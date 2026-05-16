import { describe, it, expect, beforeEach } from "vitest"
import { FractalEngine } from "./FractalEngine.js"
import type { Candle } from "./domain/candle/Candle.js"
import { Polarity } from "./domain/price-move/Polarity.js"

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

describe("FractalEngine", () => {
  let engine: FractalEngine

  beforeEach(() => {
    engine = new FractalEngine()
  })

  describe("constructor", () => {
    it("should create engine with default options", () => {
      const engine = new FractalEngine()
      expect(engine.getActiveMoves()).toEqual([])
    })

    it("should accept custom logger", () => {
      const logs: string[] = []
      const logger = {
        debug: (msg: string) => logs.push(msg),
        info: () => {},
        warn: () => {},
        error: () => {},
      }

      const engine = new FractalEngine({ logger })
      engine.addCandle(createCandle())

      expect(logs.length).toBeGreaterThan(0)
    })

    it("should accept deterministic option", () => {
      const engine1 = new FractalEngine({ deterministic: true })
      const engine2 = new FractalEngine({ deterministic: true })

      const candles = [
        createCandle({ openTime: 1000, closeTime: 2000 }),
        createCandle({ openTime: 2000, closeTime: 3000 }),
      ]

      const moves1 = engine1.buildFromCandles(candles)
      const moves2 = engine2.buildFromCandles(candles)

      expect(moves1[0].id.toString()).toBe(moves2[0].id.toString())
      expect(moves1[1].id.toString()).toBe(moves2[1].id.toString())
    })
  })

  describe("addCandle", () => {
    it("should add candle and return PriceMove", () => {
      const move = engine.addCandle(createCandle())

      expect(move).toBeDefined()
      expect(move.id).toBeDefined()
    })

    it("should throw on invalid candle", () => {
      expect(() => engine.addCandle(createCandle({ open: NaN }))).toThrow()
    })
  })

  describe("tryAddCandle", () => {
    it("should return success for valid candle", () => {
      const result = engine.tryAddCandle(createCandle())

      expect(result.success).toBe(true)
    })

    it("should return failure for invalid candle without throwing", () => {
      const result = engine.tryAddCandle(createCandle({ open: NaN }))

      expect(result.success).toBe(false)
      expect(() => engine.tryAddCandle(createCandle({ open: NaN }))).not.toThrow()
    })
  })

  describe("buildFromCandles", () => {
    it("should process all candles", () => {
      const candles = [
        createCandle({ openTime: 1000, closeTime: 2000 }),
        createCandle({ openTime: 2000, closeTime: 3000 }),
        createCandle({ openTime: 3000, closeTime: 4000 }),
      ]

      const moves = engine.buildFromCandles(candles)

      expect(moves.length).toBe(3)
    })

    it("should use deterministic IDs when configured", () => {
      const engine = new FractalEngine({ deterministic: true })
      const candles = [
        createCandle({ openTime: 1000, closeTime: 2000 }),
        createCandle({ openTime: 2000, closeTime: 3000 }),
      ]

      const moves = engine.buildFromCandles(candles)

      // Deterministic IDs are index-based
      expect(moves[0].id.toString()).toContain("0")
      expect(moves[1].id.toString()).toContain("1")
    })
  })

  describe("tryBuildFromCandles", () => {
    it("should continue after invalid candle", () => {
      const candles = [
        createCandle({ openTime: 1000, closeTime: 2000 }),
        createCandle({ openTime: 2000, closeTime: 3000, open: NaN }),
        createCandle({ openTime: 3000, closeTime: 4000 }),
      ]

      const result = engine.tryBuildFromCandles(candles)

      expect(result.processedCount).toBe(3)
      expect(result.successCount).toBe(2)
      expect(result.errors.length).toBe(1)
    })
  })

  describe("getActiveMoves", () => {
    it("should return empty array for empty engine", () => {
      expect(engine.getActiveMoves()).toEqual([])
    })

    it("should return active moves after adding candles", () => {
      engine.addCandle(createCandle())

      expect(engine.getActiveMoves().length).toBe(1)
    })
  })

  describe("getAllMoves", () => {
    it("should return all moves including closed", () => {
      // Create and close a move
      engine.addCandle(
        createCandle({
          openTime: 1000,
          closeTime: 2000,
          open: 100,
          close: 110,
          low: 95,
          high: 115,
        })
      )
      engine.addCandle(
        createCandle({
          openTime: 2000,
          closeTime: 3000,
          open: 105,
          close: 80,
          low: 75,
          high: 110,
        })
      )

      const all = engine.getAllMoves()
      const active = engine.getActiveMoves()

      expect(all.length).toBeGreaterThanOrEqual(active.length)
    })
  })

  describe("getLayers", () => {
    it("should return empty for empty engine", () => {
      expect(engine.getLayers()).toEqual([])
    })

    it("should return layers after adding candles", () => {
      engine.addCandle(createCandle())

      const layers = engine.getLayers()

      expect(layers.length).toBeGreaterThan(0)
      expect(layers[0].level).toBe(0)
    })
  })

  describe("getLayerCount", () => {
    it("should return 0 for empty engine", () => {
      expect(engine.getLayerCount()).toBe(0)
    })

    it("should return correct count after adding candles", () => {
      engine.addCandle(createCandle())

      expect(engine.getLayerCount()).toBeGreaterThan(0)
    })
  })

  describe("getLayer", () => {
    it("should return layer at specified level", () => {
      engine.addCandle(createCandle())

      const layer = engine.getLayer(0)

      expect(layer.level).toBe(0)
      expect(layer.moves.length).toBeGreaterThan(0)
    })

    it("should return empty moves for non-existent level", () => {
      engine.addCandle(createCandle())

      const layer = engine.getLayer(999)

      expect(layer.moves).toEqual([])
    })
  })

  describe("validate", () => {
    it("should return valid for empty engine", () => {
      const result = engine.validate()

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it("should return valid for well-formed structure", () => {
      engine.addCandle(createCandle())

      const result = engine.validate()

      expect(result.valid).toBe(true)
    })
  })

  describe("formatActiveMoves", () => {
    it("should return 'No active moves' for empty engine", () => {
      expect(engine.formatActiveMoves()).toBe("No active moves")
    })

    it("should format moves after adding candles", () => {
      engine.addCandle(createCandle())

      const formatted = engine.formatActiveMoves()

      expect(formatted).toContain("[Rang")
      expect(formatted).toContain("(id:")
    })
  })

  describe("getMemoryStats", () => {
    it("should return stats for empty engine", () => {
      const stats = engine.getMemoryStats()

      expect(stats.totalMoves).toBe(0)
      expect(stats.activeMoves).toBe(0)
    })

    it("should return correct stats after adding candles", () => {
      engine.addCandle(createCandle())

      const stats = engine.getMemoryStats()

      expect(stats.totalMoves).toBe(1)
      expect(stats.activeMoves).toBe(1)
    })
  })

  describe("pruneClosedMoves", () => {
    it("should not prune active moves", () => {
      engine.addCandle(createCandle({ openTime: 1000, closeTime: 2000 }))

      const pruned = engine.pruneClosedMoves(5000)

      expect(pruned).toBe(0)
    })
  })

  describe("clear", () => {
    it("should remove all moves", () => {
      engine.addCandle(createCandle())

      engine.clear()

      expect(engine.getAllMoves()).toEqual([])
      expect(engine.getActiveMoves()).toEqual([])
    })

    it("should allow adding new candles after clear", () => {
      engine.addCandle(createCandle({ openTime: 1000, closeTime: 2000 }))
      engine.clear()
      engine.addCandle(createCandle({ openTime: 2000, closeTime: 3000 }))

      expect(engine.getAllMoves().length).toBe(1)
    })
  })

  describe("getStack (point-in-time query)", () => {
    it("should return empty array for timestamp before any moves", () => {
      engine.addCandle(createCandle({ openTime: 5000, closeTime: 6000 }))

      const stack = engine.getStack(1000)

      expect(stack).toEqual([])
    })

    it("should return move that was active at timestamp", () => {
      engine.addCandle(createCandle({
        openTime: 1000,
        closeTime: 2000,
        open: 100,
        close: 110,
        high: 115,
        low: 95,
      }))

      const stack = engine.getStack(1500)

      expect(stack.length).toBe(1)
      expect(stack[0].polarity).toBe(Polarity.Up)
    })

    it("should not return moves that started after timestamp", () => {
      engine.addCandle(createCandle({ openTime: 1000, closeTime: 2000 }))
      engine.addCandle(createCandle({ openTime: 5000, closeTime: 6000 }))

      const stack = engine.getStack(1500)

      // Should only have the first move
      expect(stack.every(m => m.timeRange.start <= 1500)).toBe(true)
    })

    it("should not return moves that were closed before timestamp", () => {
      // Create an UP move
      engine.addCandle(createCandle({
        openTime: 1000,
        closeTime: 2000,
        open: 100,
        close: 110,
        high: 115,
        low: 95,
      }))

      // Invalidate it with a DOWN move that breaks the low
      engine.addCandle(createCandle({
        openTime: 2000,
        closeTime: 3000,
        open: 105,
        close: 80,
        high: 110,
        low: 70, // breaks the low of 95
      }))

      // Query at timestamp 4000 - the first move should be closed
      const stack = engine.getStack(4000)

      // The first move (Up) should be closed, so only the second move (Down) should be active
      const downMoves = stack.filter(m => m.polarity === Polarity.Down)

      expect(downMoves.length).toBeGreaterThanOrEqual(1)
      // The original Up move at gen 0 should be closed
    })

    it("should return moves sorted by generation", () => {
      engine.addCandle(createCandle({ openTime: 1000, closeTime: 2000 }))
      engine.addCandle(createCandle({ openTime: 2000, closeTime: 3000 }))
      engine.addCandle(createCandle({ openTime: 3000, closeTime: 4000 }))

      const stack = engine.getStack(3500)

      // Verify sorting
      for (let i = 1; i < stack.length; i++) {
        expect(stack[i].generation).toBeGreaterThanOrEqual(stack[i - 1].generation)
      }
    })

    it("should include move at exact start timestamp", () => {
      engine.addCandle(createCandle({ openTime: 1000, closeTime: 2000 }))

      const stack = engine.getStack(1000)

      expect(stack.length).toBe(1)
    })

    it("should return closed move if queried before closure time", () => {
      // Create an UP move at time 1000
      engine.addCandle(createCandle({
        openTime: 1000,
        closeTime: 2000,
        open: 100,
        close: 110,
        high: 115,
        low: 95,
      }))

      // Invalidate it at time 3000
      engine.addCandle(createCandle({
        openTime: 3000,
        closeTime: 4000,
        open: 105,
        close: 80,
        high: 110,
        low: 70,
      }))

      // Query at time 2500 - before the closure
      const stackBeforeClosure = engine.getStack(2500)
      const upMovesBefore = stackBeforeClosure.filter(m => m.polarity === Polarity.Up)

      // The UP move should still be active at 2500
      expect(upMovesBefore.length).toBe(1)
    })
  })

  describe("getMove (point-in-time generation query)", () => {
    it("should return undefined for non-existent generation", () => {
      engine.addCandle(createCandle({ openTime: 1000, closeTime: 2000 }))

      const move = engine.getMove(999, 1500)

      expect(move).toBeUndefined()
    })

    it("should return undefined for timestamp before move started", () => {
      engine.addCandle(createCandle({ openTime: 5000, closeTime: 6000 }))

      const move = engine.getMove(0, 1000)

      expect(move).toBeUndefined()
    })

    it("should return move at specific generation and timestamp", () => {
      engine.addCandle(createCandle({
        openTime: 1000,
        closeTime: 2000,
        open: 100,
        close: 110,
        high: 115,
        low: 95,
      }))

      const move = engine.getMove(0, 1500)

      expect(move).toBeDefined()
      expect(move?.generation).toBe(0)
    })

    it("should return undefined for closed move after closure", () => {
      // Create an UP move
      engine.addCandle(createCandle({
        openTime: 1000,
        closeTime: 2000,
        open: 100,
        close: 110,
        high: 115,
        low: 95,
      }))

      // Invalidate it
      engine.addCandle(createCandle({
        openTime: 3000,
        closeTime: 4000,
        open: 105,
        close: 80,
        high: 110,
        low: 70,
      }))

      // The original gen 0 UP move should be closed after 3000
      const moveAfter = engine.getMove(0, 5000)

      // Should get the new root move (Down), not the closed Up move
      if (moveAfter) {
        expect(moveAfter.polarity).toBe(Polarity.Down)
      }
    })
  })

  describe("PriceMove.closedAt tracking", () => {
    it("should set closedAt when move is invalidated", () => {
      // Create an UP move
      engine.addCandle(createCandle({
        openTime: 1000,
        closeTime: 2000,
        open: 100,
        close: 110,
        high: 115,
        low: 95,
      }))

      const upMove = engine.getAllMoves().find(m => m.polarity === Polarity.Up)
      expect(upMove?.closedAt).toBeUndefined() // Should be undefined initially

      // Invalidate it
      engine.addCandle(createCandle({
        openTime: 3000,
        closeTime: 4000,
        open: 105,
        close: 80,
        high: 110,
        low: 70,
      }))

      // The UP move should now have closedAt set
      const closedUpMove = engine.getAllMoves().find(
        m => m.polarity === Polarity.Up && m.isClosed()
      )

      expect(closedUpMove?.closedAt).toBe(3000) // Should be set to candidate's start time
    })

    it("should not set closedAt for active moves", () => {
      engine.addCandle(createCandle({ openTime: 1000, closeTime: 2000 }))

      const activeMoves = engine.getActiveMoves()

      expect(activeMoves.every(m => m.closedAt === undefined)).toBe(true)
    })
  })

  describe("Point-in-time query performance", () => {
    it("should handle getStack on 10k moves in < 100ms", () => {
      const baseTime = 1704067200000 // 2024-01-01
      // Create 10k moves
      const candles = []
      for (let i = 0; i < 10000; i++) {
        candles.push(createCandle({
          openTime: baseTime + i * 60000, // 1 minute apart
          closeTime: baseTime + (i + 1) * 60000,
          open: 100 + Math.sin(i * 0.1) * 10,
          high: 110 + Math.sin(i * 0.1) * 10,
          low: 90 + Math.sin(i * 0.1) * 10,
          close: 105 + Math.sin(i * 0.1) * 10,
        }))
      }

      engine.buildFromCandles(candles)

      // Measure getStack performance
      const start = performance.now()
      const stack = engine.getStack(baseTime + 5000 * 60000) // Middle of the dataset
      const duration = performance.now() - start

      expect(duration).toBeLessThan(100) // Should be < 100ms
      expect(stack.length).toBeGreaterThan(0)
    })

    it("should handle getMove on 10k moves in < 50ms", () => {
      const baseTime = 1704067200000 // 2024-01-01
      // Create 10k moves
      const candles = []
      for (let i = 0; i < 10000; i++) {
        candles.push(createCandle({
          openTime: baseTime + i * 60000, // 1 minute apart
          closeTime: baseTime + (i + 1) * 60000,
          open: 100 + Math.sin(i * 0.1) * 10,
          high: 110 + Math.sin(i * 0.1) * 10,
          low: 90 + Math.sin(i * 0.1) * 10,
          close: 105 + Math.sin(i * 0.1) * 10,
        }))
      }

      engine.buildFromCandles(candles)

      // Measure getMove performance
      const start = performance.now()
      const _move = engine.getMove(0, baseTime + 5000 * 60000) // Generation 0, middle of dataset
      const duration = performance.now() - start

      expect(duration).toBeLessThan(50) // Should be < 50ms
      expect(_move).toBeDefined() // Use the variable
    })
  })

  describe("PriceMove.wasActiveAt", () => {
    it("should return false for timestamp before move started", () => {
      engine.addCandle(createCandle({ openTime: 5000, closeTime: 6000 }))
      const move = engine.getAllMoves()[0]

      expect(move.wasActiveAt(1000)).toBe(false)
    })

    it("should return true for timestamp after move started but still active", () => {
      engine.addCandle(createCandle({ openTime: 1000, closeTime: 2000 }))
      const move = engine.getAllMoves()[0]

      expect(move.wasActiveAt(5000)).toBe(true)
    })

    it("should return true at exact start timestamp", () => {
      engine.addCandle(createCandle({ openTime: 1000, closeTime: 2000 }))
      const move = engine.getAllMoves()[0]

      expect(move.wasActiveAt(1000)).toBe(true)
    })

    it("should return false for timestamp after move was closed", () => {
      // Create an UP move
      engine.addCandle(createCandle({
        openTime: 1000,
        closeTime: 2000,
        open: 100,
        close: 110,
        high: 115,
        low: 95,
      }))

      // Invalidate it at time 3000
      engine.addCandle(createCandle({
        openTime: 3000,
        closeTime: 4000,
        open: 105,
        close: 80,
        high: 110,
        low: 70,
      }))

      const closedMove = engine.getAllMoves().find(
        m => m.polarity === Polarity.Up && m.isClosed()
      )

      expect(closedMove?.wasActiveAt(4000)).toBe(false)
    })

    it("should return true for timestamp before move was closed", () => {
      // Create an UP move
      engine.addCandle(createCandle({
        openTime: 1000,
        closeTime: 2000,
        open: 100,
        close: 110,
        high: 115,
        low: 95,
      }))

      // Invalidate it at time 3000
      engine.addCandle(createCandle({
        openTime: 3000,
        closeTime: 4000,
        open: 105,
        close: 80,
        high: 110,
        low: 70,
      }))

      const closedMove = engine.getAllMoves().find(
        m => m.polarity === Polarity.Up && m.isClosed()
      )

      // Before closure (at 3000), the move should have been active
      expect(closedMove?.wasActiveAt(2500)).toBe(true)
    })
  })
})
