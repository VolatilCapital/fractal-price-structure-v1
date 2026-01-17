/**
 * Example: Build and visualize a fractal price structure from BTC/USDT daily candles
 *
 * Usage: npx tsx examples/visualize-fractal.ts
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FractalEngine } from '../src/index.js';
import type { Candle } from '../src/index.js';
import type { PriceMove } from '../src/domain/price-move/PriceMove.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load fixtures
async function loadFixtures(): Promise<Candle[]> {
  const fixturePath = path.join(__dirname, '../src/__fixtures__/btcusdt-1d.json');
  const content = await fs.readFile(fixturePath, 'utf-8');
  const data = JSON.parse(content);
  return data.candles;
}

// Format price with thousands separator
function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// Format date from timestamp
function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

// Calculate move duration in days
function getDurationDays(move: PriceMove): number {
  const ms = move.timeRange.end - move.timeRange.start;
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// Print a move with tree indentation
function printMoveTree(move: PriceMove, indent = 0): void {
  const prefix = '  '.repeat(indent);
  const arrow = move.polarity === 'Up' ? '\x1b[32m\u2191\x1b[0m' : '\x1b[31m\u2193\x1b[0m';
  const priceChange = move.priceRange.high - move.priceRange.low;
  const duration = getDurationDays(move);

  console.log(
    `${prefix}${arrow} Gen${move.generation} | ` +
    `$${formatPrice(move.priceRange.low)} - $${formatPrice(move.priceRange.high)} ` +
    `(+$${formatPrice(priceChange)}) | ` +
    `${formatDate(move.timeRange.start)} to ${formatDate(move.timeRange.end)} ` +
    `(${duration}d) | ` +
    `${move.childMoves.length} children`
  );

  for (const child of move.childMoves) {
    printMoveTree(child, indent + 1);
  }
}

async function main(): Promise<void> {
  console.log('\n========================================');
  console.log('  FRACTAL PRICE STRUCTURE VISUALIZER');
  console.log('========================================\n');

  // Load fixtures
  console.log('Loading BTC/USDT 1D fixtures...');
  const candles = await loadFixtures();
  console.log(`Loaded ${candles.length} candles\n`);

  // Build fractal structure (no logger for cleaner output)
  console.log('Building fractal structure...');
  const engine = new FractalEngine({
    deterministic: true,
  });

  engine.buildFromCandles(candles);
  console.log('Done!');

  // Display stats
  const stats = engine.getMemoryStats();
  console.log('\n----------------------------------------');
  console.log('STRUCTURE STATISTICS');
  console.log('----------------------------------------');
  console.log(`Total moves:       ${stats.totalMoves}`);
  console.log(`Active moves:      ${stats.activeMoves}`);
  console.log(`Closed moves:      ${stats.closedMoves}`);
  console.log(`Fractal layers:    ${stats.layerCount}`);
  console.log(`Moves with parent: ${stats.movesWithParent}`);
  console.log(`Max children:      ${stats.maxChildCount}`);

  // Display layers summary
  const layers = engine.getLayers();
  console.log('\n----------------------------------------');
  console.log('LAYERS SUMMARY');
  console.log('----------------------------------------');
  for (const layer of layers) {
    const upMoves = layer.moves.filter(m => m.polarity === 'Up').length;
    const downMoves = layer.moves.filter(m => m.polarity === 'Down').length;
    console.log(
      `Layer ${layer.level}: ${layer.moves.length} moves ` +
      `(\x1b[32m${upMoves}\u2191\x1b[0m / \x1b[31m${downMoves}\u2193\x1b[0m)`
    );
  }

  // Display active moves stack
  console.log('\n----------------------------------------');
  console.log('ACTIVE MOVES STACK (Current State)');
  console.log('----------------------------------------');
  const activeMoves = engine.getActiveMoves();
  for (const move of activeMoves) {
    const arrow = move.polarity === 'Up' ? '\x1b[32m\u2191\x1b[0m' : '\x1b[31m\u2193\x1b[0m';
    const duration = getDurationDays(move);
    console.log(
      `  Gen${move.generation} ${arrow} $${formatPrice(move.priceRange.low)} - ` +
      `$${formatPrice(move.priceRange.high)} (${duration} days)`
    );
  }

  // Display root moves tree (limited for readability)
  console.log('\n----------------------------------------');
  console.log('ROOT MOVES TREE (First 3 roots)');
  console.log('----------------------------------------');
  const rootMoves = engine.getAllMoves().filter(m => !m.englobingMove);
  const displayRoots = rootMoves.slice(0, 3);

  for (const root of displayRoots) {
    printMoveTree(root);
    console.log('');
  }

  if (rootMoves.length > 3) {
    console.log(`... and ${rootMoves.length - 3} more root moves`);
  }

  // Validate structure
  console.log('\n----------------------------------------');
  console.log('STRUCTURE VALIDATION');
  console.log('----------------------------------------');
  const validation = engine.validate();
  if (validation.valid) {
    console.log('\x1b[32mStructure is valid!\x1b[0m');
  } else {
    console.log('\x1b[31mStructure has errors:\x1b[0m');
    for (const error of validation.errors) {
      console.log(`  - ${error}`);
    }
  }

  console.log('\n========================================\n');
}

main().catch(console.error);
