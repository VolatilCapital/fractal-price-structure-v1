/**
 * @fractal-price-structure/visualizer
 *
 * Debug visualization tools for fractal price structures.
 *
 * @packageDocumentation
 */

import {
  type Candle,
  ConsoleLogger,
  FractalEngine,
  Polarity,
  type PriceMove,
} from '@fractal-price-structure/core';

export const VERSION = '1.0.0';

/**
 * ANSI color codes for terminal output
 */
const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
} as const;

/**
 * Format a timestamp as readable date/time
 */
function formatTime(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(11, 19);
}

/**
 * Format a price with 2 decimal places
 */
function formatPrice(price: number): string {
  return price.toFixed(2).padStart(10);
}

/**
 * Get color for polarity
 */
function getPolarityColor(polarity: Polarity): string {
  return polarity === Polarity.Up ? Colors.green : Colors.red;
}

/**
 * Get symbol for polarity
 */
function getPolaritySymbol(polarity: Polarity): string {
  return polarity === Polarity.Up ? '▲' : '▼';
}

/**
 * Print a horizontal separator
 */
function printSeparator(char = '─', length = 80): void {
  console.log(Colors.dim + char.repeat(length) + Colors.reset);
}

/**
 * Print a section header
 */
function printHeader(title: string): void {
  console.log();
  printSeparator('═');
  console.log(`${Colors.bright}${Colors.cyan} ${title} ${Colors.reset}`);
  printSeparator('═');
}

/**
 * Print move details in a compact format
 */
function printMove(move: PriceMove, indent = 0): void {
  const prefix = '  '.repeat(indent);
  const color = getPolarityColor(move.polarity);
  const symbol = getPolaritySymbol(move.polarity);
  const state = move.isActive()
    ? `${Colors.green}ACTIVE${Colors.reset}`
    : `${Colors.dim}CLOSED${Colors.reset}`;
  const id = move.id.toString().slice(0, 8);

  console.log(
    `${prefix}${color}${symbol}${Colors.reset} ` +
      `Gen ${Colors.yellow}${move.generation}${Colors.reset} | ` +
      `${color}${move.polarity.padEnd(4)}${Colors.reset} | ` +
      `${formatPrice(move.priceRange.low)} - ${formatPrice(move.priceRange.high)} | ` +
      `${formatTime(move.timeRange.start)} → ${formatTime(move.timeRange.end)} | ` +
      `${state} | ` +
      `${Colors.dim}${id}${Colors.reset}`,
  );
}

/**
 * Print move tree recursively
 */
function printMoveTree(move: PriceMove, indent = 0, maxDepth = 5): void {
  if (indent > maxDepth) {
    console.log(`${'  '.repeat(indent) + Colors.dim}...${Colors.reset}`);
    return;
  }

  printMove(move, indent);

  for (const child of move.childMoves) {
    printMoveTree(child, indent + 1, maxDepth);
  }
}

/**
 * Debug visualizer for FractalEngine
 */
export class DebugVisualizer {
  private engine: FractalEngine;

  constructor(engine?: FractalEngine) {
    this.engine =
      engine ??
      new FractalEngine({
        logger: new ConsoleLogger(),
        deterministic: true,
      });
  }

  /**
   * Get the underlying engine
   */
  getEngine(): FractalEngine {
    return this.engine;
  }

  /**
   * Load candles into the engine
   */
  loadCandles(candles: Candle[]): void {
    this.engine.clear();
    this.engine.buildFromCandles(candles);
  }

  /**
   * Print summary statistics
   */
  printStats(): void {
    printHeader('STRUCTURE STATISTICS');
    const stats = this.engine.getMemoryStats();

    console.log(`  Total Moves:      ${Colors.bright}${stats.totalMoves}${Colors.reset}`);
    console.log(`  Active Moves:     ${Colors.green}${stats.activeMoves}${Colors.reset}`);
    console.log(`  Closed Moves:     ${Colors.red}${stats.closedMoves}${Colors.reset}`);
    console.log(`  Layer Count:      ${Colors.yellow}${stats.layerCount}${Colors.reset}`);
    console.log(`  With Children:    ${stats.movesWithChildren}`);
    console.log(`  With Parent:      ${stats.movesWithParent}`);
    console.log(`  Max Child Count:  ${stats.maxChildCount}`);
  }

  /**
   * Print all active moves
   */
  printActiveMoves(): void {
    printHeader('ACTIVE MOVES');
    const moves = this.engine.getActiveMoves();

    if (moves.length === 0) {
      console.log(`  ${Colors.dim}No active moves${Colors.reset}`);
      return;
    }

    for (const move of moves) {
      printMove(move);
    }
  }

  /**
   * Print moves organized by layer
   */
  printLayers(): void {
    printHeader('FRACTAL LAYERS');
    const layers = this.engine.getLayers();

    if (layers.length === 0) {
      console.log(`  ${Colors.dim}No layers${Colors.reset}`);
      return;
    }

    for (const layer of layers) {
      console.log();
      console.log(
        `${Colors.bright}${Colors.yellow}  Layer ${layer.level}${Colors.reset} (${layer.moves.length} moves)`,
      );
      printSeparator('─', 76);

      for (const move of layer.moves) {
        printMove(move, 1);
      }
    }
  }

  /**
   * Print the move tree from roots
   */
  printTree(maxDepth = 5): void {
    printHeader('MOVE TREE');
    const allMoves = this.engine.getAllMoves();
    const roots = allMoves.filter((m) => !m.englobingMove);

    if (roots.length === 0) {
      console.log(`  ${Colors.dim}No moves${Colors.reset}`);
      return;
    }

    console.log(`  ${Colors.dim}Showing tree from ${roots.length} root move(s)${Colors.reset}`);
    console.log();

    for (const root of roots) {
      printMoveTree(root, 1, maxDepth);
      console.log();
    }
  }

  /**
   * Print state at a specific timestamp
   */
  printStateAt(timestamp: number): void {
    printHeader(`STATE AT ${new Date(timestamp).toISOString()}`);
    const stack = this.engine.getStack(timestamp);

    if (stack.length === 0) {
      console.log(`  ${Colors.dim}No moves active at this timestamp${Colors.reset}`);
      return;
    }

    console.log(`  ${Colors.bright}${stack.length}${Colors.reset} moves active:`);
    console.log();

    for (const move of stack) {
      printMove(move, 1);
    }
  }

  /**
   * Validate structure and print results
   */
  printValidation(): void {
    printHeader('STRUCTURE VALIDATION');
    const result = this.engine.validate();

    if (result.valid) {
      console.log(`  ${Colors.green}✓ Structure is valid${Colors.reset}`);
    } else {
      console.log(`  ${Colors.red}✗ Structure has ${result.errors.length} error(s)${Colors.reset}`);
      for (const error of result.errors) {
        console.log(`    ${Colors.red}•${Colors.reset} ${error}`);
      }
    }
  }

  /**
   * Print complete debug output
   */
  printAll(): void {
    this.printStats();
    this.printActiveMoves();
    this.printLayers();
    this.printTree();
    this.printValidation();
  }
}

/**
 * Generate sample candles for testing
 */
export function generateSampleCandles(count: number, basePrice = 100, volatility = 5): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice;
  const baseTime = Date.now() - count * 60000;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * volatility * 2;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;

    candles.push({
      openTime: baseTime + i * 60000,
      closeTime: baseTime + (i + 1) * 60000,
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 10000) + 1000,
    });

    price = close;
  }

  return candles;
}

// Main execution when run directly
if (process.argv[1]?.includes('visualizer')) {
  console.log(`${Colors.bright}${Colors.magenta}`);
  console.log('  ╔═══════════════════════════════════════════════════════════╗');
  console.log('  ║       FRACTAL PRICE STRUCTURE - DEBUG VISUALIZER         ║');
  console.log('  ╚═══════════════════════════════════════════════════════════╝');
  console.log(Colors.reset);

  // Generate sample data
  const candles = generateSampleCandles(50);

  // Create visualizer and load data
  const visualizer = new DebugVisualizer();
  visualizer.loadCandles(candles);

  // Print all debug info
  visualizer.printAll();

  // Show point-in-time query example
  const midTime = candles[25].openTime;
  visualizer.printStateAt(midTime);

  console.log();
  printSeparator('═');
  console.log(
    `${Colors.dim}  Visualization complete. ${candles.length} candles processed.${Colors.reset}`,
  );
  printSeparator('═');
}
