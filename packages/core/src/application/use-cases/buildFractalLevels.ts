import type { PriceMove } from "../../domain/price-move/PriceMove.js"
import { FractalPriceMoveBuilder } from "./FractalPriceMoveBuilder.js"

/**
 * Construit récursivement plusieurs couches fractales de PriceMove.
 * @param initialMoves - Liste de PriceMove de niveau 0 (souvent issus des bougies).
 * @param maxDepth - Nombre de niveaux fractals à construire.
 * @returns Tableau de couches fractales, chaque niveau étant une liste de PriceMove.
 */
export function buildFractalLevels(initialMoves: PriceMove[], maxDepth = 5): PriceMove[][] {
    const layers: PriceMove[][] = []
    let current = initialMoves
    const builder = new FractalPriceMoveBuilder()

    for (let i = 0; i < maxDepth; i++) {
        if (current.length <= 1) break
        layers.push(current)
        current = builder.buildFromMoves(current)
    }

    return layers
}
