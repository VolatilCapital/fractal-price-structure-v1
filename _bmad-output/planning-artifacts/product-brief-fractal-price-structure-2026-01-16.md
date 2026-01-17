---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - _bmad-output/analysis/brainstorming-session-2026-01-16.md
  - docs/index.md
  - docs/project-overview.md
  - docs/architecture.md
  - docs/data-models.md
  - docs/development-guide.md
  - docs/source-tree-analysis.md
date: 2026-01-16
author: Maître
---

# Product Brief: fractal-price-structure

## Executive Summary

Fractal Price Structure is a foundational TypeScript library that constructs complete fractal hierarchies from raw candlestick data. Unlike traditional multi-timeframe analysis—which relies on arbitrary time unit interpretations and loses structural information—this library builds a generation-based fractal structure that captures the full price movement hierarchy at any given moment.

The library serves as a low-level building block for advanced algorithmic trading tools, enabling precise detection of structural liquidity levels (points where multiple generations converge) and cascade break events. Designed with clean architecture principles (DDD/Hexagonal), it prioritizes correctness, testability, and extensibility over feature breadth.

---

## Core Vision

### Problem Statement

Traditional multi-timeframe analysis fundamentally loses information. Each timeframe (1h, 4h, daily) is an arbitrary interpretation of the same underlying price data, creating artificial boundaries that obscure the true fractal structure of price movements.

For algorithmic traders seeking to automate liquidity detection and structural analysis, this creates three critical problems:

1. **Loss of precision**: Timeframe boundaries are arbitrary, not structural
2. **Impossible to automate rigorously**: Manual analysis cannot scale
3. **Existing tools are inadequate**: Built for discretionary trading, not algorithmic research

### Problem Impact

Without a precise, automatable representation of fractal structure:
- Liquidity zones cannot be identified with structural rigor
- Pattern detection relies on subjective interpretation
- Algorithmic strategies lack the foundational data layer they need
- Research into price structure theory cannot be validated systematically

### Why Existing Solutions Fall Short

Current trading tools (TradingView, Order Flow platforms, etc.) are designed for manual, discretionary trading. They:
- Treat timeframes as primary organizational units
- Cannot expose the underlying fractal hierarchy
- Provide no API for algorithmic consumption
- Are not designed for structural research

This project requires a purpose-built solution that implements a specific theoretical framework for price structure analysis.

### Proposed Solution

A TypeScript library that:

1. **Ingests raw candle data** (e.g., 1-minute candles from Binance)
2. **Builds fractal hierarchy** using generation-based logic (not timeframes)
3. **Identifies structural levels** where multiple generations share break points
4. **Emits events** on structure breaks (cascade detection)
5. **Enables navigation** through the complete fractal structure at any point in time

The library follows clean architecture principles:
- **Domain layer**: Pure business logic (PriceMove, generation rules, break detection)
- **Application layer**: Use cases (build structure, query levels, replay history)
- **Infrastructure layer**: Adapters (Binance API, storage, visualization)

### Key Differentiators

| Traditional Approach | Fractal Price Structure |
|---------------------|------------------------|
| Multiple timeframes (1h, 4h, D) | Single generation-based hierarchy |
| Arbitrary time boundaries | Structure-defined boundaries (breaks) |
| Manual pattern recognition | Automatable structural analysis |
| Loses information through aggregation | Preserves full structural detail |
| Timeframe = primary concept | Generation = primary concept |

**Core insight**: A price level where multiple generations share a break threshold is a structural liquidity zone. When broken, it triggers a cascade across generations—an exploitable, detectable event.

---

## Target Users

### Primary User

**Profile: Expert Algorithmic Trader / Developer**

- **Role**: Solo trader-developer building proprietary algorithmic trading tools
- **Technical level**: Expert — comfortable with TypeScript, DDD, clean architecture
- **Domain expertise**: Deep understanding of price structure theory and liquidity mechanics

**Context:**
- Already maintains a technical analysis library with various indicators
- Has charting/visualization tools in the ecosystem
- Needs a foundational building block that integrates cleanly with existing infrastructure

**Current workflow:**
- Manual multi-timeframe analysis or semi-automated approaches
- Lacks a rigorous, automatable fractal structure layer
- Cannot validate structural theories systematically

**Success criteria:**
- Library integrates via pnpm as a standard dependency
- Clean public API with encapsulated domain (no leaky abstractions)
- Same API works for historical replay and real-time feeds
- Supports large datasets (~500k+ candles for 1-year 1-minute data)
- Acceptable latency for real-time use (sub-second, not microsecond)

### Secondary Users

**N/A for Phase 1**

Future tools built on this library may have their own users, but the library itself is internal infrastructure. Any external users would interact through higher-level abstractions, never directly with this library.

### User Journey

**Integration Journey:**

1. **Discovery**: Internal need — no external discovery phase
2. **Installation**: `pnpm add fractal-price-structure` in existing project
3. **First use**: Feed historical candles, inspect resulting structure
4. **Core usage**:
   - Build fractal structure from candle stream
   - Query structure state at any timestamp (`getStack(t)`)
   - Subscribe to structure break events
   - Identify multi-generation liquidity levels
5. **Aha moment**: Seeing the complete fractal hierarchy emerge from raw 1-min data, with liquidity zones clearly identified
6. **Long-term**: Foundation layer for pattern detection tools (Phase 2, separate package)

**API Surface (Expected):**

| Operation | Description |
|-----------|-------------|
| `buildFromCandles(candles[])` | Construct structure from historical data |
| `addCandle(candle)` | Incremental update for real-time feed |
| `getStack(timestamp)` | Get full fractal state at a point in time |
| `getMove(generation, timestamp)` | Get specific generation's move at time T |
| `onStructureBreak(callback)` | Subscribe to cascade break events |

**Non-functional Requirements:**

| Requirement | Target |
|-------------|--------|
| Dataset size | 500k+ candles (1 year @ 1min) |
| Real-time latency | Sub-second processing per candle |
| Memory | Full structure in memory |
| Architecture | DDD/Hexagonal, domain encapsulated |
| Testability | Comprehensive unit + integration tests |

---

## Success Metrics

### Primary Success Criterion

**Correct fractal structure construction** — this is the single most important measure of success. Everything else (events, queries, API) is secondary and straightforward once the core structure is correct.

### Validation Approach

| Method | Purpose |
|--------|---------|
| **Visual inspector** | Step-by-step visualization of structure construction (separate package in monorepo) |
| **Vitest test suite** | Comprehensive automated tests for all domain rules |

The visual inspector allows manual verification of edge cases and intuitive understanding of structure behavior. Automated tests ensure non-regression and rule correctness.

### Functional Success Criteria

| Criterion | Definition of Done |
|-----------|-------------------|
| Structure correctness | Fractal hierarchy matches expected behavior for known test cases |
| Break detection | Cascade breaks correctly propagate through all affected generations |
| Extension logic | Moves extend or close according to defined rules |
| Generation tracking | Each move correctly inherits parent generation + 1 |

### Performance Success Criteria

| Metric | Target |
|--------|--------|
| Dataset capacity | 10 years @ 1min (~5.2M candles) without memory crash |
| Memory strategy | Active structures only; closed structures purged |
| Real-time processing | Sub-second per candle ingestion |
| Past navigation | Recalculate on-demand from raw candles (no persistence of closed structures) |

### Memory Management Strategy

**Forward/Real-time mode:**
- Retain only active structures (those that can still influence current state)
- Purge closed/archived structures — they have no impact on ongoing tracking
- No disk persistence of historical structures

**Historical navigation:**
- Recalculate structure from raw candles when exploring past timestamps
- Accept computation cost as trade-off for memory efficiency
- Raw candles are the source of truth; structure is derived

### Quality Success Criteria

| Criterion | Target |
|-----------|--------|
| Test coverage | Comprehensive Vitest suite covering all domain rules |
| Architecture | Clean DDD/Hexagonal, domain fully encapsulated |
| API stability | Public API well-defined, no leaky abstractions |
| Documentation | Clear usage examples and rule documentation |

### Business Objectives

**N/A** — Internal library, no external business metrics.

Success is measured by:
1. Enabling development of higher-level trading tools
2. Validating price structure theory through systematic testing
3. Providing a reliable foundation for Phase 2 (pattern detection)

### Key Performance Indicators

| KPI | Measurement |
|-----|-------------|
| Structure correctness | 100% pass rate on domain rule test suite |
| Memory stability | No OOM on 5M+ candle datasets |
| Integration readiness | Successfully imported and used in existing TA library |
| Code quality | All tests green, no architecture violations |

---

## MVP Scope

### Project Structure

**Monorepo pnpm** with the following packages:

```
fractal-price-structure/
├── packages/
│   ├── core/           # Main library - fractal structure engine
│   └── visualizer/     # Visualization tools for validation
├── pnpm-workspace.yaml
└── package.json
```

### Core Features (packages/core)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Fractal structure construction** | Build complete hierarchy from raw candles | P0 - Essential |
| **Break/extension logic** | Correct implementation of structure rules | P0 - Essential |
| **Generation tracking** | Each move inherits parent generation + 1 | P0 - Essential |
| **Structure break events** | Emit events on cascade breaks | P0 - Essential |
| **Memory pruning** | Purge closed structures, retain only active | P0 - Essential |
| **Clean public API** | DDD-encapsulated, no leaky abstractions | P0 - Essential |
| **Vitest test suite** | Comprehensive coverage of all domain rules | P0 - Essential |

### Visualizer Features (packages/visualizer)

| Feature | Description | Priority |
|---------|-------------|----------|
| **ASCII art console output** | Quick validation during development | P0 - MVP |
| **Observable Plot + Vue.js** | Interactive tree view and event listing | P1 - Post-MVP enhancement |

The ASCII visualizer is essential for MVP validation. The web-based visualizer (Observable Plot) is a natural evolution for deeper analysis but not blocking for initial release.

### Out of Scope for MVP

| Feature | Rationale | Phase |
|---------|-----------|-------|
| **Pattern detection** | Higher-level concern, separate package | Phase 2 |
| **Disk persistence of closed structures** | Memory pruning is sufficient; recalculate on demand | Phase 2+ |
| **Multi-exchange support** | Binance is sufficient for validation | Phase 2+ |
| **Real-time WebSocket integration** | Historical replay sufficient for MVP validation | Phase 2 |
| **Web-based visualizer** | ASCII sufficient for MVP; Observable Plot later | Phase 1.5 |

### MVP Success Criteria

The MVP is considered complete when:

1. **All tests pass** — 100% green on Vitest suite covering all domain rules
2. **Visual verification** — Structure validated on numerous examples using ASCII visualizer
3. **Structure viability** — Fractal hierarchy judged correct and usable for downstream tools

### MVP Success Gate Checklist

| Criterion | Validation Method |
|-----------|------------------|
| Break logic correct | Unit tests + visual inspection |
| Extension logic correct | Unit tests + visual inspection |
| Generation inheritance correct | Unit tests |
| Cascade propagation correct | Unit tests + visual inspection |
| Memory stable on large datasets | Performance test (500k+ candles) |
| API clean and encapsulated | Code review, no domain leakage |
| Integrates in existing TA library | Integration test |

### Future Vision

**Phase 2: Pattern Detection Layer**
- Separate package in monorepo: `packages/patterns`
- Built on top of core library
- Detect recurring structural patterns
- Provide signals for trading strategies

**Phase 2: Enhanced Visualization**
- Observable Plot + Vue.js/Vuetify web interface
- Interactive fractal tree navigation
- Event timeline with filtering
- Real-time structure updates

**Phase 3: Real-time Integration**
- WebSocket candle feed support
- Live structure updates
- Alert system for significant breaks

**Long-term Vision**
- Foundation for a complete algorithmic trading research platform
- Validate and refine price structure theory through systematic testing
- Enable development of high-probability trading strategies based on structural liquidity
