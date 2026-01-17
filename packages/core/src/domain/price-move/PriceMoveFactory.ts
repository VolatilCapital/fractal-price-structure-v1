import type { Candle } from "../../shared/Candle.js"
import { Polarity } from "./Polarity.js"
import { PriceMove } from "./PriceMove.js"
import { PriceMoveId } from "./PriceMoveId.js"
import { PriceRange } from "../../shared/PriceRange.js"
import { TimeRange } from "../../shared/TimeRange.js"

export class PriceMoveFactory {
  public static fromCandle(candle: Candle): PriceMove {
    const polarity = candle.close >= candle.open ? Polarity.Up : Polarity.Down
    return new PriceMove({
      id: PriceMoveId.create(),
      timeRange: new TimeRange(candle.openTime, candle.closeTime),
      priceRange: new PriceRange(candle.low, candle.high),
      polarity
    })
  }
}