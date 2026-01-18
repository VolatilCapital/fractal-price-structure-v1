/**
 * Factory for creating Observable Plot marks for PriceMove visualization.
 * Uses rect marks for price range boxes.
 */
import type { PriceMove } from '@fractal-price-structure/core'
import { PriceMoveState } from '@fractal-price-structure/core'
import * as Plot from '@observablehq/plot'
import type { FilterState } from '../../domain/index.js'

export interface PriceMoveMarkOptions {
  moves: PriceMove[]
  cursorTime: number
  filterState: FilterState
  fillOpacity?: number
  strokeWidth?: number
}

// State colors matching spec: Growing 🟢, Reference 🟠, Archived ⬜
const STATE_COLORS: Record<PriceMoveState, string> = {
  [PriceMoveState.Growing]: '#4CAF50',
  [PriceMoveState.Reference]: '#FF9800',
  [PriceMoveState.Archived]: '#9E9E9E',
}

const DEFAULT_FILL_OPACITY = 0.2
const DEFAULT_STROKE_WIDTH = 1

/**
 * Get color for a move's state.
 */
export function getStateColor(state: PriceMoveState): string {
  return STATE_COLORS[state] ?? '#9E9E9E'
}

/**
 * Filter moves based on filter state.
 */
export function filterMoves(moves: PriceMove[], filterState: FilterState): PriceMove[] {
  return moves.filter((move) => {
    // Filter by degre visibility
    const degre = move.degre
    if (degre !== undefined) {
      if (!filterState.visibleDegres.has(degre)) {
        return false
      }
    } else {
      // Move has undefined degre (Growing moves typically)
      if (!filterState.showUndefinedDegre) {
        return false
      }
    }

    // Filter archived moves
    if (!filterState.showArchived && move.state === PriceMoveState.Archived) {
      return false
    }

    // Filter sub-structures (moves with englobingMove)
    if (!filterState.showSubStructures && move.englobingMove) {
      return false
    }

    return true
  })
}

/**
 * Create price move marks for Observable Plot.
 * Returns an array of rect marks for the moves.
 */
export function createPriceMoveMarks(options: PriceMoveMarkOptions) {
  const {
    moves,
    cursorTime,
    filterState,
    fillOpacity = DEFAULT_FILL_OPACITY,
    strokeWidth = DEFAULT_STROKE_WIDTH,
  } = options

  // Filter moves based on filter state
  const filteredMoves = filterMoves(moves, filterState)

  // Split into active and future moves for opacity
  const activeMoves = filteredMoves.filter((m) => m.timeRange.start <= cursorTime)
  const futureMoves = filteredMoves.filter((m) => m.timeRange.start > cursorTime)

  const marks = []

  // Separate moves by state for proper z-ordering:
  // Growing moves (larger, englobing) rendered first (underneath)
  // Reference moves rendered on top to be visible
  const activeGrowing = activeMoves.filter(m => m.state === PriceMoveState.Growing)
  const activeReference = activeMoves.filter(m => m.state === PriceMoveState.Reference)
  const activeArchived = activeMoves.filter(m => m.state === PriceMoveState.Archived)

  const futureGrowing = futureMoves.filter(m => m.state === PriceMoveState.Growing)
  const futureReference = futureMoves.filter(m => m.state === PriceMoveState.Reference)
  const futureArchived = futureMoves.filter(m => m.state === PriceMoveState.Archived)

  // Helper to create rect mark
  const createRectMark = (
    moves: PriceMove[],
    opacity: number,
    strokeOp: number = 1,
    stroke: number = strokeWidth
  ) => {
    if (moves.length === 0) return null
    return Plot.rect(moves, {
      x1: (d: PriceMove) => d.timeRange.start,
      x2: (d: PriceMove) => d.timeRange.end,
      y1: (d: PriceMove) => d.priceRange.low,
      y2: (d: PriceMove) => d.priceRange.high,
      fill: (d: PriceMove) => getStateColor(d.state),
      fillOpacity: opacity,
      stroke: (d: PriceMove) => getStateColor(d.state),
      strokeWidth: stroke,
      strokeOpacity: strokeOp,
    })
  }

  // Active moves - render in order: Growing (bottom), Archived, Reference (top)
  // Reference moves get thicker stroke (2px) to stand out when nested inside Growing moves
  const growingMark = createRectMark(activeGrowing, fillOpacity)
  const archivedMark = createRectMark(activeArchived, fillOpacity)
  const referenceMark = createRectMark(activeReference, fillOpacity, 1, 2)

  if (growingMark) marks.push(growingMark)
  if (archivedMark) marks.push(archivedMark)
  if (referenceMark) marks.push(referenceMark)

  // Future moves - same order with reduced opacity
  const futureGrowingMark = createRectMark(futureGrowing, fillOpacity * 0.3, 0.3)
  const futureArchivedMark = createRectMark(futureArchived, fillOpacity * 0.3, 0.3)
  const futureReferenceMark = createRectMark(futureReference, fillOpacity * 0.3, 0.3, 2)

  if (futureGrowingMark) marks.push(futureGrowingMark)
  if (futureArchivedMark) marks.push(futureArchivedMark)
  if (futureReferenceMark) marks.push(futureReferenceMark)

  return marks
}
