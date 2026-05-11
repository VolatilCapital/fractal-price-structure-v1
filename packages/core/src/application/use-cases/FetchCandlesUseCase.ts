import type { CandleRepository } from "../ports/CandleRepository.js"
import type { Candle } from "../../domain/candle/Candle.js"

export class FetchCandlesUseCase {
  readonly #candleRepo: CandleRepository;

  constructor(candleRepo: CandleRepository) {
    this.#candleRepo = candleRepo;
  }

  async execute(symbol: string, interval: string, limit: number): Promise<Candle[]> {
    return this.#candleRepo.getCandles(symbol, interval, limit)
  }
}
