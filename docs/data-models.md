# Data Models

> **Technical Reference**: See [Protocole de Construction](./protocole-construction.md) for the authoritative specification of fractal construction rules and state transitions.

## Domain Entities

### PriceMove (Aggregate Root)

The central entity representing a directional price movement.

**Location**: `src/domain/price-move/PriceMove.ts`

```typescript
class PriceMove {
  // Identity
  readonly id: PriceMoveId

  // Core properties
  timeRange: TimeRange      // Start/end timestamps (milliseconds)
  priceRange: PriceRange    // Low/high price bounds
  polarity: Polarity        // Direction: Up | Down
  state: PriceMoveState     // Lifecycle: Growing | Reference | Archived

  // Hierarchical relationships
  origin: PriceMove[]           // Initial source moves
  confirmedOrigins: PriceMove[] // Moves that extended this one
  childMoves: PriceMove[]       // Internal nested moves
  englobingMove?: PriceMove     // Parent enclosing move
}
```

**Key Methods**:
- `tryExtendWith(candidate)`: Attempt to extend, terminate, or attach as child
- `isGrowing()`: Check if move can still be extended
- `isReference()`: Check if move is terminated but serves as reference level
- `isArchived()`: Check if move is no longer relevant

### Candle (Interface)

OHLCV candlestick data from Binance.

**Location**: `src/shared/Candle.ts` (and duplicate in `src/domain/candle/Candle.ts`)

```typescript
interface Candle {
  openTime: number   // Timestamp (ms)
  closeTime: number  // Timestamp (ms)
  open: number       // Opening price
  high: number       // Highest price
  low: number        // Lowest price
  close: number      // Closing price
  volume: number     // Trading volume
}
```

### FractalLayer (Interface)

A level in the fractal hierarchy.

**Location**: `src/domain/structure/FractalLayer.ts`

```typescript
interface FractalLayer {
  level: number       // Depth level (1, 2, 3...)
  moves: PriceMove[]  // All moves at this level
}
```

## Value Objects

### PriceRange

Represents price boundaries.

**Location**: `src/shared/PriceRange.ts`

```typescript
class PriceRange {
  low: number   // Minimum price
  high: number  // Maximum price

  extendWith(price: number): PriceRange  // Create new range including price
  contains(other: PriceRange): boolean   // Check if fully contains another
  toString(): string                     // "[low → high]"
}
```

**Invariant**: `low <= high` (throws on construction if violated)

### TimeRange

Represents temporal boundaries.

**Location**: `src/shared/TimeRange.ts`

```typescript
class TimeRange {
  readonly start: number  // Start timestamp (ms)
  readonly end: number    // End timestamp (ms)

  includes(timestamp: number): boolean   // Check if timestamp within range
  extendWith(timestamp: number): TimeRange // Create new range including time
  duration(): number                     // End - start in milliseconds
  toString(): string                     // "[start → end]"
}
```

**Invariant**: `start <= end` (throws on construction if violated)

### PriceMoveId

Unique identifier for PriceMove entities.

**Location**: `src/domain/price-move/PriceMoveId.ts`

```typescript
class PriceMoveId {
  private readonly value: string  // UUID v4

  static create(): PriceMoveId    // Factory method
  toString(): string              // Get string representation
}
```

## Enumerations

### Polarity

Direction of price movement.

**Location**: `src/domain/price-move/Polarity.ts`

```typescript
enum Polarity {
  Up = "up",     // Bullish (close >= open)
  Down = "down"  // Bearish (close < open)
}
```

### PriceMoveState

Lifecycle state of a PriceMove. See [Protocole de Construction](./protocole-construction.md#13-les-trois-états-dune-structure) for detailed state transitions.

**Location**: `src/domain/price-move/PriceMoveState.ts`

```typescript
enum PriceMoveState {
  Growing = "growing",      // Active, can be extended
  Reference = "reference",  // Terminated, serves as reference level
  Archived = "archived"     // No longer relevant, can be freed
}
```

## Repository Interfaces

### PriceMoveRepository

**Location**: `src/domain/structure/PriceMoveRepository.ts`

```typescript
interface PriceMoveRepository {
  save(priceMove: PriceMove): void
  findById(id: PriceMoveId): PriceMove | undefined
  findAll(): PriceMove[]
  findActive(): PriceMove[]
  clear(): void
}
```

**Implementation**: `InMemoryPriceMoveRepository` (Map-based)

### CandleRepository

**Location**: `src/domain/candle/CandleRepository.ts`

```typescript
interface CandleRepository {
  getCandles(symbol: string, interval: string, limit: number): Promise<Candle[]>
}
```

**Implementation**: `CachedCandleRepository` (File cache + Binance API)

## Domain Services

### PriceMoveStructure

Aggregate manager handling PriceMove lifecycle.

**Location**: `src/domain/structure/PriceMoveStructure.ts`

```typescript
class PriceMoveStructure {
  private activeMoves: Set<PriceMove>

  add(priceMove: PriceMove): void  // Add and process move
  getActiveMoves(): PriceMove[]    // Get all active moves
  getAllMoves(): PriceMove[]       // Get all moves
}
```

### PriceMoveFactory

Creates PriceMoves from Candles.

**Location**: `src/domain/price-move/PriceMoveFactory.ts`

```typescript
class PriceMoveFactory {
  static fromCandle(candle: Candle): PriceMove
}
```

### PriceMoveRules

Domain rules for move extension/invalidation.

**Location**: `src/domain/price-move/PriceMoveRules.ts`

```typescript
class PriceMoveRules {
  static canExtendWith(current: PriceMove, candidate: PriceMove): boolean
  static isInvalidatedBy(current: PriceMove, candidate: PriceMove): boolean
}
```

⚠️ **Note**: `isInvalidatedBy` currently only checks state, not actual boundary violations.

## Data Relationships

```
┌─────────────┐
│   Candle    │ (Input data)
└──────┬──────┘
       │ PriceMoveFactory.fromCandle()
       ▼
┌─────────────────────────────────────────────────────┐
│                    PriceMove                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ PriceMoveId │  │ PriceRange  │  │ TimeRange   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│  ┌─────────────┐  ┌─────────────┐                  │
│  │ Polarity    │  │ State       │                  │
│  └─────────────┘  └─────────────┘                  │
│                                                     │
│  Relationships:                                     │
│  • englobingMove → PriceMove (parent)              │
│  • childMoves[] → PriceMove[] (children)           │
│  • confirmedOrigins[] → PriceMove[] (extensions)   │
└─────────────────────────────────────────────────────┘
       │
       │ buildRecursiveFractalRoots()
       ▼
┌─────────────────┐
│  FractalLayer   │ (Output structure)
│  • level        │
│  • moves[]      │
└─────────────────┘
```

## Export Format (JSON)

Each fractal layer is exported as:

```json
[
  {
    "id": "uuid-string",
    "polarity": "up" | "down",
    "state": "active" | "closed",
    "priceRange": { "low": 50000, "high": 51000 },
    "timeRange": { "start": 1704067200000, "end": 1704153600000 },
    "originIds": ["uuid-1", "uuid-2"],
    "confirmedOriginIds": ["uuid-3"]
  }
]
```
