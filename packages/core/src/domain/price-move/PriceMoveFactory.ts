import type { Candle } from "../candle/Candle.js"
import { Polarity } from "./Polarity.js"
import { PriceMove } from "./PriceMove.js"
import { PriceMoveId } from "./PriceMoveId.js"
import { PriceRange } from "../../shared/PriceRange.js"
import { TimeRange } from "../../shared/TimeRange.js"
import { Price } from "../../shared/Price.js"

export class PriceMoveFactory {
  /**
   * Creates a PriceMove from a candle with a random UUID.
   * This is the default for production use.
   */
  public static fromCandle(candle: Candle): PriceMove {
    const polarity = Price.gte(candle.close, candle.open) ? Polarity.Up : Polarity.Down
    return new PriceMove({
      id: PriceMoveId.create(),
      timeRange: new TimeRange(candle.openTime, candle.closeTime),
      priceRange: new PriceRange(candle.low, candle.high),
      polarity,
    })
  }

  /**
   * Creates a PriceMove from a candle with a deterministic ID based on index.
   * Use this for testing and reproducibility scenarios.
   *
   * @param candle - The candle data
   * @param index - The index to use for generating a deterministic ID
   */
  public static fromCandleWithIndex(candle: Candle, index: number): PriceMove {
    const polarity = Price.gte(candle.close, candle.open) ? Polarity.Up : Polarity.Down
    return new PriceMove({
      id: PriceMoveId.fromIndex(index),
      timeRange: new TimeRange(candle.openTime, candle.closeTime),
      priceRange: new PriceRange(candle.low, candle.high),
      polarity,
    })
  }
}