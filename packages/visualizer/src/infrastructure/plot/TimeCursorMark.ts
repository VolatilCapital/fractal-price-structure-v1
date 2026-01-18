/**
 * Factory for creating Observable Plot time cursor mark.
 * Creates a vertical line at the cursor position.
 */
import * as Plot from '@observablehq/plot'

export interface TimeCursorMarkOptions {
  cursorTime: number
  color?: string
  strokeWidth?: number
}

const DEFAULT_COLOR = '#2196F3'
const DEFAULT_STROKE_WIDTH = 2

/**
 * Create time cursor mark for Observable Plot.
 * Returns a ruleX mark at the cursor time position.
 */
export function createTimeCursorMark(options: TimeCursorMarkOptions) {
  const { cursorTime, color = DEFAULT_COLOR, strokeWidth = DEFAULT_STROKE_WIDTH } = options

  return Plot.ruleX([cursorTime], {
    x: (d: number) => d,
    stroke: color,
    strokeWidth,
    strokeDasharray: '4,4',
  })
}
