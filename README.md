# Fractal Price Structure

A TypeScript library for building rang-based fractal price structures from candlestick data.

## Overview

This library converts candlestick (OHLCV) data into a hierarchical fractal structure of PriceMoves. Each PriceMove represents a directional price movement (Up or Down) that can extend, transition through a three-state lifecycle (Growing → Reference → Archived), or accumulate nested sub-structures, producing a recursive fractal pattern.

> **Reference**: see [`docs/protocole-construction.md`](docs/protocole-construction.md) for the authoritative construction protocol (states, reference levels, cascade invalidation).

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
const growingMoves = engine.getGrowingMoves();    // currently extendable
const referenceMoves = engine.getReferenceMoves(); // terminated, used as reference levels
const allMoves = engine.getAllMoves();
const layers = engine.getLayers();
const stats = engine.getMemoryStats();

// Point-in-time queries (historical analysis)
const stackAt = engine.getStack(1704067300000);  // All moves active at this timestamp
const moveAt = engine.getMove(0, 1704067300000); // Rang-0 move active at timestamp
```

## Core Concepts

### PriceMove

A PriceMove represents a directional price movement with:

- **Polarity**: `Up` (`"up"`) or `Down` (`"down"`).
- **PriceRange / TimeRange**: low–high price boundaries and start–end timestamps.
- **State**: `Growing` (can still extend) → `Reference` (terminated, used as level for parent invalidation) → `Archived` (no longer relevant for detection — eligible for memory reclamation).
- **Rang**: bottom-up complexity level — higher rang = more nested sub-structures.
- **Degré**: top-down hierarchy position — assigned when the structure terminates.
- **currentReferenceLevel**: dynamic invalidation threshold — opposite bound of the last extending candidate (protocol §3.3).
- **subStructures / parentStructure**: hierarchical relations within the fractal tree.

### Extension & Invalidation (protocol §3)

`PriceMove.processCandidate(candidate)` returns one of:

- **`extended-boundary`** — the candidate's price-to-test (high for Up, low for Down) broke the directional bound; the move grows and `currentReferenceLevel` is reset to the opposite bound of the extending candidate.
- **`extended-internal`** — the candidate fits within the move without breaking either boundary; it is attached as a `subStructure`.
- **`broken`** — the candidate broke the **reference level** (not the global bound); the move transitions Growing → Reference and cascade termination starts (protocol §6).

Engulfing candles (protocol §10) — candidates that break both the directional bound AND the reference level — are detected and handled separately.

### Fractal Layers

Layers are grouped by `rang`:
- **Rang 0**: leaf moves (no growing sub-structure).
- **Rang N+1**: moves whose deepest growing sub-structure is at rang N.

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

// State-based Queries
engine.getGrowingMoves()                    // PriceMove[] that can still extend
engine.getReferenceMoves()                  // PriceMove[] terminated, kept as levels
engine.getArchivedMoves()                   // PriceMove[] historical only
engine.getStructuresByDegre(degre)          // PriceMove[] at a given hierarchy position
engine.getAllMoves()                        // PriceMove[] all states
engine.getLayers()                          // FractalLayer[] by rang
engine.getLayer(level)                      // FractalLayer at specific rang
engine.getLayerCount()                      // number of rang levels
engine.validate()                           // { valid: boolean, errors: string[] }

// Legacy (deprecated)
engine.getActiveMoves()                     // alias for getGrowingMoves()

// Point-in-Time Queries
engine.getStack(timestamp)                  // PriceMove[] active at timestamp
engine.getMove(rang, timestamp)             // PriceMove | undefined

// Debug & Monitoring
engine.formatActiveMoves()                  // human-readable "[Rang N] ..." string
engine.logActiveMoves()                     // logs via configured logger
engine.getMemoryStats()                     // memory usage statistics
engine.logMemoryStats()                     // logs stats via logger

// Memory Management
engine.pruneClosedMoves(beforeTimestamp)             // remove old Reference/Archived moves
engine.archiveOrphanedStructures(beforeTimestamp)    // Reference → Archived for moves with no Growing descendants
engine.clear()                                       // reset to empty state
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
  polarity: Polarity;                // 'up' | 'down'
  state: PriceMoveState;             // 'growing' | 'reference' | 'archived'
  rang: number;                      // bottom-up complexity level
  degre?: number;                    // top-down hierarchy position (set on terminate)
  timeRange: TimeRange;
  priceRange: PriceRange;
  currentReferenceLevel: number;     // dynamic invalidation threshold (protocol §3.3)
  subStructures: PriceMove[];        // nested moves
  parentStructure?: PriceMove;       // parent in the fractal tree
  correction?: PriceMove;            // breaking move that terminated this one
  terminatedAt?: number;             // timestamp when Growing → Reference
  archivedAt?: number;               // timestamp when Reference → Archived
}

interface FractalLayer {
  level: number;   // rang
  moves: PriceMove[];
}
```

## Project Structure

```
fractal-price-structure/
├── packages/
│   ├── core/                       # Main library
│   │   └── src/
│   │       ├── domain/             # PriceMove, Candle, Logger, FractalLayer
│   │       ├── application/
│   │       │   ├── orchestrator/   # PriceMoveStructure (lifecycle service)
│   │       │   ├── ports/          # Hexagonal port interfaces
│   │       │   └── use-cases/      # BuildPriceMovesFromCandles, BuildRecursiveFractal
│   │       ├── infrastructure/     # Adapters, repositories, exporters, logging
│   │       └── FractalEngine.ts    # Main facade
│   └── visualizer/                 # Web visualizer (Vue 3 + Vuetify + Observable Plot)
├── docs/                           # Protocol spec + technical docs
├── CLAUDE.md                       # AI assistant instructions
└── README.md                       # This file
```

## Architecture

The project follows Clean/Hexagonal Architecture:

- **Domain Layer**: Pure business logic (PriceMove, FractalLayer, Logger interface).
- **Application Layer**: PriceMoveStructure orchestrator, hexagonal ports, use cases.
- **Infrastructure Layer**: Repositories, adapters, exporters, ConsoleLogger.

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
