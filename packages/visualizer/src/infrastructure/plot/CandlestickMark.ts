/**
 * Factory for creating Observable Plot candlestick marks.
 * Uses ruleX for vertical lines at X (time) positions.
 */
import type { Candle } from '@fractal-price-structure/core'
import * as Plot from '@observablehq/plot'

export interface CandlestickMarkOptions {
  candles: Candle[]
  cursorTime: number
  wickColor?: string
  bodyWidth?: number
  bullColor?: string
  bearColor?: string
}

const DEFAULT_WICK_COLOR = '#666'
const DEFAULT_BODY_WIDTH = 6
const DEFAULT_BULL_COLOR = '#4CAF50'
const DEFAULT_BEAR_COLOR = '#F44336'

/**
 * Create candlestick marks for Observable Plot.
 * Returns an array of mark specifications (wick + body).
 */
export function createCandlestickMarks(options: CandlestickMarkOptions) {
  const {
    candles,
    cursorTime,
    wickColor = DEFAULT_WICK_COLOR,
    bodyWidth = DEFAULT_BODY_WIDTH,
    bullColor = DEFAULT_BULL_COLOR,
    bearColor = DEFAULT_BEAR_COLOR,
  } = options

  // Wick (high-low line)
  const wickMark = Plot.ruleX(candles, {
    x: 'openTime',
    y1: 'low',
    y2: 'high',
    stroke: wickColor,
    strokeWidth: 1,
    opacity: (d: Candle) => (d.openTime <= cursorTime ? 1 : 0.3),
  })

  // Body (open-close line with color based on direction)
  const bodyMark = Plot.ruleX(candles, {
    x: 'openTime',
    y1: 'open',
    y2: 'close',
    stroke: (d: Candle) => (d.close >= d.open ? bullColor : bearColor),
    strokeWidth: bodyWidth,
    opacity: (d: Candle) => (d.openTime <= cursorTime ? 1 : 0.3),
  })

  return [wickMark, bodyMark]
}
