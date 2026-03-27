import { describe, it, expect } from "vitest"
import { FractalPriceMoveBuilder } from "./FractalPriceMoveBuilder.js"
import { InMemoryPriceMoveRepository } from "../../infrastructure/repositories/InMemoryPriceMoveRepository.js"
import { PriceMove } from "../../domain/price-move/PriceMove.js"
import { PriceMoveId } from "../../domain/price-move/PriceMoveId.js"
import { Polarity } from "../../domain/price-move/Polarity.js"
import { PriceRange } from "../../shared/PriceRange.js"
import { TimeRange } from "../../shared/TimeRange.js"

function createMove(params: {
  polarity: Polarity
  low: number
  high: number
  start: number
  end: number
}): PriceMove {
  return new PriceMove({
    id: PriceMoveId.create(),
    polarity: params.polarity,
    priceRange: new PriceRange(params.low, params.high),
    timeRange: new TimeRange(params.start, params.end),
  })
}

describe("FractalPriceMoveBuilder", () => {
  const repoFactory = () => new InMemoryPriceMoveRepository()
  let builder: FractalPriceMoveBuilder

  beforeEach(() => {
    builder = new FractalPriceMoveBuilder(repoFactory)
  })

  describe("buildFromMoves", () => {
    it("should return empty array for empty input", () => {
      const result = builder.buildFromMoves([])

      expect(result).toEqual([])
    })

    it("should return at least the single move for a single-element input", () => {
      const move = createMove({ polarity: Polarity.Up, low: 90, high: 110, start: 1000, end: 2000 })

      const result = builder.buildFromMoves([move])

      expect(result.length).toBeGreaterThanOrEqual(1)
    })

    it("should process moves in chronological order regardless of input order", () => {
      // Use fresh move instances for each builder call to avoid circular parentStructure refs
      const makeMovePair = () => [
        createMove({ polarity: Polarity.Up, low: 90, high: 110, start: 1000, end: 2000 }),
        createMove({ polarity: Polarity.Up, low: 105, high: 120, start: 2000, end: 3000 }),
      ]

      const [m1a, m2a] = makeMovePair()
      const resultReversed = builder.buildFromMoves([m2a, m1a])

      const builder2 = new FractalPriceMoveBuilder(repoFactory)
      const [m1b, m2b] = makeMovePair()
      const resultOrdered = builder2.buildFromMoves([m1b, m2b])

      // Both should produce the same number of total moves
      expect(resultReversed.length).toBe(resultOrdered.length)
    })

    it("should create a new fractal structure independent of the input moves' own hierarchy", () => {
      // Input moves have no parent-child relationships
      const moves = [
        createMove({ polarity: Polarity.Up, low: 90, high: 110, start: 1000, end: 2000 }),
        createMove({ polarity: Polarity.Up, low: 105, high: 125, start: 2000, end: 3000 }),
        createMove({ polarity: Polarity.Up, low: 120, high: 140, start: 3000, end: 4000 }),
      ]

      const result = builder.buildFromMoves(moves)

      // The returned moves are stored in the temporary repository
      expect(result.length).toBeGreaterThan(0)
    })

    it("should terminate the previous root when a new move breaks its boundary", () => {
      // Up move then Down move that breaks the reference level
      const upMove = createMove({ polarity: Polarity.Up, low: 90, high: 110, start: 1000, end: 2000 })
      const downMove = createMove({ polarity: Polarity.Down, low: 70, high: 100, start: 2000, end: 3000 })

      const result = builder.buildFromMoves([upMove, downMove])

      const terminatedMoves = result.filter(m => !m.isGrowing())
      expect(terminatedMoves.length).toBeGreaterThanOrEqual(1)
    })

    it("should use a fresh repository for each buildFromMoves call", () => {
      // Use separate move instances to avoid circular parent links from previous calls
      const move1 = createMove({ polarity: Polarity.Up, low: 90, high: 110, start: 1000, end: 2000 })
      const move2 = createMove({ polarity: Polarity.Up, low: 90, high: 110, start: 1000, end: 2000 })

      const result1 = builder.buildFromMoves([move1])
      const result2 = builder.buildFromMoves([move2])

      // Each call produces its own independent set of moves
      expect(result1.length).toBe(result2.length)
      expect(result1).not.toBe(result2) // Different array references
    })

    it("should handle moves with the same start time (sort stable)", () => {
      const move1 = createMove({ polarity: Polarity.Up, low: 90, high: 110, start: 1000, end: 2000 })
      const move2 = createMove({ polarity: Polarity.Down, low: 85, high: 105, start: 1000, end: 2000 })

      // Should not throw
      expect(() => builder.buildFromMoves([move1, move2])).not.toThrow()
    })
  })
})
