import type { Candle } from "./Candle.js"

export interface CandleRepository {
    getCandles(symbol: string, interval: string, limit: number): Promise<Candle[]>
}
