import fs from 'node:fs/promises';
import path from 'node:path';
import { DateTime } from 'luxon';
import type { Candle } from '../../domain/candle/Candle.js';
import type { CandleRepository } from '../../domain/candle/CandleRepository.js';
import { BinanceCandleApi } from '../api/BinanceCandleApi.js';

export class CachedCandleRepository implements CandleRepository {
  readonly #cacheDir: string;

  constructor(cacheDir: string) {
    this.#cacheDir = cacheDir;
  }

  async getCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
    const cachePath = path.join(this.#cacheDir, `${symbol}-${interval}.json`);
    const today = DateTime.utc().toISODate();

    try {
      const content = await fs.readFile(cachePath, 'utf-8');
      const { date, candles } = JSON.parse(content);
      if (date === today) {
        return candles;
      }
    } catch {
      // Ignore cache miss or read error
    }

    const candles = await BinanceCandleApi.fetchCandles(symbol, interval, limit);
    const payload = {
      date: today,
      candles,
    };

    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(payload, null, 2), 'utf-8');
    return candles;
  }
}
