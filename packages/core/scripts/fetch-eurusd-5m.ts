/**
 * Script to fetch EURUSD 5m candles from Yahoo Finance and save as fixture
 * Usage: npx tsx scripts/fetch-eurusd-5m.ts
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR_CORE = path.join(__dirname, '../src/__fixtures__');
const FIXTURES_DIR_VISUALIZER = path.join(__dirname, '../../../packages/visualizer/public/fixtures');

interface YahooQuote {
  open: (number | null)[];
  high: (number | null)[];
  low: (number | null)[];
  close: (number | null)[];
  volume: (number | null)[];
}

interface YahooChartResult {
  timestamp: number[];
  indicators: {
    quote: YahooQuote[];
  };
}

interface YahooChartResponse {
  chart: {
    result: YahooChartResult[];
    error: null | { code: string; description: string };
  };
}

interface Candle {
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

async function fetchEurUsd5m(): Promise<Candle[]> {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/EURUSD=X?interval=5m&range=1d';
  console.log(`Fetching EURUSD 5m from Yahoo Finance...`);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as YahooChartResponse;

  if (data.chart.error) {
    throw new Error(`Yahoo Finance error: ${data.chart.error.description}`);
  }

  const result = data.chart.result[0];
  const timestamps = result.timestamp;
  const quote = result.indicators.quote[0];
  const intervalMs = 5 * 60 * 1000; // 5 minutes in ms

  const candles: Candle[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const open = quote.open[i];
    const high = quote.high[i];
    const low = quote.low[i];
    const close = quote.close[i];

    // Skip candles with null values
    if (open === null || high === null || low === null || close === null) continue;

    candles.push({
      openTime: timestamps[i] * 1000,
      closeTime: timestamps[i] * 1000 + intervalMs - 1,
      open,
      high,
      low,
      close,
      volume: quote.volume[i] ?? 0,
    });
  }

  return candles;
}

async function main(): Promise<void> {
  const candles = await fetchEurUsd5m();
  console.log(`Fetched ${candles.length} candles`);

  const payload = {
    symbol: 'EURUSD',
    interval: '5m',
    fetchedAt: new Date().toISOString(),
    count: candles.length,
    candles,
  };

  const filename = 'eurusd-5m.json';

  // Save to core fixtures
  await fs.mkdir(FIXTURES_DIR_CORE, { recursive: true });
  const corePath = path.join(FIXTURES_DIR_CORE, filename);
  await fs.writeFile(corePath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`Saved to ${corePath}`);

  // Save to visualizer public fixtures
  await fs.mkdir(FIXTURES_DIR_VISUALIZER, { recursive: true });
  const vizPath = path.join(FIXTURES_DIR_VISUALIZER, filename);
  await fs.writeFile(vizPath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`Saved to ${vizPath}`);

  // Show first and last candle for verification
  const first = candles[0];
  const last = candles[candles.length - 1];
  console.log(`\nFirst candle: ${new Date(first.openTime).toISOString()} O=${first.open} H=${first.high} L=${first.low} C=${first.close}`);
  console.log(`Last candle:  ${new Date(last.openTime).toISOString()} O=${last.open} H=${last.high} L=${last.low} C=${last.close}`);
}

main().catch(console.error);
