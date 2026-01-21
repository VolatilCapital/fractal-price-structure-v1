import type { PriceMove } from '../../domain/price-move/PriceMove.js';
import type { PriceMoveId } from '../../domain/price-move/PriceMoveId.js';
import type { PriceMoveRepository } from '../../domain/structure/PriceMoveRepository.js';
import { PriceMoveState } from '../../domain/price-move/PriceMoveState.js';

export class InMemoryPriceMoveRepository implements PriceMoveRepository {
  private moves: Map<string, PriceMove> = new Map();

  save(priceMove: PriceMove): void {
    this.moves.set(priceMove.id.toString(), priceMove);
  }

  findById(id: PriceMoveId): PriceMove | undefined {
    return this.moves.get(id.toString());
  }

  findAll(): PriceMove[] {
    return Array.from(this.moves.values());
  }

  /**
   * @deprecated Use findGrowing() instead
   */
  findActive(): PriceMove[] {
    return this.findGrowing();
  }

  findByState(state: PriceMoveState): PriceMove[] {
    return this.findAll().filter((m) => m.state === state);
  }

  findGrowing(): PriceMove[] {
    return this.findByState(PriceMoveState.Growing);
  }

  findReference(): PriceMove[] {
    return this.findByState(PriceMoveState.Reference);
  }

  findArchived(): PriceMove[] {
    return this.findByState(PriceMoveState.Archived);
  }

  removeArchived(): number {
    const archived = this.findArchived();
    for (const move of archived) {
      this.moves.delete(move.id.toString());
    }
    return archived.length;
  }

  clear(): void {
    this.moves.clear();
  }
}
