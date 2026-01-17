import type { Candle } from "./domain/candle/Candle.js"
import type { PriceMove } from "./domain/price-move/PriceMove.js"
import type { Logger } from "./application/ports/Logger.js"
import type {
  CandleResult,
  BatchIngestionResult,
} from "./domain/structure/PriceMoveStructure.js"
import type { FractalLayer } from "./domain/structure/FractalLayer.js"
import { PriceMoveStructure } from "./domain/structure/PriceMoveStructure.js"
import { InMemoryPriceMoveRepository } from "./infrastructure/repositories/InMemoryPriceMoveRepository.js"

/**
 * Configuration options for FractalEngine.
 */
export interface FractalEngineOptions {
  /**
   * Logger implementation for debug output.
   * Defaults to noopLogger (silent).
   */
  logger?: Logger

  /**
   * Whether to use deterministic IDs for reproducibility.
   * When true, move IDs are based on their index in the input.
   * Defaults to false (random UUIDs).
   */
  deterministic?: boolean
}

/**
 * FractalEngine is the main entry point for building fractal price structures.
 *
 * It provides a simple, high-level API for:
 * - Processing candles one at a time (real-time streaming)
 * - Processing batches of candles (historical data)
 * - Querying the resulting fractal structure
 * - Managing memory via pruning
 *
 * @example
 * ```typescript
 * import { FractalEngine } from '@fractal-price-structure/core';
 *
 * const engine = new FractalEngine();
 *
 * // Add candles from your data source
 * for (const candle of candles) {
 *   engine.addCandle(candle);
 * }
 *
 * // Query the structure
 * const activeMoves = engine.getActiveMoves();
 * const layers = engine.getLayers();
 * ```
 */
export class FractalEngine {
  private readonly structure: PriceMoveStructure
  private readonly deterministic: boolean
  private candleIndex = 0

  constructor(options: FractalEngineOptions = {}) {
    const repo = new InMemoryPriceMoveRepository()
    this.structure = new PriceMoveStructure(repo)
    this.deterministic = options.deterministic ?? false

    if (options.logger) {
      this.structure.setLogger(options.logger)
    }
  }

  // ============================================
  // Candle Ingestion
  // ============================================

  /**
   * Adds a single candle to the fractal structure.
   *
   * @param candle - The candle data to process
   * @returns The PriceMove created from the candle
   * @throws CandleIngestionError if the candle is invalid
   */
  addCandle(candle: Candle): PriceMove {
    return this.structure.addCandle(candle)
  }

  /**
   * Adds a single candle with graceful error handling.
   * Never throws - returns a result object instead.
   *
   * @param candle - The candle data to process
   * @returns Result indicating success with the move, or failure with the error
   */
  tryAddCandle(candle: Candle): CandleResult {
    return this.structure.tryAddCandle(candle)
  }

  /**
   * Processes a batch of candles in order.
   *
   * @param candles - Array of candles in chronological order
   * @returns Array of all PriceMoves created
   * @throws CandleIngestionError if any candle is invalid
   */
  buildFromCandles(candles: readonly Candle[]): PriceMove[] {
    if (this.deterministic) {
      return this.structure.buildFromCandlesDeterministic(candles)
    }
    return this.structure.buildFromCandles(candles)
  }

  /**
   * Processes a batch of candles with graceful error handling.
   * Invalid candles are skipped and processing continues.
   *
   * @param candles - Array of candles in chronological order
   * @returns Result with moves, errors, and statistics
   */
  tryBuildFromCandles(candles: readonly Candle[]): BatchIngestionResult {
    return this.structure.tryBuildFromCandles(candles)
  }

  // ============================================
  // Structure Queries
  // ============================================

  /**
   * Returns all currently active moves, sorted by generation.
   * Active moves are those that haven't been invalidated yet.
   */
  getActiveMoves(): PriceMove[] {
    return this.structure.getActiveMoves()
  }

  /**
   * Returns all moves (both active and closed).
   */
  getAllMoves(): PriceMove[] {
    return this.structure.getAllMoves()
  }

  /**
   * Returns the number of fractal layers (generations) in the structure.
   */
  getLayerCount(): number {
    return this.structure.getLayerCount()
  }

  /**
   * Returns all fractal layers organized by generation level.
   * Layer 0 contains root moves, layer 1 contains their children, etc.
   */
  getLayers(): FractalLayer[] {
    return this.structure.getLayers()
  }

  /**
   * Returns moves at a specific generation level.
   */
  getLayer(level: number): FractalLayer {
    return this.structure.getLayer(level)
  }

  /**
   * Validates the structural integrity of the fractal.
   * Checks parent-child relationships are bidirectional and consistent.
   */
  validate(): { valid: boolean; errors: string[] } {
    return this.structure.validateStructure()
  }

  // ============================================
  // Point-in-Time Queries
  // ============================================

  /**
   * Returns all moves that were active at a specific timestamp.
   * This provides a point-in-time snapshot of the fractal structure.
   *
   * A move was active at timestamp T if:
   * - The move had started (timeRange.start <= T)
   * - AND the move wasn't closed yet (closedAt is undefined OR closedAt > T)
   *
   * @param timestamp - Unix timestamp in milliseconds
   * @returns Array of moves that were active at the given timestamp, sorted by generation
   */
  getStack(timestamp: number): PriceMove[] {
    return this.structure.getStack(timestamp)
  }

  /**
   * Returns the active move at a specific generation level for a given timestamp.
   * Useful for querying a specific layer of the fractal at a point in time.
   *
   * @param generation - The generation level to query (0 = root, 1 = first children, etc.)
   * @param timestamp - Unix timestamp in milliseconds
   * @returns The active move at that generation and timestamp, or undefined if none
   */
  getMove(generation: number, timestamp: number): PriceMove | undefined {
    return this.structure.getMove(generation, timestamp)
  }

  // ============================================
  // Debug & Monitoring
  // ============================================

  /**
   * Returns a human-readable string of all active moves.
   * Useful for debugging and logging.
   */
  formatActiveMoves(): string {
    return this.structure.formatActiveMoves()
  }

  /**
   * Logs the current active moves using the configured logger.
   */
  logActiveMoves(): void {
    this.structure.logActiveMoves()
  }

  /**
   * Returns memory statistics about the structure.
   */
  getMemoryStats(): {
    totalMoves: number
    activeMoves: number
    closedMoves: number
    movesWithChildren: number
    movesWithParent: number
    maxChildCount: number
    layerCount: number
  } {
    return this.structure.getMemoryStats()
  }

  /**
   * Logs memory statistics using the configured logger.
   */
  logMemoryStats(): void {
    this.structure.logMemoryStats()
  }

  // ============================================
  // Memory Management
  // ============================================

  /**
   * Removes closed moves that ended before the given timestamp.
   * Useful for managing memory in long-running applications.
   *
   * @param beforeTimestamp - Prune moves ending before this time
   * @returns Number of moves removed
   */
  pruneClosedMoves(beforeTimestamp: number): number {
    return this.structure.pruneClosedMoves(beforeTimestamp)
  }

  /**
   * Clears all moves and resets the engine to empty state.
   */
  clear(): void {
    this.structure.clear()
    this.candleIndex = 0
  }
}
