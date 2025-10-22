import { PriceMove } from "../../domain/price-move/PriceMove"
import { PriceMoveStructure } from "../../domain/structure/PriceMoveStructure"
import { PriceMoveId } from "../../domain/price-move/PriceMoveId"
import { PriceMoveFactory } from "../../domain/price-move/PriceMoveFactory"

export interface FractalLayer {
    level: number
    moves: PriceMove[]
}

export function buildFractalLayersFromMoves(
    baseMoves: PriceMove[],
    levels: number
): FractalLayer[] {
    const layers: FractalLayer[] = []
    let currentMoves = baseMoves

    for (let level = 1; level <= levels; level++) {
        const structure = new PriceMoveStructure({ save: () => { }, findAll: () => [], findActive: () => [], findById: () => undefined, clear: () => { } })
        const newMoves: PriceMove[] = []

        for (const move of currentMoves) {
            const pseudoCandle = {
                openTime: move.timeRange.start,
                closeTime: move.timeRange.end,
                low: move.priceRange.low,
                high: move.priceRange.high,
                open: move.priceRange.low,
                close: move.priceRange.high,
                volume: 0
            }
            const newMove = PriceMoveFactory.fromCandle(pseudoCandle)
            structure.add(newMove)
        }

        const result = structure.getAllMoves()
        if (result.length === 0) break

        layers.push({ level, moves: result })
        currentMoves = result
    }

    return layers
}
