import type { PriceMove } from "./PriceMove.js"
import { Polarity } from "./Polarity.js"
import { Price } from "../../shared/Price.js"

/**
 * Checks if the current move can be extended by the candidate.
 * Returns true if extension occurred.
 */
export function canExtendWith(current: PriceMove, candidate: PriceMove): boolean {
  return current.isActive() && current.tryExtendWith(candidate)
}

/**
 * Checks if the candidate would invalidate the current move.
 * Invalidation is checked against the currentReferenceLevel (protocole section 3.2),
 * not the structure's global bounds.
 * An Up move is invalidated when candidate breaks below the reference level.
 * A Down move is invalidated when candidate breaks above the reference level.
 */
export function isInvalidatedBy(current: PriceMove, candidate: PriceMove): boolean {
  if (!current.isActive()) {
    return false
  }

  if (current.polarity === Polarity.Up) {
    return Price.lt(candidate.priceRange.low, current.currentReferenceLevel)
  }
  return Price.gt(candidate.priceRange.high, current.currentReferenceLevel)
}

/**
 * @deprecated Use canExtendWith and isInvalidatedBy functions directly.
 * Kept for backward compatibility.
 */
export const PriceMoveRules = {
  canExtendWith,
  isInvalidatedBy,
}