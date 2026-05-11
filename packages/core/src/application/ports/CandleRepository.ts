import type { Candle } from "../../domain/candle/Candle.js"

export interface CandleRepository {
    getCandles(symbol: string, interval: string, limit: number): Promise<Candle[]>
}
