import { PriceMove } from "../price-move/PriceMove"
import { PriceMoveId } from "../price-move/PriceMoveId"

export interface PriceMoveRepository {
  save(priceMove: PriceMove): void
  findById(id: PriceMoveId): PriceMove | undefined
  findAll(): PriceMove[]
  findActive(): PriceMove[]
  clear(): void
}