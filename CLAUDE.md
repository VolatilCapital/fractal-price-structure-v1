# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fractal Price Structure is a TypeScript monorepo that generates fractal price structures from candlestick data. It converts candles into PriceMoves and builds recursive fractal layers representing nested price movements with generation tracking.

> **Technical Reference**: See [docs/protocole-construction.md](docs/protocole-construction.md) for the authoritative specification of fractal construction rules, including the three structure states (Growing/Reference/Archived), reference levels, and cascade invalidation.

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
const growingMoves = engine.getGrowingMoves();
const layers = engine.getLayers();
const stats = engine.getMemoryStats();
```

## Commands (pnpm monorepo)

- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm lint` - Run linting
- `pnpm format` - Format code
- `pnpm visualizer:dev` - Launch web visualizer (Vue.js + Observable Plot)
- `pnpm visualizer:build` - Build web visualizer for production

## Packages

- `packages/core` - Core library with FractalEngine facade
- `packages/visualizer` - Visualization tools (web app + terminal debug)

## Architecture

The project follows a clean/hexagonal architecture pattern. All source lives under
`packages/core/src/` (and `packages/visualizer/src/` for the UI):

### Domain Layer (`packages/core/src/domain/`)
- **PriceMove** (`domain/price-move/`) - Core entity representing a directional price movement with polarity (Up/Down), time range, price range, state (Growing/Reference/Archived), `rang`, `degre`, `currentReferenceLevel`, and hierarchical relationships via `subStructures` / `parentStructure`.
- **FractalLayer** (`domain/structure/`) - Represents a level in the fractal hierarchy, grouped by `rang`.
- **Candle**, **Logger** - cross-cutting domain types.

### Application Layer (`packages/core/src/application/`)
- **PriceMoveStructure** (`application/orchestrator/`) - Domain service that owns the lifecycle of PriceMoves (extension, invalidation, engulfing handling, cascade termination).
- **Ports** (`application/ports/`) - Hexagonal ports such as `PriceMoveRepository`, `CandleRepository`.
- **Use Cases** (`application/use-cases/`)
  - **BuildPriceMovesFromCandles** - Converts raw candles into PriceMoves and adds them to the structure.
  - **BuildRecursiveFractal** (`buildRecursiveFractalRoots`) - Builds fractal layers by traversing the PriceMove tree from roots.
  - **FractalPriceMoveBuilder** - Builds higher-rang layers from a list of moves.

### Infrastructure Layer (`packages/core/src/infrastructure/`)
- **BinanceCandleApi**, **CachedCandleRepository** (`repositories/`) - Candle ingestion + on-disk cache (`.cache/`).
- **InMemoryPriceMoveRepository** (`repositories/`) - In-memory storage for PriceMoves.
- **PriceMoveTreeFilePrinter** / **PriceMoveExporter** / **FractalLayerExporter** (`adapters/`, `exporters/`) - Export results to `.logs/`.
- **ConsoleLogger** (`logging/`) - Default Logger implementation.

### Key Concepts

**PriceMove Extension Logic** (`PriceMove.processCandidate`):
- Returns one of `'extended-boundary' | 'extended-internal' | 'broken'` (see protocol §3.1–3.3).
- A move is extended (boundary) if a candidate's *priceToTest* (high for Up, low for Down) breaks its directional boundary — `priceRange` and `timeRange` grow, and `currentReferenceLevel` is reset to the opposite bound of the extending candidate.
- A move is invalidated (`'broken'`) if the candidate breaks the **reference level** (`currentReferenceLevel`), not the global priceRange. This is the dynamic invalidation rule of protocol §3.2.
- A move stays untouched (`'extended-internal'`) if neither boundary nor reference is broken — the candidate becomes a `subStructure`.
- Engulfing candles (protocol §10) — candidates that break both the directional bound AND the reference level — are handled separately in `PriceMoveStructure.#handleEngulfingCandle`.

**Fractal Layers**: Built recursively from root PriceMoves (those without a `parentStructure`), collecting `subStructures` at each depth level.

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

// Queries - State-based API
engine.getGrowingMoves()                    // PriceMove[] that can still extend
engine.getReferenceMoves()                  // PriceMove[] terminated, serve as levels
engine.getArchivedMoves()                   // PriceMove[] historical only
engine.getStructuresByDegre(degre)          // PriceMove[] at specific complexity
engine.getAllMoves()                        // PriceMove[] all states
engine.getLayers()                          // FractalLayer[] by rang
engine.getLayer(level)                      // FractalLayer at specific level
engine.getLayerCount()                      // number of rang levels
engine.validate()                           // { valid: boolean, errors: string[] }

// Legacy (deprecated)
engine.getActiveMoves()                     // Use getGrowingMoves() instead

// Point-in-Time Queries (historical analysis)
engine.getStack(timestamp)                  // PriceMove[] active at timestamp
engine.getMove(rang, timestamp)             // PriceMove | undefined at rang+time

// Debug
engine.formatActiveMoves()                  // human-readable string ("[Rang N] ...")
engine.logActiveMoves()                     // logs via configured logger
engine.getMemoryStats()                     // memory usage statistics
engine.logMemoryStats()                     // logs stats via logger

// Memory Management
engine.pruneClosedMoves(beforeTimestamp)    // remove old Reference/Archived moves
engine.archiveOrphanedStructures(beforeTimestamp) // Reference → Archived for moves older than ts (no Growing descendants)
engine.clear()                              // reset to empty state
```

### Key Types
- `Candle` - Input: { openTime, closeTime, open, high, low, close, volume }
- `PriceMove` - Output: polarity, priceRange, timeRange, state, rang, degre?, currentReferenceLevel, subStructures, parentStructure?
- `FractalLayer` - { level: number, moves: PriceMove[] }
- `Logger` - { debug, info, warn, error } interface

### Key Properties
- **rang** - Complexity level (bottom-up): higher rang = more sub-structures
- **degre** - Hierarchy level (top-down): assigned when structure terminates
- **currentReferenceLevel** - Dynamic invalidation threshold (opposite bound of last extending move)

### PriceMove States
- **Growing**: Active structure, can still be extended by new price action
- **Reference**: Terminated, serves as reference level for detecting parent invalidation
- **Archived**: No longer relevant for structure detection, can be freed from memory

### Point-in-Time Query Example
```typescript
// Build structure from historical candles
engine.buildFromCandles(candles);

// Query what the structure looked like at a specific moment
const timestamp = 1704067500000; // Unix ms
const stackAtTime = engine.getStack(timestamp);
const rang0MoveAtTime = engine.getMove(0, timestamp);

// A move was active at T if it started before T and wasn't terminated yet
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
