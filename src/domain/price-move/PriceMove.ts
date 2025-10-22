import { Polarity } from "./Polarity.js"
import { PriceMoveState } from "./PriceMoveState.js"
import { PriceMoveId } from "./PriceMoveId.js"
import { PriceRange } from "../../shared/PriceRange.js"
import { TimeRange } from "../../shared/TimeRange.js"

export class PriceMove {
  readonly id: PriceMoveId
  public timeRange: TimeRange
  public priceRange: PriceRange
  public polarity: Polarity
  public state: PriceMoveState = PriceMoveState.Active

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
  }) {
    this.id = params.id
    this.timeRange = params.timeRange
    this.priceRange = params.priceRange
    this.polarity = params.polarity
    this.origin = params.origin ?? []
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
      (this.polarity === Polarity.Up && priceToTest > borderToBreak) ||
      (this.polarity === Polarity.Down && priceToTest < borderToBreak)
    ) {
      console.log(`📈 Extension : ${this.id.toString()} ← ${candidate.id.toString()}`)
      this.priceRange = this.priceRange.extendWith(priceToTest)
      this.timeRange = this.timeRange.extendWith(candidate.timeRange.end)
      this.confirmedOrigins.push(candidate)
      return true
    }

    const invalidation =
      (this.polarity === Polarity.Up && candidate.priceRange.low < this.priceRange.low) ||
      (this.polarity === Polarity.Down && candidate.priceRange.high > this.priceRange.high)

    if (invalidation) {
      console.log(`❌ Clôture : ${this.id.toString()} × ${candidate.id.toString()}`)
      this.state = PriceMoveState.Closed
      return false
    }

    // Cas interne : ni extension ni clôture
    console.log(`🔁 Enfant interne : ${this.id.toString()} ⇝ ${candidate.id.toString()}`)
    console.log(`🔗 ${candidate.id.toString()} rattaché à ${this.id.toString()} (enfant interne)`)
    this.childMoves.push(candidate)
    candidate.englobingMove = this
    return true
  }

  public isActive(): boolean {
    return this.state === PriceMoveState.Active
  }

  public isClosed(): boolean {
    return this.state === PriceMoveState.Closed
  }
}
