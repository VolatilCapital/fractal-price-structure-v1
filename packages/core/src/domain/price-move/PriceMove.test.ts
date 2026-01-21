import { describe, it, expect } from "vitest"
import { PriceMove } from "./PriceMove.js"
import { PriceMoveFactory } from "./PriceMoveFactory.js"
import { Polarity } from "./Polarity.js"
import { PriceMoveState } from "./PriceMoveState.js"
import { PriceMoveId } from "./PriceMoveId.js"
import { PriceRange } from "../../shared/PriceRange.js"
import { TimeRange } from "../../shared/TimeRange.js"
import type { Candle } from "../candle/Candle.js"

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

    it("should start in Growing state", () => {
      const candle = createCandle()
      const move = PriceMoveFactory.fromCandle(candle)

      expect(move.state).toBe(PriceMoveState.Growing)
      expect(move.isGrowing()).toBe(true)
      expect(move.isActive()).toBe(true) // Legacy
      expect(move.isClosed()).toBe(false) // Legacy
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
    it("should have empty subStructures array", () => {
      const candle = createCandle()
      const move = PriceMoveFactory.fromCandle(candle)

      expect(move.subStructures).toEqual([])
      expect(move.childMoves).toEqual([]) // Legacy alias
    })

    it("should have empty referenceLevels array", () => {
      const candle = createCandle()
      const move = PriceMoveFactory.fromCandle(candle)

      expect(move.referenceLevels).toEqual([])
    })

    it("should have undefined parentStructure", () => {
      const candle = createCandle()
      const move = PriceMoveFactory.fromCandle(candle)

      expect(move.parentStructure).toBeUndefined()
      expect(move.englobingMove).toBeUndefined() // Legacy alias
    })
  })

  // Story 2.2: Move Extension Logic (using processCandidate)
  describe("processCandidate - extension logic", () => {
    it("should extend Up move when candidate has higher high", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Up, priceRange: { low: 100, high: 120 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.processCandidate(candidate)

      expect(result).toBe("extended-boundary")
      expect(parent.priceRange.high).toBe(120)
      expect(parent.timeRange.end).toBe(3000)
      expect(parent.referenceLevels.length).toBe(1)
    })

    it("should extend Down move when candidate has lower low", () => {
      const parent = createMove({ polarity: Polarity.Down, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Down, priceRange: { low: 80, high: 100 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.processCandidate(candidate)

      expect(result).toBe("extended-boundary")
      expect(parent.priceRange.low).toBe(80)
      expect(parent.timeRange.end).toBe(3000)
      expect(parent.referenceLevels.length).toBe(1)
    })

    it("should return extended-internal for internal candidate (neither extends nor breaks)", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Up, priceRange: { low: 95, high: 105 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.processCandidate(candidate)

      // Internal candidates return "extended-internal" in the new model
      expect(result).toBe("extended-internal")
      expect(parent.priceRange.high).toBe(110) // unchanged
    })

    it("should not extend when move is not Growing", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      parent.terminate(2000) // Makes it Reference
      const candidate = createMove({ polarity: Polarity.Up, priceRange: { low: 100, high: 120 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.processCandidate(candidate)

      expect(result).toBe("broken")
      expect(parent.priceRange.high).toBe(110) // unchanged
    })
  })

  // Story 2.3: Move Invalidation Logic (using processCandidate)
  describe("processCandidate - invalidation logic", () => {
    it("should break Up move when candidate low < parent low", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Down, priceRange: { low: 85, high: 100 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.processCandidate(candidate)

      expect(result).toBe("broken")
      // Note: processCandidate doesn't call terminate - that's done by the structure
    })

    it("should break Down move when candidate high > parent high", () => {
      const parent = createMove({ polarity: Polarity.Down, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Up, priceRange: { low: 100, high: 115 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.processCandidate(candidate)

      expect(result).toBe("broken")
    })

    it("should NOT break Up move when candidate low == parent low (boundary case)", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 105 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.processCandidate(candidate)

      expect(result).toBe("extended-internal") // Internal candidate
      expect(parent.isGrowing()).toBe(true) // not terminated
    })

    it("should NOT break Down move when candidate high == parent high (boundary case)", () => {
      const parent = createMove({ polarity: Polarity.Down, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Down, priceRange: { low: 95, high: 110 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.processCandidate(candidate)

      expect(result).toBe("extended-internal") // Internal candidate
      expect(parent.isGrowing()).toBe(true) // not terminated
    })
  })

  // Legacy tryExtendWith tests for backward compatibility
  describe("tryExtendWith - legacy backward compatibility", () => {
    it("should extend Up move when candidate has higher high", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Up, priceRange: { low: 100, high: 120 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.tryExtendWith(candidate)

      expect(result).toBe(true)
      expect(parent.priceRange.high).toBe(120)
      expect(parent.timeRange.end).toBe(3000)
    })

    it("should invalidate Up move when candidate low < parent low", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Down, priceRange: { low: 85, high: 100 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.tryExtendWith(candidate)

      expect(result).toBe(false)
      expect(parent.isReference()).toBe(true) // Terminated
      expect(parent.isClosed()).toBe(true) // Legacy
    })

    it("should attach candidate as subStructure when it fits within parent bounds", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const candidate = createMove({ polarity: Polarity.Up, priceRange: { low: 95, high: 105 }, timeRange: { start: 2000, end: 3000 } })

      const result = parent.tryExtendWith(candidate)

      expect(result).toBe(true)
      expect(parent.subStructures).toContain(candidate)
      expect(candidate.parentStructure).toBe(parent)
    })
  })

  // Story 2.5: Rang Tracking (formerly Generation)
  describe("rang tracking", () => {
    it("should have rang 0 by default (root move)", () => {
      const move = createMove()

      expect(move.rang).toBe(0)
      expect(move.generation).toBe(0) // Legacy alias
    })

    it("should accept explicit rang in constructor", () => {
      const move = new PriceMove({
        id: PriceMoveId.create(),
        polarity: Polarity.Up,
        priceRange: new PriceRange(90, 110),
        timeRange: new TimeRange(1000, 2000),
        rang: 3,
      })

      expect(move.rang).toBe(3)
      expect(move.generation).toBe(3) // Legacy alias
    })

    it("should recalculate rang based on subStructures", () => {
      const parent = createMove()
      const child = new PriceMove({
        id: PriceMoveId.create(),
        polarity: Polarity.Up,
        priceRange: new PriceRange(95, 105),
        timeRange: new TimeRange(1100, 1900),
        rang: 2,
      })

      parent.addSubStructure(child)

      expect(parent.rang).toBe(3) // max(child.rang) + 1
    })
  })

  // State transitions
  describe("state transitions", () => {
    it("should transition from Growing to Reference on terminate", () => {
      const move = createMove()

      expect(move.isGrowing()).toBe(true)
      expect(move.state).toBe(PriceMoveState.Growing)

      move.terminate(2000)

      expect(move.isGrowing()).toBe(false)
      expect(move.isReference()).toBe(true)
      expect(move.state).toBe(PriceMoveState.Reference)
      expect(move.terminatedAt).toBe(2000)
    })

    it("should transition from Reference to Archived on archive", () => {
      const move = createMove()
      move.terminate(2000)

      expect(move.isReference()).toBe(true)

      move.archive(3000)

      expect(move.isReference()).toBe(false)
      expect(move.isArchived()).toBe(true)
      expect(move.state).toBe(PriceMoveState.Archived)
      expect(move.archivedAt).toBe(3000)
    })

    it("should not terminate if already terminated", () => {
      const move = createMove()
      move.terminate(2000)
      move.terminate(3000)

      expect(move.terminatedAt).toBe(2000) // First terminate wins
    })

    it("should not archive if not Reference", () => {
      const move = createMove()
      move.archive(3000)

      expect(move.isArchived()).toBe(false)
      expect(move.isGrowing()).toBe(true)
    })
  })

  // Reference levels tracking
  describe("referenceLevels tracking", () => {
    it("should add reference level when extending", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const extending = createMove({ polarity: Polarity.Up, priceRange: { low: 100, high: 120 }, timeRange: { start: 2000, end: 3000 } })

      parent.processCandidate(extending)

      expect(parent.referenceLevels.length).toBe(1)
      expect(parent.referenceLevels[0].price).toBe(120) // high for Up move
      expect(parent.referenceLevels[0].move).toBe(extending)
    })

    it("should NOT add reference level for internal candidate", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const internal = createMove({ polarity: Polarity.Up, priceRange: { low: 95, high: 105 }, timeRange: { start: 2000, end: 3000 } })

      parent.processCandidate(internal)

      expect(parent.referenceLevels.length).toBe(0)
    })

    it("should track multiple extensions in referenceLevels", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const ext1 = createMove({ polarity: Polarity.Up, priceRange: { low: 100, high: 115 }, timeRange: { start: 2000, end: 3000 } })
      const ext2 = createMove({ polarity: Polarity.Up, priceRange: { low: 105, high: 120 }, timeRange: { start: 3000, end: 4000 } })

      parent.processCandidate(ext1)
      parent.processCandidate(ext2)

      expect(parent.referenceLevels.length).toBe(2)
      expect(parent.referenceLevels[0].index).toBe(0)
      expect(parent.referenceLevels[1].index).toBe(1)
    })

    it("should provide legacy confirmedOrigins as alias", () => {
      const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
      const extending = createMove({ polarity: Polarity.Up, priceRange: { low: 100, high: 120 }, timeRange: { start: 2000, end: 3000 } })

      parent.processCandidate(extending)

      expect(parent.confirmedOrigins).toContain(extending) // Legacy accessor
    })
  })

  // Degre calculation
  describe("degre calculation", () => {
    it("should calculate degre 0 for root move (no parent)", () => {
      const move = createMove()
      move.terminate(2000)

      expect(move.degre).toBe(0) // Root has degre 0
    })

    it("should calculate degre based on parent (degre = parent.degre + 1)", () => {
      const parent = createMove()
      const child = createMove()

      parent.addSubStructure(child)

      // First terminate parent (it gets degre 0 as root)
      parent.terminate(2000)
      expect(parent.degre).toBe(0)

      // Then terminate child (it gets degre = parent.degre + 1 = 1)
      child.terminate(2500)
      expect(child.degre).toBe(1)
    })

    it("should calculate degre for deeply nested structures", () => {
      const grandparent = createMove()
      const parent = createMove()
      const child = createMove()

      grandparent.addSubStructure(parent)
      parent.addSubStructure(child)

      grandparent.terminate(3000)
      expect(grandparent.degre).toBe(0) // Root

      parent.terminate(2500)
      expect(parent.degre).toBe(1) // grandparent.degre + 1

      child.terminate(2000)
      expect(child.degre).toBe(2) // parent.degre + 1
    })
  })

  // Protocol compliance: currentReferenceLevel (protocole section 3)
  describe("currentReferenceLevel - protocol compliance", () => {
    describe("initialization (protocole section 3.1)", () => {
      it("should initialize reference level to LOW for Up move", () => {
        const move = createMove({ polarity: Polarity.Up, priceRange: { low: 100, high: 110 } })

        expect(move.currentReferenceLevel).toBe(100) // low is opposite bound for Up
      })

      it("should initialize reference level to HIGH for Down move", () => {
        const move = createMove({ polarity: Polarity.Down, priceRange: { low: 90, high: 110 } })

        expect(move.currentReferenceLevel).toBe(110) // high is opposite bound for Down
      })
    })

    describe("dynamic updates on extension (protocole section 3.3)", () => {
      it("should update reference level when Up move is extended", () => {
        // Up move with initial ref = 90 (the low)
        const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 90, high: 110 } })
        expect(parent.currentReferenceLevel).toBe(90)

        // Extend with a candidate that has low=105
        const extending = createMove({
          polarity: Polarity.Up,
          priceRange: { low: 105, high: 120 },
          timeRange: { start: 2000, end: 3000 }
        })

        parent.processCandidate(extending)

        // After extension, reference level = low of extending move (105)
        expect(parent.currentReferenceLevel).toBe(105)
        expect(parent.priceRange.high).toBe(120) // Structure extended
      })

      it("should update reference level when Down move is extended", () => {
        // Down move with initial ref = 110 (the high)
        const parent = createMove({ polarity: Polarity.Down, priceRange: { low: 90, high: 110 } })
        expect(parent.currentReferenceLevel).toBe(110)

        // Extend with a candidate that has high=85
        const extending = createMove({
          polarity: Polarity.Down,
          priceRange: { low: 80, high: 85 },
          timeRange: { start: 2000, end: 3000 }
        })

        parent.processCandidate(extending)

        // After extension, reference level = high of extending move (85)
        expect(parent.currentReferenceLevel).toBe(85)
        expect(parent.priceRange.low).toBe(80) // Structure extended
      })

      it("should track multiple extensions with evolving reference level", () => {
        // Protocole section 3.3 example: I1 → C1 → I2 → C2 → I3
        // Reference level evolves: low of I1 → low of I2 → low of I3
        const structure = createMove({ polarity: Polarity.Up, priceRange: { low: 100, high: 105 } })
        expect(structure.currentReferenceLevel).toBe(100) // Initial: low of I1

        // I2 extends (with low=104)
        const i2 = createMove({
          polarity: Polarity.Up,
          priceRange: { low: 104, high: 112 },
          timeRange: { start: 2000, end: 3000 }
        })
        structure.processCandidate(i2)
        expect(structure.currentReferenceLevel).toBe(104) // Now: low of I2

        // I3 extends (with low=108)
        const i3 = createMove({
          polarity: Polarity.Up,
          priceRange: { low: 108, high: 118 },
          timeRange: { start: 4000, end: 5000 }
        })
        structure.processCandidate(i3)
        expect(structure.currentReferenceLevel).toBe(108) // Now: low of I3
      })
    })

    describe("invalidation against reference level (protocole section 3.2)", () => {
      it("should break Up move when candidate breaks reference level (not structure low)", () => {
        // Up move: priceRange [100, 120], but reference level evolved to 108
        const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 100, high: 110 } })

        // Extend to evolve reference level
        const extending = createMove({
          polarity: Polarity.Up,
          priceRange: { low: 108, high: 120 },
          timeRange: { start: 2000, end: 3000 }
        })
        parent.processCandidate(extending)
        expect(parent.currentReferenceLevel).toBe(108)

        // Now a candidate with low=106 should break (106 < 108 reference)
        // even though 106 > 100 (structure low)
        const breaking = createMove({
          polarity: Polarity.Down,
          priceRange: { low: 106, high: 115 },
          timeRange: { start: 3000, end: 4000 }
        })

        const result = parent.processCandidate(breaking)
        expect(result).toBe("broken")
      })

      it("should NOT break Up move when candidate is above reference level", () => {
        const parent = createMove({ polarity: Polarity.Up, priceRange: { low: 100, high: 110 } })

        // Extend to evolve reference level to 108
        const extending = createMove({
          polarity: Polarity.Up,
          priceRange: { low: 108, high: 120 },
          timeRange: { start: 2000, end: 3000 }
        })
        parent.processCandidate(extending)

        // Candidate with low=109 should NOT break (109 > 108 reference)
        const notBreaking = createMove({
          polarity: Polarity.Down,
          priceRange: { low: 109, high: 115 },
          timeRange: { start: 3000, end: 4000 }
        })

        const result = parent.processCandidate(notBreaking)
        expect(result).toBe("extended-internal") // Internal, not broken
        expect(parent.isGrowing()).toBe(true)
      })

      it("should break Down move when candidate breaks reference level (not structure high)", () => {
        // Down move: priceRange [80, 110], but reference level evolved to 92
        const parent = createMove({ polarity: Polarity.Down, priceRange: { low: 90, high: 110 } })

        // Extend to evolve reference level
        const extending = createMove({
          polarity: Polarity.Down,
          priceRange: { low: 80, high: 92 },
          timeRange: { start: 2000, end: 3000 }
        })
        parent.processCandidate(extending)
        expect(parent.currentReferenceLevel).toBe(92)

        // Candidate with high=95 should break (95 > 92 reference)
        // even though 95 < 110 (structure high)
        const breaking = createMove({
          polarity: Polarity.Up,
          priceRange: { low: 85, high: 95 },
          timeRange: { start: 3000, end: 4000 }
        })

        const result = parent.processCandidate(breaking)
        expect(result).toBe("broken")
      })
    })
  })
})
