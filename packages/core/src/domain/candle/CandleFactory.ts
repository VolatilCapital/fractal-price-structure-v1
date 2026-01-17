import type { Candle } from "./Candle.js"
import { validateCandle } from "./Candle.js"

/**
 * Error thrown when candle creation fails due to invalid data.
 */
export class InvalidCandleError extends Error {
  constructor(
    message: string,
    public readonly validationErrors: readonly string[]
  ) {
    super(message)
    this.name = "InvalidCandleError"
  }
}

/**
 * Factory for creating validated Candle instances.
 *
 * Provides a safe way to create Candle objects with validation.
 * Ensures all business rules are satisfied before returning a Candle.
 */
export const CandleFactory = {
  /**
   * Creates a Candle from raw data, throwing if validation fails.
   *
   * @param data - Raw candle data
   * @returns A valid, frozen Candle object
   * @throws InvalidCandleError if validation fails
   */
  create(data: {
    openTime: number
    closeTime: number
    open: number
    high: number
    low: number
    close: number
    volume: number
  }): Candle {
    const result = validateCandle(data)

    if (!result.valid) {
      throw new InvalidCandleError(
        `Invalid candle data: ${result.errors.join("; ")}`,
        result.errors
      )
    }

    // Return frozen object to ensure immutability
    return Object.freeze({
      openTime: data.openTime,
      closeTime: data.closeTime,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume,
    })
  },

  /**
   * Attempts to create a Candle, returning null if validation fails.
   *
   * @param data - Raw candle data
   * @returns A valid Candle or null if validation fails
   */
  tryCreate(data: unknown): Candle | null {
    const result = validateCandle(data)

    if (!result.valid) {
      return null
    }

    // Type assertion is safe here because validateCandle confirmed the shape
    const candle = data as Candle

    return Object.freeze({
      openTime: candle.openTime,
      closeTime: candle.closeTime,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
    })
  },

  /**
   * Creates a Candle from Binance kline array format.
   *
   * Binance kline format:
   * [0] Open time
   * [1] Open price (string)
   * [2] High price (string)
   * [3] Low price (string)
   * [4] Close price (string)
   * [5] Volume (string)
   * [6] Close time
   * ...
   */
  fromBinanceKline(kline: unknown[]): Candle {
    if (!Array.isArray(kline) || kline.length < 7) {
      throw new InvalidCandleError("Invalid Binance kline format: array too short", [
        "Expected array with at least 7 elements",
      ])
    }

    return CandleFactory.create({
      openTime: Number(kline[0]),
      closeTime: Number(kline[6]),
      open: Number(kline[1]),
      high: Number(kline[2]),
      low: Number(kline[3]),
      close: Number(kline[4]),
      volume: Number(kline[5]),
    })
  },
}
