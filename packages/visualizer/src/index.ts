/**
 * @fractal-price-structure/visualizer
 *
 * Debug visualization tools for fractal price structures.
 *
 * ## Display Modes
 *
 * The visualizer supports multiple display modes via `DisplayOptions`:
 *
 * - **compact**: Minimal output (ID, polarity, price range, state)
 * - **standard**: Default view with Rang, Degré, timestamps
 * - **detailed**: Includes currentReferenceLevel for protocol debugging
 * - **protocol**: Full protocol view with all internal state
 *
 * @example
 * ```typescript
 * const visualizer = new DebugVisualizer(engine);
 *
 * // Standard view
 * visualizer.printTree();
 *
 * // Detailed view with reference levels
 * visualizer.printTree(5, { mode: 'detailed' });
 *
 * // Protocol debugging view
 * visualizer.printTree(5, { mode: 'protocol' });
 * ```
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

export const VERSION = '1.1.0';

/**
 * Display mode for move visualization.
 *
 * - `compact`: ID, polarity, price range, state only
 * - `standard`: + Rang, Degré, timestamps
 * - `detailed`: + currentReferenceLevel
 * - `protocol`: + all internal state (subStructures count, etc.)
 */
export type DisplayMode = 'compact' | 'standard' | 'detailed' | 'protocol';

/**
 * Options for controlling display output.
 */
export interface DisplayOptions {
  /** Display mode (default: 'standard') */
  mode?: DisplayMode;
  /** Show timestamps (default: true for standard+) */
  showTime?: boolean;
  /** Show colors (default: true) */
  colors?: boolean;
}

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

/** Default display options */
const DEFAULT_DISPLAY_OPTIONS: Required<DisplayOptions> = {
  mode: 'standard',
  showTime: true,
  colors: true,
};

/**
 * Print move details with configurable display mode.
 *
 * Display modes:
 * - compact: ▲ [100-110] GROWING #abc123
 * - standard: ▲ R0 D0 | up | 100-110 | 12:00→12:01 | GROWING | #abc123
 * - detailed: + ref:105
 * - protocol: + children:3, parent:yes
 */
function printMove(move: PriceMove, indent = 0, options: DisplayOptions = {}): void {
  const opts = { ...DEFAULT_DISPLAY_OPTIONS, ...options };
  const c = opts.colors ? Colors : { reset: '', bright: '', dim: '', red: '', green: '', yellow: '', blue: '', magenta: '', cyan: '', white: '', bgRed: '', bgGreen: '' };

  const prefix = '  '.repeat(indent);
  const color = opts.colors ? getPolarityColor(move.polarity) : '';
  const symbol = getPolaritySymbol(move.polarity);
  const id = move.id.toString().slice(0, 8);

  const stateStr = move.isGrowing()
    ? `${c.green}GROWING${c.reset}`
    : move.isReference()
      ? `${c.yellow}REFERENCE${c.reset}`
      : `${c.dim}ARCHIVED${c.reset}`;

  // Compact mode: minimal info
  if (opts.mode === 'compact') {
    console.log(
      `${prefix}${color}${symbol}${c.reset} ` +
        `[${move.priceRange.low.toFixed(0)}-${move.priceRange.high.toFixed(0)}] ` +
        `${stateStr} ` +
        `${c.dim}#${id}${c.reset}`,
    );
    return;
  }

  // Standard mode: add rang, degre, timestamps
  const degre = move.degre !== undefined ? ` D${move.degre}` : '';
  const timeStr = opts.showTime
    ? ` | ${formatTime(move.timeRange.start)} → ${formatTime(move.timeRange.end)}`
    : '';

  let line =
    `${prefix}${color}${symbol}${c.reset} ` +
    `R${c.yellow}${move.rang}${c.reset}${degre} | ` +
    `${color}${move.polarity.padEnd(4)}${c.reset} | ` +
    `${formatPrice(move.priceRange.low)} - ${formatPrice(move.priceRange.high)}` +
    `${timeStr} | ` +
    `${stateStr} | ` +
    `${c.dim}#${id}${c.reset}`;

  // Detailed mode: add reference level
  if (opts.mode === 'detailed' || opts.mode === 'protocol') {
    const refLevel = move.currentReferenceLevel;
    const refColor = move.polarity === Polarity.Up ? c.red : c.green;
    line += ` | ${c.cyan}ref:${refColor}${refLevel.toFixed(0)}${c.reset}`;
  }

  // Protocol mode: add children count and parent info
  if (opts.mode === 'protocol') {
    const childCount = move.subStructures.length;
    const hasParent = move.parentStructure !== undefined;
    line += ` | ${c.dim}children:${childCount}, parent:${hasParent ? 'yes' : 'no'}${c.reset}`;
  }

  console.log(line);
}

/**
 * Print move tree recursively with display options.
 */
function printMoveTree(move: PriceMove, indent = 0, maxDepth = 5, options: DisplayOptions = {}): void {
  if (indent > maxDepth) {
    console.log(`${'  '.repeat(indent) + Colors.dim}...${Colors.reset}`);
    return;
  }

  printMove(move, indent, options);

  for (const child of move.subStructures) {
    printMoveTree(child, indent + 1, maxDepth, options);
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
  printActiveMoves(options: DisplayOptions = {}): void {
    printHeader('ACTIVE MOVES');
    const moves = this.engine.getActiveMoves();

    if (moves.length === 0) {
      console.log(`  ${Colors.dim}No active moves${Colors.reset}`);
      return;
    }

    for (const move of moves) {
      printMove(move, 1, options);
    }
  }

  /**
   * Print moves organized by layer
   */
  printLayers(options: DisplayOptions = {}): void {
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
        printMove(move, 1, options);
      }
    }
  }

  /**
   * Print the move tree from roots
   *
   * @param maxDepth - Maximum tree depth to display (default: 5)
   * @param options - Display options (mode: 'compact'|'standard'|'detailed'|'protocol')
   */
  printTree(maxDepth = 5, options: DisplayOptions = {}): void {
    printHeader('MOVE TREE');
    const allMoves = this.engine.getAllMoves();
    const roots = allMoves.filter((m) => !m.parentStructure);

    if (roots.length === 0) {
      console.log(`  ${Colors.dim}No moves${Colors.reset}`);
      return;
    }

    console.log(`  ${Colors.dim}Showing tree from ${roots.length} root move(s)${Colors.reset}`);
    console.log();

    for (const root of roots) {
      printMoveTree(root, 1, maxDepth, options);
      console.log();
    }
  }

  /**
   * Print state at a specific timestamp
   */
  printStateAt(timestamp: number, options: DisplayOptions = {}): void {
    printHeader(`STATE AT ${new Date(timestamp).toISOString()}`);
    const stack = this.engine.getStack(timestamp);

    if (stack.length === 0) {
      console.log(`  ${Colors.dim}No moves active at this timestamp${Colors.reset}`);
      return;
    }

    console.log(`  ${Colors.bright}${stack.length}${Colors.reset} moves active:`);
    console.log();

    for (const move of stack) {
      printMove(move, 1, options);
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
  printAll(options: DisplayOptions = {}): void {
    this.printStats();
    this.printActiveMoves(options);
    this.printLayers(options);
    this.printTree(5, options);
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

  // Print stats and validation
  visualizer.printStats();
  visualizer.printValidation();

  // Demonstrate display modes
  console.log(`\n${Colors.bright}${Colors.cyan}Display Mode Examples:${Colors.reset}`);

  console.log(`\n${Colors.yellow}Compact mode:${Colors.reset}`);
  visualizer.printTree(3, { mode: 'compact' });

  console.log(`\n${Colors.yellow}Standard mode (default):${Colors.reset}`);
  visualizer.printTree(3, { mode: 'standard' });

  console.log(`\n${Colors.yellow}Detailed mode (with reference level):${Colors.reset}`);
  visualizer.printTree(3, { mode: 'detailed' });

  console.log(`\n${Colors.yellow}Protocol mode (full internal state):${Colors.reset}`);
  visualizer.printTree(3, { mode: 'protocol' });

  // Show point-in-time query example
  const midTime = candles[25].openTime;
  visualizer.printStateAt(midTime, { mode: 'detailed' });

  console.log();
  printSeparator('═');
  console.log(
    `${Colors.dim}  Visualization complete. ${candles.length} candles processed.${Colors.reset}`,
  );
  printSeparator('═');
}
