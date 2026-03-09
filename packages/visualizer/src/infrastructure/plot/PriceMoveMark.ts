/**
 * Factory for creating Observable Plot marks for PriceMove visualization.
 * Supports two display modes:
 * - Rectangle: boxes showing high/low price range
 * - Line: diagonal lines showing price movement direction
 */
import type { PriceMove, Candle } from '@fractal-price-structure/core'
import { PriceMoveState, Polarity } from '@fractal-price-structure/core'
import * as Plot from '@observablehq/plot'
import type { FilterState } from '../../domain/index.js'
import { STATE_COLORS, POLARITY_COLORS, LEVEL_COLORS } from '../../domain/index.js'

export interface PriceMoveMarkOptions {
  moves: PriceMove[]
  cursorTime: number
  filterState: FilterState
  candles: Candle[]
  fillOpacity?: number
  strokeWidth?: number
}

/**
 * Get the directional boundary of a Growing move at cursor time.
 * For Up moves: the progressive high (grows with each extension).
 * For Down moves: the progressive low (grows downward with each extension).
 * Uses referenceLevels for exact historical reconstruction.
 */
function getGrowingMoveBoundaryAtTime(
  move: PriceMove,
  cursorTime: number,
  candleMap: Map<number, Candle>
): number {
  // Find all extensions that occurred by cursor time
  const pastExtensions = move.referenceLevels.filter(r => r.timestamp <= cursorTime)
  if (pastExtensions.length > 0) {
    return pastExtensions[pastExtensions.length - 1].price
  }
  // Before first extension: use initial candle's directional boundary
  const initialCandle = candleMap.get(move.timeRange.start)
  if (initialCandle) {
    return move.polarity === Polarity.Up ? initialCandle.high : initialCandle.low
  }
  // Fallback to final boundary
  return move.polarity === Polarity.Up ? move.priceRange.high : move.priceRange.low
}

// Map PriceMoveState enum to STATE_COLORS keys
const STATE_COLOR_MAP: Record<PriceMoveState, string> = {
  [PriceMoveState.Growing]: STATE_COLORS.Growing,
  [PriceMoveState.Reference]: STATE_COLORS.Reference,
  [PriceMoveState.Archived]: STATE_COLORS.Archived,
}

const DEFAULT_FILL_OPACITY = 0.2
const DEFAULT_STROKE_WIDTH = 1

/**
 * Get color for a move's state.
 */
export function getStateColor(state: PriceMoveState): string {
  return STATE_COLOR_MAP[state] ?? STATE_COLORS.Archived
}

/**
 * Get color for the high boundary line of a Reference move.
 * - Up move: high = accroissement (extension side)
 * - Down move: high = cassure (invalidation side)
 */
export function getHighLineColor(polarity: Polarity): string {
  return polarity === Polarity.Up ? LEVEL_COLORS.Accroissement : LEVEL_COLORS.Cassure
}

/**
 * Get color for the low boundary line of a Reference move.
 * - Up move: low = cassure (invalidation side)
 * - Down move: low = accroissement (extension side)
 */
export function getLowLineColor(polarity: Polarity): string {
  return polarity === Polarity.Up ? LEVEL_COLORS.Cassure : LEVEL_COLORS.Accroissement
}

/**
 * Get color for a move based on its polarity.
 * See POLARITY_COLORS for the actual color values.
 */
export function getPolarityColor(polarity: Polarity): string {
  return polarity === Polarity.Up ? POLARITY_COLORS.Up : POLARITY_COLORS.Down
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
    candles,
    fillOpacity = DEFAULT_FILL_OPACITY,
    strokeWidth = DEFAULT_STROKE_WIDTH,
  } = options

  // Build candle lookup map for O(1) access by openTime
  const candleMap = new Map(candles.map(c => [c.openTime, c]))

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
      cursorTime,
      candleMap,
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
    cursorTime,
    candleMap,
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
  cursorTime: number
  candleMap: Map<number, Candle>
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
    cursorTime,
    candleMap,
  } = params

  const marks: (ReturnType<typeof Plot.rect> | ReturnType<typeof Plot.ruleY> | ReturnType<typeof Plot.text>)[] = []

  // Helper to create rect mark for non-Growing moves (full extent)
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
      fill: (d: PriceMove) => getPolarityColor(d.polarity),
      fillOpacity: opacity,
      stroke: (d: PriceMove) => getPolarityColor(d.polarity),
      strokeWidth: stroke,
      strokeOpacity: strokeOp,
    })
  }

  // Helper to create progressive rect mark for active Growing moves.
  // Clips x2 to cursorTime and animates the directional boundary using referenceLevels.
  const createProgressiveRectMark = (
    moves: PriceMove[],
    opacity: number,
    strokeOp: number = 1,
    stroke: number = strokeWidth
  ) => {
    if (moves.length === 0) return null
    return Plot.rect(moves, {
      x1: (d: PriceMove) => d.timeRange.start,
      x2: (d: PriceMove) => Math.min(d.timeRange.end, cursorTime),
      y1: (d: PriceMove) =>
        d.polarity === Polarity.Up
          ? d.priceRange.low
          : getGrowingMoveBoundaryAtTime(d, cursorTime, candleMap),
      y2: (d: PriceMove) =>
        d.polarity === Polarity.Up
          ? getGrowingMoveBoundaryAtTime(d, cursorTime, candleMap)
          : d.priceRange.high,
      fill: (d: PriceMove) => getPolarityColor(d.polarity),
      fillOpacity: opacity,
      stroke: (d: PriceMove) => getPolarityColor(d.polarity),
      strokeWidth: stroke,
      strokeOpacity: strokeOp,
    })
  }

  // Helper to create Reference level marks:
  // - Light fill background (direction indicator)
  // - High horizontal line (accroissement or cassure depending on polarity)
  // - Low horizontal line (cassure or accroissement depending on polarity)
  const createReferenceLevelMarks = (moves: PriceMove[], strokeOp: number = 1) => {
    if (moves.length === 0) return []
    const result: (ReturnType<typeof Plot.rect> | ReturnType<typeof Plot.ruleY>)[] = []

    // Background fill: polarity direction color, very low opacity
    result.push(Plot.rect(moves, {
      x1: (d: PriceMove) => d.timeRange.start,
      x2: (d: PriceMove) => d.timeRange.end,
      y1: (d: PriceMove) => d.priceRange.low,
      y2: (d: PriceMove) => d.priceRange.high,
      fill: (d: PriceMove) => getPolarityColor(d.polarity),
      fillOpacity: 0.08 * strokeOp,
      stroke: null,
    }))

    // High boundary line
    result.push(Plot.ruleY(moves, {
      y: (d: PriceMove) => d.priceRange.high,
      x1: (d: PriceMove) => d.timeRange.start,
      x2: (d: PriceMove) => d.timeRange.end,
      stroke: (d: PriceMove) => getHighLineColor(d.polarity),
      strokeWidth: 2,
      strokeOpacity: strokeOp,
    }))

    // Low boundary line
    result.push(Plot.ruleY(moves, {
      y: (d: PriceMove) => d.priceRange.low,
      x1: (d: PriceMove) => d.timeRange.start,
      x2: (d: PriceMove) => d.timeRange.end,
      stroke: (d: PriceMove) => getLowLineColor(d.polarity),
      strokeWidth: 2,
      strokeOpacity: strokeOp,
    }))

    return result
  }

  // Helper to create text labels showing Rang and Degré.
  // For Growing moves, centers on the visible (clipped) extent.
  const createTextMark = (moves: PriceMove[], opacity: number = 1) => {
    if (moves.length === 0) return null
    return Plot.text(moves, {
      x: (d: PriceMove) => {
        const x2 = d.state === PriceMoveState.Growing
          ? Math.min(d.timeRange.end, cursorTime)
          : d.timeRange.end
        return (d.timeRange.start + x2) / 2
      },
      y: (d: PriceMove) => {
        const y1 = d.state === PriceMoveState.Growing && d.polarity === Polarity.Down
          ? getGrowingMoveBoundaryAtTime(d, cursorTime, candleMap)
          : d.priceRange.low
        const y2 = d.state === PriceMoveState.Growing && d.polarity === Polarity.Up
          ? getGrowingMoveBoundaryAtTime(d, cursorTime, candleMap)
          : d.priceRange.high
        return (y1 + y2) / 2
      },
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
  const growingMark = createProgressiveRectMark(activeGrowing, fillOpacity)
  const archivedMark = createRectMark(activeArchived, fillOpacity)

  if (growingMark) marks.push(growingMark)
  if (archivedMark) marks.push(archivedMark)

  // Reference moves: two horizontal boundary lines + light background
  for (const m of createReferenceLevelMarks(activeReference)) {
    marks.push(m)
  }

  // Text labels for active moves
  const allActive = [...activeGrowing, ...activeReference, ...activeArchived]
  const textMark = createTextMark(allActive)
  if (textMark) marks.push(textMark)

  // Future moves - same order with reduced opacity
  const futureGrowingMark = createRectMark(futureGrowing, fillOpacity * 0.3, 0.3)
  const futureArchivedMark = createRectMark(futureArchived, fillOpacity * 0.3, 0.3)

  if (futureGrowingMark) marks.push(futureGrowingMark)
  if (futureArchivedMark) marks.push(futureArchivedMark)

  for (const m of createReferenceLevelMarks(futureReference, 0.3)) {
    marks.push(m)
  }

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
    cursorTime,
    candleMap,
  } = params

  const marks: ReturnType<typeof Plot.link>[] = []

  // Helper to create line mark for non-Growing moves (full extent)
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
      stroke: (d: PriceMove) => getPolarityColor(d.polarity),
      strokeWidth: stroke,
      strokeOpacity: strokeOp,
    })
  }

  // Helper to create progressive line mark for active Growing moves.
  // Clips x2 to cursorTime and animates the endpoint using referenceLevels.
  const createProgressiveLineMark = (
    moves: PriceMove[],
    strokeOp: number = 1,
    stroke: number = strokeWidth
  ) => {
    if (moves.length === 0) return null
    return Plot.link(moves, {
      x1: (d: PriceMove) => d.timeRange.start,
      y1: (d: PriceMove) => d.polarity === Polarity.Up ? d.priceRange.low : d.priceRange.high,
      x2: (d: PriceMove) => Math.min(d.timeRange.end, cursorTime),
      y2: (d: PriceMove) => getGrowingMoveBoundaryAtTime(d, cursorTime, candleMap),
      stroke: (d: PriceMove) => getPolarityColor(d.polarity),
      strokeWidth: stroke,
      strokeOpacity: strokeOp,
    })
  }

  // Active moves - render in order: Growing (bottom), Archived, Reference (top)
  // Reference moves get thicker stroke (2px) to stand out
  const growingMark = createProgressiveLineMark(activeGrowing, 1, strokeWidth)
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
