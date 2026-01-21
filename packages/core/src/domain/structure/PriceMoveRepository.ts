import type { PriceMove } from "../price-move/PriceMove.js"
import type { PriceMoveId } from "../price-move/PriceMoveId.js"
import type { PriceMoveState } from "../price-move/PriceMoveState.js"

export interface PriceMoveRepository {
  save(priceMove: PriceMove): void
  findById(id: PriceMoveId): PriceMove | undefined
  findAll(): PriceMove[]

  /** @deprecated Use findGrowing() instead */
  findActive(): PriceMove[]

  /** Find moves by state */
  findByState(state: PriceMoveState): PriceMove[]

  /** Find all Growing moves */
  findGrowing(): PriceMove[]

  /** Find all Reference moves */
  findReference(): PriceMove[]

  /** Find all Archived moves */
  findArchived(): PriceMove[]

  /** Remove all Archived moves and return count */
  removeArchived(): number

  clear(): void
}
