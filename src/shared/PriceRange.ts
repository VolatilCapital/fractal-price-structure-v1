export class PriceRange {
  constructor(public low: number, public high: number) {
    if (low > high) {
      throw new Error("PriceRange: low cannot be greater than high")
    }
  }

  public extendWith(price: number): PriceRange {
    return new PriceRange(Math.min(this.low, price), Math.max(this.high, price))
  }

  public contains(other: PriceRange): boolean {
    return this.low <= other.low && this.high >= other.high
  }

  public toString(): string {
    return `[${this.low} → ${this.high}]`
  }
}
