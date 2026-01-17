---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
classification:
  projectType: developer_tool
  domain: fintech
  complexity: high
  projectContext: brownfield
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-fractal-price-structure-2026-01-16.md
  - docs/index.md
  - docs/project-overview.md
  - docs/architecture.md
  - docs/data-models.md
  - docs/development-guide.md
  - docs/source-tree-analysis.md
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 6
workflowType: 'prd'
date: 2026-01-17
author: Maître
---

# Product Requirements Document - fractal-price-structure

**Author:** Maître
**Date:** 2026-01-17

## Executive Summary

**Product:** fractal-price-structure - A TypeScript library for building generation-based fractal price structures from candlestick data.

**Vision:** Replace arbitrary multi-timeframe analysis with a single, precise fractal hierarchy where generations emerge from price structure itself, not time boundaries.

**Target User:** Expert algorithmic trader/developer building proprietary trading tools.

**Differentiator:** Generation-based fractal structure preserves complete structural detail while traditional timeframe-based approaches lose information through aggregation. Price levels where multiple generations share a break threshold represent structural liquidity zones.

**Project Context:** Brownfield (existing prototype), internal private library, solo developer.

**Phase:** MVP focused on core fractal logic correctness before adding features.

## Success Criteria

### User Success

The primary user (expert algorithmic trader/developer) achieves success when:

- **Integration Ready**: Library integrates cleanly via pnpm as a standard dependency into existing TA infrastructure
- **Foundation for Patterns**: Library provides a solid, well-structured base that enables building a pattern detection system on top
- **API Clarity**: Public API is clean, encapsulated, and works identically for historical replay and real-time feeds
- **Scale Handling**: Supports 500k+ candles (1 year @ 1min) without performance degradation

### Technical Success

| Criterion | Target |
|-----------|--------|
| Structure Correctness | Fractal hierarchy matches expected behavior for all test cases |
| Break Detection | Cascade breaks correctly propagate through all affected generations |
| Extension Logic | Moves extend or close according to defined rules |
| Generation Tracking | Each move correctly inherits parent generation + 1 |
| Memory Stability | No OOM on 5M+ candle datasets |
| Test Coverage | Comprehensive Vitest suite with 100% pass rate on domain rules |
| Architecture | Clean DDD/Hexagonal, no domain leakage |

### Validation Success

The "Aha!" moment occurs when:

1. **Visual Verification**: Watching fractal structures advance in real-time, seeing moves extend, close, and nest correctly
2. **Inspection Capability**: Browsing active moves listing and events listing (breaks, extensions, englobments)
3. **Navigation**: Ability to navigate within the structure and manually verify fractal correctness
4. **Auto-Verification**: Automated system that validates the fractal concept is correctly implemented

### Measurable Outcomes

| Outcome | Measurement |
|---------|-------------|
| Pattern-Ready Foundation | Successfully supports building pattern detection layer (Phase 2) |
| Visual Validation Complete | Fractal structures verified correct through visual inspector on multiple datasets |
| Test Suite Complete | All domain rules covered with passing tests |
| Auto-Verification System | Automated checks confirm fractal invariants hold |

## Product Scope

### MVP - Minimum Viable Product

**Core Library (packages/core):**
- Fractal structure construction from raw candles
- Break/extension logic with correct propagation
- Generation tracking (parent generation + 1)
- Structure break events emission
- Memory pruning (active structures only)
- Clean public API (DDD-encapsulated)
- Comprehensive Vitest test suite

**Visualizer (packages/visualizer or integrated):**
- ASCII art console output for quick validation
- Active moves listing
- Events listing (breaks, extensions, closures)
- Structure navigation for manual verification

**Auto-Verification:**
- Invariant checks for fractal correctness
- Automated validation that structure rules are respected

### Growth Features (Post-MVP)

- Observable Plot + Vue.js interactive visualizer
- Real-time WebSocket integration for live feeds
- Pattern detection layer (separate package)
- Enhanced navigation and filtering in visualizer

### Vision (Future)

- Complete pattern detection system built on fractal foundation
- Real-time trading signals based on structural liquidity
- Research platform for validating price structure theories
- Foundation for algorithmic trading strategies

## User Journeys

### Journey 1: Real-Time Structure Observation (Primary Path)

**Persona:** Maître, expert algo-trader/developer building proprietary trading tools

**Opening Scene:**
Maître launches his trading analysis environment. He wants to observe how the fractal structure evolves as new candles arrive from Binance, validating that the library correctly captures structural liquidity zones in real-time.

**Rising Action:**
1. Initializes the fractal engine with a WebSocket connection to Binance (or simulated real-time feed)
2. Watches as each new candle arrives and triggers structure updates
3. Observes active moves extending, new moves being born, and old moves closing
4. Sees events firing: "Move G3 extended", "Move G5 closed - break detected", "Cascade propagated to G2"
5. Monitors the active moves listing updating in real-time
6. Notes structural liquidity zones where multiple generations converge

**Climax:**
A significant price break occurs. Maître watches the cascade propagate through multiple generations in real-time, exactly as his theory predicts. The events log shows the chain reaction clearly.

**Resolution:**
Maître has visual confirmation that the fractal logic is correct. He can now confidently build pattern detection logic on top of this foundation, knowing the underlying structure is solid.

**Requirements Revealed:**
- Real-time candle ingestion API (identical to batch)
- Event emission system (breaks, extensions, closures, cascades)
- Active moves listing with real-time updates
- Events log/listing
- Generation-level visibility

---

### Journey 2: Step-by-Step Structure Validation (Debug/Verification Path)

**Persona:** Maître in validation mode

**Opening Scene:**
Maître suspects an edge case in the extension logic. He needs to step through candle-by-candle to see exactly how the structure evolves and verify correctness.

**Rising Action:**
1. Loads a historical dataset (e.g., 1000 candles)
2. Steps through one candle at a time (manual advance or slow autoplay)
3. At each step, observes:
   - Which moves are **active** (can still extend)
   - Which moves are **referenced** (closed but still relevant as parents)
   - Which moves are **archived** (fully closed, no active descendants)
4. Sees moves being born, extending, nesting as children, and closing
5. Can pause at any point and inspect the full structure state

**Climax:**
Maître identifies the exact candle where an unexpected behavior occurs. He can see the before/after state and understand why the logic behaved that way.

**Resolution:**
With clear visibility into the step-by-step evolution, Maître can fix the edge case or confirm the behavior is actually correct. The visual inspector becomes his primary debugging tool.

**Requirements Revealed:**
- Step-by-step candle advance (manual control)
- Move state visibility: Active / Referenced / Archived
- Pause and inspect at any point
- Clear before/after visualization per step
- Same API as real-time (unified interface)

---

### Journey 3: Point-in-Time Structure Exploration (Backtest/Research Path)

**Persona:** Maître exploring historical data

**Opening Scene:**
Maître wants to analyze a specific historical moment - a major market event - and see what the fractal structure looked like at that exact point in time.

**Rising Action:**
1. Loads a large historical dataset
2. Navigates to a specific timestamp (or clicks on a chart point)
3. Views the complete fractal stack at that moment:
   - All generations visible
   - Parent-child relationships clear
   - Can drill down into any generation
4. Compares structure at different points in time
5. Identifies where structural liquidity zones existed

**Climax:**
Maître sees exactly how the fractal structure was arranged before a major price move, confirming his theory about structural liquidity predicting breaks.

**Resolution:**
Armed with this historical validation, Maître has data points to refine his pattern detection algorithms for Phase 2.

**Requirements Revealed:**
- `getStack(timestamp)` API for point-in-time queries
- Generation navigation (expand/collapse levels)
- Timestamp-based navigation
- Historical dataset replay
- Consistent data model whether real-time or historical

---

### Journey 4: Library Integration (Developer Path)

**Persona:** Maître integrating the library into a larger project

**Opening Scene:**
Maître starts building a pattern detection system. He needs to add fractal-price-structure as a dependency and wire it into his existing TA infrastructure.

**Rising Action:**
1. Adds the library via `pnpm add fractal-price-structure`
2. Imports the public API - clean, well-documented entry points
3. Wires up his candle source (Binance adapter or custom)
4. Subscribes to structure events (onBreak, onExtend, onCascade)
5. Queries the current structure state as needed
6. Builds pattern detection logic that consumes the fractal data

**Climax:**
The integration works seamlessly. The API is intuitive, the types are correct, and the library behaves identically whether fed historical or real-time data.

**Resolution:**
The library serves as a solid foundation. Maître can focus on higher-level pattern logic without worrying about the underlying fractal mechanics.

**Requirements Revealed:**
- Clean public API surface
- npm/pnpm package distribution
- TypeScript types exported
- Event subscription system
- Unified API for batch and streaming
- No leaky abstractions

---

### Journey Requirements Summary

| Journey | Key Capabilities Required |
|---------|--------------------------|
| Real-Time Observation | Streaming candle API, event emission, live active moves listing, events log |
| Step-by-Step Validation | Manual step control, move state visibility (Active/Referenced/Archived), pause/inspect |
| Point-in-Time Exploration | `getStack(timestamp)` API, generation navigation, timestamp navigation |
| Library Integration | Clean public API, TypeScript types, event subscriptions, unified batch/stream interface |

**Cross-Cutting Requirement:**
The API must be **identical** whether consuming historical data (batch) or real-time data (streaming). This simplifies both the library design and the user's mental model.

## Domain-Specific Requirements

### Technical Quality Constraints

This library operates in the fintech domain (algorithmic trading analysis) but does not handle money, execute trades, or store sensitive user data. Therefore, traditional fintech compliance (KYC, AML, PCI-DSS) does not apply. The relevant domain constraints are:

| Constraint | Requirement | Rationale |
|------------|-------------|-----------|
| **Calculation Precision** | Use `big.js` for all price calculations | Avoid floating-point errors in financial data |
| **Reproducibility** | Deterministic output: same candle sequence = same fractal structure | Essential for backtesting and debugging |
| **Real-Time Performance** | Sub-second latency per candle ingestion | Required for live trading analysis |
| **Data Source** | Public market data only (Binance API) | No sensitive or proprietary data handling |

### Reliability Requirements

| Requirement | Target |
|-------------|--------|
| Memory Stability | No OOM on 5M+ candle datasets |
| Deterministic Behavior | 100% reproducible results given same input |
| Error Handling | Graceful handling of malformed candle data |
| State Consistency | Structure invariants always hold after any operation |

## Innovation & Novel Patterns

### Detected Innovation Areas

**Core Innovation: Generation-Based Fractal Structure**

This project introduces a fundamentally different approach to price structure analysis:

| Traditional Approach | Fractal Price Structure |
|---------------------|------------------------|
| Multiple timeframes (1h, 4h, D) | Single generation-based hierarchy |
| Arbitrary time boundaries | Structure-defined boundaries (breaks) |
| Information lost through aggregation | Full structural detail preserved |
| Timeframe = primary concept | Generation = primary concept |

**Key Insight:** Price levels where multiple generations share a break threshold represent structural liquidity zones. When broken, cascades propagate across generations - a potentially exploitable, detectable event.

### Research & Exploration Focus

This is an **exploratory research project**, not hypothesis validation. The goal is to:

1. Build a precise representation of deep fractal structure
2. Observe what patterns emerge from the data
3. Explore repeatable patterns across different market conditions
4. Investigate practical applications (stop loss movements, price complexity analysis)

### Intrinsic Value (Independent of Pattern Discovery)

Even without discovering predictive patterns, the fractal structure provides:

| Application | Value |
|-------------|-------|
| **Price Movement Visualization** | Precise view of how price actually moves through nested structures |
| **Stop Loss Analysis** | Understanding of where stops cluster and how they cascade |
| **Complexity Measurement** | Quantifiable measure of price "complexity" at any given moment |
| **Research Foundation** | Platform for systematic exploration of price structure theories |

### Validation Approach

Since this is exploratory research:

1. **Visual Validation First**: Watch structures build, verify they match intuition
2. **Pattern Emergence**: Observe what recurring patterns naturally appear
3. **Backtesting**: Test discovered patterns on historical data
4. **Iteration**: Refine understanding based on observations

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| No predictive patterns found | Intrinsic value remains (visualization, complexity, research platform) |
| Structure too complex | Memory pruning, focus on active structures only |
| Edge cases in fractal logic | Comprehensive test suite + visual inspector for debugging |

## Developer Tool Specific Requirements

### Project-Type Overview

This is an **internal TypeScript library** designed for integration into a private ecosystem of trading analysis tools. It is not published to npm but consumed directly from a private GitHub repository.

**Distribution Model:**
- Private GitHub repository
- Consumed via Git URL in package.json: `"fractal-price-structure": "git+ssh://git@github.com:user/fractal-price-structure.git"`
- TypeScript source with compiled JavaScript output
- Full type definitions included

### Language & Platform Support

| Aspect | Specification |
|--------|---------------|
| **Language** | TypeScript 5.x (strict mode) |
| **Target** | ES2022 |
| **Module System** | ESM (NodeNext) |
| **Runtime** | Node.js 18+ |
| **Other Languages** | Not supported (TypeScript only) |

### Installation Method

```bash
# Via Git URL (private repo)
pnpm add git+ssh://git@github.com:user/fractal-price-structure.git

# Or in package.json
"dependencies": {
  "fractal-price-structure": "git+ssh://git@github.com:user/fractal-price-structure.git#main"
}
```

### API Surface

**Core API (MVP):**

| Method | Description |
|--------|-------------|
| `buildFromCandles(candles[])` | Construct complete fractal structure from historical candle array |
| `addCandle(candle)` | Incremental update - add single candle to existing structure |
| `getStack(timestamp)` | Get complete fractal state at a specific point in time |
| `getMove(generation, timestamp)` | Get specific generation's active move at time T |
| `onStructureBreak(callback)` | Subscribe to cascade break events |
| `getActiveMoves()` | Get all currently active moves across all generations |
| `getEvents(options?)` | Get event log (breaks, extensions, closures) |

**API Design Principles:**
- Unified interface for batch and streaming use cases
- Same method (`addCandle`) works identically for historical replay and real-time feed
- Event-driven architecture for structure changes
- Immutable return values (no leaky internal references)

### Documentation Strategy (LLM-Optimized)

Documentation designed for consumption by LLM assistants (Claude, GPT):

| Document | Purpose | Format |
|----------|---------|--------|
| **CLAUDE.md** | Complete architecture, patterns, domain rules, usage | Markdown with examples |
| **README.md** | Quick start, installation, basic usage | Concise markdown |
| **TSDoc comments** | Public API documentation | Inline in source |
| **examples/** | Usage patterns and common scenarios | TypeScript files |

**LLM Documentation Principles:**
- Clear architecture description in CLAUDE.md
- Domain concepts explained (PriceMove, generation, extension, break)
- Code examples showing common patterns
- Explicit invariants and rules
- No generated documentation (TypeDoc) - source + CLAUDE.md is sufficient

### Code Quality Standards

| Aspect | Standard |
|--------|----------|
| **Testing** | Vitest with comprehensive domain rule coverage |
| **Linting** | ESLint with TypeScript strict rules |
| **Architecture** | Clean/Hexagonal (DDD), domain layer isolated |
| **Types** | Strict TypeScript, no `any` |
| **Exports** | Clean public API surface, internal implementation hidden |

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP - Focus on getting the core fractal logic correct before adding features.

**Core Challenge:** The extension/invalidation/archiving logic and fractal management is the primary technical risk. The initial implementation approach may need rethinking for clarity and correctness.

**MVP Philosophy:**
- Get the domain logic right first
- Validate visually with minimal debug output
- Add features only after core is proven correct

### MVP Feature Set (Phase 1)

**Core User Journey Supported:** Step-by-Step Validation (Journey 2) - ability to verify correctness.

**Must-Have Capabilities:**

| Priority | Capability | Rationale |
|----------|------------|-----------|
| P0 | Fractal structure construction | Core purpose of the library |
| P0 | Extension logic (move extends on directional break) | Fundamental domain rule |
| P0 | Invalidation logic (move closes on opposite break) | Fundamental domain rule |
| P0 | Child move attachment (internal moves) | Fractal hierarchy building |
| P0 | Generation tracking (parent gen + 1) | Core fractal concept |
| P0 | Debug output mode | Essential for validation |
| P1 | Vitest test suite for domain rules | Confidence in correctness |
| P1 | Active moves listing | Verify structure state |

**Explicitly Deferred from MVP:**
- Events system (onBreak, onExtend, etc.)
- Memory pruning/archiving optimization
- `getStack(timestamp)` point-in-time queries
- Visualizer beyond basic debug output
- Auto-verification system

### Phase 2: Post-MVP Enhancements

| Feature | Dependency |
|---------|------------|
| Event emission system | Core logic stable |
| Memory pruning (archive closed structures) | Core logic stable |
| `getStack(timestamp)` API | Core logic stable |
| Active/Referenced/Archived state visibility | Memory pruning |
| Events log/listing | Event system |

### Phase 3: Expansion

| Feature | Dependency |
|---------|------------|
| ASCII visualizer with navigation | Phase 2 complete |
| Real-time WebSocket integration | Events system |
| Observable Plot + Vue.js visualizer | Phase 2 complete |
| Pattern detection layer (separate package) | Core lib proven |

### Risk Mitigation Strategy

**Technical Risk: Core Logic Complexity**

| Risk | Mitigation |
|------|------------|
| Extension/invalidation logic unclear | Clear domain rules documented before coding |
| Edge cases in fractal behavior | Comprehensive test cases written first (TDD) |
| Previous approach inefficient | Fresh architecture review before implementation |
| Debugging difficult | Debug output mode from day 1 |

**Recommended Approach:**
1. Document all domain rules explicitly (extension, invalidation, child attachment, generation inheritance)
2. Write test cases for each rule before implementation
3. Implement with debug output to visually verify
4. Iterate until behavior matches expected outcomes

**Resource Context:**
- Solo developer project
- No external deadline pressure
- Can iterate until correct

## Functional Requirements

### Candle Ingestion

- **FR1:** System can ingest a single candle and update the fractal structure incrementally
- **FR2:** System can ingest an array of candles and build the complete fractal structure in batch
- **FR3:** System accepts candles with OHLCV data (open, high, low, close, volume, timestamps)

### Fractal Structure Construction

- **FR4:** System can create a new PriceMove from a candle with correct polarity (Up if close >= open, Down otherwise)
- **FR5:** System can extend an active move when a candidate breaks its directional boundary
- **FR6:** System can close/invalidate an active move when a candidate breaks the opposite boundary
- **FR7:** System can attach a candidate as a child move when it fits within parent boundaries without extending or invalidating
- **FR8:** System can track generation for each move (child inherits parent generation + 1)
- **FR9:** System can maintain parent-child relationships (englobingMove, childMoves)
- **FR10:** System can track move origins (initial source moves) and confirmed origins (moves that extended)

### Structure State Management

- **FR11:** System can distinguish between Active moves (can still extend) and Closed moves (terminated)
- **FR12:** System can retrieve all currently active moves across all generations
- **FR13:** System can retrieve all moves (active and closed) in the structure
- **FR14:** System maintains structure consistency after any candle ingestion

### Structure Querying

- **FR15:** Developer can query the complete fractal state at a specific timestamp (getStack)
- **FR16:** Developer can query a specific generation's active move at a given timestamp
- **FR17:** Developer can iterate through fractal layers by depth level

### Debug & Validation

- **FR18:** System can output debug information showing structure state after each candle
- **FR19:** System can display active moves listing with key properties (id, polarity, price range, time range, generation)
- **FR20:** System can log move lifecycle events (creation, extension, closure) for debugging

### API & Integration

- **FR21:** Developer can import the library as an ES module with TypeScript types
- **FR22:** Developer can use the same API for both batch (historical) and streaming (real-time) use cases
- **FR23:** Library exposes a clean public API surface without leaking internal domain objects

### Data Precision

- **FR24:** System uses precise decimal arithmetic for all price calculations (no floating-point errors)
- **FR25:** System produces deterministic output: same candle sequence always produces same structure

## Non-Functional Requirements

### Performance

| NFR | Requirement | Measurement |
|-----|-------------|-------------|
| **NFR1** | Single candle ingestion completes in sub-second time | < 100ms per `addCandle()` call on standard hardware |
| **NFR2** | Batch construction of 500k candles completes in acceptable time | < 60 seconds for 500k candles |
| **NFR3** | Memory usage scales linearly with active structure size | No exponential memory growth patterns |

### Scalability

| NFR | Requirement | Measurement |
|-----|-------------|-------------|
| **NFR4** | System handles 500k+ candles (1 year @ 1min) without degradation | All operations remain performant at this scale |
| **NFR5** | System handles 5M+ candles without OOM | Memory pruning keeps working set bounded |
| **NFR6** | Generation depth can grow unbounded without failure | No arbitrary limits on fractal depth |

### Reliability

| NFR | Requirement | Measurement |
|-----|-------------|-------------|
| **NFR7** | Same input always produces same output (determinism) | 100% reproducible results across runs |
| **NFR8** | Structure invariants always hold after any operation | No invalid states possible through public API |
| **NFR9** | Malformed candle data is handled gracefully | Error returned, state unchanged, no crash |
| **NFR10** | No memory leaks during long-running sessions | Stable memory footprint over 24h+ operation |

### Maintainability

| NFR | Requirement | Measurement |
|-----|-------------|-------------|
| **NFR11** | Code follows DDD/Hexagonal architecture | Domain layer isolated, no infrastructure leakage |
| **NFR12** | All domain rules are covered by tests | Vitest suite passes with comprehensive coverage |
| **NFR13** | Documentation is LLM-friendly | CLAUDE.md provides complete context for AI assistance |

### Compatibility

| NFR | Requirement | Measurement |
|-----|-------------|-------------|
| **NFR14** | Library works with Node.js 18+ | Tested on Node 18, 20, 22 |
| **NFR15** | TypeScript types are correctly exported | No type errors when importing in consumer projects |
| **NFR16** | ESM module resolution works correctly | Import/export with .js extensions resolves properly |
