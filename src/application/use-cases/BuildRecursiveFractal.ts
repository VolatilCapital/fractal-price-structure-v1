import { PriceMove } from "../../domain/price-move/PriceMove"
import { FractalLayer } from "../../domain/structure/FractalLayer"


export function buildRecursiveFractalRoots(roots: PriceMove[], maxLevels: number): FractalLayer[] {
  const layers: FractalLayer[] = []

  function buildLayer(moves: PriceMove[], level: number): void {
    if (level > maxLevels || moves.length === 0) return

    layers.push({ level, moves })

    const nextLevelMoves: PriceMove[] = []
    for (const move of moves) {
      nextLevelMoves.push(...move.childMoves)
    }

    buildLayer(nextLevelMoves, level + 1)
  }

  buildLayer(roots, 1)

  return layers
}
