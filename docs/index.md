# Project Documentation Index

## Fractal Price Structure

> TypeScript tool for generating hierarchical fractal structures from candlestick price data.

---

## Project Overview

| Attribute | Value |
|-----------|-------|
| **Type** | pnpm monorepo (`packages/core` + `packages/visualizer`) |
| **Language** | TypeScript 5.9.x |
| **Runtime** | Node.js (ES Modules, NodeNext resolution) |
| **Architecture** | Clean/Hexagonal (DDD) |
| **Data Source** | Binance REST API + JSON fixtures |
| **Tests** | Vitest — 357 tests in core (all passing) |

### Quick Reference

- **Library Entry Point**: `packages/core/src/index.ts` (re-exports `FractalEngine`)
- **CLI Entry Point**: `packages/core/src/main.ts`
- **Tech Stack**: TypeScript, Node.js, axios, luxon, big.js, Vue 3, Observable Plot, Vitest, Biome
- **Architecture Pattern**: Clean Architecture with Domain-Driven Design
- **Primary Domain Entity**: `PriceMove` (states: Growing / Reference / Archived)

---

## Generated Documentation

### Core Documentation

| Document | Description |
|----------|-------------|
| [Protocole de Construction](./protocole-construction.md) | **Reference** - Authoritative specification for fractal construction rules |
| [Spécification Fractale](./specification-fractale.md) | Complementary concepts (Rang vs Degré) |
| [Fractal Logic](./fractal-logic.md) | Logic specification (English) |
| [Project Overview](./project-overview.md) | High-level project summary and purpose |
| [Architecture](./architecture.md) | Detailed architecture documentation with diagrams |
| [Data Models](./data-models.md) | Domain entities, value objects, and relationships |
| [Source Tree Analysis](./source-tree-analysis.md) | Annotated directory structure |
| [Development Guide](./development-guide.md) | Setup, commands, and development workflow |

### Not Generated (Not Applicable)

- **API Contracts** - This is a library/CLI tool, not an HTTP service
- **Deployment Guide** - No deployment configuration found
- **UI Components** - Backend-only project

---

## Existing Documentation

| Document | Type | Description |
|----------|------|-------------|
| [README.md](../README.md) | Readme | Basic project description |
| [CLAUDE.md](../CLAUDE.md) | AI Guide | Detailed guidance for AI assistants |

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm v8+

### Quick Start

```bash
# Install dependencies
npm install

# Run the application
npm run dev
```

### Output

After running, check:
- `.cache/` - Cached candle data
- `.logs/` - Execution logs
- `.logs/fractal-layers/` - Exported JSON layers

---

## Architecture Summary

```
packages/core/src/
├── FractalEngine.ts      # Facade (public entry)
├── domain/               # PriceMove, Polarity, PriceMoveState, Candle, FractalLayer
├── application/          # PriceMoveStructure (orchestrator), ports, use cases
├── infrastructure/       # Binance API, in-memory repo, exporters, console logger
└── shared/               # Price, PriceRange, TimeRange (big.js)
```

### Key Domain Concepts

1. **PriceMove**: Directional price movement (Up/Down) with three lifecycle states
2. **PriceMoveState**: `Growing → Reference → Archived` (one-way transitions)
3. **Extension Logic**: 3-outcome `processCandidate` — `extended-boundary` / `extended-internal` / `broken`
4. **Reference Levels**: Per-move pivot history; invalidation checks against `currentReferenceLevel` (protocole §3.3)
5. **Fractal Layers**: `rang`-indexed bottom-up grouping; `degre` is the top-down counterpart

---

## Technical Debt & Known Issues

| Severity | Issue |
|----------|-------|
| 🔴 High | `pnpm build` is broken — `tsc` compiles `*.test.ts` which contain pre-existing strict-mode errors. Tests pass via Vitest. Fix: exclude tests from build tsconfig. |
| 🔴 High | Legacy `/src/` directory at repo root is still on disk but unwired. Candidate for deletion. |
| 🟡 Medium | `Reference → Archived` transition is not automatic on parent termination — requires explicit `archiveOrphanedStructures()` call. |
| 🟡 Medium | Promotion mechanism (protocole §12.4) is described in the spec but not implemented in `PriceMoveStructure`. |
| 🟡 Medium | `FractalLayerExporter` still reads deprecated `origin` / `confirmedOrigins` getters (the former is always `[]`). Migrate to `referenceLevels`. |
| 🟢 Low | `docs/validation-protocole.md` lists spec-vs-code drift that needs arbitration. |
| 🟢 Low | `CandleRepository` port is re-exported from `domain/candle/index.ts` (technical layer leak, benign). |

### Resolved since the previous audit

- Vitest installed and 357 tests passing in core.
- `PriceMoveStructure` moved from domain to `application/orchestrator/`.
- `shared/Candle.ts` reduced to a deprecated re-export of `domain/candle/Candle.ts` — single source of truth.
- `Logger` interface threaded through; no `console.log` left in domain code.

---

## Next Steps for Development

1. Fix the build (exclude `**/*.test.ts` from `tsconfig.json` or add `tsconfig.build.json`).
2. Decide and act on the legacy `/src/` directory at repo root.
3. Migrate `FractalLayerExporter` away from the deprecated `origin` / `confirmedOrigins` getters.
4. Arbitrate the spec-vs-code drift items in `validation-protocole.md`.
5. Implement protocole §12.4 promotion, or document its absence as a deliberate scope cut.
6. Consider auto-archiving children when a parent terminates (or document the manual workflow).

---

*Last updated: 2026-05-16 — after DDD refactor + dead-code purge.*
