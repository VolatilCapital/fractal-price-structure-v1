import type { PriceMove } from "./PriceMove.js"

/**
 * Un niveau de référence représente un point pivot (haut ou bas) dans la structure fractale.
 * Ces niveaux sont numérotés (L0, L1, L2... pour les bas, H0, H1, H2... pour les hauts)
 * et servent de support/résistance pour l'analyse technique.
 */
export interface ReferenceLevel {
  /** Prix du niveau de référence */
  price: number
  /** Timestamp du niveau de référence */
  timestamp: number
  /** Index du niveau (0, 1, 2...) dans la séquence */
  index: number
  /** Structure de prix qui a créé ce niveau */
  move: PriceMove
}
