import type { CandleRepository } from "../../domain/candle/CandleRepository.js"
import type { Candle } from "../../domain/candle/Candle.js"

export class FetchCandlesUseCase {
    constructor(private candleRepo: CandleRepository) { }

    async execute(symbol: string, interval: string, limit: number): Promise<Candle[]> {
        return this.candleRepo.getCandles(symbol, interval, limit)
    }
}
