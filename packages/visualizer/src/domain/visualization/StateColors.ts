/**
 * Color constants for the fractal visualizer.
 *
 * Design principle: each visual axis has its own color family.
 * - Direction (polarity): Blue/Red — NEVER used for state
 * - Structural dynamics: Green/Orange — extension vs break
 * - Lifecycle state: expressed via opacity/stroke, NOT color
 *
 * See docs/charte-couleurs.md for the full charter.
 */

/**
 * Colors based on polarity (Up/Down).
 * Primary visual identity of every move and candle.
 */
export const POLARITY_COLORS = {
  Up: '#42A5F5',    // Blue 400 — bullish / haussier
  Down: '#EF5350',  // Red 400 — bearish / baissier
} as const

export type PolarityColorKey = keyof typeof POLARITY_COLORS

/**
 * Colors for reference level boundary lines.
 * Semantic: green = growth side, orange = break side.
 */
export const LEVEL_COLORS = {
  Accroissement: '#66BB6A',  // Green 400 — extension boundary
  Cassure: '#FFA726',        // Orange 400 — invalidation boundary
} as const

export type LevelColorKey = keyof typeof LEVEL_COLORS

/**
 * State indicator colors (UI dots, filter panel toggles, statistics).
 * These are NOT used for move fill/stroke — state is expressed via opacity.
 */
export const STATE_COLORS = {
  Growing: '#66BB6A',   // Green 400 — active, under construction
  Reference: '#FFA726', // Orange 400 — frozen, serves as level
  Archived: '#BDBDBD',  // Grey 400 — historical, inactive
} as const

export type StateColorKey = keyof typeof STATE_COLORS

/**
 * Opacity levels for each lifecycle state.
 * State is expressed through visual treatment, not color.
 */
export const STATE_OPACITY = {
  Growing: { fill: 0.25, stroke: 1.0 },
  Reference: { fill: 0.12, stroke: 0.8 },
  Archived: { fill: 0.06, stroke: 0.5 },
} as const

/**
 * Event flash colors — coherent with structural dynamics.
 */
export const EVENT_COLORS = {
  Created: '#66BB6A',    // Green — birth = growth
  Extended: '#42A5F5',   // Blue — continuation = movement
  Terminated: '#FFA726', // Orange — end = becomes reference
  Archived: '#BDBDBD',  // Grey — historical
} as const
