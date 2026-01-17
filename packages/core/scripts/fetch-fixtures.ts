/**
 * Script to fetch candle data from Binance and save as fixtures
 * Usage: npx tsx scripts/fetch-fixtures.ts
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BinanceCandleApi } from '../src/infrastructure/api/BinanceCandleApi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, '../src/__fixtures__');

interface FixtureConfig {
  symbol: string;
  interval: string;
  limit: number;
  filename: string;
}

const FIXTURES: FixtureConfig[] = [
  { symbol: 'BTCUSDT', interval: '1d', limit: 1000, filename: 'btcusdt-1d.json' },
];

async function fetchAndSaveFixture(config: FixtureConfig): Promise<void> {
  console.log(`Fetching ${config.symbol} ${config.interval} (${config.limit} candles)...`);

  const candles = await BinanceCandleApi.fetchCandles(
    config.symbol,
    config.interval,
    config.limit
  );

  const fixturePath = path.join(FIXTURES_DIR, config.filename);
  const payload = {
    symbol: config.symbol,
    interval: config.interval,
    fetchedAt: new Date().toISOString(),
    count: candles.length,
    candles,
  };

  await fs.mkdir(FIXTURES_DIR, { recursive: true });
  await fs.writeFile(fixturePath, JSON.stringify(payload, null, 2), 'utf-8');

  console.log(`Saved ${candles.length} candles to ${config.filename}`);
}

async function main(): Promise<void> {
  console.log('Fetching fixtures from Binance...\n');

  for (const config of FIXTURES) {
    await fetchAndSaveFixture(config);
  }

  console.log('\nDone!');
}

main().catch(console.error);
