# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fractal Price Structure is a TypeScript tool that generates fractal price structures from candlestick data. It fetches candles from Binance API, converts them into PriceMoves, and builds recursive fractal layers representing nested price movements.

## Commands

- `npm run dev` - Run the application (uses tsx for direct TypeScript execution)
- `npm run build` - Compile TypeScript to JavaScript (outputs to dist/)
- `npm run clean` - Remove the dist/ directory

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
