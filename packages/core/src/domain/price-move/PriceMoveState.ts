/**
 * État du cycle de vie d'une structure de prix fractale.
 *
 * Growing: Structure en croissance active, peut être étendue ou cassée
 * Reference: Structure terminée servant de référence (niveaux de support/résistance)
 * Archived: Structure archivée pour optimisation mémoire
 */
export const PriceMoveState = {
  Growing: "growing",
  Reference: "reference",
  Archived: "archived",
} as const;
export type PriceMoveState = (typeof PriceMoveState)[keyof typeof PriceMoveState];
