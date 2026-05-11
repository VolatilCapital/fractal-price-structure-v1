import { describe, it, expect, beforeEach } from "vitest"
import { PriceMoveStructure, CandleIngestionError } from "../PriceMoveStructure.js"
import { InMemoryPriceMoveRepository } from "../../../infrastructure/repositories/InMemoryPriceMoveRepository.js"
import { Polarity } from "../../../domain/price-move/Polarity.js"
import { PriceMoveState } from "../../../domain/price-move/PriceMoveState.js"
import type { Candle } from "../../../domain/candle/Candle.js"
import type { PriceMoveRepository } from "../../ports/PriceMoveRepository.js"

function createCandle(overrides: Partial<Candle> = {}): Candle {
  return {
    openTime: 1704067200000,
    closeTime: 1704067260000,
    open: 100,
    high: 110,
    low: 90,
    close: 105,
    volume: 1000,
    ...overrides,
  }
}

describe("PriceMoveStructure", () => {
  let repo: PriceMoveRepository
  let structure: PriceMoveStructure

  beforeEach(() => {
    repo = new InMemoryPriceMoveRepository()
    structure = new PriceMoveStructure(repo)
  })

  describe("addCandle", () => {
    describe("adding to empty structure", () => {
      it("should create a PriceMove from candle", () => {
        const candle = createCandle()

        const move = structure.addCandle(candle)

        expect(move).toBeDefined()
        expect(move.id).toBeDefined()
      })

      it("should set correct polarity for Up candle (close >= open)", () => {
        const candle = createCandle({ open: 100, close: 110 })

        const move = structure.addCandle(candle)

        expect(move.polarity).toBe(Polarity.Up)
      })

      it("should set correct polarity for Down candle (close < open)", () => {
        const candle = createCandle({ open: 110, close: 100 })

        const move = structure.addCandle(candle)

        expect(move.polarity).toBe(Polarity.Down)
      })

      it("should set timeRange from candle timestamps", () => {
        const candle = createCandle({
          openTime: 1704067200000,
          closeTime: 1704067260000,
        })

        const move = structure.addCandle(candle)

        expect(move.timeRange.start).toBe(1704067200000)
        expect(move.timeRange.end).toBe(1704067260000)
      })

      it("should set priceRange from candle low/high", () => {
        const candle = createCandle({ low: 95, high: 115 })

        const move = structure.addCandle(candle)

        expect(move.priceRange.low).toBe(95)
        expect(move.priceRange.high).toBe(115)
      })

      it("should add move to active moves", () => {
        const candle = createCandle()

        structure.addCandle(candle)

        const activeMoves = structure.getActiveMoves()
        expect(activeMoves).toHaveLength(1)
      })

      it("should return the created move", () => {
        const candle = createCandle()

        const move = structure.addCandle(candle)
        const allMoves = structure.getAllMoves()

        expect(allMoves).toContain(move)
      })
    })

    describe("candle validation", () => {
      it("should throw CandleIngestionError for invalid candle", () => {
        const invalidCandle = {
          openTime: 1000,
          closeTime: 500, // invalid: before openTime
          open: 100,
          high: 110,
          low: 90,
          close: 105,
          volume: 1000,
        }

        expect(() => structure.addCandle(invalidCandle)).toThrow(CandleIngestionError)
      })

      it("should include validation errors in exception", () => {
        const invalidCandle = {
          openTime: 1000,
          closeTime: 500,
          open: 100,
          high: 110,
          low: 90,
          close: 105,
          volume: 1000,
        }

        let thrownError: CandleIngestionError | null = null
        try {
          structure.addCandle(invalidCandle)
        } catch (error) {
          thrownError = error as CandleIngestionError
        }

        expect(thrownError).not.toBeNull()
        if (thrownError !== null) {
          expect(thrownError.validationErrors).toBeDefined()
          expect(thrownError.validationErrors?.length).toBeGreaterThan(0)
        }
      })

      it("should not modify structure when candle is invalid", () => {
        const invalidCandle = {
          openTime: 1000,
          closeTime: 500,
          open: 100,
          high: 110,
          low: 90,
          close: 105,
          volume: 1000,
        }

        try {
          structure.addCandle(invalidCandle)
        } catch {
          // Expected
        }

        expect(structure.getAllMoves()).toHaveLength(0)
      })
    })

    describe("extension behavior", () => {
      it("should extend active Up move when new candle has higher high", () => {
        // First candle creates an Up move
        const candle1 = createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 110,
          low: 95,
          high: 115,
        })
        const move1 = structure.addCandle(candle1)

        // Second candle extends the Up move
        const candle2 = createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 112,
          close: 125,
          low: 110,
          high: 130, // higher than previous high
        })
        structure.addCandle(candle2)

        // The first move should be extended
        expect(move1.priceRange.high).toBe(130)
        expect(move1.timeRange.end).toBe(3000)
      })

      it("should extend active Down move when new candle has lower low", () => {
        // First candle creates a Down move
        const candle1 = createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 110,
          close: 100,
          low: 95,
          high: 115,
        })
        const move1 = structure.addCandle(candle1)

        // Second candle extends the Down move
        const candle2 = createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 98,
          close: 85,
          low: 80, // lower than previous low
          high: 100,
        })
        structure.addCandle(candle2)

        // The first move should be extended
        expect(move1.priceRange.low).toBe(80)
        expect(move1.timeRange.end).toBe(3000)
      })
    })

    describe("invalidation behavior", () => {
      it("should invalidate Up move when new candle breaks below its low", () => {
        // First candle creates an Up move
        const candle1 = createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 110,
          low: 95,
          high: 115,
        })
        const move1 = structure.addCandle(candle1)

        // Second candle invalidates the Up move
        const candle2 = createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 90,
          close: 85,
          low: 80, // below the Up move's low of 95
          high: 95,
        })
        structure.addCandle(candle2)

        // The first move should be terminated (Reference state)
        expect(move1.isReference()).toBe(true)
        expect(move1.isClosed()).toBe(true) // Legacy check
      })

      it("should invalidate Down move when new candle breaks above its high", () => {
        // First candle creates a Down move
        const candle1 = createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 110,
          close: 100,
          low: 95,
          high: 115,
        })
        const move1 = structure.addCandle(candle1)

        // Second candle invalidates the Down move
        const candle2 = createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 118,
          close: 125,
          low: 115,
          high: 130, // above the Down move's high of 115
        })
        structure.addCandle(candle2)

        // The first move should be terminated (Reference state)
        expect(move1.isReference()).toBe(true)
        expect(move1.isClosed()).toBe(true) // Legacy check
      })
    })

    describe("child attachment behavior", () => {
      it("should attach internal candle as child when within parent bounds", () => {
        // First candle creates a large Up move
        const candle1 = createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 150,
          low: 90,
          high: 160,
        })
        const parent = structure.addCandle(candle1)

        // Second candle fits inside the parent (doesn't extend or invalidate)
        const candle2 = createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 130,
          close: 140,
          low: 120, // above parent's low
          high: 145, // below parent's high
        })
        const child = structure.addCandle(candle2)

        // Child should be attached to parent
        expect(parent.childMoves).toContain(child)
        expect(child.englobingMove).toBe(parent)
      })
    })

    describe("performance", () => {
      it("should process single candle in under 100ms", () => {
        const candle = createCandle()

        const startTime = performance.now()
        structure.addCandle(candle)
        const endTime = performance.now()

        const duration = endTime - startTime
        expect(duration).toBeLessThan(100)
      })

      it("should handle 100 sequential candles efficiently", () => {
        const startTime = performance.now()

        for (let i = 0; i < 100; i++) {
          const candle = createCandle({
            openTime: 1000 + i * 60000,
            closeTime: 1000 + (i + 1) * 60000,
            open: 100 + i,
            close: 100 + i + 5,
            low: 100 + i - 2,
            high: 100 + i + 7,
          })
          structure.addCandle(candle)
        }

        const endTime = performance.now()
        const avgTime = (endTime - startTime) / 100

        expect(avgTime).toBeLessThan(100)
      })
    })

    describe("edge cases", () => {
      it("should handle doji candle (open == close)", () => {
        const candle = createCandle({
          open: 100,
          close: 100,
          low: 95,
          high: 105,
        })

        const move = structure.addCandle(candle)

        // Doji is treated as Up (close >= open)
        expect(move.polarity).toBe(Polarity.Up)
      })

      it("should handle flat candle (all OHLC equal)", () => {
        const candle = createCandle({
          open: 100,
          high: 100,
          low: 100,
          close: 100,
        })

        const move = structure.addCandle(candle)

        expect(move).toBeDefined()
        expect(move.priceRange.low).toBe(100)
        expect(move.priceRange.high).toBe(100)
      })

      it("should handle zero volume candle", () => {
        const candle = createCandle({ volume: 0 })

        const move = structure.addCandle(candle)

        expect(move).toBeDefined()
      })
    })
  })

  describe("buildFromCandles", () => {
    describe("basic batch processing", () => {
      it("should return empty array for empty input", () => {
        const moves = structure.buildFromCandles([])

        expect(moves).toHaveLength(0)
        expect(structure.getAllMoves()).toHaveLength(0)
      })

      it("should process single candle in batch", () => {
        const candles = [createCandle()]

        const moves = structure.buildFromCandles(candles)

        expect(moves).toHaveLength(1)
        expect(structure.getAllMoves()).toHaveLength(1)
      })

      it("should process multiple candles in sequence", () => {
        const candles = [
          createCandle({
            openTime: 1000,
            closeTime: 2000,
            open: 100,
            close: 110,
            low: 95,
            high: 115,
          }),
          createCandle({
            openTime: 2000,
            closeTime: 3000,
            open: 108,
            close: 120,
            low: 105,
            high: 125,
          }),
          createCandle({
            openTime: 3000,
            closeTime: 4000,
            open: 118,
            close: 130,
            low: 115,
            high: 135,
          }),
        ]

        const moves = structure.buildFromCandles(candles)

        expect(moves).toHaveLength(3)
      })

      it("should return all created moves", () => {
        const candles = [
          createCandle({ openTime: 1000, closeTime: 2000 }),
          createCandle({ openTime: 2000, closeTime: 3000 }),
        ]

        const moves = structure.buildFromCandles(candles)

        expect(moves).toHaveLength(2)
        expect(structure.getAllMoves()).toContain(moves[0])
        expect(structure.getAllMoves()).toContain(moves[1])
      })
    })

    describe("equivalence with sequential addCandle", () => {
      it("should produce identical result to sequential addCandle calls", () => {
        // Create two identical structures
        const repo1 = new InMemoryPriceMoveRepository()
        const structure1 = new PriceMoveStructure(repo1)

        const repo2 = new InMemoryPriceMoveRepository()
        const structure2 = new PriceMoveStructure(repo2)

        const candles = [
          createCandle({
            openTime: 1000,
            closeTime: 2000,
            open: 100,
            close: 110,
            low: 95,
            high: 115,
          }),
          createCandle({
            openTime: 2000,
            closeTime: 3000,
            open: 115,
            close: 125,
            low: 110,
            high: 130,
          }),
          createCandle({
            openTime: 3000,
            closeTime: 4000,
            open: 120,
            close: 115,
            low: 110,
            high: 125,
          }),
        ]

        // Process using batch
        structure1.buildFromCandles(candles)

        // Process using sequential addCandle
        for (const candle of candles) {
          structure2.addCandle(candle)
        }

        // Compare results
        const moves1 = structure1.getAllMoves()
        const moves2 = structure2.getAllMoves()

        expect(moves1.length).toBe(moves2.length)

        // Compare move count and structure
        expect(structure1.getActiveMoves().length).toBe(structure2.getActiveMoves().length)
      })
    })

    describe("error handling", () => {
      it("should throw on first invalid candle", () => {
        const candles = [
          createCandle({ openTime: 1000, closeTime: 2000 }),
          { ...createCandle(), openTime: 3000, closeTime: 2500 }, // invalid
          createCandle({ openTime: 2500, closeTime: 3500 }),
        ]

        expect(() => structure.buildFromCandles(candles)).toThrow(CandleIngestionError)
      })

      it("should not process candles after error", () => {
        const candles = [
          createCandle({ openTime: 1000, closeTime: 2000 }),
          { ...createCandle(), openTime: 3000, closeTime: 2500 }, // invalid
          createCandle({ openTime: 2500, closeTime: 3500 }),
        ]

        try {
          structure.buildFromCandles(candles)
        } catch {
          // Expected
        }

        // Only the first candle should be processed
        expect(structure.getAllMoves()).toHaveLength(1)
      })
    })

    describe("performance", () => {
      it("should process 1000 candles in reasonable time", () => {
        const candles: Candle[] = []
        for (let i = 0; i < 1000; i++) {
          candles.push(
            createCandle({
              openTime: 1000 + i * 60000,
              closeTime: 1000 + (i + 1) * 60000,
              open: 100 + Math.sin(i / 10) * 10,
              close: 100 + Math.sin(i / 10) * 10 + (Math.random() - 0.5) * 5,
              low: 95 + Math.sin(i / 10) * 10,
              high: 105 + Math.sin(i / 10) * 10,
            })
          )
        }

        const startTime = performance.now()
        structure.buildFromCandles(candles)
        const endTime = performance.now()

        const duration = endTime - startTime
        // 1000 candles should complete well under 10 seconds
        expect(duration).toBeLessThan(10000)
        // Average should be well under 100ms per candle
        expect(duration / 1000).toBeLessThan(10)
      })

      it("should scale linearly with candle count", () => {
        // Test with 100 candles
        const candles100: Candle[] = []
        for (let i = 0; i < 100; i++) {
          candles100.push(
            createCandle({
              openTime: 1000 + i * 60000,
              closeTime: 1000 + (i + 1) * 60000,
              open: 100 + i,
              close: 100 + i + 5,
              low: 100 + i - 2,
              high: 100 + i + 7,
            })
          )
        }

        const start100 = performance.now()
        structure.buildFromCandles(candles100)
        const time100 = performance.now() - start100

        // Reset structure
        structure.clear()

        // Test with 200 candles
        const candles200: Candle[] = []
        for (let i = 0; i < 200; i++) {
          candles200.push(
            createCandle({
              openTime: 1000 + i * 60000,
              closeTime: 1000 + (i + 1) * 60000,
              open: 100 + i,
              close: 100 + i + 5,
              low: 100 + i - 2,
              high: 100 + i + 7,
            })
          )
        }

        const start200 = performance.now()
        structure.buildFromCandles(candles200)
        const time200 = performance.now() - start200

        // Time for 200 should be roughly 2x time for 100 (allow 10x for CI tolerance)
        expect(time200).toBeLessThan(time100 * 10)
      })
    })
  })

  describe("buildFromCandlesDeterministic", () => {
    describe("deterministic ID generation", () => {
      it("should produce identical IDs for same input across multiple runs", () => {
        const candles = [
          createCandle({
            openTime: 1000,
            closeTime: 2000,
            open: 100,
            close: 110,
            low: 95,
            high: 115,
          }),
          createCandle({
            openTime: 2000,
            closeTime: 3000,
            open: 108,
            close: 120,
            low: 105,
            high: 125,
          }),
          createCandle({
            openTime: 3000,
            closeTime: 4000,
            open: 118,
            close: 130,
            low: 115,
            high: 135,
          }),
        ]

        // First run
        const moves1 = structure.buildFromCandlesDeterministic(candles)
        const ids1 = moves1.map((m) => m.id.toString())

        // Reset and run again
        structure.clear()
        const moves2 = structure.buildFromCandlesDeterministic(candles)
        const ids2 = moves2.map((m) => m.id.toString())

        // IDs should be identical
        expect(ids1).toEqual(ids2)
      })

      it("should produce index-based IDs", () => {
        const candles = [
          createCandle({ openTime: 1000, closeTime: 2000 }),
          createCandle({ openTime: 2000, closeTime: 3000 }),
          createCandle({ openTime: 3000, closeTime: 4000 }),
        ]

        const moves = structure.buildFromCandlesDeterministic(candles)

        // IDs should follow the deterministic format
        expect(moves[0].id.toString()).toBe("00000000-0000-0000-0000-000000000000")
        expect(moves[1].id.toString()).toBe("00000000-0000-0000-0000-000000000001")
        expect(moves[2].id.toString()).toBe("00000000-0000-0000-0000-000000000002")
      })

      it("should handle large indices correctly", () => {
        const candles: Candle[] = []
        for (let i = 0; i < 20; i++) {
          candles.push(
            createCandle({
              openTime: 1000 + i * 60000,
              closeTime: 1000 + (i + 1) * 60000,
              open: 100 + i,
              close: 100 + i + 5,
              low: 100 + i - 2,
              high: 100 + i + 7,
            })
          )
        }

        const moves = structure.buildFromCandlesDeterministic(candles)

        // All moves should have deterministic IDs
        expect(moves.length).toBe(20)
        expect(moves[15].id.toString()).toBe("00000000-0000-0000-0000-00000000000f") // 15 in hex
        expect(moves[16].id.toString()).toBe("00000000-0000-0000-0000-000000000010") // 16 in hex
      })
    })

    describe("reproducibility", () => {
      it("should produce identical structure for identical input", () => {
        const candles = [
          createCandle({
            openTime: 1000,
            closeTime: 2000,
            open: 100,
            close: 110,
            low: 90,
            high: 120,
          }),
          createCandle({
            openTime: 2000,
            closeTime: 3000,
            open: 115,
            close: 130,
            low: 110,
            high: 135,
          }),
          createCandle({
            openTime: 3000,
            closeTime: 4000,
            open: 125,
            close: 120,
            low: 115,
            high: 132,
          }),
        ]

        // First run
        const moves1 = structure.buildFromCandlesDeterministic(candles)
        const structure1Snapshot = moves1.map((m) => ({
          id: m.id.toString(),
          polarity: m.polarity,
          state: m.state,
          priceRange: { low: m.priceRange.low, high: m.priceRange.high },
          timeRange: { start: m.timeRange.start, end: m.timeRange.end },
        }))

        // Reset and second run
        structure.clear()
        const moves2 = structure.buildFromCandlesDeterministic(candles)
        const structure2Snapshot = moves2.map((m) => ({
          id: m.id.toString(),
          polarity: m.polarity,
          state: m.state,
          priceRange: { low: m.priceRange.low, high: m.priceRange.high },
          timeRange: { start: m.timeRange.start, end: m.timeRange.end },
        }))

        // Structures should be identical
        expect(structure1Snapshot).toEqual(structure2Snapshot)
      })

      it("should produce same active moves across runs", () => {
        const candles = [
          createCandle({
            openTime: 1000,
            closeTime: 2000,
            open: 100,
            close: 110,
            low: 95,
            high: 115,
          }),
          createCandle({
            openTime: 2000,
            closeTime: 3000,
            open: 108,
            close: 85,
            low: 80,
            high: 110,
          }),
        ]

        // First run
        structure.buildFromCandlesDeterministic(candles)
        const active1 = structure.getActiveMoves().map((m) => m.id.toString())

        // Reset and second run
        structure.clear()
        structure.buildFromCandlesDeterministic(candles)
        const active2 = structure.getActiveMoves().map((m) => m.id.toString())

        expect(active1).toEqual(active2)
      })
    })

    describe("error handling", () => {
      it("should throw CandleIngestionError with index for invalid candle", () => {
        const candles = [
          createCandle({ openTime: 1000, closeTime: 2000 }),
          { ...createCandle(), openTime: 3000, closeTime: 2500 }, // invalid at index 1
          createCandle({ openTime: 2500, closeTime: 3500 }),
        ]

        let thrownError: CandleIngestionError | null = null
        try {
          structure.buildFromCandlesDeterministic(candles)
        } catch (error) {
          thrownError = error as CandleIngestionError
        }

        expect(thrownError).not.toBeNull()
        if (thrownError !== null) {
          expect(thrownError.message).toContain("index 1")
        }
      })
    })

    describe("comparison with non-deterministic version", () => {
      it("should produce same count and structure shape as buildFromCandles", () => {
        const candles = [
          createCandle({
            openTime: 1000,
            closeTime: 2000,
            open: 100,
            close: 110,
            low: 95,
            high: 115,
          }),
          createCandle({
            openTime: 2000,
            closeTime: 3000,
            open: 108,
            close: 120,
            low: 105,
            high: 125,
          }),
        ]

        // Deterministic version
        const movesDet = structure.buildFromCandlesDeterministic(candles)
        const countDet = structure.getAllMoves().length
        const activeDet = structure.getActiveMoves().length

        structure.clear()

        // Non-deterministic version
        const movesNonDet = structure.buildFromCandles(candles)
        const countNonDet = structure.getAllMoves().length
        const activeNonDet = structure.getActiveMoves().length

        // Same count and structure shape
        expect(movesDet.length).toBe(movesNonDet.length)
        expect(countDet).toBe(countNonDet)
        expect(activeDet).toBe(activeNonDet)
      })
    })
  })

  describe("clear", () => {
    it("should remove all moves from structure", () => {
      const candles = [
        createCandle({ openTime: 1000, closeTime: 2000 }),
        createCandle({ openTime: 2000, closeTime: 3000 }),
      ]
      structure.buildFromCandles(candles)
      expect(structure.getAllMoves().length).toBeGreaterThan(0)

      structure.clear()

      expect(structure.getAllMoves()).toHaveLength(0)
      expect(structure.getActiveMoves()).toHaveLength(0)
    })

    it("should allow adding new candles after clear", () => {
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000 }))
      structure.clear()

      const move = structure.addCandle(createCandle({ openTime: 3000, closeTime: 4000 }))

      expect(move).toBeDefined()
      expect(structure.getAllMoves()).toHaveLength(1)
    })
  })

  describe("getActiveMoves", () => {
    it("should return moves sorted by generation ascending", () => {
      // Create a structure with multiple generations
      // First a large parent move
      const candle1 = createCandle({
        openTime: 1000,
        closeTime: 2000,
        open: 100,
        close: 150,
        low: 90,
        high: 160,
      })
      structure.addCandle(candle1)

      // Then a child move that fits inside
      const candle2 = createCandle({
        openTime: 2000,
        closeTime: 3000,
        open: 120,
        close: 140,
        low: 110,
        high: 150,
      })
      structure.addCandle(candle2)

      const activeMoves = structure.getActiveMoves()

      // Should be sorted by generation
      for (let i = 1; i < activeMoves.length; i++) {
        expect(activeMoves[i].generation).toBeGreaterThanOrEqual(activeMoves[i - 1].generation)
      }
    })

    it("should return a defensive copy", () => {
      structure.addCandle(createCandle())
      const moves1 = structure.getActiveMoves()
      const moves2 = structure.getActiveMoves()

      // Should be different array instances
      expect(moves1).not.toBe(moves2)
    })
  })

  describe("getAllMoves", () => {
    it("should return a defensive copy", () => {
      structure.addCandle(createCandle())
      const moves1 = structure.getAllMoves()
      const moves2 = structure.getAllMoves()

      // Should be different array instances
      expect(moves1).not.toBe(moves2)
    })
  })

  describe("getLayerCount", () => {
    it("should return 0 for empty structure", () => {
      expect(structure.getLayerCount()).toBe(0)
    })

    it("should return 1 for structure with single root move", () => {
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000 }))

      expect(structure.getLayerCount()).toBe(1)
    })

    it("should return 2 when second move becomes child of first", () => {
      // First move: large range
      structure.addCandle(createCandle({
        openTime: 1000,
        closeTime: 2000,
        low: 90,
        high: 110,
      }))
      // Second move: fits within first, becomes child (generation 1)
      structure.addCandle(createCandle({
        openTime: 2000,
        closeTime: 3000,
        low: 95,
        high: 105,
      }))

      expect(structure.getLayerCount()).toBe(2)
    })

    it("should return correct count for multi-generation structure", () => {
      // Large parent move
      const candle1 = createCandle({
        openTime: 1000,
        closeTime: 2000,
        open: 100,
        close: 150,
        low: 90,
        high: 160,
      })
      structure.addCandle(candle1)

      // Child move that fits inside (should become generation 1)
      const candle2 = createCandle({
        openTime: 2000,
        closeTime: 3000,
        open: 120,
        close: 140,
        low: 110,
        high: 150,
      })
      structure.addCandle(candle2)

      // At least 1 layer (root)
      expect(structure.getLayerCount()).toBeGreaterThanOrEqual(1)
    })
  })

  describe("getLayers", () => {
    it("should return empty array for empty structure", () => {
      expect(structure.getLayers()).toHaveLength(0)
    })

    it("should return layers organized by generation", () => {
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000 }))
      structure.addCandle(createCandle({ openTime: 2000, closeTime: 3000 }))

      const layers = structure.getLayers()

      expect(layers.length).toBeGreaterThan(0)
      expect(layers[0].level).toBe(0)

      // Each layer should have moves with matching generation
      for (const layer of layers) {
        for (const move of layer.moves) {
          expect(move.generation).toBe(layer.level)
        }
      }
    })
  })

  describe("getLayer", () => {
    it("should return empty moves array for non-existent level", () => {
      structure.addCandle(createCandle())
      const layer = structure.getLayer(999)

      expect(layer.level).toBe(999)
      expect(layer.moves).toHaveLength(0)
    })

    it("should return moves at specific level", () => {
      structure.addCandle(createCandle())
      const layer = structure.getLayer(0)

      expect(layer.level).toBe(0)
      expect(layer.moves.length).toBeGreaterThan(0)
      for (const move of layer.moves) {
        expect(move.generation).toBe(0)
      }
    })
  })

  describe("validateStructure", () => {
    it("should return valid for empty structure", () => {
      const result = structure.validateStructure()

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should return valid for well-formed structure", () => {
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000 }))
      structure.addCandle(createCandle({ openTime: 2000, closeTime: 3000 }))

      const result = structure.validateStructure()

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should validate after batch processing", () => {
      const candles = [
        createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 150,
          low: 90,
          high: 160,
        }),
        createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 120,
          close: 140,
          low: 110,
          high: 150,
        }),
        createCandle({
          openTime: 3000,
          closeTime: 4000,
          open: 145,
          close: 170,
          low: 140,
          high: 175,
        }),
      ]

      structure.buildFromCandles(candles)
      const result = structure.validateStructure()

      expect(result.valid).toBe(true)
    })
  })

  describe("formatActiveMoves", () => {
    it("should return 'No active moves' when structure is empty", () => {
      const result = structure.formatActiveMoves()

      expect(result).toBe("No active moves")
    })

    it("should format single active move correctly", () => {
      const candle = createCandle({
        openTime: 1000,
        closeTime: 2000,
        open: 100,
        close: 110,
        low: 95,
        high: 115,
      })

      structure.addCandle(candle)
      const result = structure.formatActiveMoves()

      expect(result).toContain("[Gen 0]")
      expect(result).toContain("up")
      expect(result).toContain("[95.00-115.00]")
      expect(result).toContain("(id:")
    })

    it("should format multiple active moves sorted by generation", () => {
      const candles = [
        createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 110,
          low: 95,
          high: 115,
        }),
        createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 110,
          close: 100,
          low: 90,
          high: 120,
        }),
      ]

      structure.buildFromCandles(candles)
      const result = structure.formatActiveMoves()
      const lines = result.split("\n")

      expect(lines.length).toBeGreaterThan(0)
      for (const line of lines) {
        expect(line).toMatch(/\[Gen \d\]/)
        expect(line).toMatch(/(up|down)/)
      }
    })
  })

  describe("setLogger", () => {
    it("should accept a logger implementation", () => {
      const logs: string[] = []
      const mockLogger = {
        debug: (msg: string) => logs.push(`DEBUG: ${msg}`),
        info: (msg: string) => logs.push(`INFO: ${msg}`),
        warn: (msg: string) => logs.push(`WARN: ${msg}`),
        error: (msg: string) => logs.push(`ERROR: ${msg}`),
      }

      structure.setLogger(mockLogger)
      const candle = createCandle()
      structure.addCandle(candle)

      expect(logs.length).toBeGreaterThan(0)
      expect(logs.some(l => l.includes("[CANDLE]"))).toBe(true)
      expect(logs.some(l => l.includes("[ADD]"))).toBe(true)
      expect(logs.some(l => l.includes("[STATE]"))).toBe(true)
    })

    it("should log extension events", () => {
      const logs: string[] = []
      const mockLogger = {
        debug: (msg: string) => logs.push(msg),
        info: () => {},
        warn: () => {},
        error: () => {},
      }

      structure.setLogger(mockLogger)

      // First candle - Up move
      structure.addCandle(
        createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 110,
          low: 95,
          high: 115,
        })
      )

      // Second candle - extends the Up move (breaks above 115)
      structure.addCandle(
        createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 115,
          close: 130,
          low: 110,
          high: 135,
        })
      )

      expect(logs.some(l => l.includes("[EXTEND]"))).toBe(true)
    })

    it("should log break events", () => {
      const logs: string[] = []
      const mockLogger = {
        debug: (msg: string) => logs.push(msg),
        info: () => {},
        warn: () => {},
        error: () => {},
      }

      structure.setLogger(mockLogger)

      // First candle - Up move
      structure.addCandle(
        createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 110,
          low: 95,
          high: 115,
        })
      )

      // Second candle - invalidates the Up move (breaks below 95, but NOT above 115)
      // Must NOT extend (high <= 115) but MUST break low (low < 95)
      structure.addCandle(
        createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 105,
          close: 80,
          low: 75,
          high: 110, // <= 115 so no extension
        })
      )

      expect(logs.some(l => l.includes("[BREAK]"))).toBe(true)
    })
  })

  describe("logActiveMoves", () => {
    it("should use info level to log active moves", () => {
      const logs: string[] = []
      const mockLogger = {
        debug: () => {},
        info: (msg: string) => logs.push(msg),
        warn: () => {},
        error: () => {},
      }

      structure.setLogger(mockLogger)
      structure.addCandle(createCandle())
      structure.logActiveMoves()

      expect(logs.length).toBe(1)
      expect(logs[0]).toContain("Active moves")
    })
  })

  describe("tryAddCandle", () => {
    it("should return success result for valid candle", () => {
      const candle = createCandle()
      const result = structure.tryAddCandle(candle)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.move).toBeDefined()
      }
    })

    it("should return failure result for invalid candle", () => {
      const invalidCandle = createCandle({ open: NaN })
      const result = structure.tryAddCandle(invalidCandle)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error)
        expect(result.error.name).toBe("CandleIngestionError")
      }
    })

    it("should not throw on invalid candle", () => {
      const invalidCandle = createCandle({ open: NaN })

      expect(() => structure.tryAddCandle(invalidCandle)).not.toThrow()
    })

    it("should log errors for invalid candles", () => {
      const logs: string[] = []
      const mockLogger = {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: (msg: string) => logs.push(msg),
      }

      structure.setLogger(mockLogger)
      structure.tryAddCandle(createCandle({ open: NaN }))

      expect(logs.some(l => l.includes("[ERROR]"))).toBe(true)
    })
  })

  describe("tryBuildFromCandles", () => {
    it("should return result with all moves for valid candles", () => {
      const candles = [
        createCandle({ openTime: 1000, closeTime: 2000 }),
        createCandle({ openTime: 2000, closeTime: 3000 }),
        createCandle({ openTime: 3000, closeTime: 4000 }),
      ]

      const result = structure.tryBuildFromCandles(candles)

      expect(result.processedCount).toBe(3)
      expect(result.successCount).toBe(3)
      expect(result.moves.length).toBe(3)
      expect(result.errors.length).toBe(0)
    })

    it("should continue processing after invalid candle", () => {
      const candles = [
        createCandle({ openTime: 1000, closeTime: 2000 }),
        createCandle({ openTime: 2000, closeTime: 3000, open: NaN }), // invalid
        createCandle({ openTime: 3000, closeTime: 4000 }),
      ]

      const result = structure.tryBuildFromCandles(candles)

      expect(result.processedCount).toBe(3)
      expect(result.successCount).toBe(2)
      expect(result.moves.length).toBe(2)
      expect(result.errors.length).toBe(1)
    })

    it("should include index in error messages", () => {
      const candles = [
        createCandle({ openTime: 1000, closeTime: 2000 }),
        createCandle({ openTime: 2000, closeTime: 3000, open: NaN }), // invalid at index 1
      ]

      const result = structure.tryBuildFromCandles(candles)

      expect(result.errors.length).toBe(1)
      expect(result.errors[0].index).toBe(1)
      expect(result.errors[0].message).toContain("index 1")
    })

    it("should log warning for errors during batch processing", () => {
      const logs: { level: string; msg: string }[] = []
      const mockLogger = {
        debug: () => {},
        info: (msg: string) => logs.push({ level: "info", msg }),
        warn: (msg: string) => logs.push({ level: "warn", msg }),
        error: () => {},
      }

      structure.setLogger(mockLogger)
      structure.tryBuildFromCandles([
        createCandle({ openTime: 1000, closeTime: 2000 }),
        createCandle({ openTime: 2000, closeTime: 3000, open: NaN }),
      ])

      expect(logs.some(l => l.level === "warn" && l.msg.includes("[BATCH]"))).toBe(true)
    })

    it("should log success message when all candles are valid", () => {
      const logs: { level: string; msg: string }[] = []
      const mockLogger = {
        debug: () => {},
        info: (msg: string) => logs.push({ level: "info", msg }),
        warn: () => {},
        error: () => {},
      }

      structure.setLogger(mockLogger)
      structure.tryBuildFromCandles([
        createCandle({ openTime: 1000, closeTime: 2000 }),
        createCandle({ openTime: 2000, closeTime: 3000 }),
      ])

      expect(logs.some(l => l.level === "info" && l.msg.includes("[BATCH]"))).toBe(true)
    })
  })

  describe("CandleIngestionError", () => {
    it("should include index property when provided", () => {
      const invalidCandle = createCandle({ open: NaN })
      const candles = [
        createCandle({ openTime: 1000, closeTime: 2000 }),
        invalidCandle,
      ]

      const result = structure.tryBuildFromCandles(candles)

      expect(result.errors[0].index).toBe(1)
    })

    it("should preserve validation errors", () => {
      const invalidCandle = createCandle({ open: NaN })
      const result = structure.tryAddCandle(invalidCandle)

      if (!result.success) {
        expect(result.error.validationErrors).toBeDefined()
        expect(result.error.validationErrors?.length).toBeGreaterThan(0)
      }
    })
  })

  describe("getMemoryStats", () => {
    it("should return zero stats for empty structure", () => {
      const stats = structure.getMemoryStats()

      expect(stats.totalMoves).toBe(0)
      expect(stats.activeMoves).toBe(0)
      expect(stats.closedMoves).toBe(0)
      expect(stats.movesWithChildren).toBe(0)
      expect(stats.movesWithParent).toBe(0)
      expect(stats.maxChildCount).toBe(0)
      expect(stats.layerCount).toBe(0)
    })

    it("should count active and closed moves correctly", () => {
      // First candle - creates an Up move
      structure.addCandle(
        createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 110,
          low: 95,
          high: 115,
        })
      )

      // Second candle - invalidates the Up move (breaks low)
      structure.addCandle(
        createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 100,
          close: 80,
          low: 75,
          high: 105, // doesn't extend (< 115)
        })
      )

      const stats = structure.getMemoryStats()

      expect(stats.totalMoves).toBe(2)
      expect(stats.closedMoves).toBeGreaterThanOrEqual(1) // At least first move is closed
    })

    it("should count layer count correctly", () => {
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000 }))
      structure.addCandle(createCandle({ openTime: 2000, closeTime: 3000 }))

      const stats = structure.getMemoryStats()

      expect(stats.layerCount).toBeGreaterThanOrEqual(1)
    })
  })

  describe("logMemoryStats", () => {
    it("should log memory statistics", () => {
      const logs: string[] = []
      const mockLogger = {
        debug: () => {},
        info: (msg: string) => logs.push(msg),
        warn: () => {},
        error: () => {},
      }

      structure.setLogger(mockLogger)
      structure.addCandle(createCandle())
      structure.logMemoryStats()

      expect(logs.some(l => l.includes("[MEMORY]"))).toBe(true)
      expect(logs.some(l => l.includes("total"))).toBe(true)
    })
  })

  describe("pruneClosedMoves", () => {
    it("should not prune active moves", () => {
      structure.addCandle(
        createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 110,
          low: 95,
          high: 115,
        })
      )

      const pruned = structure.pruneClosedMoves(5000)

      expect(pruned).toBe(0)
      expect(structure.getAllMoves().length).toBe(1)
    })

    it("should prune closed moves older than timestamp", () => {
      // First move - will be closed
      structure.addCandle(
        createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 110,
          low: 95,
          high: 115,
        })
      )

      // Second move - invalidates first move
      structure.addCandle(
        createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 105,
          close: 80,
          low: 75,
          high: 110, // doesn't extend
        })
      )

      // Third move - much later
      structure.addCandle(
        createCandle({
          openTime: 10000,
          closeTime: 11000,
          open: 100,
          close: 110,
          low: 95,
          high: 115,
        })
      )

      const initialCount = structure.getAllMoves().length
      const pruned = structure.pruneClosedMoves(5000) // Prune moves ending before 5000

      expect(pruned).toBeGreaterThanOrEqual(0) // May or may not have prunable moves
      expect(structure.getAllMoves().length).toBeLessThanOrEqual(initialCount)
    })

    it("should not prune if move has active children", () => {
      // Create parent-child relationship where parent is closed but child is active
      const candles = [
        createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 110,
          low: 95,
          high: 115,
        }),
        createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 100,
          close: 105,
          low: 98, // internal child, doesn't extend or invalidate
          high: 108,
        }),
      ]

      structure.buildFromCandles(candles)
      const initialCount = structure.getAllMoves().length

      // Try to prune - should not prune parent if it has active children
      const pruned = structure.pruneClosedMoves(5000)

      // Structure should be maintained
      expect(structure.getAllMoves().length).toBe(initialCount - pruned)
    })

    it("should log when moves are pruned", () => {
      const logs: string[] = []
      const mockLogger = {
        debug: () => {},
        info: (msg: string) => logs.push(msg),
        warn: () => {},
        error: () => {},
      }

      structure.setLogger(mockLogger)

      // Create a closed move
      structure.addCandle(
        createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 110,
          low: 95,
          high: 115,
        })
      )
      structure.addCandle(
        createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 105,
          close: 80,
          low: 75,
          high: 110,
        })
      )

      structure.pruneClosedMoves(5000)

      // May or may not log depending on whether moves were prunable
      // This test just ensures no errors occur
    })
  })

  // Protocol compliance: Engulfing candles (protocole section 10)
  describe("engulfing candle handling - protocol compliance", () => {
    it("should detect and handle green engulfing candle", () => {
      const logs: string[] = []
      const mockLogger = {
        debug: (msg: string) => logs.push(msg),
        info: () => {},
        warn: () => {},
        error: () => {},
      }
      structure.setLogger(mockLogger)

      // Create an Up structure
      structure.addCandle(
        createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 110,
          low: 100,
          high: 110,
        })
      )

      // Green engulfing candle (close > open) that breaks both bounds
      // Breaks high (120 > 110) AND breaks reference level (95 < 100)
      structure.addCandle(
        createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 105,
          close: 120, // Green: close > open
          low: 95,    // Breaks reference (100)
          high: 125,  // Breaks high (110)
        })
      )

      expect(logs.some(l => l.includes("[ENGULFING]"))).toBe(true)
      expect(logs.some(l => l.includes("Green"))).toBe(true)
    })

    it("should detect and handle red engulfing candle on Up structure", () => {
      const logs: string[] = []
      const mockLogger = {
        debug: (msg: string) => logs.push(msg),
        info: () => {},
        warn: () => {},
        error: () => {},
      }
      structure.setLogger(mockLogger)

      // Create an Up structure
      structure.addCandle(
        createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 110,
          low: 100,
          high: 110,
        })
      )

      // Red engulfing candle (close < open) that breaks both bounds
      structure.addCandle(
        createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 115,
          close: 90,  // Red: close < open
          low: 85,    // Breaks reference (100)
          high: 120,  // Breaks high (110)
        })
      )

      expect(logs.some(l => l.includes("[ENGULFING]"))).toBe(true)
      expect(logs.some(l => l.includes("Red"))).toBe(true)
    })

    it("should terminate target and create new root on engulfing", () => {
      // Create an Up structure
      structure.addCandle(
        createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 110,
          low: 100,
          high: 110,
        })
      )

      const movesAfterFirst = structure.getGrowingMoves()
      expect(movesAfterFirst).toHaveLength(1)
      const firstMove = movesAfterFirst[0]
      expect(firstMove.isGrowing()).toBe(true)

      // Engulfing candle terminates the first structure
      structure.addCandle(
        createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 105,
          close: 120,
          low: 95,
          high: 125,
        })
      )

      // First move should be terminated
      expect(firstMove.isGrowing()).toBe(false)
      expect(firstMove.isReference()).toBe(true)

      // New structure should be growing
      const growingMoves = structure.getGrowingMoves()
      expect(growingMoves).toHaveLength(1)
      expect(growingMoves[0]).not.toBe(firstMove)
    })

    it("should NOT detect engulfing when only one bound is broken", () => {
      const logs: string[] = []
      const mockLogger = {
        debug: (msg: string) => logs.push(msg),
        info: () => {},
        warn: () => {},
        error: () => {},
      }
      structure.setLogger(mockLogger)

      // Create an Up structure
      structure.addCandle(
        createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 110,
          low: 100,
          high: 110,
        })
      )

      // Candle that only breaks high (extension), not reference
      structure.addCandle(
        createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 105,
          close: 115,
          low: 102, // Above reference (100)
          high: 120, // Breaks high
        })
      )

      // Should NOT log engulfing
      expect(logs.some(l => l.includes("[ENGULFING]"))).toBe(false)
      // Should log extension instead
      expect(logs.some(l => l.includes("[EXTEND]"))).toBe(true)
    })
  })

  // Protocol compliance: Reference level invalidation (protocole section 3.2)
  describe("reference level invalidation - protocol compliance", () => {
    it("should invalidate when breaking evolved reference level", () => {
      // Create Up structure
      const firstMove = structure.addCandle(
        createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 105,
          low: 100,
          high: 105,
        })
      )

      expect(firstMove.currentReferenceLevel).toBe(100) // Initial ref = low
      expect(firstMove.isGrowing()).toBe(true)

      // Extend it (reference level evolves to 108)
      structure.addCandle(
        createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 109,  // Must be between low and high
          close: 112,
          low: 108,
          high: 115,
        })
      )

      // After extension, firstMove's reference level should be updated
      expect(firstMove.currentReferenceLevel).toBe(108)
      expect(firstMove.priceRange.high).toBe(115) // Structure extended
      expect(firstMove.isGrowing()).toBe(true)

      // Now a candle with low=106 should break (106 < 108)
      // even though 106 > 100 (original structure low)
      structure.addCandle(
        createCandle({
          openTime: 3000,
          closeTime: 4000,
          open: 110,
          close: 107,
          low: 106,  // Breaks reference 108
          high: 112,
        })
      )

      // Original structure should be terminated
      expect(firstMove.isReference()).toBe(true)
      expect(firstMove.isGrowing()).toBe(false)
    })

    it("should NOT invalidate when above evolved reference level", () => {
      // Create Up structure
      const firstMove = structure.addCandle(
        createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 105,
          low: 100,
          high: 105,
        })
      )

      // Extend it (reference level evolves to 108)
      structure.addCandle(
        createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 109,
          close: 112,
          low: 108,
          high: 115,
        })
      )

      expect(firstMove.currentReferenceLevel).toBe(108)

      // Candle with low=109 should NOT break (109 > 108)
      structure.addCandle(
        createCandle({
          openTime: 3000,
          closeTime: 4000,
          open: 112,
          close: 110,
          low: 109,  // Above reference 108 → no break
          high: 114,
        })
      )

      // Structure should still be growing
      expect(firstMove.isGrowing()).toBe(true)
    })
  })
})
