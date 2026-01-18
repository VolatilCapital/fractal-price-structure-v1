/**
 * Use case for loading candles and building the fractal structure.
 */
import type { Candle, FractalEngine } from '@fractal-price-structure/core'
import type { CandleLoader } from '../ports/CandleLoader.js'
import type { StructureEvent } from '../../domain/index.js'
import { deriveEvents } from '../../domain/index.js'

export interface LoadCandlesResult {
  candles: Candle[]
  engine: FractalEngine
  events: StructureEvent[]
}

export interface LoadCandlesOptions {
  candleLoader: CandleLoader
  engineFactory: () => FractalEngine
}

/**
 * Load candles, build the fractal structure, and derive events.
 */
export async function loadCandles(options: LoadCandlesOptions): Promise<LoadCandlesResult> {
  const { candleLoader, engineFactory } = options

  // Load candles from the data source
  const candles = await candleLoader.loadCandles()

  if (candles.length === 0) {
    throw new Error('No candles loaded')
  }

  // Create engine and build structure
  const engine = engineFactory()
  engine.buildFromCandles(candles)

  // Derive events by replaying through a fresh engine
  const events = deriveEvents(candles, engineFactory)

  return {
    candles,
    engine,
    events,
  }
}
