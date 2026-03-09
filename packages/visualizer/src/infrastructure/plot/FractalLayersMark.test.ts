import { describe, it, expect } from 'vitest'
import { Polarity, PriceMoveState } from '@fractal-price-structure/core'
import type { PriceMove } from '@fractal-price-structure/core'
import { prepareFractalLayersData, computeLayersChartHeight } from './FractalLayersMark.js'
import { createFilterState } from '../../domain/index.js'

function makeTimeRange(start: number, end: number) {
  return { start, end, includes: () => false, extendWith: () => makeTimeRange(start, end), duration: () => end - start }
}

interface MoveStubInput {
  rang: number
  polarity: Polarity
  state: PriceMoveState
  degre?: number
  priceRange?: { low: number; high: number }
  timeRange?: { start: number; end: number }
  parentStructure?: PriceMove
}

function makeMoveStub(overrides: MoveStubInput): PriceMove {
  const tr = overrides.timeRange
    ? makeTimeRange(overrides.timeRange.start, overrides.timeRange.end)
    : makeTimeRange(1000, 2000)
  return {
    id: 'test-' + Math.random(),
    polarity: overrides.polarity,
    state: overrides.state,
    rang: overrides.rang,
    degre: overrides.degre ?? undefined,
    priceRange: overrides.priceRange ?? { low: 100, high: 110 },
    timeRange: tr,
    currentReferenceLevel: 105,
    referenceLevels: [],
    subStructures: [],
    parentStructure: overrides.parentStructure ?? undefined,
    englobingMove: overrides.parentStructure ?? undefined,
    childMoves: [],
    terminatedAt: undefined,
    archivedAt: undefined,
    isGrowing: () => overrides.state === PriceMoveState.Growing,
    isReference: () => overrides.state === PriceMoveState.Reference,
    isArchived: () => overrides.state === PriceMoveState.Archived,
  } as unknown as PriceMove
}

describe('FractalLayersMark', () => {
  describe('prepareFractalLayersData', () => {
    it('should return empty data for empty moves', () => {
      const result = prepareFractalLayersData({
        moves: [],
        cursorTime: 2000,
        filterState: createFilterState(),
        candles: [],
      })
      expect(result.data).toHaveLength(0)
      expect(result.maxRang).toBe(0)
    })

    it('should position moves at their rang level', () => {
      const moves = [
        makeMoveStub({ rang: 0, polarity: Polarity.Up, state: PriceMoveState.Reference }),
        makeMoveStub({ rang: 2, polarity: Polarity.Down, state: PriceMoveState.Reference }),
      ]
      const result = prepareFractalLayersData({
        moves,
        cursorTime: 3000,
        filterState: createFilterState(),
        candles: [],
      })
      expect(result.data[0].y).toBe(0)
      expect(result.data[1].y).toBe(2)
      expect(result.maxRang).toBe(2)
    })

    it('should clip Growing moves x2 to cursorTime', () => {
      const moves = [
        makeMoveStub({
          rang: 0,
          polarity: Polarity.Up,
          state: PriceMoveState.Growing,
          timeRange: { start: 1000, end: 5000 },
        }),
      ]
      const result = prepareFractalLayersData({
        moves,
        cursorTime: 3000,
        filterState: createFilterState(),
        candles: [],
      })
      expect(result.data[0].x2).toBe(3000)
    })

    it('should create parent-child links when parentStructure exists', () => {
      const parent = makeMoveStub({
        rang: 1,
        polarity: Polarity.Up,
        state: PriceMoveState.Growing,
        timeRange: { start: 500, end: 3000 },
      })
      const child = makeMoveStub({
        rang: 0,
        polarity: Polarity.Up,
        state: PriceMoveState.Reference,
        parentStructure: parent,
      })
      const result = prepareFractalLayersData({
        moves: [parent, child],
        cursorTime: 3000,
        filterState: createFilterState(),
        candles: [],
      })
      expect(result.parentChildLinks).toHaveLength(1)
      expect(result.parentChildLinks[0].childY).toBe(0)
      expect(result.parentChildLinks[0].parentY).toBe(1)
    })

    it('should reduce opacity for future moves', () => {
      const moves = [
        makeMoveStub({
          rang: 0,
          polarity: Polarity.Up,
          state: PriceMoveState.Reference,
          timeRange: { start: 5000, end: 6000 },
        }),
      ]
      const result = prepareFractalLayersData({
        moves,
        cursorTime: 3000,
        filterState: createFilterState(),
        candles: [],
      })
      expect(result.data[0].opacity).toBeLessThan(0.5)
    })
  })

  describe('computeLayersChartHeight', () => {
    it('should return minimum 100px', () => {
      expect(computeLayersChartHeight(0)).toBeGreaterThanOrEqual(100)
    })

    it('should increase with maxRang', () => {
      const h0 = computeLayersChartHeight(0)
      const h5 = computeLayersChartHeight(5)
      expect(h5).toBeGreaterThan(h0)
    })
  })
})
