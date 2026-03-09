import { FractalEngine } from '../src/index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const candlesData = JSON.parse(readFileSync(join(__dirname, '../src/__fixtures__/btcusdt-1d.json'), 'utf-8'));
const candles = candlesData.candles || [];

const engine = new FractalEngine({ deterministic: true });
engine.buildFromCandles(candles.slice(0, 100));

const stats = engine.getMemoryStats();
console.log('Stats:', JSON.stringify(stats, null, 2));

const allMoves = engine.getAllMoves();
const rangDistribution: Record<number, number> = {};
for (const m of allMoves) {
  rangDistribution[m.rang] = (rangDistribution[m.rang] || 0) + 1;
}
console.log('Rang distribution:', rangDistribution);
console.log('Max rang:', Math.max(...allMoves.map(m => m.rang)));

// Show some moves with their rang
console.log('\nSample moves with rang > 0:');
const movesWithRang = allMoves.filter(m => m.rang > 0).slice(0, 5);
for (const m of movesWithRang) {
  console.log(`  Rang ${m.rang}: ${m.polarity} [${m.priceRange.low.toFixed(2)}-${m.priceRange.high.toFixed(2)}] - ${m.subStructures.length} children`);
}
