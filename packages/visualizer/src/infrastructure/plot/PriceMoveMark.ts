/**
 * Factory for creating Observable Plot marks for PriceMove visualization.
 * Supports two display modes:
 * - Rectangle: boxes showing high/low price range
 * - Line: diagonal lines showing price movement direction
 */
import type { PriceMove } from '@fractal-price-structure/core'
import { PriceMoveState, Polarity } from '@fractal-price-structure/core'
import * as Plot from '@observablehq/plot'
import type { FilterState } from '../../domain/index.js'
import { STATE_COLORS } from '../../domain/index.js'

export interface PriceMoveMarkOptions {
  moves: PriceMove[]
  cursorTime: number
  filterState: FilterState
  fillOpacity?: number
  strokeWidth?: number
}

// Map PriceMoveState enum to STATE_COLORS keys
const STATE_COLOR_MAP: Record<PriceMoveState, string> = {
  [PriceMoveState.Growing]: STATE_COLORS.Growing,
  [PriceMoveState.Reference]: STATE_COLORS.Reference,
  [PriceMoveState.Archived]: STATE_COLORS.Archived,
}

// Degree colors - distinct colors for each degree level
const DEGRE_COLORS: string[] = [
  '#E91E63', // D0 - Pink
  '#9C27B0', // D1 - Purple
  '#3F51B5', // D2 - Indigo
  '#2196F3', // D3 - Blue
  '#00BCD4', // D4 - Cyan
  '#009688', // D5 - Teal
  '#FF5722', // D6 - Deep Orange
  '#795548', // D7 - Brown
]

const DEFAULT_FILL_OPACITY = 0.2
const DEFAULT_STROKE_WIDTH = 1

/**
 * Get color for a move's state.
 */
export function getStateColor(state: PriceMoveState): string {
  return STATE_COLOR_MAP[state] ?? STATE_COLORS.Archived
}

/**
 * Get color for a move based on its degree.
 * Growing moves (undefined degre) use green, Reference uses degree color.
 */
export function getMoveColor(move: PriceMove): string {
  if (move.state === PriceMoveState.Growing) {
    return STATE_COLORS.Growing
  }
  if (move.state === PriceMoveState.Archived) {
    return STATE_COLORS.Archived
  }
  // Reference move - use degree color
  const degre = move.degre ?? 0
  return DEGRE_COLORS[degre % DEGRE_COLORS.length]
}

/**
 * Filter moves based on filter state.
 */
export function filterMoves(moves: PriceMove[], filterState: FilterState): PriceMove[] {
  return moves.filter((move) => {
    // Filter by state (Growing, Reference, Archived)
    if (!filterState.showGrowing && move.state === PriceMoveState.Growing) {
      return false
    }
    if (!filterState.showReference && move.state === PriceMoveState.Reference) {
      return false
    }
    if (!filterState.showArchived && move.state === PriceMoveState.Archived) {
      return false
    }

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

    // Filter sub-structures (moves with englobingMove)
    if (!filterState.showSubStructures && move.englobingMove) {
      return false
    }

    return true
  })
}

/**
 * Create price move marks for Observable Plot.
 * Supports rectangle and line display modes.
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

  // Separate moves by state for proper z-ordering:
  // Growing moves (larger, englobing) rendered first (underneath)
  // Reference moves rendered on top to be visible
  const activeGrowing = activeMoves.filter(m => m.state === PriceMoveState.Growing)
  const activeReference = activeMoves.filter(m => m.state === PriceMoveState.Reference)
  const activeArchived = activeMoves.filter(m => m.state === PriceMoveState.Archived)

  const futureGrowing = futureMoves.filter(m => m.state === PriceMoveState.Growing)
  const futureReference = futureMoves.filter(m => m.state === PriceMoveState.Reference)
  const futureArchived = futureMoves.filter(m => m.state === PriceMoveState.Archived)

  // Choose mark creation function based on display mode
  if (filterState.displayMode === 'line') {
    return createLineMarks({
      activeGrowing,
      activeReference,
      activeArchived,
      futureGrowing,
      futureReference,
      futureArchived,
      strokeWidth,
    })
  }

  return createRectMarks({
    activeGrowing,
    activeReference,
    activeArchived,
    futureGrowing,
    futureReference,
    futureArchived,
    fillOpacity,
    strokeWidth,
  })
}

interface StateGroupedMoves {
  activeGrowing: PriceMove[]
  activeReference: PriceMove[]
  activeArchived: PriceMove[]
  futureGrowing: PriceMove[]
  futureReference: PriceMove[]
  futureArchived: PriceMove[]
  fillOpacity?: number
  strokeWidth: number
}

/**
 * Create rectangle marks (box mode).
 */
function createRectMarks(params: StateGroupedMoves) {
  const {
    activeGrowing,
    activeReference,
    activeArchived,
    futureGrowing,
    futureReference,
    futureArchived,
    fillOpacity = DEFAULT_FILL_OPACITY,
    strokeWidth,
  } = params

  const marks: (ReturnType<typeof Plot.rect> | ReturnType<typeof Plot.text>)[] = []

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

  // Helper to create text labels showing Rang and Degré
  const createTextMark = (moves: PriceMove[], opacity: number = 1) => {
    if (moves.length === 0) return null
    return Plot.text(moves, {
      x: (d: PriceMove) => (d.timeRange.start + d.timeRange.end) / 2,
      y: (d: PriceMove) => (d.priceRange.low + d.priceRange.high) / 2,
      text: (d: PriceMove) => {
        const rang = `R${d.rang}`
        const degre = d.degre !== undefined ? ` D${d.degre}` : ''
        return rang + degre
      },
      fill: 'white',
      stroke: 'black',
      strokeWidth: 0.5,
      fontSize: 10,
      textAnchor: 'middle',
      opacity,
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

  // Text labels for active moves
  const allActive = [...activeGrowing, ...activeReference, ...activeArchived]
  const textMark = createTextMark(allActive)
  if (textMark) marks.push(textMark)

  // Future moves - same order with reduced opacity
  const futureGrowingMark = createRectMark(futureGrowing, fillOpacity * 0.3, 0.3)
  const futureArchivedMark = createRectMark(futureArchived, fillOpacity * 0.3, 0.3)
  const futureReferenceMark = createRectMark(futureReference, fillOpacity * 0.3, 0.3, 2)

  if (futureGrowingMark) marks.push(futureGrowingMark)
  if (futureArchivedMark) marks.push(futureArchivedMark)
  if (futureReferenceMark) marks.push(futureReferenceMark)

  return marks
}

/**
 * Create line marks (diagonal mode).
 * Lines go from start to end, direction based on polarity:
 * - Up: (startTime, low) → (endTime, high)
 * - Down: (startTime, high) → (endTime, low)
 */
function createLineMarks(params: Omit<StateGroupedMoves, 'fillOpacity'>) {
  const {
    activeGrowing,
    activeReference,
    activeArchived,
    futureGrowing,
    futureReference,
    futureArchived,
    strokeWidth,
  } = params

  const marks: ReturnType<typeof Plot.link>[] = []

  // Helper to create line mark using Plot.link
  const createLineMark = (
    moves: PriceMove[],
    strokeOp: number = 1,
    stroke: number = strokeWidth
  ) => {
    if (moves.length === 0) return null
    return Plot.link(moves, {
      x1: (d: PriceMove) => d.timeRange.start,
      y1: (d: PriceMove) => d.polarity === Polarity.Up ? d.priceRange.low : d.priceRange.high,
      x2: (d: PriceMove) => d.timeRange.end,
      y2: (d: PriceMove) => d.polarity === Polarity.Up ? d.priceRange.high : d.priceRange.low,
      stroke: (d: PriceMove) => getStateColor(d.state),
      strokeWidth: stroke,
      strokeOpacity: strokeOp,
    })
  }

  // Active moves - render in order: Growing (bottom), Archived, Reference (top)
  // Reference moves get thicker stroke (2px) to stand out
  const growingMark = createLineMark(activeGrowing, 1, strokeWidth)
  const archivedMark = createLineMark(activeArchived, 1, strokeWidth)
  const referenceMark = createLineMark(activeReference, 1, strokeWidth + 1)

  if (growingMark) marks.push(growingMark)
  if (archivedMark) marks.push(archivedMark)
  if (referenceMark) marks.push(referenceMark)

  // Future moves - same order with reduced opacity
  const futureGrowingMark = createLineMark(futureGrowing, 0.3)
  const futureArchivedMark = createLineMark(futureArchived, 0.3)
  const futureReferenceMark = createLineMark(futureReference, 0.3, strokeWidth + 1)

  if (futureGrowingMark) marks.push(futureGrowingMark)
  if (futureArchivedMark) marks.push(futureArchivedMark)
  if (futureReferenceMark) marks.push(futureReferenceMark)

  return marks
}
