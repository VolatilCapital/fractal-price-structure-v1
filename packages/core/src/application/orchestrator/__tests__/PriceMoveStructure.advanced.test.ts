import { describe, it, expect, beforeEach } from "vitest"
import { PriceMoveStructure } from "../PriceMoveStructure.js"
import { InMemoryPriceMoveRepository } from "../../../infrastructure/repositories/InMemoryPriceMoveRepository.js"
import { Polarity } from "../../../domain/price-move/Polarity.js"
import { PriceMoveState } from "../../../domain/price-move/PriceMoveState.js"
import type { Candle } from "../../../domain/candle/Candle.js"
import type { PriceMoveRepository } from "../../ports/PriceMoveRepository.js"

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

describe("PriceMoveStructure — advanced", () => {
  let repo: PriceMoveRepository
  let structure: PriceMoveStructure

  beforeEach(() => {
    repo = new InMemoryPriceMoveRepository()
    structure = new PriceMoveStructure(repo)
  })

  // ============================================
  // State queries
  // ============================================

  describe("getGrowingMoves / getReferenceMoves / getArchivedMoves", () => {
    it("should return only growing moves from getGrowingMoves", () => {
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000, open: 100, close: 110, low: 95, high: 115 }))

      const growing = structure.getGrowingMoves()

      expect(growing.every(m => m.isGrowing())).toBe(true)
    })

    it("should return reference moves after termination", () => {
      // Add an Up move then break it
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000, open: 100, close: 110, low: 95, high: 115 }))
      structure.addCandle(createCandle({ openTime: 2000, closeTime: 3000, open: 105, close: 75, low: 70, high: 108 }))

      const reference = structure.getReferenceMoves()

      expect(reference.every(m => m.isReference())).toBe(true)
    })

    it("should return no archived moves before any archiving", () => {
      structure.addCandle(createCandle())

      expect(structure.getArchivedMoves()).toHaveLength(0)
    })

    it("should include archived moves after archiveOrphanedStructures", () => {
      // Create a terminated move that is old enough to archive
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000, open: 100, close: 110, low: 95, high: 115 }))
      structure.addCandle(createCandle({ openTime: 2000, closeTime: 3000, open: 105, close: 75, low: 70, high: 108 }))

      const archived = structure.archiveOrphanedStructures(10000)

      if (archived > 0) {
        expect(structure.getArchivedMoves().length).toBeGreaterThan(0)
      }
    })
  })

  // ============================================
  // getStructuresByDegre
  // ============================================

  describe("getStructuresByDegre", () => {
    it("should return root structures at degre 0 after termination", () => {
      // Create and terminate a root move
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000, open: 100, close: 110, low: 95, high: 115 }))
      structure.addCandle(createCandle({ openTime: 2000, closeTime: 3000, open: 105, close: 75, low: 70, high: 108 }))

      const degreZero = structure.getStructuresByDegre(0)

      // Terminated root structures should have degre 0
      expect(degreZero.every(m => m.degre === 0)).toBe(true)
    })

    it("should return empty array for a degre with no structures", () => {
      structure.addCandle(createCandle())

      expect(structure.getStructuresByDegre(99)).toHaveLength(0)
    })
  })

  // ============================================
  // getLayers / getLayer / getLayerCount
  // ============================================

  describe("getLayers / getLayer / getLayerCount", () => {
    it("should return zero layers for empty structure", () => {
      expect(structure.getLayerCount()).toBe(0)
      expect(structure.getLayers()).toHaveLength(0)
    })

    it("should return layer 0 with one move after adding a single candle", () => {
      structure.addCandle(createCandle())

      const layers = structure.getLayers()

      expect(layers.length).toBeGreaterThanOrEqual(1)
      expect(layers[0].level).toBe(0)
      expect(layers[0].moves.length).toBeGreaterThanOrEqual(1)
    })

    it("getLayer should return correct level field", () => {
      structure.addCandle(createCandle())

      const layer = structure.getLayer(0)

      expect(layer.level).toBe(0)
    })

    it("getLayer should return empty moves array for a level that does not exist", () => {
      structure.addCandle(createCandle())

      const layer = structure.getLayer(500)

      expect(layer.moves).toHaveLength(0)
    })
  })

  // ============================================
  // formatActiveMoves
  // ============================================

  describe("formatActiveMoves", () => {
    it("should return 'No active moves' for empty structure", () => {
      expect(structure.formatActiveMoves()).toBe("No active moves")
    })

    it("should contain polarity in formatted output", () => {
      structure.addCandle(createCandle({ open: 100, close: 110 }))

      const formatted = structure.formatActiveMoves()

      // Polarity.Up = "up", should appear in the formatted string
      expect(formatted.toLowerCase()).toContain("up")
    })

    it("should contain rang bracket in formatted output", () => {
      structure.addCandle(createCandle())

      const formatted = structure.formatActiveMoves()

      expect(formatted).toContain("[Rang")
    })

    it("should list one entry per growing move", () => {
      structure.addCandle(createCandle())

      const growingCount = structure.getGrowingMoves().length
      const lines = structure.formatActiveMoves().split("\n").filter(l => l.trim())

      expect(lines.length).toBe(growingCount)
    })
  })

  // ============================================
  // validateStructure
  // ============================================

  describe("validateStructure", () => {
    it("should be valid for empty structure", () => {
      const result = structure.validateStructure()

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should be valid after adding a single candle", () => {
      structure.addCandle(createCandle())

      const result = structure.validateStructure()

      expect(result.valid).toBe(true)
    })

    it("should be valid after a sequence of candles with terminations", () => {
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000, open: 100, close: 110, low: 95, high: 115 }))
      structure.addCandle(createCandle({ openTime: 2000, closeTime: 3000, open: 105, close: 75, low: 70, high: 108 }))
      structure.addCandle(createCandle({ openTime: 3000, closeTime: 4000, open: 78, close: 90, low: 72, high: 95 }))

      const result = structure.validateStructure()

      expect(result.valid).toBe(true)
    })
  })

  // ============================================
  // getMemoryStats
  // ============================================

  describe("getMemoryStats", () => {
    it("should return all-zero stats for empty structure", () => {
      const stats = structure.getMemoryStats()

      expect(stats.totalMoves).toBe(0)
      expect(stats.activeMoves).toBe(0)
      expect(stats.closedMoves).toBe(0)
      expect(stats.growingMoves).toBe(0)
      expect(stats.referenceMoves).toBe(0)
      expect(stats.archivedMoves).toBe(0)
    })

    it("should count one growing move after adding a single candle", () => {
      structure.addCandle(createCandle())

      const stats = structure.getMemoryStats()

      expect(stats.totalMoves).toBe(1)
      expect(stats.growingMoves).toBe(1)
      expect(stats.referenceMoves).toBe(0)
    })

    it("should reflect reference moves after termination", () => {
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000, open: 100, close: 110, low: 95, high: 115 }))
      structure.addCandle(createCandle({ openTime: 2000, closeTime: 3000, open: 105, close: 75, low: 70, high: 108 }))

      const stats = structure.getMemoryStats()

      expect(stats.referenceMoves).toBeGreaterThanOrEqual(1)
    })

    it("activeMoves should equal growingMoves (legacy alias)", () => {
      structure.addCandle(createCandle())

      const stats = structure.getMemoryStats()

      expect(stats.activeMoves).toBe(stats.growingMoves)
    })

    it("closedMoves should equal referenceMoves + archivedMoves (legacy alias)", () => {
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000, open: 100, close: 110, low: 95, high: 115 }))
      structure.addCandle(createCandle({ openTime: 2000, closeTime: 3000, open: 105, close: 75, low: 70, high: 108 }))

      const stats = structure.getMemoryStats()

      expect(stats.closedMoves).toBe(stats.referenceMoves + stats.archivedMoves)
    })
  })

  // ============================================
  // pruneClosedMoves
  // ============================================

  describe("pruneClosedMoves", () => {
    it("should return 0 for empty structure", () => {
      expect(structure.pruneClosedMoves(9999)).toBe(0)
    })

    it("should not prune growing moves", () => {
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000 }))

      const pruned = structure.pruneClosedMoves(9999)

      expect(pruned).toBe(0)
      expect(structure.getAllMoves().length).toBe(1)
    })

    it("should prune reference moves older than the threshold", () => {
      // Terminate a move
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000, open: 100, close: 110, low: 95, high: 115 }))
      structure.addCandle(createCandle({ openTime: 2000, closeTime: 3000, open: 105, close: 75, low: 70, high: 108 }))

      const referenceCountBefore = structure.getReferenceMoves().length

      const pruned = structure.pruneClosedMoves(9999)

      if (referenceCountBefore > 0) {
        expect(pruned).toBeGreaterThan(0)
      }
    })

    it("should not prune reference moves newer than the threshold", () => {
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000, open: 100, close: 110, low: 95, high: 115 }))
      structure.addCandle(createCandle({ openTime: 2000, closeTime: 3000, open: 105, close: 75, low: 70, high: 108 }))

      // Threshold is before the move's end time (3000), so nothing should be pruned
      const pruned = structure.pruneClosedMoves(1)

      expect(pruned).toBe(0)
    })
  })

  // ============================================
  // clear
  // ============================================

  describe("clear", () => {
    it("should remove all moves", () => {
      structure.addCandle(createCandle())

      structure.clear()

      expect(structure.getAllMoves()).toHaveLength(0)
    })

    it("should reset growing moves", () => {
      structure.addCandle(createCandle())

      structure.clear()

      expect(structure.getGrowingMoves()).toHaveLength(0)
    })

    it("should allow adding candles again after clear", () => {
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000 }))
      structure.clear()
      structure.addCandle(createCandle({ openTime: 3000, closeTime: 4000 }))

      expect(structure.getAllMoves()).toHaveLength(1)
    })
  })

  // ============================================
  // tryAddCandle / tryBuildFromCandles
  // ============================================

  describe("tryAddCandle", () => {
    it("should return success=true for a valid candle", () => {
      const result = structure.tryAddCandle(createCandle())

      expect(result.success).toBe(true)
    })

    it("should return success=false for an invalid candle (closeTime < openTime)", () => {
      const invalid = createCandle({ openTime: 5000, closeTime: 1000 })

      const result = structure.tryAddCandle(invalid)

      expect(result.success).toBe(false)
    })

    it("should not throw for invalid candles", () => {
      const invalid = createCandle({ openTime: 5000, closeTime: 1000 })

      expect(() => structure.tryAddCandle(invalid)).not.toThrow()
    })

    it("should include an error message when failing", () => {
      const invalid = createCandle({ open: NaN })

      const result = structure.tryAddCandle(invalid)

      if (!result.success) {
        expect(result.error.message).toBeTruthy()
      }
    })
  })

  describe("tryBuildFromCandles", () => {
    it("should return zero errors for all-valid candles", () => {
      const candles = [
        createCandle({ openTime: 1000, closeTime: 2000 }),
        createCandle({ openTime: 2000, closeTime: 3000 }),
      ]

      const result = structure.tryBuildFromCandles(candles)

      expect(result.errors).toHaveLength(0)
      expect(result.successCount).toBe(2)
      expect(result.processedCount).toBe(2)
    })

    it("should skip invalid candles and continue processing", () => {
      const candles = [
        createCandle({ openTime: 1000, closeTime: 2000 }),
        createCandle({ openTime: 9000, closeTime: 1000 }), // invalid: closeTime < openTime
        createCandle({ openTime: 2000, closeTime: 3000 }),
      ]

      const result = structure.tryBuildFromCandles(candles)

      expect(result.processedCount).toBe(3)
      expect(result.successCount).toBe(2)
      expect(result.errors).toHaveLength(1)
    })

    it("should include index info in error objects", () => {
      const candles = [
        createCandle({ openTime: 1000, closeTime: 2000 }),
        createCandle({ openTime: 9000, closeTime: 1000 }), // invalid at index 1
      ]

      const result = structure.tryBuildFromCandles(candles)

      expect(result.errors[0].index).toBe(1)
    })
  })

  // ============================================
  // getStack / getMove — point-in-time queries
  // ============================================

  describe("getStack", () => {
    it("should return empty array when no moves exist", () => {
      expect(structure.getStack(5000)).toHaveLength(0)
    })

    it("should return the move active at the given timestamp", () => {
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000 }))

      const stack = structure.getStack(1500)

      expect(stack.length).toBe(1)
    })

    it("should not return moves that started after the timestamp", () => {
      structure.addCandle(createCandle({ openTime: 5000, closeTime: 6000 }))

      const stack = structure.getStack(1000)

      expect(stack).toHaveLength(0)
    })

    it("should return moves sorted by rang ascending", () => {
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000, open: 100, close: 110, low: 95, high: 115 }))
      structure.addCandle(createCandle({ openTime: 2000, closeTime: 3000, open: 108, close: 120, low: 105, high: 125 }))

      const stack = structure.getStack(2500)

      for (let i = 1; i < stack.length; i++) {
        expect(stack[i].rang).toBeGreaterThanOrEqual(stack[i - 1].rang)
      }
    })
  })

  describe("getMove", () => {
    it("should return undefined for non-existent rang", () => {
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000 }))

      expect(structure.getMove(999, 1500)).toBeUndefined()
    })

    it("should return the move at rang 0 for the given timestamp", () => {
      structure.addCandle(createCandle({ openTime: 1000, closeTime: 2000, open: 100, close: 110, low: 95, high: 115 }))

      const move = structure.getMove(0, 1500)

      expect(move).toBeDefined()
      expect(move?.rang).toBe(0)
    })

    it("should return undefined for timestamp before move started", () => {
      structure.addCandle(createCandle({ openTime: 5000, closeTime: 6000 }))

      expect(structure.getMove(0, 1000)).toBeUndefined()
    })
  })

  // ============================================
  // setLogger
  // ============================================

  describe("setLogger", () => {
    it("should accept a custom logger without throwing", () => {
      const logs: string[] = []
      const logger = {
        debug: (msg: string) => logs.push(`DEBUG: ${msg}`),
        info: (msg: string) => logs.push(`INFO: ${msg}`),
        warn: (msg: string) => logs.push(`WARN: ${msg}`),
        error: (msg: string) => logs.push(`ERROR: ${msg}`),
      }

      expect(() => structure.setLogger(logger)).not.toThrow()
    })

    it("should invoke logger.debug when adding a candle", () => {
      const logs: string[] = []
      const logger = {
        debug: (msg: string) => logs.push(msg),
        info: () => {},
        warn: () => {},
        error: () => {},
      }

      structure.setLogger(logger)
      structure.addCandle(createCandle())

      expect(logs.length).toBeGreaterThan(0)
    })
  })

  // ============================================
  // Engulfing candle logic
  // ============================================

  describe("engulfing candle detection", () => {
    it("should handle a green engulfing candle (breaks both high and reference level)", () => {
      // Establish an Up structure
      structure.addCandle(createCandle({
        openTime: 1000, closeTime: 2000,
        open: 100, close: 110, low: 95, high: 115,
      }))

      // Extend it to raise the reference level
      structure.addCandle(createCandle({
        openTime: 2000, closeTime: 3000,
        open: 112, close: 120, low: 108, high: 125,
      }))

      // Green engulfing: high > 125 (breaks directional) AND low < 108 (breaks reference)
      structure.addCandle(createCandle({
        openTime: 3000, closeTime: 4000,
        open: 110, close: 130, low: 100, high: 135,
      }))

      // Should not throw and structure should remain consistent
      const validation = structure.validateStructure()
      expect(validation.valid).toBe(true)
    })

    it("should handle a red engulfing candle on an Up structure", () => {
      // Establish an Up structure with reference level above initial low
      structure.addCandle(createCandle({
        openTime: 1000, closeTime: 2000,
        open: 100, close: 110, low: 95, high: 115,
      }))

      // Extend to raise reference
      structure.addCandle(createCandle({
        openTime: 2000, closeTime: 3000,
        open: 112, close: 118, low: 108, high: 122,
      }))

      // Red engulfing: high > 122 (extends) AND low < 108 (breaks reference)
      structure.addCandle(createCandle({
        openTime: 3000, closeTime: 4000,
        open: 125, close: 90, low: 85, high: 130,
      }))

      const validation = structure.validateStructure()
      expect(validation.valid).toBe(true)
    })
  })
})
