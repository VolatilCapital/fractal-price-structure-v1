import type { PriceMove } from '../../domain/price-move/PriceMove.js';

/**
 * Tree-shaped JSON serialization of a PriceMove (ADR-005 schema).
 *
 * Includes the protocol-relevant fields (rang/rangContrasted/degre, current
 * reference level, breaking move) and recursive children, omitting the
 * legacy `originIds`/`confirmedOriginIds` that were always empty.
 */
export interface PriceMoveJson {
  id: string;
  polarity: 'up' | 'down';
  state: 'growing' | 'reference' | 'archived';
  rang: number;
  rangContrasted: number;
  degre?: number;
  priceRange: { low: number; high: number };
  timeRange: { start: number; end: number };
  currentReferenceLevel: number;
  breakingMoveId?: string;
  children: PriceMoveJson[];
}

export class PriceMoveExporter {
  public static toJSON(move: PriceMove): PriceMoveJson {
    return {
      id: move.id.toString(),
      polarity: move.polarity,
      state: move.state,
      rang: move.rang,
      rangContrasted: move.rangContrasted,
      degre: move.degre,
      priceRange: { low: move.priceRange.low, high: move.priceRange.high },
      timeRange: { start: move.timeRange.start, end: move.timeRange.end },
      currentReferenceLevel: move.currentReferenceLevel,
      breakingMoveId: move.breakingMove?.id.toString(),
      children: move.subStructures.map(PriceMoveExporter.toJSON),
    };
  }
}
