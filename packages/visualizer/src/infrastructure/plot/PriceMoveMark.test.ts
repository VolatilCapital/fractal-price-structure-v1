import { describe, it, expect } from 'vitest'
import { Polarity } from '@fractal-price-structure/core'
import { getPolarityColor, getStateColor, prepareParentChildLinks } from './PriceMoveMark.js'
import { POLARITY_COLORS, STATE_COLORS } from '../../domain/index.js'
import { PriceMoveState } from '@fractal-price-structure/core'
import type { PriceMove } from '@fractal-price-structure/core'

describe('getPolarityColor', () => {
  it('returns Up color for bullish moves', () => {
    expect(getPolarityColor(Polarity.Up)).toBe(POLARITY_COLORS.Up)
  })

  it('returns Down color for bearish moves', () => {
    expect(getPolarityColor(Polarity.Down)).toBe(POLARITY_COLORS.Down)
  })

  it('Up and Down colors are distinct', () => {
    expect(getPolarityColor(Polarity.Up)).not.toBe(getPolarityColor(Polarity.Down))
  })
})

describe('getStateColor', () => {
  it('returns correct color for each state', () => {
    expect(getStateColor(PriceMoveState.Growing)).toBe(STATE_COLORS.Growing)
    expect(getStateColor(PriceMoveState.Reference)).toBe(STATE_COLORS.Reference)
    expect(getStateColor(PriceMoveState.Archived)).toBe(STATE_COLORS.Archived)
  })
})

function makeTimeRange(start: number, end: number) {
  return { start, end, includes: () => false, extendWith: () => makeTimeRange(start, end), duration: () => end - start }
}

function makeMoveStub(overrides: {
  rang: number
  polarity: Polarity
  state: PriceMoveState
  priceRange?: { low: number; high: number }
  timeRange?: { start: number; end: number }
  englobingMove?: PriceMove
}): PriceMove {
  const tr = overrides.timeRange
    ? makeTimeRange(overrides.timeRange.start, overrides.timeRange.end)
    : makeTimeRange(1000, 2000)
  return {
    id: 'test-' + Math.random(),
    polarity: overrides.polarity,
    state: overrides.state,
    rang: overrides.rang,
    degre: undefined,
    priceRange: overrides.priceRange ?? { low: 100, high: 110 },
    timeRange: tr,
    currentReferenceLevel: 105,
    referenceLevels: [],
    subStructures: [],
    parentStructure: undefined,
    englobingMove: overrides.englobingMove ?? undefined,
    childMoves: [],
    terminatedAt: undefined,
    archivedAt: undefined,
    isGrowing: () => overrides.state === PriceMoveState.Growing,
    isReference: () => overrides.state === PriceMoveState.Reference,
    isArchived: () => overrides.state === PriceMoveState.Archived,
  } as unknown as PriceMove
}

describe('prepareParentChildLinks', () => {
  it('returns empty array when no parent-child relationships exist', () => {
    const moves = [
      makeMoveStub({ rang: 0, polarity: Polarity.Up, state: PriceMoveState.Reference }),
      makeMoveStub({ rang: 1, polarity: Polarity.Down, state: PriceMoveState.Growing }),
    ]
    const links = prepareParentChildLinks(moves, 3000)
    expect(links).toHaveLength(0)
  })

  it('creates links between child and parent midpoints', () => {
    const parent = makeMoveStub({
      rang: 1,
      polarity: Polarity.Up,
      state: PriceMoveState.Growing,
      timeRange: { start: 1000, end: 5000 },
      priceRange: { low: 100, high: 120 },
    })
    const child = makeMoveStub({
      rang: 0,
      polarity: Polarity.Down,
      state: PriceMoveState.Reference,
      timeRange: { start: 2000, end: 3000 },
      priceRange: { low: 105, high: 115 },
      englobingMove: parent,
    })
    const links = prepareParentChildLinks([parent, child], 6000)
    expect(links).toHaveLength(1)
    // Child midpoint
    expect(links[0]!.x1).toBe(2500)
    expect(links[0]!.y1).toBe(110)
    // Parent midpoint
    expect(links[0]!.x2).toBe(3000)
    expect(links[0]!.y2).toBe(110)
  })

  it('skips moves whose start is after cursorTime', () => {
    const parent = makeMoveStub({
      rang: 1,
      polarity: Polarity.Up,
      state: PriceMoveState.Growing,
      timeRange: { start: 5000, end: 8000 },
    })
    const child = makeMoveStub({
      rang: 0,
      polarity: Polarity.Down,
      state: PriceMoveState.Reference,
      timeRange: { start: 6000, end: 7000 },
      englobingMove: parent,
    })
    const links = prepareParentChildLinks([parent, child], 3000)
    expect(links).toHaveLength(0)
  })
})
