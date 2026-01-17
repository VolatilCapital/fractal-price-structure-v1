// src/application/use-cases/BuildPriceMovesFromCandles.ts

import type { Candle } from "../../shared/Candle.js"
import type { PriceMoveStructure } from "../../domain/structure/PriceMoveStructure.js"
import { PriceMoveFactory } from "../../domain/price-move/PriceMoveFactory.js"

/**
 * Cas d’usage : à partir d’un tableau de bougies, génère les PriceMove élémentaires
 * et les injecte dans la structure fractale.
 */
export class BuildPriceMovesFromCandles {
  constructor(private readonly structure: PriceMoveStructure) {}

  build(candles: Candle[]): void {
    for (const candle of candles) {
      const move = PriceMoveFactory.fromCandle(candle)
      this.structure.add(move)
    }
  }
}
