# Source Tree Analysis

## Project Structure

```
fractal-price-structure/
├── src/                           # Source code root
│   ├── main.ts                    # 🚀 Entry point - orchestrates the fractal building
│   │
│   ├── domain/                    # 🏛️ DOMAIN LAYER - Business logic & entities
│   │   ├── candle/
│   │   │   ├── Candle.ts          # Candle interface (OHLCV data)
│   │   │   └── CandleRepository.ts # Repository interface for candle fetching
│   │   │
│   │   ├── price-move/
│   │   │   ├── PriceMove.ts       # ⭐ Core entity - directional price movement
│   │   │   ├── PriceMoveId.ts     # Value object - UUID identifier
│   │   │   ├── PriceMoveFactory.ts # Factory - creates PriceMove from Candle
│   │   │   ├── PriceMoveRules.ts  # Domain rules for extension/invalidation
│   │   │   ├── PriceMoveState.ts  # Enum: Growing | Reference | Archived
│   │   │   └── Polarity.ts        # Enum: Up | Down
│   │   │
│   │   └── structure/
│   │       ├── PriceMoveStructure.ts # ⭐ Aggregate - manages move lifecycle
│   │       ├── PriceMoveRepository.ts # Repository interface
│   │       └── FractalLayer.ts    # Interface for fractal levels
│   │
│   ├── application/               # 📋 APPLICATION LAYER - Use cases
│   │   └── use-cases/
│   │       ├── BuildPriceMovesFromCandles.ts  # Converts candles → PriceMoves
│   │       ├── BuildRecursiveFractal.ts       # Builds layers from child traversal
│   │       ├── buildFractalLevels.ts          # Alternative layer building
│   │       ├── FractalPriceMoveBuilder.ts     # Re-aggregates moves as primitives
│   │       ├── BuildFractalLayersFromMoves.ts # Converts moves to pseudo-candles
│   │       └── FetchCandlesUseCase.ts         # Thin wrapper for candle fetching
│   │
│   ├── infrastructure/            # 🔌 INFRASTRUCTURE LAYER - External adapters
│   │   ├── api/
│   │   │   └── BinanceCandleApi.ts # REST client for Binance klines API
│   │   │
│   │   ├── repositories/
│   │   │   ├── CachedCandleRepository.ts    # File-based daily cache
│   │   │   └── InMemoryPriceMoveRepository.ts # Map-based in-memory storage
│   │   │
│   │   ├── adapters/
│   │   │   ├── PriceMoveLogger.ts       # Console logging
│   │   │   ├── PriceMoveLoggerFile.ts   # File + console logging
│   │   │   ├── PriceMoveTreePrinter.ts  # Console tree visualization
│   │   │   ├── PriceMoveTreeFilePrinter.ts # File tree visualization
│   │   │   └── PriceMoveExporter.ts     # JSON serialization
│   │   │
│   │   └── exporters/
│   │       └── FractalLayerExporter.ts  # Exports layers to JSON files
│   │
│   └── shared/                    # 🔗 SHARED - Cross-cutting value objects
│       ├── Candle.ts              # Candle interface (duplicate of domain)
│       ├── PriceRange.ts          # Value object: low/high price bounds
│       └── TimeRange.ts           # Value object: start/end timestamps
│
├── dist/                          # 📦 Compiled JavaScript output
├── .cache/                        # 💾 Binance candle cache (daily)
├── .logs/                         # 📝 Runtime logs and exports
│   └── fractal-layers/            # JSON exports per level
│
├── package.json                   # NPM configuration
├── tsconfig.json                  # TypeScript configuration
├── README.md                      # Basic project description
└── CLAUDE.md                      # AI assistant guidance
```

## Critical Folders

| Folder | Purpose | Key Files |
|--------|---------|-----------|
| `src/domain/price-move/` | Core business entity and rules | PriceMove.ts, PriceMoveFactory.ts |
| `src/domain/structure/` | Aggregate root and lifecycle management | PriceMoveStructure.ts |
| `src/application/use-cases/` | Business operations orchestration | BuildPriceMovesFromCandles.ts, BuildRecursiveFractal.ts |
| `src/infrastructure/api/` | External API integration | BinanceCandleApi.ts |
| `src/infrastructure/repositories/` | Data persistence implementations | CachedCandleRepository.ts, InMemoryPriceMoveRepository.ts |

## Entry Points

| File | Type | Description |
|------|------|-------------|
| `src/main.ts` | Application Entry | Orchestrates candle loading, structure building, and export |

## File Statistics

- **Total TypeScript files**: 30
- **Domain layer files**: 10
- **Application layer files**: 6
- **Infrastructure layer files**: 9
- **Shared files**: 3
- **Entry point**: 1
- **Total lines of code**: ~800 LOC
