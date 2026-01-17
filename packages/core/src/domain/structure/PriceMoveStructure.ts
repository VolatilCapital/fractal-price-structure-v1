import type { PriceMove } from "../price-move/PriceMove.js"
import type { PriceMoveRepository } from "./PriceMoveRepository.js"
import { PriceMoveRules } from "../price-move/PriceMoveRules.js"
import type { Candle } from "../candle/Candle.js"
import { validateCandle } from "../candle/Candle.js"
import { PriceMoveFactory } from "../price-move/PriceMoveFactory.js"
import type { FractalLayer } from "./FractalLayer.js"
import type { Logger } from "../../application/ports/Logger.js"
import { noopLogger } from "../../application/ports/Logger.js"

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
  private activeMoves: Set<PriceMove> = new Set()
  private logger: Logger = noopLogger

  constructor(
    private readonly repo: PriceMoveRepository
  ) { }

  /**
   * Sets the logger for debug output.
   * @param logger - Logger implementation to use
   */
  public setLogger(logger: Logger): void {
    this.logger = logger
  }

  public add(priceMove: PriceMove): void {
    this.logger.debug(
      `[ADD] New move: ${priceMove.polarity} [${priceMove.priceRange.low.toFixed(2)}-${priceMove.priceRange.high.toFixed(2)}]`
    )

    for (const active of this.activeMoves) {
      const wasActive = active.isActive()
      if (PriceMoveRules.canExtendWith(active, priceMove)) {
        this.logger.debug(
          `[EXTEND] Move ${active.id.toString().slice(0, 8)} extended by new move`
        )
        active.tryExtendWith(priceMove)
        this.repo.save(priceMove)
        return
      }

      // Check if the move was closed by the canExtendWith call (side effect of tryExtendWith)
      if (wasActive && active.isClosed()) {
        this.logger.debug(
          `[CLOSE] Move ${active.id.toString().slice(0, 8)} invalidated and closed`
        )
        this.activeMoves.delete(active)
      }
    }

    // This move extends nothing: it becomes a new root
    this.logger.debug(
      `[ROOT] New root move created: ${priceMove.id.toString().slice(0, 8)}`
    )
    this.activeMoves.add(priceMove)
    this.repo.save(priceMove)

    // Check if it's englobed by an existing larger move
    for (const potentialParent of this.repo.findAll()) {
      if (
        potentialParent !== priceMove &&
        potentialParent.timeRange.includes(priceMove.timeRange.start) &&
        potentialParent.timeRange.includes(priceMove.timeRange.end) &&
        potentialParent.priceRange.contains(priceMove.priceRange)
      ) {
        this.logger.debug(
          `[CHILD] Move ${priceMove.id.toString().slice(0, 8)} attached to parent ${potentialParent.id.toString().slice(0, 8)}`
        )
        priceMove.englobingMove = potentialParent
        potentialParent.childMoves.push(priceMove)
        break
      }
    }
  }

  /**
   * Returns all currently active moves, sorted by generation (ascending).
   * Returns a defensive copy - modifications won't affect internal state.
   */
  public getActiveMoves(): PriceMove[] {
    return this.repo.findActive().sort((a, b) => a.generation - b.generation)
  }

  /**
   * Returns a human-readable formatted string of all active moves.
   * Useful for debugging and logging purposes.
   *
   * Format per line: "  [Gen N] POLARITY [low-high] (id: xxxxxxxx)"
   */
  public formatActiveMoves(): string {
    const activeMoves = this.getActiveMoves()
    if (activeMoves.length === 0) {
      return "No active moves"
    }

    return activeMoves
      .map(m => {
        const id = m.id.toString().slice(0, 8)
        const gen = m.generation
        const pol = m.polarity.padEnd(4)
        const low = m.priceRange.low.toFixed(2)
        const high = m.priceRange.high.toFixed(2)
        return `  [Gen ${gen}] ${pol} [${low}-${high}] (id: ${id})`
      })
      .join("\n")
  }

  /**
   * Logs the current active moves using the configured logger.
   */
  public logActiveMoves(): void {
    this.logger.info(`Active moves (${this.getActiveMoves().length}):\n${this.formatActiveMoves()}`)
  }

  /**
   * Returns all moves (active and closed).
   * Returns a defensive copy - modifications won't affect internal state.
   */
  public getAllMoves(): PriceMove[] {
    return [...this.repo.findAll()]
  }

  /**
   * Returns the maximum generation depth in the structure.
   * Returns 0 if the structure is empty.
   */
  public getLayerCount(): number {
    const moves = this.repo.findAll()
    if (moves.length === 0) return 0
    return Math.max(...moves.map(m => m.generation)) + 1
  }

  /**
   * Returns all fractal layers, organized by generation level.
   * Layer 0 contains root moves (generation 0), layer 1 contains generation 1, etc.
   */
  public getLayers(): FractalLayer[] {
    const layerCount = this.getLayerCount()
    const layers: FractalLayer[] = []
    const allMoves = this.repo.findAll()

    for (let level = 0; level < layerCount; level++) {
      layers.push({
        level,
        moves: allMoves.filter(m => m.generation === level),
      })
    }

    return layers
  }

  /**
   * Returns moves at a specific generation level.
   * Returns empty array if the level doesn't exist.
   */
  public getLayer(level: number): FractalLayer {
    return {
      level,
      moves: this.repo.findAll().filter(m => m.generation === level),
    }
  }

  /**
   * Validates the structural integrity of the fractal structure.
   * Checks:
   * - All parent-child relationships are bidirectional
   * - No orphaned moves (moves with englobingMove that don't exist)
   * - Active moves are properly tracked
   *
   * Note: Generation consistency is not validated as the current implementation
   * doesn't update generation when moves are attached as children.
   *
   * @returns Validation result with any errors found
   */
  public validateStructure(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const allMoves = this.repo.findAll()
    const moveIds = new Set(allMoves.map(m => m.id.toString()))

    for (const move of allMoves) {
      // Check parent-child bidirectional relationship
      if (move.englobingMove) {
        const parent = move.englobingMove
        if (!parent.childMoves.includes(move)) {
          errors.push(
            `Move ${move.id.toString().slice(0, 8)} has englobingMove but is not in parent's childMoves`
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
      const uniqueChildren = new Set(move.childMoves)
      for (const child of uniqueChildren) {
        if (child.englobingMove !== move) {
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
    this.logger.debug(
      `[CANDLE] Ingesting candle: O=${candle.open} H=${candle.high} L=${candle.low} C=${candle.close}`
    )

    // Validate candle before processing
    const validation = validateCandle(candle)
    if (!validation.valid) {
      const error = new CandleIngestionError(
        `Invalid candle data: ${validation.errors.join("; ")}`,
        validation.errors
      )
      this.logger.error(`[ERROR] ${error.message}`)
      throw error
    }

    // Create PriceMove from candle
    const move = PriceMoveFactory.fromCandle(candle)

    // Add to structure (uses existing logic)
    this.add(move)

    // Log state after candle ingestion
    const activeMoves = this.getActiveMoves()
    this.logger.debug(
      `[STATE] After candle: ${activeMoves.length} active moves, ${this.repo.findAll().length} total moves`
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
      this.logger.error(`[ERROR] ${error.message}`)
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
      const result = this.tryAddCandle(candles[i])
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
        this.logger.warn(`[SKIP] Skipping invalid candle at index ${i}: ${result.error.message}`)
      }
    }

    if (errors.length > 0) {
      this.logger.warn(
        `[BATCH] Completed with ${errors.length} errors out of ${candles.length} candles`
      )
    } else {
      this.logger.info(`[BATCH] Successfully processed ${candles.length} candles`)
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

      // Validate candle before processing
      const validation = validateCandle(candle)
      if (!validation.valid) {
        const error = new CandleIngestionError(
          `Invalid candle data at index ${i}: ${validation.errors.join("; ")}`,
          validation.errors,
          i
        )
        this.logger.error(`[ERROR] ${error.message}`)
        throw error
      }

      // Create PriceMove with deterministic ID
      const move = PriceMoveFactory.fromCandleWithIndex(candle, i)

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
    this.activeMoves.clear()
    this.repo.clear()
  }

  /**
   * Returns memory statistics about the structure.
   * Useful for monitoring and debugging memory usage.
   */
  public getMemoryStats(): {
    totalMoves: number
    activeMoves: number
    closedMoves: number
    movesWithChildren: number
    movesWithParent: number
    maxChildCount: number
    layerCount: number
  } {
    const allMoves = this.repo.findAll()
    const activeMoves = allMoves.filter(m => m.isActive())
    const closedMoves = allMoves.filter(m => m.isClosed())
    const movesWithChildren = allMoves.filter(m => m.childMoves.length > 0)
    const movesWithParent = allMoves.filter(m => m.englobingMove !== undefined)
    const maxChildCount = allMoves.reduce((max, m) => Math.max(max, m.childMoves.length), 0)

    return {
      totalMoves: allMoves.length,
      activeMoves: activeMoves.length,
      closedMoves: closedMoves.length,
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
    this.logger.info(
      `[MEMORY] Moves: ${stats.totalMoves} total (${stats.activeMoves} active, ${stats.closedMoves} closed). ` +
      `Parents: ${stats.movesWithChildren}, Children: ${stats.movesWithParent}, Max children: ${stats.maxChildCount}`
    )
  }

  /**
   * Prunes closed moves that ended before the given timestamp.
   *
   * This removes old closed moves from the repository to free memory.
   * Active moves are never pruned. Parent-child relationships are
   * preserved for remaining moves.
   *
   * @param beforeTimestamp - Prune moves that ended before this timestamp
   * @returns Number of moves pruned
   */
  public pruneClosedMoves(beforeTimestamp: number): number {
    const allMoves = this.repo.findAll()
    const movesToPrune: PriceMove[] = []

    for (const move of allMoves) {
      // Only prune closed moves that ended before the timestamp
      if (move.isClosed() && move.timeRange.end < beforeTimestamp) {
        // Don't prune if this move is a parent of active moves
        const hasActiveChildren = move.childMoves.some(child => child.isActive())
        if (!hasActiveChildren) {
          movesToPrune.push(move)
        }
      }
    }

    // Detach pruned moves from the graph
    for (const move of movesToPrune) {
      this.detachMove(move)
    }

    if (movesToPrune.length > 0) {
      this.logger.info(`[PRUNE] Removed ${movesToPrune.length} closed moves older than ${beforeTimestamp}`)
    }

    return movesToPrune.length
  }

  /**
   * Detaches a move from the structure graph and removes it from the repository.
   * This breaks parent-child relationships to allow garbage collection.
   */
  private detachMove(move: PriceMove): void {
    // Remove from parent's childMoves
    if (move.englobingMove) {
      const parent = move.englobingMove
      const idx = parent.childMoves.indexOf(move)
      if (idx !== -1) {
        parent.childMoves.splice(idx, 1)
      }
      move.englobingMove = undefined
    }

    // Orphan children (they become root moves)
    for (const child of move.childMoves) {
      child.englobingMove = undefined
    }
    move.childMoves = []

    // Clear origin references
    move.origin = []
    move.confirmedOrigins = []

    // Remove from repository
    // Note: InMemoryPriceMoveRepository doesn't have delete, so we rebuild
    const allMoves = this.repo.findAll().filter(m => m.id.toString() !== move.id.toString())
    this.repo.clear()
    for (const m of allMoves) {
      this.repo.save(m)
    }
  }
}
