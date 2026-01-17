import { randomUUID } from "crypto"
export class PriceMoveId {
  constructor(private readonly value: string) {}
  public static create(): PriceMoveId {
    return new PriceMoveId(randomUUID())
  }
  public toString(): string {
    return this.value
  }
}