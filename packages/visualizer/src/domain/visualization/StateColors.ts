/**
 * State colors for PriceMove visualization.
 * Shared constants to ensure consistency across UI components.
 */

/** Colors for each PriceMove state */
export const STATE_COLORS = {
  Growing: '#4CAF50',
  Reference: '#FF9800',
  Archived: '#9E9E9E',
} as const

export type StateColorKey = keyof typeof STATE_COLORS
