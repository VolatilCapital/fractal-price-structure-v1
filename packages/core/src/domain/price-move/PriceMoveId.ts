import { randomUUID } from "node:crypto"

export class PriceMoveId {
  constructor(private readonly value: string) {}

  /**
   * Creates a new PriceMoveId with a random UUID.
   * Use this for production/non-deterministic scenarios.
   */
  public static create(): PriceMoveId {
    return new PriceMoveId(randomUUID())
  }

  /**
   * Creates a deterministic PriceMoveId based on an index.
   * Use this for testing and reproducibility scenarios.
   *
   * @param index - The index to use for generating the ID
   */
  public static fromIndex(index: number): PriceMoveId {
    // Create a deterministic UUID-like format: 00000000-0000-0000-0000-XXXXXXXXXXXX
    const hex = index.toString(16).padStart(12, "0")
    return new PriceMoveId(`00000000-0000-0000-0000-${hex}`)
  }

  /**
   * Creates a PriceMoveId from an existing string value.
   * Use this for deserialization or testing.
   *
   * @param value - The ID string value
   */
  public static fromString(value: string): PriceMoveId {
    return new PriceMoveId(value)
  }

  public toString(): string {
    return this.value
  }

  public equals(other: PriceMoveId): boolean {
    return this.value === other.value
  }
}