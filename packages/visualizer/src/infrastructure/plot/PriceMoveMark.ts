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
import { STATE_COLORS, POLARITY_COLORS, LEVEL_COLORS, STATE_OPACITY } from '../../domain/index.js'

export interface PriceMoveMarkOptions {
  moves: PriceMove[]
  cursorTime: number
  filterState: FilterState
  candles: Candle[]
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
  const lastExtension = pastExtensions[pastExtensions.length - 1]
  if (lastExtension !== undefined) {
    return lastExtension.price
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

    // Filter sub-structures (moves with a parent structure)
    if (!filterState.showSubStructures && move.parentStructure) {
      return false
    }

    // Filter by maxRang
    if (filterState.maxRang !== undefined && move.rang > filterState.maxRang) {
      return false
    }

    // Filter by minRangContrasted (ADR-007)
    if (filterState.minRangContrasted !== undefined && move.rangContrasted < filterState.minRangContrasted) {
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
  strokeWidth: number
  cursorTime: number
  candleMap: Map<number, Candle>
}

/**
 * Tooltip text for a PriceMove (used by both rect and line marks).
 */
/**
 * Format a timestamp as a short date string.
 */
function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('fr-FR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function moveTitle(d: PriceMove): string {
  const pol = d.polarity === Polarity.Up ? '▲ Up' : '▼ Down'
  const state = d.state === PriceMoveState.Growing ? 'Growing'
    : d.state === PriceMoveState.Reference ? 'Reference' : 'Archived'
  const degre = d.degre !== undefined ? `D${d.degre}` : '-'
  // Auto-detect decimal precision: use enough digits to show price differences
  const digits = d.priceRange.high < 10 ? 5 : d.priceRange.high < 1000 ? 2 : 0
  const range = `${d.priceRange.low.toFixed(digits)} → ${d.priceRange.high.toFixed(digits)}`
  const amplitude = ((d.priceRange.high - d.priceRange.low) / d.priceRange.low * 100).toFixed(2)
  const subs = d.subStructures?.length ?? 0
  const time = `${formatTime(d.timeRange.start)} — ${formatTime(d.timeRange.end)}`
  return `R${d.rang} ${degre} | ${pol} ${state}\n${range} (${amplitude}%)\n${time}\nSous-structures: ${subs}`
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
    strokeWidth,
    cursorTime,
    candleMap,
  } = params

  const marks: (ReturnType<typeof Plot.rect> | ReturnType<typeof Plot.ruleY> | ReturnType<typeof Plot.text>)[] = []

  // Scale stroke width by rang — higher rang = thicker border for visual hierarchy
  const rangStrokeWidth = (d: PriceMove, base: number) =>
    d.rang === 0 ? Math.max(base * 0.5, 0.5) : Math.min(base + d.rang * 0.5, base + 3)

  // Get fill opacity from STATE_OPACITY, scaled by rang
  // Rang 0 is very subtle, higher rangs more visible
  const stateFillOpacity = (d: PriceMove, futureScale: number = 1) => {
    const base = d.state === PriceMoveState.Growing ? STATE_OPACITY.Growing.fill
      : d.state === PriceMoveState.Reference ? STATE_OPACITY.Reference.fill
      : STATE_OPACITY.Archived.fill
    const rangScale = d.rang === 0 ? 0.5 : Math.min(1 + d.rang * 0.15, 2)
    return base * rangScale * futureScale
  }

  // Get stroke opacity from STATE_OPACITY
  const stateStrokeOpacity = (d: PriceMove, futureScale: number = 1) => {
    const base = d.state === PriceMoveState.Growing ? STATE_OPACITY.Growing.stroke
      : d.state === PriceMoveState.Reference ? STATE_OPACITY.Reference.stroke
      : STATE_OPACITY.Archived.stroke
    return base * futureScale
  }

  // Helper to create rect mark for non-Growing moves (full extent)
  const createRectMark = (
    moves: PriceMove[],
    futureScale: number = 1,
    stroke: number = strokeWidth
  ) => {
    if (moves.length === 0) return null
    return Plot.rect(moves, {
      x1: (d: PriceMove) => d.timeRange.start,
      x2: (d: PriceMove) => d.timeRange.end,
      y1: (d: PriceMove) => d.priceRange.low,
      y2: (d: PriceMove) => d.priceRange.high,
      fill: (d: PriceMove) => getPolarityColor(d.polarity),
      fillOpacity: (d: PriceMove) => stateFillOpacity(d, futureScale),
      stroke: (d: PriceMove) => getPolarityColor(d.polarity),
      strokeWidth: (d: PriceMove) => rangStrokeWidth(d, stroke),
      strokeOpacity: (d: PriceMove) => stateStrokeOpacity(d, futureScale),
      title: moveTitle,
    })
  }

  // Helper to create progressive rect mark for active Growing moves.
  // Clips x2 to cursorTime and animates the directional boundary using referenceLevels.
  const createProgressiveRectMark = (
    moves: PriceMove[],
    futureScale: number = 1,
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
      fillOpacity: (d: PriceMove) => stateFillOpacity(d, futureScale),
      stroke: (d: PriceMove) => getPolarityColor(d.polarity),
      strokeWidth: (d: PriceMove) => rangStrokeWidth(d, stroke),
      strokeOpacity: (d: PriceMove) => stateStrokeOpacity(d, futureScale),
      title: moveTitle,
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

    // High boundary line — thickness scales with rang
    result.push(Plot.ruleY(moves, {
      y: (d: PriceMove) => d.priceRange.high,
      x1: (d: PriceMove) => d.timeRange.start,
      x2: (d: PriceMove) => d.timeRange.end,
      stroke: (d: PriceMove) => getHighLineColor(d.polarity),
      strokeWidth: (d: PriceMove) => Math.min(1.5 + d.rang * 0.5, 5),
      strokeOpacity: strokeOp,
    }))

    // Low boundary line — thickness scales with rang
    result.push(Plot.ruleY(moves, {
      y: (d: PriceMove) => d.priceRange.low,
      x1: (d: PriceMove) => d.timeRange.start,
      x2: (d: PriceMove) => d.timeRange.end,
      stroke: (d: PriceMove) => getLowLineColor(d.polarity),
      strokeWidth: (d: PriceMove) => Math.min(1.5 + d.rang * 0.5, 5),
      strokeOpacity: strokeOp,
    }))

    return result
  }

  // Helper to create text labels showing Rang and Degré.
  // Uses adaptive filtering: with many moves, only higher-rang labels are shown.
  // Font size scales with rang for visual hierarchy.
  const createTextMark = (moves: PriceMove[], opacity: number = 1) => {
    // Adaptive minimum rang threshold based on move count
    // Few moves (< 300): show rang >= 1
    // Medium (300-600): show rang >= 2
    // Many (> 600): show rang >= 3
    const minRangForLabels = moves.length > 600 ? 3 : moves.length > 300 ? 2 : 1
    const labeledMoves = moves.filter(m => m.rang >= minRangForLabels)
    if (labeledMoves.length === 0) return null
    return Plot.text(labeledMoves, {
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
      fontSize: (d: PriceMove) => Math.min(8 + d.rang * 2, 18),
      fontWeight: 'bold',
      textAnchor: 'middle',
      opacity,
    })
  }

  // Active moves - render in order: Growing (bottom), Archived, Reference (top)
  const growingMark = createProgressiveRectMark(activeGrowing)
  const archivedMark = createRectMark(activeArchived)

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

  // Future moves - same order with reduced opacity (30% of base)
  const futureGrowingMark = createRectMark(futureGrowing, 0.3)
  const futureArchivedMark = createRectMark(futureArchived, 0.3)

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

  // Scale line stroke by rang — rang 0 thin, higher rangs thicker
  const rangLineStroke = (d: PriceMove, base: number) =>
    d.rang === 0 ? Math.max(base * 0.5, 0.5) : Math.min(base + d.rang, base + 4)

  // Helper to create line mark for non-Growing moves (full extent)
  const createLineMark = (
    moves: PriceMove[],
    strokeOp: number = 1,
    _stroke: number = strokeWidth
  ) => {
    if (moves.length === 0) return null
    return Plot.link(moves, {
      x1: (d: PriceMove) => d.timeRange.start,
      y1: (d: PriceMove) => d.polarity === Polarity.Up ? d.priceRange.low : d.priceRange.high,
      x2: (d: PriceMove) => d.timeRange.end,
      y2: (d: PriceMove) => d.polarity === Polarity.Up ? d.priceRange.high : d.priceRange.low,
      stroke: (d: PriceMove) => getPolarityColor(d.polarity),
      strokeWidth: (d: PriceMove) => rangLineStroke(d, _stroke),
      strokeOpacity: strokeOp,
      title: moveTitle,
    })
  }

  // Helper to create progressive line mark for active Growing moves.
  // Clips x2 to cursorTime and animates the endpoint using referenceLevels.
  const createProgressiveLineMark = (
    moves: PriceMove[],
    strokeOp: number = 1,
    _stroke: number = strokeWidth
  ) => {
    if (moves.length === 0) return null
    return Plot.link(moves, {
      x1: (d: PriceMove) => d.timeRange.start,
      y1: (d: PriceMove) => d.polarity === Polarity.Up ? d.priceRange.low : d.priceRange.high,
      x2: (d: PriceMove) => Math.min(d.timeRange.end, cursorTime),
      y2: (d: PriceMove) => getGrowingMoveBoundaryAtTime(d, cursorTime, candleMap),
      stroke: (d: PriceMove) => getPolarityColor(d.polarity),
      strokeWidth: (d: PriceMove) => rangLineStroke(d, _stroke),
      strokeOpacity: strokeOp,
      title: moveTitle,
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

/**
 * Link data for parent-child connections on the price chart.
 */
export interface ParentChildLink {
  x1: number // child midpoint time
  y1: number // child midpoint price
  x2: number // parent midpoint time
  y2: number // parent midpoint price
  childRang: number
  parentRang: number
}

/**
 * Prepare parent-child link data from filtered moves.
 * Only includes links where both parent and child are active (start <= cursorTime).
 */
export function prepareParentChildLinks(
  moves: PriceMove[],
  cursorTime: number,
): ParentChildLink[] {
  const links: ParentChildLink[] = []

  for (const child of moves) {
    if (!child.parentStructure) continue
    if (child.timeRange.start > cursorTime) continue

    const parent = child.parentStructure
    if (parent.timeRange.start > cursorTime) continue

    const childMidTime = (child.timeRange.start + Math.min(child.timeRange.end, cursorTime)) / 2
    const childMidPrice = (child.priceRange.low + child.priceRange.high) / 2
    const parentMidTime = (parent.timeRange.start + Math.min(parent.timeRange.end, cursorTime)) / 2
    const parentMidPrice = (parent.priceRange.low + parent.priceRange.high) / 2

    links.push({
      x1: childMidTime,
      y1: childMidPrice,
      x2: parentMidTime,
      y2: parentMidPrice,
      childRang: child.rang,
      parentRang: parent.rang,
    })
  }

  return links
}

/**
 * Create Observable Plot marks for parent-child connection links on the price chart.
 * Dashed lines connecting child midpoint to parent midpoint.
 */
export function createParentChildLinkMarks(
  moves: PriceMove[],
  cursorTime: number,
): ReturnType<typeof Plot.link>[] {
  const links = prepareParentChildLinks(moves, cursorTime)
  if (links.length === 0) return []

  return [
    Plot.link(links, {
      x1: 'x1',
      y1: 'y1',
      x2: 'x2',
      y2: 'y2',
      stroke: '#888',
      strokeWidth: 0.8,
      strokeOpacity: 0.5,
      strokeDasharray: '4,3',
    }),
  ]
}
