import type { PriceMove } from "./PriceMove.js"
import { Polarity } from "./Polarity.js"
import { Price } from "../../shared/Price.js"

export class PriceMoveRules {
  public static canExtendWith(current: PriceMove, candidate: PriceMove): boolean {
    return current.isActive() && current.tryExtendWith(candidate)
  }

  /**
   * Checks if the candidate would invalidate the current move.
   * An Up move is invalidated when candidate breaks below the move's low.
   * A Down move is invalidated when candidate breaks above the move's high.
   */
  public static isInvalidatedBy(current: PriceMove, candidate: PriceMove): boolean {
    if (!current.isActive()) {
      return false
    }

    if (current.polarity === Polarity.Up) {
      return Price.lt(candidate.priceRange.low, current.priceRange.low)
    }
    return Price.gt(candidate.priceRange.high, current.priceRange.high)
  }
}