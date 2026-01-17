import { Price } from "../../shared/Price.js"

/**
 * Candle represents OHLCV (Open, High, Low, Close, Volume) candlestick data.
 *
 * This is the single source of truth for candle data structure in the system.
 * All candle-related code should import from this location.
 *
 * Timestamps are Unix milliseconds (number).
 * Prices use number type; big.js conversion happens at calculation time.
 */
export interface Candle {
  /** Candle open timestamp in Unix milliseconds */
  readonly openTime: number

  /** Candle close timestamp in Unix milliseconds */
  readonly closeTime: number

  /** Opening price */
  readonly open: number

  /** Highest price during the candle period */
  readonly high: number

  /** Lowest price during the candle period */
  readonly low: number

  /** Closing price */
  readonly close: number

  /** Trading volume during the candle period */
  readonly volume: number
}

/**
 * Type guard to check if an object is a valid Candle structure.
 */
export function isCandle(obj: unknown): obj is Candle {
  if (typeof obj !== "object" || obj === null) {
    return false
  }

  const candidate = obj as Record<string, unknown>

  return (
    typeof candidate.openTime === "number" &&
    typeof candidate.closeTime === "number" &&
    typeof candidate.open === "number" &&
    typeof candidate.high === "number" &&
    typeof candidate.low === "number" &&
    typeof candidate.close === "number" &&
    typeof candidate.volume === "number"
  )
}

/**
 * Validation result for candle data.
 */
export interface CandleValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
}

/**
 * Validates a Candle for logical consistency.
 *
 * Checks:
 * - All required fields are present and numeric
 * - openTime < closeTime (chronological order)
 * - low <= high (price consistency)
 * - low <= open, close <= high (OHLC consistency)
 * - No NaN or Infinity values
 * - volume >= 0
 */
export function validateCandle(candle: unknown): CandleValidationResult {
  const errors: string[] = []

  // Type check first
  if (!isCandle(candle)) {
    return {
      valid: false,
      errors: ["Invalid candle structure: missing or invalid required fields"],
    }
  }

  const { openTime, closeTime, open, high, low, close, volume } = candle

  // Check for NaN or Infinity first - must return early as Price module cannot handle these
  const numericFields = { openTime, closeTime, open, high, low, close, volume }
  for (const [name, value] of Object.entries(numericFields)) {
    if (!Number.isFinite(value)) {
      errors.push(`${name} is not a valid finite number`)
    }
  }

  // Return early if any value is not finite - Price module cannot handle NaN/Infinity
  if (errors.length > 0) {
    return { valid: false, errors }
  }

  // Validate timestamps are positive
  if (openTime <= 0) {
    errors.push(`openTime (${openTime}) must be positive`)
  }
  if (closeTime <= 0) {
    errors.push(`closeTime (${closeTime}) must be positive`)
  }

  // Validate prices are non-negative (using Price for decimal precision)
  if (Price.lt(open, 0)) {
    errors.push(`open (${open}) cannot be negative`)
  }
  if (Price.lt(high, 0)) {
    errors.push(`high (${high}) cannot be negative`)
  }
  if (Price.lt(low, 0)) {
    errors.push(`low (${low}) cannot be negative`)
  }
  if (Price.lt(close, 0)) {
    errors.push(`close (${close}) cannot be negative`)
  }

  // Chronological order
  if (openTime >= closeTime) {
    errors.push(`openTime (${openTime}) must be before closeTime (${closeTime})`)
  }

  // Price consistency (using Price for decimal precision)
  if (Price.gt(low, high)) {
    errors.push(`low (${low}) cannot be greater than high (${high})`)
  }

  // OHLC consistency (using Price for decimal precision)
  if (Price.lt(open, low) || Price.gt(open, high)) {
    errors.push(`open (${open}) must be between low (${low}) and high (${high})`)
  }
  if (Price.lt(close, low) || Price.gt(close, high)) {
    errors.push(`close (${close}) must be between low (${low}) and high (${high})`)
  }

  // Volume non-negative (using Price for decimal precision)
  if (Price.lt(volume, 0)) {
    errors.push(`volume (${volume}) cannot be negative`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
