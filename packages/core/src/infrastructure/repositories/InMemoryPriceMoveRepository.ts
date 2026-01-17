import type { PriceMoveRepository } from "../../domain/structure/PriceMoveRepository.js"
import type { PriceMove } from "../../domain/price-move/PriceMove.js"
import type { PriceMoveId } from "../../domain/price-move/PriceMoveId.js"

export class InMemoryPriceMoveRepository implements PriceMoveRepository {
  private moves: Map<string, PriceMove> = new Map()

  save(priceMove: PriceMove): void {
    this.moves.set(priceMove.id.toString(), priceMove)
  }

  findById(id: PriceMoveId): PriceMove | undefined {
    return this.moves.get(id.toString())
  }

  findAll(): PriceMove[] {
    return Array.from(this.moves.values())
  }

  findActive(): PriceMove[] {
    return this.findAll().filter(m => m.isActive())
  }

  clear(): void {
    this.moves.clear()
  }
}