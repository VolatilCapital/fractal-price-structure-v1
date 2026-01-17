import { Polarity } from "./Polarity.js"
import { PriceMoveState } from "./PriceMoveState.js"
import type { PriceMoveId } from "./PriceMoveId.js"
import type { PriceRange } from "../../shared/PriceRange.js"
import type { TimeRange } from "../../shared/TimeRange.js"
import { Price } from "../../shared/Price.js"

export class PriceMove {
  readonly id: PriceMoveId
  public timeRange: TimeRange
  public priceRange: PriceRange
  public polarity: Polarity
  public state: PriceMoveState = PriceMoveState.Active
  /** Generation level: 0 for root moves, parent.generation + 1 for children */
  public generation: number
  /** Timestamp when this move was closed/invalidated (undefined if still active) */
  public closedAt?: number

  public origin: PriceMove[] = []
  public confirmedOrigins: PriceMove[] = []
  public childMoves: PriceMove[] = []
  public englobingMove?: PriceMove

  constructor(params: {
    id: PriceMoveId
    timeRange: TimeRange
    priceRange: PriceRange
    polarity: Polarity
    origin?: PriceMove[]
    generation?: number
  }) {
    this.id = params.id
    this.timeRange = params.timeRange
    this.priceRange = params.priceRange
    this.polarity = params.polarity
    this.origin = params.origin ?? []
    this.generation = params.generation ?? 0
  }

  /**
   * Tente de prolonger ce mouvement avec un nouveau sous-mouvement.
   * Retourne true si prolongation (ou enfant interne), false si clôture.
   */
  public tryExtendWith(candidate: PriceMove): boolean {
    if (this.state !== PriceMoveState.Active) return false

    const priceToTest =
      this.polarity === Polarity.Up
        ? candidate.priceRange.high
        : candidate.priceRange.low

    const borderToBreak =
      this.polarity === Polarity.Up
        ? this.priceRange.high
        : this.priceRange.low

    if (
      (this.polarity === Polarity.Up && Price.gt(priceToTest, borderToBreak)) ||
      (this.polarity === Polarity.Down && Price.lt(priceToTest, borderToBreak))
    ) {
      this.priceRange = this.priceRange.extendWith(priceToTest)
      this.timeRange = this.timeRange.extendWith(candidate.timeRange.end)
      this.confirmedOrigins.push(candidate)
      return true
    }

    const invalidation =
      (this.polarity === Polarity.Up && Price.lt(candidate.priceRange.low, this.priceRange.low)) ||
      (this.polarity === Polarity.Down && Price.gt(candidate.priceRange.high, this.priceRange.high))

    if (invalidation) {
      this.state = PriceMoveState.Closed
      this.closedAt = candidate.timeRange.start
      return false
    }

    // Internal child: neither extension nor invalidation
    // Avoid duplicates and update generation
    if (!this.childMoves.includes(candidate)) {
      this.childMoves.push(candidate)
      candidate.englobingMove = this
      candidate.generation = this.generation + 1
    }
    return true
  }

  public isActive(): boolean {
    return this.state === PriceMoveState.Active
  }

  public isClosed(): boolean {
    return this.state === PriceMoveState.Closed
  }

  /**
   * Checks if this move was active at a specific timestamp.
   * A move was active at timestamp T if:
   * - The move had started (timeRange.start <= T)
   * - AND the move wasn't closed yet (closedAt is undefined OR closedAt > T)
   *
   * @param timestamp - Unix timestamp in milliseconds
   * @returns true if the move was active at the given timestamp
   */
  public wasActiveAt(timestamp: number): boolean {
    // Move hadn't started yet
    if (this.timeRange.start > timestamp) {
      return false
    }
    // Move is still active (never closed) or was closed after the timestamp
    return this.closedAt === undefined || this.closedAt > timestamp
  }
}
