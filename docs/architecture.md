# Architecture

> **Technical Reference**: For the fractal construction rules (extension, invalidation, cascade, reference levels), see [protocole-construction.md](./protocole-construction.md). This document describes the *code structure* that implements that protocol — not the protocol itself.

---

## Executive Summary

Fractal Price Structure is a TypeScript pnpm monorepo organized around a single core library and a separate visualizer application. The core follows **Clean Architecture / Hexagonal Architecture** with **Domain-Driven Design (DDD)** layering.

| Attribute | Value |
|-----------|-------|
| Pattern | Clean / Hexagonal / DDD |
| Language | TypeScript 5.9.x (ES Modules, strict mode) |
| Runtime | Node.js (NodeNext resolution, `.js` extensions in imports) |
| Workspace | pnpm workspaces (`packages/*`) |
| Test | Vitest — 357 tests in core, plus visualizer suite |
| Lint/Format | Biome |

---

## Monorepo Layout

```
fractal-price-structure/
├── packages/
│   ├── core/                # @fractal-price-structure/core — library
│   └── visualizer/          # @fractal-price-structure/visualizer — Vue.js app + terminal debug
├── docs/                    # this directory
├── tests/e2e/               # Playwright end-to-end
├── resources/               # fixture JSON candle data
├── src/                     # LEGACY — see Known Issues below
└── _bmad / _bmad-output/    # BMad workflow artifacts
```

---

## Core Package Layers

Source root: `packages/core/src/`

```
src/
├── FractalEngine.ts         ← Facade (public entry point)
├── main.ts                  ← CLI demo / executable entry
├── index.ts                 ← Public re-exports
│
├── domain/                  ← Layer 1: pure business model
│   ├── candle/              (Candle, validateCandle, isCandle, CandleFactory)
│   ├── logger/              (Logger interface, noopLogger)
│   ├── price-move/          (PriceMove, PriceMoveId, PriceMoveState, Polarity,
│   │                         PriceMoveFactory, ReferenceLevel)
│   └── structure/           (FractalLayer)
│
├── application/             ← Layer 2: orchestration + use cases + ports
│   ├── orchestrator/        (PriceMoveStructure — lifecycle service)
│   ├── ports/               (PriceMoveRepository, CandleRepository,
│   │                         PriceMoveRepositoryFactory)
│   └── use-cases/           (BuildPriceMovesFromCandles, BuildRecursiveFractal,
│                             FractalPriceMoveBuilder, FetchCandlesUseCase)
│
├── infrastructure/          ← Layer 3: adapters to the outside world
│   ├── adapters/            (PriceMoveExporter, PriceMoveTreePrinter,
│   │                         PriceMoveTreeFilePrinter, PriceMoveLoggerFile,
│   │                         PriceMoveLogger)
│   ├── api/                 (BinanceCandleApi)
│   ├── exporters/           (FractalLayerExporter)
│   ├── logging/             (ConsoleLogger)
│   └── repositories/        (InMemoryPriceMoveRepository, CachedCandleRepository)
│
└── shared/                  ← Cross-cutting value objects
    ├── Price.ts             (big.js decimal arithmetic)
    ├── PriceRange.ts
    ├── TimeRange.ts
    └── Candle.ts            (DEPRECATED re-export)
```

### Dependency Direction

```
┌─────────────────────────────────────────────────────┐
│                  Infrastructure                     │
│   (Binance API, file IO, in-memory repo, logging)   │
└────────────────┬────────────────────────────────────┘
                 │ implements ports
                 ▼
┌─────────────────────────────────────────────────────┐
│                   Application                       │
│   (PriceMoveStructure, use-cases, ports)            │
└────────────────┬────────────────────────────────────┘
                 │ uses entities
                 ▼
┌─────────────────────────────────────────────────────┐
│                     Domain                          │
│   (PriceMove, Polarity, PriceMoveState, ...)        │
└─────────────────────────────────────────────────────┘
                 ▲
                 │ used by all
                 │
┌─────────────────────────────────────────────────────┐
│                     Shared                          │
│   (Price, PriceRange, TimeRange)                    │
└─────────────────────────────────────────────────────┘
```

Rules enforced by the layout:
- **Domain** has no imports from `application/`, `infrastructure/`, or third-party libraries (except `big.js` via `shared/Price`).
- **Application** depends on `domain/` and `shared/`, never on `infrastructure/`.
- **Infrastructure** depends on `application/` ports and `domain/` types — it provides concrete implementations.
- **Shared** is transverse and depends on nothing internal.

---

## Component Responsibilities

### `FractalEngine` (`packages/core/src/FractalEngine.ts`)

The public facade. Hides the wiring (`InMemoryPriceMoveRepository` + `PriceMoveStructure`) and exposes a flat API: candle ingestion, structure queries, point-in-time queries, debug helpers, memory management.

### `PriceMoveStructure` (`packages/core/src/application/orchestrator/PriceMoveStructure.ts`)

**Location**: Application layer, *not* domain. This is a stateful orchestration service that:

- Holds the set of currently-growing root moves
- Implements the algorithm described in protocole §§3–10 (extension, cascade invalidation, engulfing candles)
- Delegates persistence to the `PriceMoveRepository` port
- Exposes lifecycle helpers: `add`, `addCandle`, `buildFromCandles`, `archiveOrphanedStructures`, `pruneClosedMoves`, `clear`
- Exposes query helpers: `getGrowingMoves`, `getReferenceMoves`, `getArchivedMoves`, `getStack`, `getMove`, `getLayers`, `validateStructure`

It is **not** a pure domain entity because (a) it depends on a repository port and (b) it implements process orchestration, not invariants of a single aggregate. The `PriceMove` entity itself owns the invariants (extension, termination, rang recalculation).

### `PriceMove` (`packages/core/src/domain/price-move/PriceMove.ts`)

The aggregate root. Owns its own lifecycle (`processCandidate`, `terminate`, `archive`), its child references (`addSubStructure`), and its rang/degré recalculation. See [data-models.md](./data-models.md).

### Use Cases (`packages/core/src/application/use-cases/`)

Thin, focused operations:
- `BuildPriceMovesFromCandles` — bulk candle → PriceMove ingestion through `PriceMoveStructure`
- `BuildRecursiveFractal` — traverses `subStructures` from a list of roots to produce `FractalLayer[]`
- `FractalPriceMoveBuilder` — alternative builder (older API surface)
- `FetchCandlesUseCase` — orchestrates `CandleRepository` to pull data

### Ports (`packages/core/src/application/ports/`)

- `PriceMoveRepository` — 9 methods: `save`, `findById`, `findAll`, `findByState`, `findGrowing`, `findReference`, `findArchived`, `removeArchived`, `clear`. No `findActive` (removed during refactor).
- `CandleRepository` — re-exported from `domain/candle/index.ts` for convenience.
- `PriceMoveRepositoryFactory` — `() => PriceMoveRepository`.

### Infrastructure

- `InMemoryPriceMoveRepository` — `Map<string, PriceMove>`-backed, the only repository implementation currently shipped.
- `CachedCandleRepository` + `BinanceCandleApi` — fetch + local file cache (`.cache/`).
- `ConsoleLogger` — default `Logger` implementation.
- `PriceMoveTreeFilePrinter`, `PriceMoveLoggerFile`, `FractalLayerExporter` — file output to `.logs/`.

---

## Cross-Package: Visualizer

`packages/visualizer/` is a Vue 3 + Observable Plot application that consumes `@fractal-price-structure/core` as a workspace dependency. It mirrors the layered structure (`domain/visualization`, `application/ports`, `infrastructure/plot`, `infrastructure/loaders`) and is documented separately — see [visualizer-guide.md](./visualizer-guide.md).

---

## Known Issues / Technical Debt

| Severity | Issue | Location |
|----------|-------|----------|
| High | Build (`pnpm build`) is broken: `tsc` compiles `*.test.ts` files which contain pre-existing TypeScript strict-mode errors (`noUncheckedIndexedAccess` violations, missing `beforeEach` import, narrowed-type comparisons in `PriceMoveState.test.ts`). Tests still pass via Vitest — the issue is the production build pipeline only. **Fix path**: exclude `**/*.test.ts` from `tsconfig.json` `include` or use a separate `tsconfig.build.json`. |
| High | Legacy code at repo root: `/src/` is the pre-monorepo codebase still present on disk. It references the old `domain/structure/PriceMoveStructure` path and is **not** wired into any build. Candidate for deletion. |
| Medium | `FractalLayerExporter` (infrastructure/exporters/) consumes the deprecated `origin` / `confirmedOrigins` getters. The fields are no-ops on the new model — `originIds` is always `[]`. The exporter shape is preserved for compatibility but should be migrated to read `referenceLevels` directly. See [data-models.md](./data-models.md) JSON section. |
| Medium | `Reference → Archived` transition is not automatic. When a parent terminates, its already-terminated children remain in `Reference` state. The only way to advance them is to call `PriceMoveStructure.archiveOrphanedStructures(beforeTimestamp)` explicitly. |
| Medium | The promotion mechanism described in protocole §12.4 (Reference-level structure being absorbed by a new parent) is documented in the spec but **not implemented** in `PriceMoveStructure`. |
| Low | `docs/validation-protocole.md` records several spec-vs-code drift items that need to be arbitrated (either the protocol is the ground truth and the code must change, or vice-versa). |
| Low | A port (`CandleRepository`) is re-exported from `domain/candle/index.ts`. Functionally harmless, but technically a layer boundary violation (domain referencing application). |

---

## Build & Test

```bash
pnpm install
pnpm test                           # runs all package tests via Vitest
pnpm --filter @fractal-price-structure/core test
pnpm visualizer:dev                 # Vite dev server for the visualizer
pnpm build                          # currently FAILS — see Known Issues
```

See [development-guide.md](./development-guide.md) for a full command reference.

---

*Last updated: 2026-05-16 — after DDD refactor + dead-code purge.*
