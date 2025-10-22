import { Candle } from "../../shared/Candle"
import { Polarity } from "./Polarity"
import { PriceMove } from "./PriceMove"
import { PriceMoveId } from "./PriceMoveId"
import { PriceRange } from "../../shared/PriceRange"
import { TimeRange } from "../../shared/TimeRange"

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