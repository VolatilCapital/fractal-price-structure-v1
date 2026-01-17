import { describe, it, expect } from "vitest"
import { PriceMove } from "./PriceMove.js"
import { PriceMoveFactory } from "./PriceMoveFactory.js"
import { Polarity } from "./Polarity.js"
import { PriceMoveState } from "./PriceMoveState.js"
import { PriceMoveId } from "./PriceMoveId.js"
import { PriceRange } from "../../shared/PriceRange.js"
import { TimeRange } from "../../shared/TimeRange.js"
import type { Candle } from "../../shared/Candle.js"

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

function createMove(overrides: {
  polarity?: Polarity
  priceRange?: { low: number; high: number }
  timeRange?: { start: number; end: number }
} = {}): PriceMove {
  const { polarity = Polarity.Up, priceRange = { low: 90, high: 110 }, timeRange = { start: 1000, end: 2000 } } = overrides
  return new PriceMove({
    id: PriceMoveId.create(),
    polarity,
    priceRange: new PriceRange(priceRange.low, priceRange.high),
    timeRange: new TimeRange(timeRange.start, timeRange.end),
  })
}

describe("PriceMove Entity", () => {
  describe("creation via PriceMoveFactory", () => {
    it("should have Up polarity when close > open", () => {
      const candle = createCandle({ open: 100, close: 110 })
      const move = PriceMoveFactory.fromCandle(candle)

      expect(move.polarity).toBe(Polarity.Up)
    })

    it("should have Up polarity when close == open (edge case)", () => {
      const candle = createCandle({ open: 100, close: 100 })
      const move = PriceMoveFactory.fromCandle(candle)

      expect(move.polarity).toBe(Polarity.Up)
    })

    it("should have Down polarity when close < open", () => {
      const candle = createCandle({ open: 110, close: 100 })
      const move = PriceMoveFactory.fromCandle(candle)

      expect(move.polarity).toBe(Polarity.Down)
    })

    it("should set correct timeRange from candle", () => {
      const candle = createCandle({ openTime: 5000, closeTime: 6000 })
      const move = PriceMoveFactory.fromCandle(candle)

      expect(move.timeRange.start).toBe(5000)
      expect(move.timeRange.end).toBe(6000)
    })

    it("should set correct priceRange from candle low/high", () => {
      const candle = createCandle({ low: 80, high: 120 })
      const move = PriceMoveFactory.fromCandle(candle)

      expect(move.priceRange.low).toBe(80)
      expect(move.priceRange.high).toBe(120)
    })

    it("should generate unique id (UUID)", () => {
      const candle = createCandle()
      const move1 = PriceMoveFactory.fromCandle(candle)
      const move2 = PriceMoveFactory.fromCandle(candle)

      expect(move1.id.toString()).not.toBe(move2.id.toString())
      expect(move1.id.toString()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
    })

    it("should start in Active state", () => {
      const candle = createCandle()
      const move = PriceMoveFactory.fromCandle(candle)

      expect(move.state).toBe(PriceMoveState.Active)
      expect(move.isActive()).toBe(true)
      expect(move.isClosed()).toBe(false)
    })

    it("should handle extreme price values", () => {
      const candle = createCandle({
        open: 0.00000001,
        close: 0.00000002,
        low: 0.000000005,
        high: 0.00000003,
      })
      const move = PriceMoveFactory.fromCandle(candle)

      expect(move.polarity).toBe(Polarity.Up)
      expect(move.priceRange.low).toBe(0.000000005)
      expect(move.priceRange.high).toBe(0.00000003)
    })

    it("should handle large price values", () => {
      const candle = createCandle({
        open: 1000000,
        close: 999999,
        low: 999000,
        high: 1001000,
      })
      const move = PriceMoveFactory.fromCandle(candle)

      expect(move.polarity).toBe(Polarity.Down)
      expect(move.priceRange.low).toBe(999000)
      expect(move.priceRange.high).toBe(1001000)
    })
  })

  describe("immutability", () => {
    it("should have readonly id", () => {
      const candle = createCandle()
      const move = PriceMoveFactory.fromCandle(candle)

      // TypeScript readonly check - id cannot be reassigned
      // This is a compile-time check, but we verify the property exists
      expect(move.id).toBeDefined()
    })
  })

  describe("initial state", () => {
    it("should have empty childMoves array", () => {
      const candle = createCandle()
      const move = PriceMoveFactory.fromCandle(candle)

      expect(move.childMoves).toEqual([])
    })

    it("should have empty origin array", () => {
      const candle = createCandle()
      const move = PriceMoveFactory.fromCandle(candle)

      expect(move.origin).toEqual([])
    })

    it("should have empty confirmedOrigins array", () => {
      const candle = createCandle()
      const move = PriceMoveFactory.fromCandle(candle)

      expect(move.confirmedOrigins).toEqual([])
    })

    it("should have undefined englobingMove", () => {
      const candle = createCandle()
      const move = PriceMoveFactory.fromCandle(candle)

      expect(move.englobingMove).toBeUndefined()
    })
  })

  // Story 2.2: Move Extension Logic
  describe("tryExtendWith - extension logic", () => {
    it("should extend Up move when candidate has higher high", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Up, priceRange: { low: 100, high: 120 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.tryExtendWith(candidate)

      expect(result).toBe(true)
      expect(parent.priceRange.high).toBe(120)
      expect(parent.timeRange.end).toBe(3000)
      expect(parent.confirmedOrigins).toContain(candidate)
    })

    it("should extend Down move when candidate has lower low", () => {
      const parent = createMove({ polarity: Polarity.Down, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Down, priceRange: { low: 80, high: 100 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.tryExtendWith(candidate)

      expect(result).toBe(true)
      expect(parent.priceRange.low).toBe(80)
      expect(parent.timeRange.end).toBe(3000)
      expect(parent.confirmedOrigins).toContain(candidate)
    })

    it("should NOT extend Up move when candidate high <= parent high", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Up, priceRange: { low: 95, high: 105 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.tryExtendWith(candidate)

      // Should attach as child, not extend
      expect(result).toBe(true)
      expect(parent.priceRange.high).toBe(110) // unchanged
      expect(parent.childMoves).toContain(candidate)
    })

    it("should NOT extend Down move when candidate low >= parent low", () => {
      const parent = createMove({ polarity: Polarity.Down, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Down, priceRange: { low: 95, high: 105 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.tryExtendWith(candidate)

      // Should attach as child, not extend
      expect(result).toBe(true)
      expect(parent.priceRange.low).toBe(90) // unchanged
      expect(parent.childMoves).toContain(candidate)
    })

    it("should not extend when move is Closed", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      parent.state = PriceMoveState.Closed
      const candidate = createMove({ polarity: Polarity.Up, priceRange: { low: 100, high: 120 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.tryExtendWith(candidate)

      expect(result).toBe(false)
      expect(parent.priceRange.high).toBe(110) // unchanged
    })
  })

  // Story 2.3: Move Invalidation Logic
  describe("tryExtendWith - invalidation logic", () => {
    it("should invalidate Up move when candidate low < parent low", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Down, priceRange: { low: 85, high: 100 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.tryExtendWith(candidate)

      expect(result).toBe(false)
      expect(parent.state).toBe(PriceMoveState.Closed)
      expect(parent.isClosed()).toBe(true)
    })

    it("should invalidate Down move when candidate high > parent high", () => {
      const parent = createMove({ polarity: Polarity.Down, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Up, priceRange: { low: 100, high: 115 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.tryExtendWith(candidate)

      expect(result).toBe(false)
      expect(parent.state).toBe(PriceMoveState.Closed)
      expect(parent.isClosed()).toBe(true)
    })

    it("should NOT invalidate Up move when candidate low == parent low (boundary case)", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 105 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.tryExtendWith(candidate)

      expect(result).toBe(true)
      expect(parent.state).toBe(PriceMoveState.Active) // not invalidated
    })

    it("should NOT invalidate Down move when candidate high == parent high (boundary case)", () => {
      const parent = createMove({ polarity: Polarity.Down, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Down, priceRange: { low: 95, high: 110 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.tryExtendWith(candidate)

      expect(result).toBe(true)
      expect(parent.state).toBe(PriceMoveState.Active) // not invalidated
    })
  })

  // Story 2.4: Child Move Attachment
  describe("tryExtendWith - child attachment", () => {
    it("should attach candidate as child when it fits within parent bounds", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Up, priceRange: { low: 95, high: 105 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.tryExtendWith(candidate)

      expect(result).toBe(true)
      expect(parent.childMoves).toContain(candidate)
      expect(candidate.englobingMove).toBe(parent)
    })

    it("should set bidirectional relationship between parent and child", () => {
      const parent = createMove({ polarity: Polarity.Down, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Down, priceRange: { low: 92, high: 108 }, timeRange: { start: 2000, end: 3000 } })

      parent.tryExtendWith(candidate)

      expect(parent.childMoves.includes(candidate)).toBe(true)
      expect(candidate.englobingMove).toBe(parent)
    })

    it("should allow multiple children", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const child1 = createMove({ polarity: Polarity.Up, priceRange: { low: 92, high: 100 }, timeRange: { start: 2000, end: 2500 } })
      const child2 = createMove({ polarity: Polarity.Up, priceRange: { low: 95, high: 105 }, timeRange: { start: 2500, end: 3000 } })

      parent.tryExtendWith(child1)
      parent.tryExtendWith(child2)

      expect(parent.childMoves).toHaveLength(2)
      expect(parent.childMoves).toContain(child1)
      expect(parent.childMoves).toContain(child2)
    })
  })

  // Story 2.5: Generation Tracking
  describe("generation tracking", () => {
    it("should have generation 0 by default (root move)", () => {
      const move = createMove()

      expect(move.generation).toBe(0)
    })

    it("should accept explicit generation in constructor", () => {
      const move = new PriceMove({
        id: PriceMoveId.create(),
        polarity: Polarity.Up,
        priceRange: new PriceRange(90, 110),
        timeRange: new TimeRange(1000, 2000),
        generation: 3,
      })

      expect(move.generation).toBe(3)
    })

    it("should have readonly generation (immutable after creation)", () => {
      const move = createMove()

      // TypeScript ensures generation is readonly at compile time
      expect(move.generation).toBe(0)
    })

    it("should create move with parent generation + 1 for proper nesting", () => {
      const parent = new PriceMove({
        id: PriceMoveId.create(),
        polarity: Polarity.Up,
        priceRange: new PriceRange(90, 110),
        timeRange: new TimeRange(1000, 2000),
        generation: 2,
      })

      const child = new PriceMove({
        id: PriceMoveId.create(),
        polarity: Polarity.Up,
        priceRange: new PriceRange(95, 105),
        timeRange: new TimeRange(1100, 1900),
        generation: parent.generation + 1,
      })

      expect(parent.generation).toBe(2)
      expect(child.generation).toBe(3)
    })
  })

  // Story 2.7: Move Origins Tracking
  describe("origins tracking", () => {
    it("should add extending candidate to confirmedOrigins", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const extending = createMove({ polarity: Polarity.Up, priceRange: { low: 100, high: 120 }, timeRange: { start: 2000, end: 3000 } })

      parent.tryExtendWith(extending)

      expect(parent.confirmedOrigins).toContain(extending)
    })

    it("should NOT add internal child to confirmedOrigins", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const child = createMove({ polarity: Polarity.Up, priceRange: { low: 95, high: 105 }, timeRange: { start: 2000, end: 3000 } })

      parent.tryExtendWith(child)

      expect(parent.confirmedOrigins).not.toContain(child)
    })

    it("should track multiple extensions in confirmedOrigins", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const ext1 = createMove({ polarity: Polarity.Up, priceRange: { low: 100, high: 115 }, timeRange: { start: 2000, end: 3000 } })
      const ext2 = createMove({ polarity: Polarity.Up, priceRange: { low: 105, high: 120 }, timeRange: { start: 3000, end: 4000 } })

      parent.tryExtendWith(ext1)
      parent.tryExtendWith(ext2)

      expect(parent.confirmedOrigins).toHaveLength(2)
      expect(parent.confirmedOrigins).toContain(ext1)
      expect(parent.confirmedOrigins).toContain(ext2)
    })
  })
})
