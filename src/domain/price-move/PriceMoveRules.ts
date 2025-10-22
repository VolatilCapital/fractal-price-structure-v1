import { PriceMove } from "./PriceMove.js"

export class PriceMoveRules {
  public static canExtendWith(current: PriceMove, candidate: PriceMove): boolean {
    return current.isActive() && current.tryExtendWith(candidate)
  }

  public static isInvalidatedBy(current: PriceMove, candidate: PriceMove): boolean {
    return !current.isActive()
  }
}