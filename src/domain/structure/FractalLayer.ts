import { PriceMove } from "../price-move/PriceMove"

/**
 * Une couche fractale est un ensemble de PriceMoves construits au même niveau.
 * Exemple :
 * - Couche 0 = bougies ou ticks
 * - Couche 1 = premiers PriceMoves
 * - Couche 2 = PriceMoves créés à partir de la couche 1
 */
export interface FractalLayer {
  level: number
  moves: PriceMove[]
}
