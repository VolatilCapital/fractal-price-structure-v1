import Big from "big.js"

/**
 * Provides precise decimal arithmetic for price comparisons and calculations.
 * Uses big.js internally to eliminate floating-point errors.
 *
 * @example
 * // Instead of: 0.1 + 0.2 === 0.3 (false in JavaScript)
 * Price.eq(Price.add(0.1, 0.2), 0.3) // true
 */
export const Price = {
  /**
   * Compares if a > b with decimal precision.
   */
  gt(a: number, b: number): boolean {
    return new Big(a).gt(new Big(b))
  },

  /**
   * Compares if a >= b with decimal precision.
   */
  gte(a: number, b: number): boolean {
    return new Big(a).gte(new Big(b))
  },

  /**
   * Compares if a < b with decimal precision.
   */
  lt(a: number, b: number): boolean {
    return new Big(a).lt(new Big(b))
  },

  /**
   * Compares if a <= b with decimal precision.
   */
  lte(a: number, b: number): boolean {
    return new Big(a).lte(new Big(b))
  },

  /**
   * Compares if a === b with decimal precision.
   */
  eq(a: number, b: number): boolean {
    return new Big(a).eq(new Big(b))
  },

  /**
   * Returns the minimum of two prices.
   */
  min(a: number, b: number): number {
    return new Big(a).lt(new Big(b)) ? a : b
  },

  /**
   * Returns the maximum of two prices.
   */
  max(a: number, b: number): number {
    return new Big(a).gt(new Big(b)) ? a : b
  },

  /**
   * Adds two prices with decimal precision.
   */
  add(a: number, b: number): number {
    return Number(new Big(a).plus(new Big(b)))
  },

  /**
   * Subtracts b from a with decimal precision.
   */
  sub(a: number, b: number): number {
    return Number(new Big(a).minus(new Big(b)))
  },
}
