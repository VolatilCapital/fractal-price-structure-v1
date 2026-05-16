# Source Tree Analysis

> Snapshot of the repository layout. For architectural context, see [architecture.md](./architecture.md). For data structures, see [data-models.md](./data-models.md).

---

## Repository Root

```
fractal-price-structure/
├── packages/                     # pnpm workspaces (active code)
│   ├── core/                     # @fractal-price-structure/core
│   └── visualizer/               # @fractal-price-structure/visualizer
├── docs/                         # Documentation (this directory)
├── tests/e2e/                    # Playwright end-to-end tests
├── resources/                    # Fixture data (candle JSON files)
├── src/                          # LEGACY pre-monorepo code (not wired)
├── _bmad/                        # BMad workflow framework
├── _bmad-output/                 # BMad-generated artifacts
├── .claude/                      # Claude Code config (commands, skills, audio)
├── .cache/                       # Cached Binance candles (gitignored)
├── .logs/                        # CLI run output (gitignored)
├── screenshots/                  # Visualizer screenshots (gitignored)
├── package.json                  # Root workspace manifest
├── pnpm-workspace.yaml           # pnpm workspace config
├── tsconfig.json                 # Root TS config
├── biome.json                    # Lint + format config
├── playwright.config.ts          # E2E test config
├── README.md
├── CLAUDE.md                     # AI-assistant guidance
└── AI_CONTEXT.md                 # Ecosystem audit summary
```

---

## `packages/core/` — Core Library

```
packages/core/
├── package.json                  # name: @fractal-price-structure/core
├── tsconfig.json                 # NodeNext, ES2022, strict, noUncheckedIndexedAccess
├── vitest.config.ts
├── src/
│   ├── FractalEngine.ts          # Facade — public entry point
│   ├── main.ts                   # CLI demo (BTCUSDT 1m fetch + build + export)
│   ├── index.ts                  # Public re-exports
│   │
│   ├── domain/                   # Pure business model — no infra dependencies
│   │   ├── candle/
│   │   │   ├── Candle.ts         # Candle interface + isCandle + validateCandle
│   │   │   ├── CandleFactory.ts  # Factory + InvalidCandleError
│   │   │   └── index.ts          # Barrel — also re-exports CandleRepository port
│   │   ├── logger/
│   │   │   └── Logger.ts         # Logger interface + noopLogger
│   │   ├── price-move/
│   │   │   ├── PriceMove.ts          # The aggregate root
│   │   │   ├── PriceMoveId.ts        # UUID or deterministic-index ID
│   │   │   ├── PriceMoveState.ts     # Growing / Reference / Archived
│   │   │   ├── Polarity.ts           # Up / Down (lowercase strings)
│   │   │   ├── PriceMoveFactory.ts   # createPriceMoveFromCandle(WithIndex)
│   │   │   └── ReferenceLevel.ts     # Pivot data
│   │   └── structure/
│   │       └── FractalLayer.ts   # { level, moves[] }
│   │
│   ├── application/              # Orchestration + ports + use cases
│   │   ├── orchestrator/
│   │   │   └── PriceMoveStructure.ts   # Lifecycle service (add, terminate, archive)
│   │   ├── ports/
│   │   │   ├── PriceMoveRepository.ts        # 9-method port
│   │   │   ├── PriceMoveRepositoryFactory.ts # () => PriceMoveRepository
│   │   │   └── CandleRepository.ts           # Candle source port
│   │   └── use-cases/
│   │       ├── BuildPriceMovesFromCandles.ts # Bulk candle ingestion
│   │       ├── BuildRecursiveFractal.ts      # buildRecursiveFractalRoots(roots, max)
│   │       ├── FractalPriceMoveBuilder.ts    # Alternative builder
│   │       └── FetchCandlesUseCase.ts        # Candle-fetch orchestration
│   │
│   ├── infrastructure/           # External adapters
│   │   ├── adapters/
│   │   │   ├── PriceMoveExporter.ts          # toJSON(move) — recursive tree
│   │   │   ├── PriceMoveLogger.ts            # In-memory logger
│   │   │   ├── PriceMoveLoggerFile.ts        # File logger (.logs/)
│   │   │   ├── PriceMoveTreePrinter.ts       # Pretty-printer
│   │   │   └── PriceMoveTreeFilePrinter.ts   # Pretty-printer → file
│   │   ├── api/
│   │   │   └── BinanceCandleApi.ts           # REST klines fetcher
│   │   ├── exporters/
│   │   │   └── FractalLayerExporter.ts       # layer-N.json per-rang dump
│   │   ├── logging/
│   │   │   └── ConsoleLogger.ts              # Default Logger impl
│   │   └── repositories/
│   │       ├── InMemoryPriceMoveRepository.ts  # Map-backed (only impl)
│   │       └── CachedCandleRepository.ts       # Binance + local file cache
│   │
│   └── shared/                   # Cross-cutting value objects
│       ├── Price.ts              # big.js arithmetic (gt/lt/eq/min/max/add/sub)
│       ├── PriceRange.ts         # { low, high } + extendWith + contains
│       ├── TimeRange.ts          # { start, end } + extendWith + includes
│       └── Candle.ts             # DEPRECATED re-export
│
└── dist/                         # Build output (gitignored, currently broken)
```

**Test files** (357 tests total): co-located `*.test.ts` alongside their subjects.

---

## `packages/visualizer/` — Vue.js Visualizer

```
packages/visualizer/
├── package.json                  # name: @fractal-price-structure/visualizer
├── vite.config.ts
├── index.html                    # Vite entry
├── src/
│   ├── App.vue                   # Root Vue component
│   ├── main.ts                   # Vite/Vue bootstrap
│   ├── index.ts                  # Library entry (for tests)
│   ├── btc-demo.ts               # Terminal debug demo
│   ├── shims-vue.d.ts            # Vue SFC ambient declarations
│   ├── shims/
│   │   └── crypto.ts             # Browser shim for crypto.randomUUID
│   │
│   ├── domain/
│   │   ├── events/               # StructureEvent + EventFilter + EventDeriver
│   │   └── visualization/        # FilterState, ZoomState, PlaybackState,
│   │                             #   StateColors, DataSource, VisualizationState
│   │
│   ├── application/
│   │   └── ports/                # CandleLoader, ChartRenderer
│   │
│   └── infrastructure/
│       ├── loaders/              # JsonCandleLoader
│       └── plot/                 # Observable Plot marks:
│                                 #   CandlestickMark, PriceMoveMark,
│                                 #   FractalLayersMark, TimeCursorMark,
│                                 #   EventHighlightMark, HoverDecorator,
│                                 #   ChartOptimizer
└── public/                       # Static assets
```

---

## `docs/` — Documentation

```
docs/
├── index.md                    # This directory's TOC
├── protocole-construction.md   # Authoritative spec — DO NOT MODIFY casually
├── specification-fractale.md   # Complementary concepts (Rang vs Degré)
├── fractal-logic.md            # English logic notes
├── data-models.md              # Domain model reference (this update)
├── architecture.md             # Layered architecture (this update)
├── source-tree-analysis.md     # This file
├── development-guide.md        # Setup + workflow
├── visualizer-guide.md         # Visualizer usage
├── validation-protocole.md     # Spec-vs-code drift log
├── project-overview.md         # High-level summary
└── project-scan-report.json    # Auto-generated scan
```

---

## `tests/e2e/`

Playwright tests targeting the visualizer dev server. Currently a small surface — extension is open.

---

## `src/` (root) — LEGACY

Pre-monorepo code, parallel to `packages/core/src/`. Still references the old layout (`domain/structure/PriceMoveStructure.ts`). **Not** included in any pnpm workspace, not imported by anything in `packages/*`. Marked for removal — see Known Issues in [architecture.md](./architecture.md).

---

*Last updated: 2026-05-16 — after DDD refactor + dead-code purge.*
