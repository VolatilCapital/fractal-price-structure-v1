// src/infrastructure/adapters/PriceMoveExporter.ts
import type { PriceMove } from '../../domain/price-move/PriceMove.js';

interface PriceMoveJson {
  id: string;
  polarity: string;
  priceRange: { low: number; high: number };
  state: string;
  children: PriceMoveJson[];
}

export class PriceMoveExporter {
  public static toJSON(move: PriceMove): PriceMoveJson {
    return {
      id: move.id.toString(),
      polarity: move.polarity,
      priceRange: { low: move.priceRange.low, high: move.priceRange.high },
      state: move.state,
      children: move.childMoves.map(PriceMoveExporter.toJSON),
    };
  }
}
