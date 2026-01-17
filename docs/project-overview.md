# Project Overview

## Fractal Price Structure

**Purpose**: Generate hierarchical fractal structures from candlestick price data for trading analysis.

## What It Does

1. **Fetches** OHLCV candlestick data from Binance API
2. **Converts** candles into directional PriceMoves (Up/Down)
3. **Builds** recursive fractal layers representing nested price movements
4. **Exports** the fractal structure as JSON for further analysis

## Key Concepts

### PriceMove

A directional price movement that can:
- **Extend**: When price breaks in the direction of the move
- **Close**: When price breaks the opposite boundary
- **Contain children**: Internal moves that fit within its boundaries

### Fractal Layers

Price movements form a natural hierarchy:
- Level 1: Large trend movements
- Level 2: Corrections within trends
- Level 3: Micro-movements within corrections
- And so on...

## Technology Summary

| Aspect | Details |
|--------|---------|
| **Language** | TypeScript 5.9.3 |
| **Runtime** | Node.js (ES Modules) |
| **Architecture** | Clean/Hexagonal (DDD) |
| **Data Source** | Binance REST API |
| **Storage** | In-memory + file cache |

## Repository Structure

```
├── src/
│   ├── domain/          # Business logic & entities
│   ├── application/     # Use cases
│   ├── infrastructure/  # External adapters
│   └── shared/          # Cross-cutting concerns
├── dist/                # Compiled output
├── .cache/              # Candle data cache
└── .logs/               # Runtime outputs
```

## Quick Start

```bash
npm install
npm run dev
```

## Current Status

**Prototype Stage** - Core algorithms functional but:
- No test suite
- Some architectural issues to resolve
- Hardcoded configuration

## Links

- [Architecture Documentation](./architecture.md)
- [Development Guide](./development-guide.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Data Models](./data-models.md)
