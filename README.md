# Fractal Price Structure

A TypeScript library for building generation-based fractal price structures from candlestick data.

## Overview

This library converts candlestick (OHLCV) data into a hierarchical fractal structure of PriceMoves. Each PriceMove represents a directional price movement (Up or Down) that can extend, be invalidated, or contain child moves, creating a recursive fractal pattern.

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/fractal-price-structure.git
cd fractal-price-structure

# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test
```

## Quick Start

```typescript
import { FractalEngine, ConsoleLogger } from '@fractal-price-structure/core';

// Create engine with optional logging
const engine = new FractalEngine({
  logger: new ConsoleLogger(),
  deterministic: true  // for reproducible IDs
});

// Define candles
const candles = [
  { openTime: 1704067200000, closeTime: 1704067260000, open: 100, high: 110, low: 95, close: 108, volume: 1000 },
  { openTime: 1704067260000, closeTime: 1704067320000, open: 108, high: 115, low: 105, close: 112, volume: 1200 },
  // ... more candles
];

// Build the fractal structure
engine.buildFromCandles(candles);

// Query the structure
const activeMoves = engine.getActiveMoves();
const allMoves = engine.getAllMoves();
const layers = engine.getLayers();
const stats = engine.getMemoryStats();

// Point-in-time queries (historical analysis)
const stackAt = engine.getStack(1704067300000);  // All moves active at this timestamp
const moveAt = engine.getMove(0, 1704067300000); // Generation 0 move at timestamp
```

## Core Concepts

### PriceMove

A PriceMove represents a directional price movement with:

- **Polarity**: `Up` (close >= open) or `Down` (close < open)
- **PriceRange**: The low-high boundaries of the move
- **TimeRange**: The start-end timestamps of the move
- **Generation**: Depth level in the fractal hierarchy (0 = root)
- **State**: `Active` (can still extend) or `Closed` (invalidated)

### Extension & Invalidation

- **Extension**: A move extends when a new candle breaks its directional boundary (high for Up, low for Down)
- **Invalidation**: A move closes when a candle breaks the opposite boundary
- **Child attachment**: Candles that fit within boundaries without extending or invalidating become child moves

### Fractal Layers

The structure organizes moves by generation:
- **Layer 0**: Root moves (no parent)
- **Layer 1**: Children of root moves
- **Layer N**: N-th level descendants

## API Reference

### FractalEngine

```typescript
// Construction
new FractalEngine({ logger?: Logger, deterministic?: boolean })

// Candle Ingestion
engine.addCandle(candle)                    // throws on error
engine.tryAddCandle(candle)                 // returns CandleResult
engine.buildFromCandles(candles)            // throws on error
engine.tryBuildFromCandles(candles)         // returns BatchIngestionResult

// Structure Queries
engine.getActiveMoves()                     // PriceMove[] sorted by generation
engine.getAllMoves()                        // PriceMove[] including closed
engine.getLayers()                          // FractalLayer[] by generation
engine.getLayer(level)                      // FractalLayer at specific level
engine.getLayerCount()                      // number of generations
engine.validate()                           // { valid: boolean, errors: string[] }

// Point-in-Time Queries
engine.getStack(timestamp)                  // PriceMove[] active at timestamp
engine.getMove(generation, timestamp)       // PriceMove | undefined

// Debug & Monitoring
engine.formatActiveMoves()                  // human-readable string
engine.logActiveMoves()                     // logs via configured logger
engine.getMemoryStats()                     // memory usage statistics
engine.logMemoryStats()                     // logs stats via logger

// Memory Management
engine.pruneClosedMoves(beforeTimestamp)    // remove old closed moves
engine.clear()                              // reset to empty state
```

### Key Types

```typescript
interface Candle {
  openTime: number;    // Unix timestamp (ms)
  closeTime: number;   // Unix timestamp (ms)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PriceMove {
  id: PriceMoveId;
  polarity: Polarity;        // 'Up' | 'Down'
  state: PriceMoveState;     // 'Active' | 'Closed'
  generation: number;
  timeRange: TimeRange;
  priceRange: PriceRange;
  childMoves: PriceMove[];
  englobingMove?: PriceMove;
  closedAt?: number;         // timestamp when closed
}

interface FractalLayer {
  level: number;
  moves: PriceMove[];
}
```

## Project Structure

```
fractal-price-structure/
├── packages/
│   ├── core/                 # Main library
│   │   └── src/
│   │       ├── domain/       # Core entities (PriceMove, Candle)
│   │       ├── application/  # Use cases, ports
│   │       ├── infrastructure/  # Adapters, repositories
│   │       └── FractalEngine.ts # Main facade
│   └── visualizer/           # Debug visualization tools
├── CLAUDE.md                 # AI assistant instructions
└── README.md                 # This file
```

## Architecture

The project follows Clean/Hexagonal Architecture:

- **Domain Layer**: Pure business logic (PriceMove, PriceMoveStructure)
- **Application Layer**: Use cases and port interfaces
- **Infrastructure Layer**: Adapters and external integrations

### Key Rules

- Domain code has no infrastructure dependencies
- All prices use `big.js` for decimal precision
- ESM modules with `.js` extensions in imports
- TypeScript strict mode enabled

## Development

```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint
pnpm lint

# Format
pnpm format
```

## Debug Visualization

```bash
# Run the debug visualizer
pnpm --filter @fractal-price-structure/visualizer dev
```

## License

ISC
