import type { PriceMove } from "../../domain/price-move/PriceMove.js"
import type { PriceMoveRepository } from "../ports/PriceMoveRepository.js"
import type { Candle } from "../../domain/candle/Candle.js"
import { validateCandle } from "../../domain/candle/Candle.js"
import { createPriceMoveFromCandle, createPriceMoveFromCandleWithIndex } from "../../domain/price-move/PriceMoveFactory.js"
import type { FractalLayer } from "../../domain/structure/FractalLayer.js"
import type { Logger } from "../../domain/logger/Logger.js"
import { noopLogger } from "../../domain/logger/Logger.js"
import { Polarity } from "../../domain/price-move/Polarity.js"
import { Price } from "../../shared/Price.js"

/**
 * Error thrown when candle ingestion fails.
 */
export class CandleIngestionError extends Error {
  constructor(
    message: string,
    public readonly validationErrors?: readonly string[],
    public readonly index?: number
  ) {
    super(message)
    this.name = "CandleIngestionError"
  }
}

/**
 * Result of adding a single candle with error handling.
 */
export type CandleResult =
  | { success: true; move: PriceMove }
  | { success: false; error: CandleIngestionError }

/**
 * Result of batch candle processing with error handling.
 */
export interface BatchIngestionResult {
  /** Successfully created PriceMoves */
  moves: PriceMove[]
  /** Errors encountered during processing */
  errors: CandleIngestionError[]
  /** Number of candles processed (including failures) */
  processedCount: number
  /** Number of candles that succeeded */
  successCount: number
}

export class PriceMoveStructure {
  #growingMoves: Set<PriceMove> = new Set()
  #logger: Logger = noopLogger
  readonly #repo: PriceMoveRepository

  constructor(repo: PriceMoveRepository) {
    this.#repo = repo
  }

  /**
   * Sets the logger for debug output.
   * @param logger - Logger implementation to use
   */
  public setLogger(logger: Logger): void {
    this.#logger = logger
  }

  /**
   * Adds a new PriceMove to the structure.
   * Uses 3-outcome logic: extend-boundary, extend-internal, or break.
   *
   * - extended-boundary: Parent grows, new move is NOT a sub-structure
   * - extended-internal: New move becomes a sub-structure
   * - broken: Cascade termination
   *
   * Also handles engulfing candles (protocole section 10) where the candidate
   * breaks both the directional bound AND the reference level.
   */
  public add(priceMove: PriceMove): void {
    this.#logger.debug(
      `[ADD] New move: ${priceMove.polarity} [${priceMove.priceRange.low.toFixed(2)}-${priceMove.priceRange.high.toFixed(2)}]`
    )

    // Find the deepest growing structure to process against
    const deepestGrowing = this.#findDeepestGrowingStructure()

    if (deepestGrowing) {
      // Check for engulfing candle (protocole section 10)
      if (this.#isEngulfingCandle(deepestGrowing, priceMove)) {
        this.#handleEngulfingCandle(deepestGrowing, priceMove)
        return
      }

      const wasGrowing = deepestGrowing.isGrowing()
      const result = deepestGrowing.processCandidate(priceMove)

      if (result === "extended-boundary") {
        // True extension: parent range was updated
        // M becomes a composante of S (protocole section 4.1)
        this.#logger.debug(
          `[EXTEND] Move ${deepestGrowing.id.toString().slice(0, 8)} extended (boundary broken)`
        )
        deepestGrowing.addSubStructure(priceMove)
        this.#repo.save(priceMove)
        return
      }

      if (result === "extended-internal") {
        // Internal movement: becomes a sub-structure of the parent
        this.#logger.debug(
          `[INTERNAL] Move added as sub-structure to ${deepestGrowing.id.toString().slice(0, 8)}`
        )
        deepestGrowing.addSubStructure(priceMove)
        this.#repo.save(priceMove)
        return
      }

      // Result is "broken" - handle cascade termination
      if (wasGrowing) {
        this.#logger.debug(
          `[BREAK] Move ${deepestGrowing.id.toString().slice(0, 8)} broken by new move`
        )
        const survivingParent = this.#handleCascadeTermination(deepestGrowing, priceMove)

        // After cascade, check if the new move is internal to a surviving parent
        if (survivingParent && survivingParent.isGrowing()) {
          const parentResult = survivingParent.processCandidate(priceMove)
          if (parentResult === "extended-internal") {
            this.#logger.debug(
              `[INTERNAL-AFTER-CASCADE] Move added as sub-structure to surviving parent ${survivingParent.id.toString().slice(0, 8)}`
            )
            survivingParent.addSubStructure(priceMove)
            this.#repo.save(priceMove)
            return
          }
          // If it extended the surviving parent, that's already handled by processCandidate
          if (parentResult === "extended-boundary") {
            this.#logger.debug(
              `[EXTEND-AFTER-CASCADE] Surviving parent ${survivingParent.id.toString().slice(0, 8)} extended`
            )
            this.#repo.save(priceMove)
            return
          }
        }
      }
    }

    // This move becomes a new root (no growing structure or all broken)
    this.#logger.debug(
      `[ROOT] New root move created: ${priceMove.id.toString().slice(0, 8)}`
    )
    this.#growingMoves.add(priceMove)
    this.#repo.save(priceMove)
  }

  /**
   * Detects if a candidate is an engulfing candle (protocole section 10.1).
   * An engulfing candle breaks BOTH the directional bound AND the reference level.
   */
  #isEngulfingCandle(target: PriceMove, candidate: PriceMove): boolean {
    if (!target.isGrowing()) return false

    const breaksDirectionalBound = target.polarity === Polarity.Up
      ? Price.gt(candidate.priceRange.high, target.priceRange.high)
      : Price.lt(candidate.priceRange.low, target.priceRange.low)

    const breaksReferenceLevel = target.polarity === Polarity.Up
      ? Price.lt(candidate.priceRange.low, target.currentReferenceLevel)
      : Price.gt(candidate.priceRange.high, target.currentReferenceLevel)

    return breaksDirectionalBound && breaksReferenceLevel
  }

  /**
   * Handles engulfing candles using the color heuristic (protocole section 10.3).
   *
   * Green candle (Up polarity): sequence is Open → Low → High → Close
   *   → Process LOW first (invalidation), then HIGH (new impulsion)
   *
   * Red candle (Down polarity): sequence is Open → High → Low → Close
   *   → Process HIGH first (potential extension), then LOW (invalidation)
   *
   * In both cases, the target structure is terminated and the engulfing candle
   * becomes a new root structure.
   */
  #handleEngulfingCandle(target: PriceMove, candidate: PriceMove): void {
    this.#logger.debug(
      `[ENGULFING] ${candidate.polarity === Polarity.Up ? "Green" : "Red"} candle engulfs ${target.id.toString().slice(0, 8)}`
    )

    if (candidate.polarity === Polarity.Up) {
      // Green candle: Low came first, so invalidation happened before any potential high extension
      // 1. First the low broke the reference level → structure is terminated
      // 2. Then the high created upward momentum → new Up structure
      this.#logger.debug(
        `[ENGULFING] Processing GREEN: Low (${candidate.priceRange.low}) broke ref (${target.currentReferenceLevel}), then High (${candidate.priceRange.high})`
      )
    } else {
      // Red candle: High came first
      // For an Up target: high might have extended it momentarily before low broke it
      // For a Down target: high broke reference, then low extended
      if (target.polarity === Polarity.Up) {
        // Extend the structure with the high before terminating.
        // Maintain protocol §3.3 invariant: currentReferenceLevel is the opposite
        // bound of the last extending candidate. Even though target is terminated
        // immediately below, the snapshot must remain consistent for observers
        // (visualizer, stats) and for any future promotion logic that would
        // re-read this state.
        target.priceRange = target.priceRange.extendWith(candidate.priceRange.high)
        target.timeRange = target.timeRange.extendWith(candidate.timeRange.end)
        target.currentReferenceLevel = candidate.priceRange.low
        this.#logger.debug(
          `[ENGULFING] Processing RED on Up structure: Extended to ${candidate.priceRange.high}, then Low (${candidate.priceRange.low}) broke ref (${target.currentReferenceLevel})`
        )
      } else {
        this.#logger.debug(
          `[ENGULFING] Processing RED on Down structure: High (${candidate.priceRange.high}) broke ref (${target.currentReferenceLevel}), then Low (${candidate.priceRange.low})`
        )
      }
    }

    // Terminate the target structure
    target.terminate(candidate.timeRange.start)
    target.correction = candidate
    this.#growingMoves.delete(target)

    // The engulfing candle becomes a new root structure
    this.#growingMoves.add(candidate)
    this.#repo.save(candidate)
  }

  /**
   * Finds the deepest growing structure in the hierarchy.
   * Searches recursively through all subStructures to find the Growing structure
   * that is deepest in the tree (has no Growing children).
   */
  #findDeepestGrowingStructure(): PriceMove | undefined {
    let deepest: PriceMove | undefined

    // Start from root growing moves and descend recursively
    for (const root of this.#growingMoves) {
      if (root.isGrowing()) {
        const candidate = this.#findDeepestGrowingInSubtree(root)
        if (candidate) {
          // Take the one with highest rang, or if equal, the most recent
          if (!deepest || candidate.rang > deepest.rang) {
            deepest = candidate
          }
        }
      }
    }

    return deepest
  }

  /**
   * Recursively finds the deepest Growing structure in a subtree.
   * Returns the Growing structure with no Growing children (the "leaf" of the growing path).
   */
  #findDeepestGrowingInSubtree(move: PriceMove): PriceMove | undefined {
    if (!move.isGrowing()) {
      return undefined
    }

    // Look for Growing children
    for (const child of move.subStructures) {
      if (child.isGrowing()) {
        const deeper = this.#findDeepestGrowingInSubtree(child)
        if (deeper) {
          return deeper
        }
      }
    }

    // No Growing children found, this is the deepest
    return move
  }

  /**
   * Handles cascade termination when a structure is broken.
   * Terminates the broken structure and potentially its parents.
   * Returns the surviving parent (the first parent that wasn't broken), or undefined.
   */
  #handleCascadeTermination(brokenStructure: PriceMove, breakingMove: PriceMove): PriceMove | undefined {
    // Terminate the broken structure
    brokenStructure.terminate(breakingMove.timeRange.start)
    this.#growingMoves.delete(brokenStructure)

    // Set the breaking move as the correction
    brokenStructure.correction = breakingMove

    // Check if parent structures should also be terminated
    let current = brokenStructure.parentStructure
    while (current && current.isGrowing()) {
      const result = current.processCandidate(breakingMove)
      if (result === "broken") {
        this.#logger.debug(
          `[CASCADE] Parent ${current.id.toString().slice(0, 8)} also broken`
        )
        current.terminate(breakingMove.timeRange.start)
        current.correction = breakingMove
        this.#growingMoves.delete(current)
        current = current.parentStructure
      } else {
        // Parent survived (absorbed the breaking move via extension or internal)
        this.#logger.debug(
          `[SURVIVING] Parent ${current.id.toString().slice(0, 8)} survived cascade`
        )
        return current
      }
    }

    // No surviving parent found
    return undefined
  }

  /**
   * Archives orphaned structures that are no longer needed.
   */
  public archiveOrphanedStructures(beforeTimestamp: number): number {
    let archivedCount = 0
    const allMoves = this.#repo.findAll()

    for (const move of allMoves) {
      if (move.isReference() && move.timeRange.end < beforeTimestamp) {
        // Check if this structure has no active children
        const hasGrowingChildren = move.subStructures.some(s => s.isGrowing())
        if (!hasGrowingChildren) {
          move.archive(beforeTimestamp)
          archivedCount++
        }
      }
    }

    if (archivedCount > 0) {
      this.#logger.info(`[ARCHIVE] Archived ${archivedCount} structures`)
    }

    return archivedCount
  }

  // ============================================
  // Legacy compatibility - renamed from activeMoves
  // ============================================

  /**
   * @deprecated Use #growingMoves internally
   */
  get #activeMoves(): Set<PriceMove> {
    return this.#growingMoves
  }

  /**
   * Returns all currently growing moves, sorted by rang (ascending).
   * Returns a defensive copy - modifications won't affect internal state.
   */
  public getGrowingMoves(): PriceMove[] {
    return this.#repo.findGrowing().sort((a, b) => a.rang - b.rang)
  }

  /**
   * Returns all reference moves (terminated but not archived).
   */
  public getReferenceMoves(): PriceMove[] {
    return this.#repo.findReference()
  }

  /**
   * Returns all archived moves.
   */
  public getArchivedMoves(): PriceMove[] {
    return this.#repo.findArchived()
  }

  /**
   * @deprecated Use getGrowingMoves() instead
   * Returns all currently active moves, sorted by generation (ascending).
   */
  public getActiveMoves(): PriceMove[] {
    return this.getGrowingMoves()
  }

  /**
   * Returns a human-readable formatted string of all active moves.
   * Useful for debugging and logging purposes.
   *
   * Format per line: "  [Rang N] POLARITY [low-high] (id: xxxxxxxx)"
   */
  public formatActiveMoves(): string {
    const growingMoves = this.getGrowingMoves()
    if (growingMoves.length === 0) {
      return "No active moves"
    }

    return growingMoves
      .map(m => {
        const id = m.id.toString().slice(0, 8)
        const rang = m.rang
        const pol = m.polarity.padEnd(4)
        const low = m.priceRange.low.toFixed(2)
        const high = m.priceRange.high.toFixed(2)
        return `  [Rang ${rang}] ${pol} [${low}-${high}] (id: ${id})`
      })
      .join("\n")
  }

  /**
   * Logs the current active moves using the configured logger.
   */
  public logActiveMoves(): void {
    this.#logger.info(`Active moves (${this.getGrowingMoves().length}):\n${this.formatActiveMoves()}`)
  }

  /**
   * Returns all moves (growing, reference, and archived).
   * Returns a defensive copy - modifications won't affect internal state.
   */
  public getAllMoves(): PriceMove[] {
    return [...this.#repo.findAll()]
  }

  /**
   * Returns the maximum rang depth in the structure.
   * Returns 0 if the structure is empty.
   */
  public getLayerCount(): number {
    const moves = this.#repo.findAll()
    if (moves.length === 0) return 0
    return Math.max(...moves.map(m => m.rang)) + 1
  }

  /**
   * Returns all fractal layers, organized by rang level.
   * Layer 0 contains root moves (rang 0), layer 1 contains rang 1, etc.
   */
  public getLayers(): FractalLayer[] {
    const layerCount = this.getLayerCount()
    const layers: FractalLayer[] = []
    const allMoves = this.#repo.findAll()

    for (let level = 0; level < layerCount; level++) {
      layers.push({
        level,
        moves: allMoves.filter(m => m.rang === level),
      })
    }

    return layers
  }

  /**
   * Returns moves at a specific rang level.
   * Returns empty array if the level doesn't exist.
   */
  public getLayer(level: number): FractalLayer {
    return {
      level,
      moves: this.#repo.findAll().filter(m => m.rang === level),
    }
  }

  /**
   * Returns structures at a specific degre.
   */
  public getStructuresByDegre(degre: number): PriceMove[] {
    return this.#repo.findAll().filter(m => m.degre === degre)
  }

  /**
   * Returns all moves that were active at a specific timestamp.
   * This provides a point-in-time snapshot of the fractal structure.
   *
   * A move was active at timestamp T if:
   * - The move had started (timeRange.start <= T)
   * - AND the move wasn't terminated yet (terminatedAt is undefined OR terminatedAt > T)
   *
   * @param timestamp - Unix timestamp in milliseconds
   * @returns Array of moves that were active at the given timestamp, sorted by rang
   */
  public getStack(timestamp: number): PriceMove[] {
    return this.#repo
      .findAll()
      .filter(move => move.wasActiveAt(timestamp))
      .sort((a, b) => a.rang - b.rang)
  }

  /**
   * Returns the active move at a specific rang level for a given timestamp.
   * Useful for querying a specific layer of the fractal at a point in time.
   *
   * @param rang - The rang level to query (0 = root, 1 = first children, etc.)
   * @param timestamp - Unix timestamp in milliseconds
   * @returns The active move at that rang and timestamp, or undefined if none
   */
  public getMove(rang: number, timestamp: number): PriceMove | undefined {
    return this.#repo
      .findAll()
      .find(move => move.rang === rang && move.wasActiveAt(timestamp))
  }

  /**
   * Validates the structural integrity of the fractal structure.
   * Checks:
   * - All parent-child relationships are bidirectional
   * - No orphaned moves (moves with parentStructure that don't exist)
   * - Growing moves are properly tracked
   *
   * @returns Validation result with any errors found
   */
  public validateStructure(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const allMoves = this.#repo.findAll()
    const moveIds = new Set(allMoves.map(m => m.id.toString()))

    for (const move of allMoves) {
      // Check parent-child bidirectional relationship
      if (move.parentStructure) {
        const parent = move.parentStructure
        if (!parent.subStructures.includes(move)) {
          errors.push(
            `Move ${move.id.toString().slice(0, 8)} has parentStructure but is not in parent's subStructures`
          )
        }
        // Check parent exists in repository
        if (!moveIds.has(parent.id.toString())) {
          errors.push(
            `Move ${move.id.toString().slice(0, 8)} references non-existent parent ${parent.id.toString().slice(0, 8)}`
          )
        }
      }

      // Check children point back to this move (using Set to handle duplicates)
      const uniqueChildren = new Set(move.subStructures)
      for (const child of uniqueChildren) {
        if (child.parentStructure !== move) {
          errors.push(
            `Move ${move.id.toString().slice(0, 8)} has child that doesn't reference it as parent`
          )
        }
        // Check child exists in repository
        if (!moveIds.has(child.id.toString())) {
          errors.push(
            `Move ${move.id.toString().slice(0, 8)} references non-existent child ${child.id.toString().slice(0, 8)}`
          )
        }
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Adds a single candle to the fractal structure.
   *
   * This is the primary entry point for real-time streaming data.
   * Creates a PriceMove from the candle and processes it against the structure.
   *
   * @param candle - The candle data to add
   * @returns The PriceMove created from the candle
   * @throws CandleIngestionError if the candle is invalid
   */
  public addCandle(candle: Candle): PriceMove {
    this.#logger.debug(
      `[CANDLE] Ingesting candle: O=${candle.open} H=${candle.high} L=${candle.low} C=${candle.close}`
    )

    // Validate candle before processing
    const validation = validateCandle(candle)
    if (!validation.valid) {
      const error = new CandleIngestionError(
        `Invalid candle data: ${validation.errors.join("; ")}`,
        validation.errors
      )
      this.#logger.error(`[ERROR] ${error.message}`)
      throw error
    }

    // Create PriceMove from candle
    const move = createPriceMoveFromCandle(candle)

    // Add to structure (uses existing logic)
    this.add(move)

    // Log state after candle ingestion
    const growingMoves = this.getGrowingMoves()
    this.#logger.debug(
      `[STATE] After candle: ${growingMoves.length} growing moves, ${this.#repo.findAll().length} total moves`
    )

    return move
  }

  /**
   * Adds a single candle with graceful error handling.
   *
   * Unlike addCandle(), this method never throws. Instead, it returns
   * a result object indicating success or failure.
   *
   * @param candle - The candle data to add
   * @returns Result indicating success with the move, or failure with the error
   */
  public tryAddCandle(candle: Candle): CandleResult {
    try {
      const move = this.addCandle(candle)
      return { success: true, move }
    } catch (e) {
      if (e instanceof CandleIngestionError) {
        return { success: false, error: e }
      }
      // Wrap unexpected errors
      const error = new CandleIngestionError(
        `Unexpected error: ${e instanceof Error ? e.message : String(e)}`
      )
      this.#logger.error(`[ERROR] ${error.message}`)
      return { success: false, error }
    }
  }

  /**
   * Builds the complete fractal structure from an array of candles.
   *
   * This is the primary entry point for historical/batch data processing.
   * Processes candles in order, building the fractal structure incrementally.
   *
   * @param candles - Array of candles in chronological order
   * @returns Array of all PriceMoves created
   * @throws CandleIngestionError if any candle is invalid
   */
  public buildFromCandles(candles: readonly Candle[]): PriceMove[] {
    const moves: PriceMove[] = []

    for (const candle of candles) {
      const move = this.addCandle(candle)
      moves.push(move)
    }

    return moves
  }

  /**
   * Builds fractal structure from candles with graceful error handling.
   *
   * Unlike buildFromCandles(), this method never throws. It processes all
   * candles and collects any errors, returning a detailed result object.
   * Invalid candles are skipped, but processing continues.
   *
   * @param candles - Array of candles in chronological order
   * @returns Result object with moves, errors, and processing statistics
   */
  public tryBuildFromCandles(candles: readonly Candle[]): BatchIngestionResult {
    const moves: PriceMove[] = []
    const errors: CandleIngestionError[] = []

    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i]
      if (!candle) continue
      const result = this.tryAddCandle(candle)
      if (result.success) {
        moves.push(result.move)
      } else {
        // Add index information to the error
        const errorWithIndex = new CandleIngestionError(
          `At index ${i}: ${result.error.message}`,
          result.error.validationErrors,
          i
        )
        errors.push(errorWithIndex)
        this.#logger.warn(`[SKIP] Skipping invalid candle at index ${i}: ${result.error.message}`)
      }
    }

    if (errors.length > 0) {
      this.#logger.warn(
        `[BATCH] Completed with ${errors.length} errors out of ${candles.length} candles`
      )
    } else {
      this.#logger.info(`[BATCH] Successfully processed ${candles.length} candles`)
    }

    return {
      moves,
      errors,
      processedCount: candles.length,
      successCount: moves.length,
    }
  }

  /**
   * Builds the complete fractal structure with deterministic IDs.
   *
   * Each move gets an ID based on its index in the candle array, ensuring
   * that the same input always produces the same structure with identical IDs.
   * Use this for testing and reproducibility scenarios.
   *
   * @param candles - Array of candles in chronological order
   * @returns Array of all PriceMoves created (with deterministic IDs)
   * @throws CandleIngestionError if any candle is invalid
   */
  public buildFromCandlesDeterministic(candles: readonly Candle[]): PriceMove[] {
    const moves: PriceMove[] = []

    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i]
      if (!candle) continue

      // Validate candle before processing
      const validation = validateCandle(candle)
      if (!validation.valid) {
        const error = new CandleIngestionError(
          `Invalid candle data at index ${i}: ${validation.errors.join("; ")}`,
          validation.errors,
          i
        )
        this.#logger.error(`[ERROR] ${error.message}`)
        throw error
      }

      // Create PriceMove with deterministic ID
      const move = createPriceMoveFromCandleWithIndex(candle, i)

      // Add to structure
      this.add(move)
      moves.push(move)
    }

    return moves
  }

  /**
   * Clears all moves and resets the structure to empty state.
   */
  public clear(): void {
    this.#growingMoves.clear()
    this.#repo.clear()
  }

  /**
   * Returns memory statistics about the structure.
   * Useful for monitoring and debugging memory usage.
   */
  public getMemoryStats(): {
    totalMoves: number
    activeMoves: number
    closedMoves: number
    growingMoves: number
    referenceMoves: number
    archivedMoves: number
    movesWithChildren: number
    movesWithParent: number
    maxChildCount: number
    layerCount: number
  } {
    const allMoves = this.#repo.findAll()
    const growing = allMoves.filter(m => m.isGrowing())
    const reference = allMoves.filter(m => m.isReference())
    const archived = allMoves.filter(m => m.isArchived())
    const movesWithChildren = allMoves.filter(m => m.subStructures.length > 0)
    const movesWithParent = allMoves.filter(m => m.parentStructure !== undefined)
    const maxChildCount = allMoves.reduce((max, m) => Math.max(max, m.subStructures.length), 0)

    return {
      totalMoves: allMoves.length,
      activeMoves: growing.length, // Legacy alias
      closedMoves: reference.length + archived.length, // Legacy alias
      growingMoves: growing.length,
      referenceMoves: reference.length,
      archivedMoves: archived.length,
      movesWithChildren: movesWithChildren.length,
      movesWithParent: movesWithParent.length,
      maxChildCount,
      layerCount: this.getLayerCount(),
    }
  }

  /**
   * Logs memory statistics using the configured logger.
   */
  public logMemoryStats(): void {
    const stats = this.getMemoryStats()
    this.#logger.info(
      `[MEMORY] Moves: ${stats.totalMoves} total (${stats.growingMoves} growing, ${stats.referenceMoves} reference, ${stats.archivedMoves} archived). ` +
      `Parents: ${stats.movesWithChildren}, Children: ${stats.movesWithParent}, Max children: ${stats.maxChildCount}`
    )
  }

  /**
   * Prunes archived moves that ended before the given timestamp.
   *
   * This removes old archived moves from the repository to free memory.
   * Growing and Reference moves are never pruned. Parent-child relationships are
   * preserved for remaining moves.
   *
   * @param beforeTimestamp - Prune moves that ended before this timestamp
   * @returns Number of moves pruned
   */
  public pruneClosedMoves(beforeTimestamp: number): number {
    const allMoves = this.#repo.findAll()
    const movesToPrune: PriceMove[] = []

    for (const move of allMoves) {
      // Only prune archived moves that ended before the timestamp
      if (move.isArchived() && move.timeRange.end < beforeTimestamp) {
        movesToPrune.push(move)
      }
      // Also allow pruning Reference moves without active children
      else if (move.isReference() && move.timeRange.end < beforeTimestamp) {
        const hasGrowingChildren = move.subStructures.some(child => child.isGrowing())
        if (!hasGrowingChildren) {
          movesToPrune.push(move)
        }
      }
    }

    // Detach pruned moves from the graph
    for (const move of movesToPrune) {
      this.#detachMove(move)
    }

    if (movesToPrune.length > 0) {
      this.#logger.info(`[PRUNE] Removed ${movesToPrune.length} closed moves older than ${beforeTimestamp}`)
    }

    return movesToPrune.length
  }

  /**
   * Detaches a move from the structure graph and removes it from the repository.
   * This breaks parent-child relationships to allow garbage collection.
   */
  #detachMove(move: PriceMove): void {
    // Remove from parent's subStructures
    if (move.parentStructure) {
      const parent = move.parentStructure
      const idx = parent.subStructures.indexOf(move)
      if (idx !== -1) {
        parent.subStructures.splice(idx, 1)
      }
      move.parentStructure = undefined
    }

    // Orphan children (they become root moves)
    for (const child of move.subStructures) {
      child.parentStructure = undefined
    }
    move.subStructures = []

    // Clear correction reference
    move.correction = undefined

    // Clear reference levels
    move.referenceLevels = []

    // Remove from growingMoves set
    this.#growingMoves.delete(move)

    // Remove from repository
    // Note: InMemoryPriceMoveRepository doesn't have delete, so we rebuild
    const allMoves = this.#repo.findAll().filter(m => m.id.toString() !== move.id.toString())
    this.#repo.clear()
    for (const m of allMoves) {
      this.#repo.save(m)
    }
  }
}
