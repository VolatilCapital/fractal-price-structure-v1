/**
 * Port interface for rendering the price chart.
 * Abstracts away the specific charting library (Observable Plot).
 */
import type { Candle, PriceMove } from '@fractal-price-structure/core'
import type { FilterState } from '../../domain/index.js'

export interface ChartData {
  candles: Candle[]
  moves: PriceMove[]
  cursorTime: number
  cursorIndex: number
  filterState: FilterState
}

export interface ChartRenderer {
  /**
   * Render the chart with the given data.
   * @param container - DOM element to render into
   * @param data - Chart data including candles, moves, and cursor position
   */
  render(container: HTMLElement, data: ChartData): void

  /**
   * Clear the chart from the container.
   * @param container - DOM element to clear
   */
  clear(container: HTMLElement): void
}
