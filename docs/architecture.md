# Architecture Documentation

## Executive Summary

Fractal Price Structure is a TypeScript tool that generates hierarchical fractal structures from candlestick price data. It follows Clean Architecture / Hexagonal Architecture principles with Domain-Driven Design (DDD) patterns.

The system fetches OHLCV candles from Binance API, converts them into directional PriceMoves, and builds recursive fractal layers representing nested price movements at different time scales.

## Architecture Pattern

**Clean Architecture / Hexagonal (Ports & Adapters)**

```
┌─────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ BinanceCandleApi│  │CachedCandle     │  │ Loggers &       │ │
│  │ (HTTP Adapter)  │  │Repository       │  │ Exporters       │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
└───────────┼────────────────────┼────────────────────┼──────────┘
            │                    │                    │
            │    ┌───────────────▼────────────────┐   │
            │    │      APPLICATION LAYER          │   │
            │    │  ┌──────────────────────────┐  │   │
            │    │  │ Use Cases:                │  │   │
            │    │  │ • BuildPriceMovesFrom    │  │   │
            │    │  │   Candles                │  │   │
            │    │  │ • BuildRecursiveFractal  │  │   │
            │    │  │ • FetchCandlesUseCase    │  │   │
            │    │  └────────────┬─────────────┘  │   │
            │    └───────────────┼────────────────┘   │
            │                    │                    │
            │    ┌───────────────▼────────────────┐   │
            │    │         DOMAIN LAYER            │   │
            │    │  ┌──────────────────────────┐  │   │
            │    │  │ Entities:                 │  │   │
            │    │  │ • PriceMove (Aggregate)  │  │   │
            │    │  │ • Candle                 │  │   │
            │    │  ├──────────────────────────┤  │   │
            │    │  │ Value Objects:           │  │   │
            │    │  │ • PriceRange, TimeRange  │  │   │
            │    │  │ • PriceMoveId            │  │   │
            │    │  │ • Polarity, State        │  │   │
            │    │  ├──────────────────────────┤  │   │
            │    │  │ Domain Services:         │  │   │
            │    │  │ • PriceMoveStructure     │  │   │
            │    │  │ • PriceMoveRules         │  │   │
            │    │  │ • PriceMoveFactory       │  │   │
            │    │  ├──────────────────────────┤  │   │
            │    │  │ Repository Interfaces:   │  │   │
            │    │  │ • PriceMoveRepository    │  │   │
            │    │  │ • CandleRepository       │  │   │
            │    │  └──────────────────────────┘  │   │
            │    └────────────────────────────────┘   │
            └─────────────────────────────────────────┘
```

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Language | TypeScript | 5.9.3 | Type-safe development |
| Runtime | Node.js | 18+ | ES2022, NodeNext modules |
| HTTP Client | axios | 1.12.2 | Binance API calls |
| Date/Time | luxon | 3.7.2 | Timestamp formatting |
| Precision Math | big.js | 7.0.1 | Financial calculations |
| UUID | uuid | 11.1.0 | Entity identification |
| Dev Runner | tsx | 4.20.6 | Direct TS execution |

## Domain Model

### Core Entity: PriceMove

The `PriceMove` is the central aggregate representing a directional price movement:

```typescript
class PriceMove {
  id: PriceMoveId           // Unique identifier
  timeRange: TimeRange      // Start/end timestamps
  priceRange: PriceRange    // Low/high price bounds
  polarity: Polarity        // Up or Down direction
  state: PriceMoveState     // Active or Closed

  origin: PriceMove[]           // Source moves (initial)
  confirmedOrigins: PriceMove[] // Moves that extended this
  childMoves: PriceMove[]       // Internal nested moves
  englobingMove?: PriceMove     // Parent enclosing move
}
```

### Key Domain Concepts

#### Polarity
- **Up**: Close >= Open (bullish candle/move)
- **Down**: Close < Open (bearish candle/move)

#### PriceMove States
- **Active**: Can be extended by new moves
- **Closed**: Terminated, no longer extensible

#### Extension Logic (`tryExtendWith`)

```
IF candidate breaks directional boundary:
  → EXTEND: Update price/time range, add to confirmedOrigins

ELSE IF candidate breaks opposite boundary:
  → INVALIDATE: Mark as Closed

ELSE (fits within boundaries):
  → ATTACH: Add as childMove, set parent relationship
```

### Fractal Layer Concept

```
Level 0: Raw candles (input)
    ↓ PriceMoveFactory.fromCandle()
Level 1: Initial PriceMoves
    ↓ childMoves traversal
Level 2: Nested moves within Level 1
    ↓
Level N: Deepest fractal level
```

## Data Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Binance API │────▶│ CachedCandle     │────▶│ Candle[]        │
│ (klines)    │     │ Repository       │     │                 │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                       │
                    ┌──────────────────────────────────▼────────┐
                    │ BuildPriceMovesFromCandles                │
                    │ - PriceMoveFactory.fromCandle()           │
                    │ - PriceMoveStructure.add()                │
                    └──────────────────────────────────┬────────┘
                                                       │
                    ┌──────────────────────────────────▼────────┐
                    │ PriceMoveStructure                        │
                    │ - Extension/Invalidation logic            │
                    │ - Parent-child relationships              │
                    └──────────────────────────────────┬────────┘
                                                       │
                    ┌──────────────────────────────────▼────────┐
                    │ buildRecursiveFractalRoots                │
                    │ - Traverse childMoves recursively         │
                    │ - Build FractalLayer[] by depth           │
                    └──────────────────────────────────┬────────┘
                                                       │
                    ┌──────────────────────────────────▼────────┐
                    │ FractalLayerExporter                      │
                    │ - Export to .logs/fractal-layers/*.json   │
                    └───────────────────────────────────────────┘
```

## Repository Interfaces

### CandleRepository

```typescript
interface CandleRepository {
  getCandles(symbol: string, interval: string, limit: number): Promise<Candle[]>
}
```

**Implementation**: `CachedCandleRepository`
- File-based daily cache in `.cache/`
- Falls back to `BinanceCandleApi` on cache miss

### PriceMoveRepository

```typescript
interface PriceMoveRepository {
  save(priceMove: PriceMove): void
  findById(id: PriceMoveId): PriceMove | undefined
  findAll(): PriceMove[]
  findActive(): PriceMove[]
  clear(): void
}
```

**Implementation**: `InMemoryPriceMoveRepository`
- Map-based in-memory storage
- No persistence between runs

## External Dependencies

### Binance API

- **Endpoint**: `https://api.binance.com/api/v3/klines`
- **Authentication**: None (public endpoint)
- **Rate limits**: Standard Binance limits apply
- **Data format**: Array of arrays (OHLCV + metadata)

## Architectural Issues & Technical Debt

### High Severity

| Issue | Location | Impact |
|-------|----------|--------|
| Infrastructure in Domain | `PriceMoveStructure.ts:4` | Violates dependency rule |
| Incomplete rules | `PriceMoveRules.isInvalidatedBy()` | Only checks state, not boundaries |
| No test suite | `package.json` | Zero test coverage |

### Medium Severity

| Issue | Location | Impact |
|-------|----------|--------|
| Duplicate Candle interface | `shared/` & `domain/candle/` | Maintenance confusion |
| Console.log in domain | `PriceMove.tryExtendWith()` | Side effects in entity |
| Static methods everywhere | Adapters, API | Hard to test/mock |
| Unused code | `BuildFractalLayersFromMoves.ts` | Dead code with mock repo |

### Recommendations

1. **Inject logger via constructor** instead of static import
2. **Remove duplicate Candle** - keep only in `shared/`
3. **Add Vitest** for unit testing domain logic
4. **Extract console.log** to injected logger interface
5. **Fix `isInvalidatedBy()`** to check actual boundary violations

## Security Considerations

- No sensitive data stored
- No authentication required
- Public API only (Binance public endpoints)
- No user input handling (hardcoded config)

## Performance Characteristics

- **Memory**: O(n) where n = number of candles
- **Time complexity**: O(n²) for englobment check (linear scan per add)
- **Cache**: Daily invalidation reduces API calls
- **Typical run**: 10,000 candles → ~500 PriceMoves → ~5 fractal layers
