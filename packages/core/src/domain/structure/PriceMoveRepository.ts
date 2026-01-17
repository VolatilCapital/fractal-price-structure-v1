import type { PriceMove } from "../price-move/PriceMove.js"
import type { PriceMoveId } from "../price-move/PriceMoveId.js"

export interface PriceMoveRepository {
  save(priceMove: PriceMove): void
  findById(id: PriceMoveId): PriceMove | undefined
  findAll(): PriceMove[]
  findActive(): PriceMove[]
  clear(): void
}