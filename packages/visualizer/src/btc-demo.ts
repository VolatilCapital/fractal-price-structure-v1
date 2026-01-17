/**
 * Demo: Visualize BTC/USDT 1D fractal structure
 * Usage: npx tsx packages/visualizer/src/btc-demo.ts
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DebugVisualizer } from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Load BTC 1D fixtures
  const fixturePath = path.join(__dirname, '../../core/src/__fixtures__/btcusdt-1d.json');
  const content = await fs.readFile(fixturePath, 'utf-8');
  const { candles } = JSON.parse(content);

  console.log('\x1b[1m\x1b[35m');
  console.log('  ╔═══════════════════════════════════════════════════════════╗');
  console.log('  ║         BTC/USDT 1D - FRACTAL STRUCTURE DEMO             ║');
  console.log('  ╚═══════════════════════════════════════════════════════════╝');
  console.log('\x1b[0m');

  // Create visualizer without logger (cleaner output)
  const { FractalEngine } = await import('@fractal-price-structure/core');
  const engine = new FractalEngine({ deterministic: true });
  const visualizer = new DebugVisualizer(engine);

  console.log(`Loading ${candles.length} candles...`);
  visualizer.loadCandles(candles);

  // Show stats and structure
  visualizer.printStats();
  visualizer.printActiveMoves();
  visualizer.printTree(3); // Limit depth to 3 for readability
  visualizer.printValidation();

  console.log('\n\x1b[2m════════════════════════════════════════════════════════════════════════════════\x1b[0m');
  console.log(`\x1b[2m  Done. ${candles.length} candles processed.\x1b[0m`);
  console.log('\x1b[2m════════════════════════════════════════════════════════════════════════════════\x1b[0m');
}

main().catch(console.error);
