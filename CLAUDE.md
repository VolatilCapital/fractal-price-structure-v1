# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fractal Price Structure is a TypeScript monorepo that generates fractal price structures from candlestick data. It converts candles into PriceMoves and builds recursive fractal layers representing nested price movements with generation tracking.

## Quick Start

```typescript
import { FractalEngine, ConsoleLogger } from '@fractal-price-structure/core';

// Create engine with optional logging
const engine = new FractalEngine({
  logger: new ConsoleLogger(),
  deterministic: true  // for reproducible IDs
});

// Add candles
engine.buildFromCandles(candles);

// Query the structure
const activeMoves = engine.getActiveMoves();
const layers = engine.getLayers();
const stats = engine.getMemoryStats();
```

## Commands (pnpm monorepo)

- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm lint` - Run linting
- `pnpm format` - Format code

## Packages

- `packages/core` - Core library with FractalEngine facade
- `packages/visualizer` - (future) Visualization tools

## Architecture

The project follows a clean/hexagonal architecture pattern:

### Domain Layer (`src/domain/`)
- **PriceMove** - Core entity representing a directional price movement with polarity (Up/Down), time range, price range, and hierarchical relationships (childMoves, englobingMove)
- **PriceMoveStructure** - Manages active PriceMoves and handles their lifecycle (extension, invalidation, englobment)
- **FractalLayer** - Represents a level in the fractal hierarchy (level 0 = candles, level 1+ = aggregated PriceMoves)

### Application Layer (`src/application/use-cases/`)
- **BuildPriceMovesFromCandles** - Converts raw candles into PriceMoves and adds them to the structure
- **BuildRecursiveFractal** - Builds fractal layers by traversing the PriceMove tree from roots

### Infrastructure Layer (`src/infrastructure/`)
- **BinanceCandleApi** - Fetches klines from Binance REST API
- **CachedCandleRepository** - Caches candle data locally in `.cache/` directory
- **InMemoryPriceMoveRepository** - In-memory storage for PriceMoves
- **PriceMoveTreeFilePrinter** / **FractalLayerExporter** - Export results to `.logs/` directory

### Key Concepts

**PriceMove Extension Logic** (`PriceMove.tryExtendWith`):
- A move can be extended if a candidate breaks its directional boundary (high for Up, low for Down)
- A move is invalidated/closed if the candidate breaks the opposite boundary
- Internal children are moves that fit within the parent's price/time range without extending or invalidating

**Fractal Layers**: Built recursively from root PriceMoves (those without an englobingMove), collecting childMoves at each depth level.

## Public API

### FractalEngine (Main Entry Point)
```typescript
// Construction
new FractalEngine({ logger?: Logger, deterministic?: boolean })

// Candle Ingestion
engine.addCandle(candle)                    // throws on error
engine.tryAddCandle(candle)                 // returns CandleResult
engine.buildFromCandles(candles)            // throws on error
engine.tryBuildFromCandles(candles)         // returns BatchIngestionResult

// Queries
engine.getActiveMoves()                     // PriceMove[] sorted by generation
engine.getAllMoves()                        // PriceMove[] including closed
engine.getLayers()                          // FractalLayer[] by generation
engine.getLayer(level)                      // FractalLayer at specific level
engine.getLayerCount()                      // number of generations
engine.validate()                           // { valid: boolean, errors: string[] }

// Point-in-Time Queries (historical analysis)
engine.getStack(timestamp)                  // PriceMove[] active at timestamp
engine.getMove(generation, timestamp)       // PriceMove | undefined at gen+time

// Debug
engine.formatActiveMoves()                  // human-readable string
engine.logActiveMoves()                     // logs via configured logger
engine.getMemoryStats()                     // memory usage statistics
engine.logMemoryStats()                     // logs stats via logger

// Memory Management
engine.pruneClosedMoves(beforeTimestamp)    // remove old closed moves
engine.clear()                              // reset to empty state
```

### Key Types
- `Candle` - Input: { openTime, closeTime, open, high, low, close, volume }
- `PriceMove` - Output: polarity, priceRange, timeRange, state, generation, childMoves, closedAt?
- `FractalLayer` - { level: number, moves: PriceMove[] }
- `Logger` - { debug, info, warn, error } interface

### Point-in-Time Query Example
```typescript
// Build structure from historical candles
engine.buildFromCandles(candles);

// Query what the structure looked like at a specific moment
const timestamp = 1704067500000; // Unix ms
const stackAtTime = engine.getStack(timestamp);
const gen0MoveAtTime = engine.getMove(0, timestamp);

// A move was active at T if it started before T and wasn't closed yet
// move.wasActiveAt(timestamp) helper available on PriceMove
```

## TypeScript Configuration

- ES Modules with NodeNext resolution (requires `.js` extension in imports)
- Strict mode enabled
- Output to `dist/` with declaration files

## MCP Servers

Two MCP servers are available for enhanced capabilities:

### Context7 - Documentation Lookup
Use Context7 to fetch up-to-date documentation for any library:
```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

### Playwright - Browser Automation
Use Playwright MCP for browser automation and testing:
```bash
claude mcp add playwright npx @playwright/mcp@latest
```
