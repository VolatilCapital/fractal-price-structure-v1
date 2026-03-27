/**
 * Script to fetch EURUSD 5m candles from Dukascopy and save as fixture
 * Usage: npx tsx scripts/fetch-dukascopy.ts
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getHistoricalRates } from 'dukascopy-node';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR_CORE = path.join(__dirname, '../src/__fixtures__');
const FIXTURES_DIR_VISUALIZER = path.join(__dirname, '../../../packages/visualizer/public/fixtures');

interface Candle {
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

async function fetchEurUsd5m(from: string, to: string): Promise<Candle[]> {
  console.log(`Fetching EURUSD 5m from Dukascopy (${from} → ${to})...`);

  const data = await getHistoricalRates({
    instrument: 'eurusd',
    dates: { from, to },
    timeframe: 'm5',
    format: 'json',
    batchSize: 10,
    pauseBetweenBatchesMs: 500,
  });

  const intervalMs = 5 * 60 * 1000;

  return data.map((c) => ({
    openTime: c.timestamp,
    closeTime: c.timestamp + intervalMs - 1,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume ?? 0,
  }));
}

async function saveFixture(candles: Candle[], from: string): Promise<void> {
  const payload = {
    symbol: 'EURUSD',
    interval: '5m',
    source: 'dukascopy',
    fetchedAt: new Date().toISOString(),
    count: candles.length,
    candles,
  };

  const filename = 'eurusd-5m.json';

  await fs.mkdir(FIXTURES_DIR_CORE, { recursive: true });
  const corePath = path.join(FIXTURES_DIR_CORE, filename);
  await fs.writeFile(corePath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`Saved to ${corePath}`);

  await fs.mkdir(FIXTURES_DIR_VISUALIZER, { recursive: true });
  const vizPath = path.join(FIXTURES_DIR_VISUALIZER, filename);
  await fs.writeFile(vizPath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`Saved to ${vizPath}`);

  const first = candles[0];
  const last = candles[candles.length - 1];
  console.log(`\nFirst: ${new Date(first.openTime).toISOString()} O=${first.open} H=${first.high} L=${first.low} C=${first.close}`);
  console.log(`Last:  ${new Date(last.openTime).toISOString()} O=${last.open} H=${last.high} L=${last.low} C=${last.close}`);
}

async function main(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const from = process.argv[2] ?? today;
  const to = process.argv[3] ?? tomorrow;

  const candles = await fetchEurUsd5m(from, to);
  console.log(`Fetched ${candles.length} candles`);

  if (candles.length === 0) {
    console.error('No candles returned');
    process.exit(1);
  }

  await saveFixture(candles, from);
  console.log('\nDone!');
}

main().catch(console.error);
