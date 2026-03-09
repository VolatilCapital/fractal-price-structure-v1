/**
 * Factory for creating Observable Plot marks for the Fractal Layers swim-lane view.
 * Each rang level is a horizontal band; moves are rendered as bars at their rang level.
 */
import type { PriceMove, Candle } from '@fractal-price-structure/core'
import { PriceMoveState, Polarity } from '@fractal-price-structure/core'
import * as Plot from '@observablehq/plot'
import type { FilterState } from '../../domain/index.js'
import { filterMoves, getPolarityColor, getStateColor } from './PriceMoveMark.js'

/** Height of each rang band in pixels */
const BAND_HEIGHT = 24
/** Vertical gap between bands */
const BAND_GAP = 4
/** Vertical padding within each band for the bar */
const BAR_PADDING = 2

export interface FractalLayersMarkOptions {
  moves: PriceMove[]
  cursorTime: number
  filterState: FilterState
  candles: Candle[]
}

interface LayerDatum {
  move: PriceMove
  x1: number
  x2: number
  y: number
  color: string
  opacity: number
  stateColor: string
}

/**
 * Compute the vertical position for a move based on its rang.
 * Rang 0 is at bottom, higher rangs go up.
 */
function rangToY(rang: number): number {
  return rang
}

/**
 * Prepare data for the fractal layers chart.
 * Returns flat array of LayerDatum ready for Observable Plot.
 */
export function prepareFractalLayersData(options: FractalLayersMarkOptions): {
  data: LayerDatum[]
  maxRang: number
  parentChildLinks: Array<{ parentX: number; parentY: number; childX: number; childY: number; color: string; opacity: number }>
} {
  const { moves, cursorTime, filterState } = options

  const filteredMoves = filterMoves(moves, filterState)

  const data: LayerDatum[] = []
  const parentChildLinks: Array<{ parentX: number; parentY: number; childX: number; childY: number; color: string; opacity: number }> = []
  let maxRang = 0

  for (const move of filteredMoves) {
    const isFuture = move.timeRange.start > cursorTime
    const baseOpacity = isFuture ? 0.2 : 1.0
    // State opacity follows the charter: Growing = vivid, Reference = medium, Archived = subtle
    const stateOpacity = move.state === PriceMoveState.Growing ? 1.0
      : move.state === PriceMoveState.Reference ? 0.7
      : 0.3

    const x2 = move.state === PriceMoveState.Growing
      ? Math.min(move.timeRange.end, cursorTime)
      : move.timeRange.end

    if (move.rang > maxRang) maxRang = move.rang

    data.push({
      move,
      x1: move.timeRange.start,
      x2,
      y: rangToY(move.rang),
      color: getPolarityColor(move.polarity),
      opacity: baseOpacity * stateOpacity,
      stateColor: getStateColor(move.state),
    })

    // Parent-child links
    if (move.parentStructure && !isFuture) {
      const parent = move.parentStructure
      const midChildX = (move.timeRange.start + x2) / 2
      const midParentX = midChildX // align vertically
      parentChildLinks.push({
        childX: midChildX,
        childY: rangToY(move.rang),
        parentX: midParentX,
        parentY: rangToY(parent.rang),
        color: getPolarityColor(move.polarity),
        opacity: baseOpacity * 0.5,
      })
    }
  }

  return { data, maxRang, parentChildLinks }
}

/**
 * Create Observable Plot marks for the fractal layers swim-lane view.
 */
export function createFractalLayersMarks(options: FractalLayersMarkOptions) {
  const { data, maxRang, parentChildLinks } = prepareFractalLayersData(options)
  const marks: unknown[] = []

  if (data.length === 0) return { marks, maxRang }

  // Horizontal bars for each move
  marks.push(
    Plot.barX(data, {
      x1: (d: LayerDatum) => d.x1,
      x2: (d: LayerDatum) => d.x2,
      y: (d: LayerDatum) => d.y,
      fill: (d: LayerDatum) => d.color,
      fillOpacity: (d: LayerDatum) => d.opacity * 0.6,
      stroke: (d: LayerDatum) => d.stateColor,
      strokeWidth: 1.5,
      strokeOpacity: (d: LayerDatum) => d.opacity,
      insetTop: BAR_PADDING,
      insetBottom: BAR_PADDING,
    })
  )

  // State indicator dots at the start of each bar
  marks.push(
    Plot.dot(data, {
      x: (d: LayerDatum) => d.x1,
      y: (d: LayerDatum) => d.y,
      r: 3,
      fill: (d: LayerDatum) => d.stateColor,
      fillOpacity: (d: LayerDatum) => d.opacity,
    })
  )

  // Parent-child connection lines
  if (parentChildLinks.length > 0) {
    marks.push(
      Plot.link(parentChildLinks, {
        x1: (d) => d.childX,
        y1: (d) => d.childY,
        x2: (d) => d.parentX,
        y2: (d) => d.parentY,
        stroke: (d) => d.color,
        strokeWidth: 0.5,
        strokeOpacity: (d) => d.opacity,
        strokeDasharray: '2,2',
      })
    )
  }

  return { marks, maxRang }
}

/**
 * Compute chart height based on maximum rang level.
 */
export function computeLayersChartHeight(maxRang: number): number {
  return Math.max(100, (maxRang + 1) * (BAND_HEIGHT + BAND_GAP) + 60)
}
