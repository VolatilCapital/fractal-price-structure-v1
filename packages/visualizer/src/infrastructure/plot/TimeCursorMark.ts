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

const DEFAULT_COLOR = '#FFFFFF'
const DEFAULT_STROKE_WIDTH = 1.5

/**
 * Create time cursor mark for Observable Plot.
 * Returns a ruleX mark at the cursor time position with a subtle shadow for contrast.
 */
export function createTimeCursorMark(options: TimeCursorMarkOptions) {
  const { cursorTime, color = DEFAULT_COLOR, strokeWidth = DEFAULT_STROKE_WIDTH } = options

  // Shadow line behind cursor for contrast on both light and dark backgrounds
  const shadow = Plot.ruleX([cursorTime], {
    x: (d: number) => d,
    stroke: 'rgba(0,0,0,0.5)',
    strokeWidth: strokeWidth + 2,
    strokeDasharray: '6,3',
  })

  const cursor = Plot.ruleX([cursorTime], {
    x: (d: number) => d,
    stroke: color,
    strokeWidth,
    strokeDasharray: '6,3',
  })

  return [shadow, cursor]
}
