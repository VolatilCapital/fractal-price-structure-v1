import { PriceMove } from "../../domain/price-move/PriceMove"
import { PriceMoveStructure } from "../../domain/structure/PriceMoveStructure"
import { PriceMoveRepository } from "../../domain/structure/PriceMoveRepository"
import { InMemoryPriceMoveRepository } from "../../infrastructure/repositories/InMemoryPriceMoveRepository"

export class FractalPriceMoveBuilder {
    buildFromMoves(moves: PriceMove[]): PriceMove[] {
        // Trie les moves par ordre chronologique
        const sorted = moves.slice().sort((a, b) => a.timeRange.start - b.timeRange.start)

        // Utilise un repo temporaire en mémoire
        const repo: PriceMoveRepository = new InMemoryPriceMoveRepository()
        const structure = new PriceMoveStructure(repo)

        // Injection des moves comme s'ils étaient des bougies (éléments primitifs)
        for (const move of sorted) {
            structure.add(move)
        }

        // Retourne les nouveaux PriceMoves créés
        return structure.getAllMoves()
    }
}
