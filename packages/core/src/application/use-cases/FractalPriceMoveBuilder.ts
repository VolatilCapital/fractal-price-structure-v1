import type { PriceMove } from "../../domain/price-move/PriceMove.js"
import { PriceMoveStructure } from "../../domain/structure/PriceMoveStructure.js"
import type { PriceMoveRepositoryFactory } from "../ports/PriceMoveRepositoryFactory.js"

export class FractalPriceMoveBuilder {
    constructor(private readonly repoFactory: PriceMoveRepositoryFactory) {}

    buildFromMoves(moves: PriceMove[]): PriceMove[] {
        // Trie les moves par ordre chronologique
        const sorted = moves.slice().sort((a, b) => a.timeRange.start - b.timeRange.start)

        // Utilise un repo temporaire en mémoire
        const repo = this.repoFactory()
        const structure = new PriceMoveStructure(repo)

        // Injection des moves comme s'ils étaient des bougies (éléments primitifs)
        for (const move of sorted) {
            structure.add(move)
        }

        // Retourne les nouveaux PriceMoves créés
        return structure.getAllMoves()
    }
}
