/**
 * Performance optimization for large datasets.
 * Implements viewport-based data windowing.
 */
import type { Candle, PriceMove } from '@fractal-price-structure/core'

export interface OptimizationResult<T> {
  data: T[]
  isOptimized: boolean
  originalCount: number
  visibleCount: number
}

// Performance thresholds
const THRESHOLD_NO_OPTIMIZATION = 500
const THRESHOLD_WINDOWING = 2000
const DEFAULT_BUFFER = 50

/**
 * Get visible candles based on viewport.
 * For < 500 candles: return all
 * For 500-2000: window to visible range + buffer
 * For > 2000: aggregate (future enhancement)
 */
export function getVisibleCandles(
  candles: Candle[],
  viewportStartIndex: number,
  viewportEndIndex: number,
  buffer: number = DEFAULT_BUFFER
): OptimizationResult<Candle> {
  const originalCount = candles.length

  // No optimization needed for small datasets
  if (originalCount <= THRESHOLD_NO_OPTIMIZATION) {
    return {
      data: candles,
      isOptimized: false,
      originalCount,
      visibleCount: originalCount,
    }
  }

  // Window to visible range with buffer
  const startIndex = Math.max(0, viewportStartIndex - buffer)
  const endIndex = Math.min(originalCount - 1, viewportEndIndex + buffer)
  const windowedCandles = candles.slice(startIndex, endIndex + 1)

  return {
    data: windowedCandles,
    isOptimized: true,
    originalCount,
    visibleCount: windowedCandles.length,
  }
}

/**
 * Get visible moves based on time range.
 * Moves are filtered to those overlapping the visible time range.
 */
export function getVisibleMoves(
  moves: PriceMove[],
  viewportStartTime: number,
  viewportEndTime: number
): OptimizationResult<PriceMove> {
  const originalCount = moves.length

  // Filter moves that overlap with the viewport time range
  const visibleMoves = moves.filter((move) => {
    const moveStart = move.timeRange.start
    const moveEnd = move.timeRange.end
    // Move overlaps if it starts before viewport ends and ends after viewport starts
    return moveStart <= viewportEndTime && moveEnd >= viewportStartTime
  })

  return {
    data: visibleMoves,
    isOptimized: visibleMoves.length < originalCount,
    originalCount,
    visibleCount: visibleMoves.length,
  }
}

/**
 * Determine optimization level based on data size.
 */
export function getOptimizationLevel(candleCount: number): 'none' | 'windowing' | 'aggregation' {
  if (candleCount <= THRESHOLD_NO_OPTIMIZATION) {
    return 'none'
  }
  if (candleCount <= THRESHOLD_WINDOWING) {
    return 'windowing'
  }
  return 'aggregation'
}

/**
 * Get viewport bounds from candles array and cursor position.
 * Returns the full data range for chart axis scaling.
 */
export function getFullDataRange(candles: Candle[]): {
  timeMin: number
  timeMax: number
  priceMin: number
  priceMax: number
} {
  if (candles.length === 0) {
    return { timeMin: 0, timeMax: 0, priceMin: 0, priceMax: 0 }
  }

  let priceMin = Infinity
  let priceMax = -Infinity

  for (const candle of candles) {
    if (candle.low < priceMin) priceMin = candle.low
    if (candle.high > priceMax) priceMax = candle.high
  }

  const firstCandle = candles[0]
  const lastCandle = candles[candles.length - 1]
  return {
    timeMin: firstCandle !== undefined ? firstCandle.openTime : 0,
    timeMax: lastCandle !== undefined ? lastCandle.openTime : 0,
    priceMin,
    priceMax,
  }
}
