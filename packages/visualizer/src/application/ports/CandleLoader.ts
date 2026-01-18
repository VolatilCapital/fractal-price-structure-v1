/**
 * Port interface for loading candle data.
 * Implementations can load from JSON files, APIs, etc.
 */
import type { Candle } from '@fractal-price-structure/core'

export interface CandleLoader {
  /**
   * Load candles from the data source.
   * @returns Promise resolving to an array of candles sorted by openTime
   */
  loadCandles(): Promise<Candle[]>
}
