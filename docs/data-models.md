# Data Models

> **Authority**: This document describes the runtime data model as implemented in `packages/core/src/`. For the construction rules that govern how these structures evolve, see [protocole-construction.md](./protocole-construction.md).

---

## Overview

The core package exposes a small, focused domain model centered on the `PriceMove` entity. Everything else — value objects, ports, state enums, factories — exists to support it.

```
Candle  ──►  PriceMoveFactory  ──►  PriceMove (Growing)  ──►  Reference  ──►  Archived
                                       │
                                       ├── subStructures: PriceMove[]
                                       ├── parentStructure?: PriceMove
                                       ├── referenceLevels: ReferenceLevel[]
                                       └── correction?: PriceMove
```

---

## Entity: `PriceMove`

Source: `packages/core/src/domain/price-move/PriceMove.ts`

A `PriceMove` is a directional, mutable price excursion bounded in time and price. It is the only aggregate root in the model.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `PriceMoveId` | Stable identifier (UUID or deterministic index). Readonly. |
| `polarity` | `Polarity` | `"up"` or `"down"`. Direction of the excursion. |
| `state` | `PriceMoveState` | Lifecycle state: `"growing"`, `"reference"`, or `"archived"`. |
| `priceRange` | `PriceRange` | `{ low, high }` — extended over time as the move grows. |
| `timeRange` | `TimeRange` | `{ start, end }` — extended over time as the move grows. |
| `rang` | `number` | Bottom-up complexity index. `rang(leaf) = 0`, `rang(parent) = max(children.rang) + 1`. |
| `degre?` | `number` | Top-down hierarchy index, assigned at termination. Roots = 0. |
| `currentReferenceLevel` | `number` | Dynamic invalidation threshold (protocole §3.3). Opposite bound of the last extending sub-move. |
| `referenceLevels` | `ReferenceLevel[]` | History of pivots created during extensions. |
| `subStructures` | `PriceMove[]` | Nested moves contained within this move. |
| `parentStructure?` | `PriceMove` | The englobing move, if any. |
| `correction?` | `PriceMove` | The move that broke (terminated) this one. |
| `terminatedAt?` | `number` | Unix ms — set on `Growing → Reference` transition. |
| `archivedAt?` | `number` | Unix ms — set on `Reference → Archived` transition. |

### `rang` vs `degre`

Two distinct hierarchy indices coexist:

- **`rang`** — bottom-up, always defined. Tracks complexity: how deep the sub-structure tree is below this move.
- **`degre`** — top-down, only defined post-termination. Tracks position from the root: a root structure has `degre = 0`, its terminated children have `degre = 1`, and so on. Recalculation is propagated to children whenever a parent terminates (`#propagateDegreToChildren`).

### `currentReferenceLevel`

Per protocole §3.3, invalidation is **not** checked against the structure's own boundary but against the opposite bound of the most recent extending sub-move. This field captures that running threshold and is updated every time `processCandidate` returns `"extended-boundary"`.

### Key Methods

| Method | Description |
|--------|-------------|
| `processCandidate(candidate)` | Returns `"extended-boundary"`, `"extended-internal"`, or `"broken"`. Mutates `priceRange`, `timeRange`, `currentReferenceLevel`, and `referenceLevels` on extension. |
| `terminate(timestamp)` | `Growing → Reference`. Sets `terminatedAt`, computes `degre`, propagates to children. |
| `archive(timestamp)` | `Reference → Archived`. Sets `archivedAt`. |
| `addSubStructure(sub)` | Attaches a child, sets its `parentStructure`, recalculates `rang` (and propagates upward). |
| `recalculateRang()` | Recomputes `rang` from children; bubbles up if changed. |
| `wasActiveAt(timestamp)` | Point-in-time predicate used by `getStack`/`getMove`. |

### Deprecated aliases (kept for backward compatibility)

The following getters/setters exist purely to ease migration and should not be used in new code:

- `generation` → use `rang`
- `closedAt` → use `terminatedAt`
- `childMoves` → use `subStructures`
- `englobingMove` → use `parentStructure`
- `origin` / `confirmedOrigins` → use `referenceLevels`
- `isActive()` / `isClosed()` → use `isGrowing()` / `isReference()` / `isArchived()`
- `tryExtendWith()` → use `processCandidate()`

---

## Enum: `PriceMoveState`

Source: `packages/core/src/domain/price-move/PriceMoveState.ts`

```typescript
export const PriceMoveState = {
  Growing: "growing",
  Reference: "reference",
  Archived: "archived",
} as const;
```

### Transitions (protocole §13.3)

```
   ┌──────────┐   terminate()    ┌───────────┐   archive()    ┌──────────┐
   │ Growing  │ ───────────────► │ Reference │ ─────────────► │ Archived │
   └──────────┘                  └───────────┘                └──────────┘
```

- **Growing → Reference**: triggered by `processCandidate` returning `"broken"`, by cascade termination, or by engulfing-candle handling.
- **Reference → Archived**: only via `PriceMoveStructure.archiveOrphanedStructures()`. **Not automatic** when a parent terminates — see Known Issues in [architecture.md](./architecture.md).
- Transitions are **one-way**. No state regression is possible.

---

## Enum: `Polarity`

Source: `packages/core/src/domain/price-move/Polarity.ts`

```typescript
export const Polarity = { Up: "up", Down: "down" } as const;
```

String values are lowercase to match exporter output and visualizer expectations.

---

## Value Object: `PriceRange`

Source: `packages/core/src/shared/PriceRange.ts`

```typescript
class PriceRange {
  constructor(public low: number, public high: number) // throws if low > high
  extendWith(price: number): PriceRange
  contains(other: PriceRange): boolean
  toString(): string
}
```

All comparisons use the `Price` module (big.js-backed) to avoid floating-point errors.

---

## Value Object: `TimeRange`

Source: `packages/core/src/shared/TimeRange.ts`

```typescript
class TimeRange {
  constructor(public readonly start: number, public readonly end: number) // throws if start > end
  includes(timestamp: number): boolean
  extendWith(timestamp: number): TimeRange
  duration(): number
}
```

Timestamps are Unix milliseconds.

---

## Module: `Price`

Source: `packages/core/src/shared/Price.ts`

Stateless comparison/arithmetic helpers backed by `big.js`. Used everywhere a price comparison is needed, in place of native `>`/`<`/`===`.

```typescript
Price.gt(a, b) / Price.gte(a, b) / Price.lt(a, b) / Price.lte(a, b) / Price.eq(a, b)
Price.min(a, b) / Price.max(a, b) / Price.add(a, b) / Price.sub(a, b)
```

---

## Interface: `ReferenceLevel`

Source: `packages/core/src/domain/price-move/ReferenceLevel.ts`

```typescript
interface ReferenceLevel {
  price: number
  timestamp: number
  index: number      // ordinal within the move's referenceLevels[]
  move: PriceMove    // the extending move that created this level
}
```

A `ReferenceLevel` is appended each time the host `PriceMove` accepts a boundary extension. Together they form the support/resistance history (H0, H1, … for Up moves; L0, L1, … for Down moves).

---

## Interface: `Candle`

Source: `packages/core/src/domain/candle/Candle.ts` (single source of truth)

```typescript
interface Candle {
  readonly openTime: number    // Unix ms
  readonly closeTime: number   // Unix ms
  readonly open: number
  readonly high: number
  readonly low: number
  readonly close: number
  readonly volume: number
}
```

Helpers exported from `domain/candle/index.ts`:
- `isCandle(obj): obj is Candle` — type guard
- `validateCandle(obj): { valid, errors }` — logical consistency check (OHLC ordering, timestamps, non-negative volume, finite numbers)
- `CandleFactory` / `InvalidCandleError`

> Note: `packages/core/src/shared/Candle.ts` is a deprecated re-export kept for backward compatibility.

---

## Interface: `FractalLayer`

Source: `packages/core/src/domain/structure/FractalLayer.ts`

```typescript
interface FractalLayer {
  level: number      // rang level
  moves: PriceMove[] // all moves with this rang
}
```

Produced by `PriceMoveStructure.getLayers()` / `getLayer(level)`.

---

## Port: `PriceMoveRepository`

Source: `packages/core/src/application/ports/PriceMoveRepository.ts`

```typescript
interface PriceMoveRepository {
  save(priceMove: PriceMove): void
  findById(id: PriceMoveId): PriceMove | undefined
  findAll(): PriceMove[]
  findByState(state: PriceMoveState): PriceMove[]
  findGrowing(): PriceMove[]
  findReference(): PriceMove[]
  findArchived(): PriceMove[]
  removeArchived(): number
  clear(): void
}
```

The implementation lives in infrastructure (`InMemoryPriceMoveRepository`). A factory port (`PriceMoveRepositoryFactory`) is also defined for dependency-injection scenarios.

---

## Port: `CandleRepository`

Source: `packages/core/src/application/ports/CandleRepository.ts` (re-exported from `domain/candle/index.ts`).

Defines how candles are fetched (used by `FetchCandlesUseCase`, implemented by `CachedCandleRepository` + `BinanceCandleApi`).

---

## JSON Export Formats

### `PriceMoveExporter.toJSON(move)` — recursive tree

Source: `packages/core/src/infrastructure/adapters/PriceMoveExporter.ts`

```json
{
  "id": "uuid-string",
  "polarity": "up",
  "priceRange": { "low": 42000.0, "high": 42500.0 },
  "state": "growing",
  "children": [ /* recursively the same shape */ ]
}
```

### `FractalLayerExporter.exportLayersToJson(layers, baseDir)` — per-layer dump

Source: `packages/core/src/infrastructure/exporters/FractalLayerExporter.ts`

Writes one file per layer to `<baseDir>/fractal-layers/layer-<level>.json`. Each entry:

```json
{
  "id": "uuid",
  "polarity": "up",
  "state": "growing",
  "priceRange": { "low": 42000.0, "high": 42500.0 },
  "timeRange": { "start": 1704067200000, "end": 1704067500000 },
  "originIds": [],
  "confirmedOriginIds": ["uuid1", "uuid2"]
}
```

> **Note**: `originIds` and `confirmedOriginIds` are produced via the deprecated `origin` / `confirmedOrigins` getters. `originIds` is always `[]` (the underlying field was removed). `confirmedOriginIds` maps to `referenceLevels[].move.id`. This export shape is preserved for backward compatibility — new consumers should read `referenceLevels` directly.

---

*Last updated: 2026-05-16 — after DDD refactor + dead-code purge.*
