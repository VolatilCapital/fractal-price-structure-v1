import { PriceMove } from "../../domain/price-move/PriceMove.js"

export class PriceMoveLogger {
  public static logNewMove(move: PriceMove): void {
    console.log(`[New] ${move.id.toString()} | ${move.polarity} | ${move.priceRange.toString()} | ${move.timeRange.toString()}`)
  }

  public static logClosure(move: PriceMove): void {
    console.log(`[Closed] ${move.id.toString()} | Final range: ${move.priceRange.toString()}`)
  }
}