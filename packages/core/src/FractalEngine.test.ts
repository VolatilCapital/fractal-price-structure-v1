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

      expect(formatted).toContain("[Gen")
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
})
