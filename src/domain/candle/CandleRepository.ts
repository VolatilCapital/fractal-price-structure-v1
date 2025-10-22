import { Candle } from "./Candle"

export interface CandleRepository {
    getCandles(symbol: string, interval: string, limit: number): Promise<Candle[]>
}
