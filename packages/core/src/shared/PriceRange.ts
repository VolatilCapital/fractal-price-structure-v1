import { Price } from "./Price.js"

export class PriceRange {
  constructor(
    public low: number,
    public high: number
  ) {
    if (Price.gt(low, high)) {
      throw new Error("PriceRange: low cannot be greater than high")
    }
  }

  public extendWith(price: number): PriceRange {
    return new PriceRange(Price.min(this.low, price), Price.max(this.high, price))
  }

  public contains(other: PriceRange): boolean {
    return Price.lte(this.low, other.low) && Price.gte(this.high, other.high)
  }

  public toString(): string {
    return `[${this.low} → ${this.high}]`
  }
}
