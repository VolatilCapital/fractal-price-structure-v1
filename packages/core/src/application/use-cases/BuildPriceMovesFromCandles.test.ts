import { describe, it, expect, beforeEach } from "vitest"
import { BuildPriceMovesFromCandles } from "./BuildPriceMovesFromCandles.js"
import { PriceMoveStructure } from "../../domain/structure/PriceMoveStructure.js"
import { InMemoryPriceMoveRepository } from "../../infrastructure/repositories/InMemoryPriceMoveRepository.js"
import { Polarity } from "../../domain/price-move/Polarity.js"
import type { Candle } from "../../domain/candle/Candle.js"

function createCandle(overrides: Partial<Candle> = {}): Candle {
  return {
    openTime: 1000,
    closeTime: 2000,
    open: 100,
    high: 110,
    low: 90,
    close: 105,
    volume: 1000,
    ...overrides,
  }
}

describe("BuildPriceMovesFromCandles", () => {
  let structure: PriceMoveStructure
  let useCase: BuildPriceMovesFromCandles

  beforeEach(() => {
    const repo = new InMemoryPriceMoveRepository()
    structure = new PriceMoveStructure(repo)
    useCase = new BuildPriceMovesFromCandles(structure)
  })

  describe("build", () => {
    it("should add no moves to structure for an empty candle array", () => {
      useCase.build([])

      expect(structure.getAllMoves()).toHaveLength(0)
    })

    it("should add a single candle as a PriceMove", () => {
      const candle = createCandle({ open: 100, close: 110 })

      useCase.build([candle])

      expect(structure.getAllMoves()).toHaveLength(1)
    })

    it("should produce an Up move for a bullish candle (close > open)", () => {
      const candle = createCandle({ open: 100, close: 110 })

      useCase.build([candle])

      const moves = structure.getAllMoves()
      expect(moves[0].polarity).toBe(Polarity.Up)
    })

    it("should produce a Down move for a bearish candle (close < open)", () => {
      const candle = createCandle({ open: 110, close: 100 })

      useCase.build([candle])

      const moves = structure.getAllMoves()
      expect(moves[0].polarity).toBe(Polarity.Down)
    })

    it("should set priceRange from candle low/high", () => {
      const candle = createCandle({ low: 85, high: 120 })

      useCase.build([candle])

      const moves = structure.getAllMoves()
      expect(moves[0].priceRange.low).toBe(85)
      expect(moves[0].priceRange.high).toBe(120)
    })

    it("should set timeRange from candle openTime/closeTime", () => {
      const candle = createCandle({ openTime: 5000, closeTime: 6000 })

      useCase.build([candle])

      const moves = structure.getAllMoves()
      expect(moves[0].timeRange.start).toBe(5000)
      expect(moves[0].timeRange.end).toBe(6000)
    })

    it("should process multiple candles in order", () => {
      const candles = [
        createCandle({ openTime: 1000, closeTime: 2000, open: 100, close: 110, low: 95, high: 115 }),
        createCandle({ openTime: 2000, closeTime: 3000, open: 108, close: 120, low: 105, high: 125 }),
        createCandle({ openTime: 3000, closeTime: 4000, open: 115, close: 130, low: 110, high: 135 }),
      ]

      useCase.build(candles)

      // All candles processed — total moves may include sub-structures
      const allMoves = structure.getAllMoves()
      expect(allMoves.length).toBeGreaterThanOrEqual(1)
    })

    it("should extend the structure when consecutive candles continue the same direction", () => {
      // Two consecutive Up candles; the second should extend the first
      const candles = [
        createCandle({ openTime: 1000, closeTime: 2000, open: 100, close: 110, low: 95, high: 115 }),
        createCandle({ openTime: 2000, closeTime: 3000, open: 108, close: 120, low: 105, high: 125 }),
      ]

      useCase.build(candles)

      const growing = structure.getGrowingMoves()
      expect(growing.length).toBeGreaterThanOrEqual(1)
      // The root move should have been extended to high=125
      const rootMove = growing.find(m => !m.parentStructure)
      expect(rootMove?.priceRange.high).toBe(125)
    })

    it("should create a new root when a candle breaks the opposite boundary", () => {
      // Up move then a strong Down move that breaks the low
      const candles = [
        createCandle({ openTime: 1000, closeTime: 2000, open: 100, close: 110, low: 95, high: 115 }),
        createCandle({ openTime: 2000, closeTime: 3000, open: 105, close: 80, low: 75, high: 110 }),
      ]

      useCase.build(candles)

      const allMoves = structure.getAllMoves()
      const closedMoves = allMoves.filter(m => !m.isGrowing())
      expect(closedMoves.length).toBeGreaterThanOrEqual(1)
    })

    it("should be idempotent with respect to the structure state between separate builds", () => {
      // Each call to build adds on top of existing structure
      const candle = createCandle({ openTime: 1000, closeTime: 2000 })

      useCase.build([candle])
      const countAfterFirst = structure.getAllMoves().length

      useCase.build([]) // empty build — no change
      const countAfterSecond = structure.getAllMoves().length

      expect(countAfterSecond).toBe(countAfterFirst)
    })
  })
})
