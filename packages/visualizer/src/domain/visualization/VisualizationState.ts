/**
 * State for the visualization cursor and view settings.
 * Pure TypeScript - no Vue imports.
 */
export interface VisualizationState {
  /** Index of the current candle (0-based) */
  cursorIndex: number
  /** Timestamp of the current cursor position */
  cursorTime: number
  /** Total number of candles loaded */
  totalCandles: number
}

export function createVisualizationState(totalCandles: number = 0): VisualizationState {
  return {
    cursorIndex: totalCandles > 0 ? totalCandles - 1 : 0,
    cursorTime: 0,
    totalCandles,
  }
}

export function setCursorIndex(
  state: VisualizationState,
  index: number,
  candleTime: number
): VisualizationState {
  const clampedIndex = Math.max(0, Math.min(index, state.totalCandles - 1))
  return {
    ...state,
    cursorIndex: clampedIndex,
    cursorTime: candleTime,
  }
}
