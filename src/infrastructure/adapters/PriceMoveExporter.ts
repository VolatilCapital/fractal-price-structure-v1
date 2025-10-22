// src/infrastructure/adapters/PriceMoveExporter.ts
import { PriceMove } from "../../domain/price-move/PriceMove.js"

export class PriceMoveExporter {
    public static toJSON(move: PriceMove): any {
        return {
            id: move.id.toString(),
            polarity: move.polarity,
            priceRange: { low: move.priceRange.low, high: move.priceRange.high },
            state: move.state,
            children: move.childMoves.map(this.toJSON)
        }
    }
}
