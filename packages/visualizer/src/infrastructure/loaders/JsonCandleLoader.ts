/**
 * JSON-based candle loader for web environment.
 * Fetches candle data from static JSON files.
 */
import type { Candle } from '@fractal-price-structure/core'
import type { CandleLoader } from '../../application/ports/CandleLoader.js'

/**
 * Raw candle format from JSON file (matches core fixtures).
 */
interface RawCandle {
  openTime: number
  closeTime: number
  open: string | number
  high: string | number
  low: string | number
  close: string | number
  volume: string | number
}

/**
 * Candle loader that fetches from JSON files.
 */
export class JsonCandleLoader implements CandleLoader {
  constructor(private readonly url: string) {}

  async loadCandles(): Promise<Candle[]> {
    const response = await fetch(this.url)

    if (!response.ok) {
      throw new Error(`Failed to load candles from ${this.url}: ${response.statusText}`)
    }

    const rawCandles: RawCandle[] = await response.json()

    // Convert to Candle format (ensure numbers)
    return rawCandles.map((raw) => ({
      openTime: raw.openTime,
      closeTime: raw.closeTime,
      open: Number(raw.open),
      high: Number(raw.high),
      low: Number(raw.low),
      close: Number(raw.close),
      volume: Number(raw.volume),
    }))
  }
}
