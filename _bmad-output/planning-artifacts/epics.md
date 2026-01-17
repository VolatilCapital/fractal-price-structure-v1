---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: complete
completedAt: '2026-01-17'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
workflowType: 'epics'
project_name: 'fractal-price-structure'
user_name: 'Maître'
date: '2026-01-17'
---

# fractal-price-structure - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for fractal-price-structure, decomposing the requirements from the PRD and Architecture documents into implementable stories.

## Requirements Inventory

### Functional Requirements

**Candle Ingestion (FR1-FR3)**
- FR1: System can ingest a single candle and update the fractal structure incrementally
- FR2: System can ingest an array of candles and build the complete fractal structure in batch
- FR3: System accepts candles with OHLCV data (open, high, low, close, volume, timestamps)

**Fractal Structure Construction (FR4-FR10)**
- FR4: System can create a new PriceMove from a candle with correct polarity (Up if close >= open, Down otherwise)
- FR5: System can extend an active move when a candidate breaks its directional boundary
- FR6: System can close/invalidate an active move when a candidate breaks the opposite boundary
- FR7: System can attach a candidate as a child move when it fits within parent boundaries without extending or invalidating
- FR8: System can track generation for each move (child inherits parent generation + 1)
- FR9: System can maintain parent-child relationships (englobingMove, childMoves)
- FR10: System can track move origins (initial source moves) and confirmed origins (moves that extended)

**Structure State Management (FR11-FR14)**
- FR11: System can distinguish between Active moves (can still extend) and Closed moves (terminated)
- FR12: System can retrieve all currently active moves across all generations
- FR13: System can retrieve all moves (active and closed) in the structure
- FR14: System maintains structure consistency after any candle ingestion

**Structure Querying (FR15-FR17)**
- FR15: Developer can query the complete fractal state at a specific timestamp (getStack)
- FR16: Developer can query a specific generation's active move at a given timestamp
- FR17: Developer can iterate through fractal layers by depth level

**Debug & Validation (FR18-FR20)**
- FR18: System can output debug information showing structure state after each candle
- FR19: System can display active moves listing with key properties (id, polarity, price range, time range, generation)
- FR20: System can log move lifecycle events (creation, extension, closure) for debugging

**API & Integration (FR21-FR23)**
- FR21: Developer can import the library as an ES module with TypeScript types
- FR22: Developer can use the same API for both batch (historical) and streaming (real-time) use cases
- FR23: Library exposes a clean public API surface without leaking internal domain objects

**Data Precision (FR24-FR25)**
- FR24: System uses precise decimal arithmetic for all price calculations (no floating-point errors)
- FR25: System produces deterministic output: same candle sequence always produces same structure

### NonFunctional Requirements

**Performance (NFR1-NFR3)**
- NFR1: Single candle ingestion completes in sub-second time (< 100ms per addCandle() call on standard hardware)
- NFR2: Batch construction of 500k candles completes in acceptable time (< 60 seconds for 500k candles)
- NFR3: Memory usage scales linearly with active structure size (no exponential memory growth patterns)

**Scalability (NFR4-NFR6)**
- NFR4: System handles 500k+ candles (1 year @ 1min) without degradation (all operations remain performant at this scale)
- NFR5: System handles 5M+ candles without OOM (memory pruning keeps working set bounded)
- NFR6: Generation depth can grow unbounded without failure (no arbitrary limits on fractal depth)

**Reliability (NFR7-NFR10)**
- NFR7: Same input always produces same output (determinism) - 100% reproducible results across runs
- NFR8: Structure invariants always hold after any operation (no invalid states possible through public API)
- NFR9: Malformed candle data is handled gracefully (error returned, state unchanged, no crash)
- NFR10: No memory leaks during long-running sessions (stable memory footprint over 24h+ operation)

**Maintainability (NFR11-NFR13)**
- NFR11: Code follows DDD/Hexagonal architecture (domain layer isolated, no infrastructure leakage)
- NFR12: All domain rules are covered by tests (Vitest suite passes with comprehensive coverage)
- NFR13: Documentation is LLM-friendly (CLAUDE.md provides complete context for AI assistance)

**Compatibility (NFR14-NFR16)**
- NFR14: Library works with Node.js 18+ (tested on Node 18, 20, 22)
- NFR15: TypeScript types are correctly exported (no type errors when importing in consumer projects)
- NFR16: ESM module resolution works correctly (import/export with .js extensions resolves properly)

### Additional Requirements

**Migration & Starter Template (Architecture)**
- Migrate to pnpm monorepo structure as first implementation task
- Target structure: packages/core/ and packages/visualizer/
- Migrate existing code from src/ to packages/core/src/

**Tooling Requirements (Architecture)**
- pnpm workspaces for monorepo management
- Vitest 4.x for testing framework
- Biome for unified linting/formatting (replaces ESLint + Prettier)
- tsx 4.x for development runner

**Architecture Violations to Fix**
- Remove infrastructure import in domain layer (PriceMoveStructure.ts)
- Remove console.log side effects in entity (PriceMove.tryExtendWith())
- Eliminate duplicate Candle interface (shared/ and domain/candle/)
- Fix incomplete domain rules (isInvalidatedBy() boundary checks)

**Data Architecture Requirements**
- In-memory only (no external database)
- Use big.js for all price calculations
- UUID v4 for all entity IDs
- Timestamps as Unix milliseconds internally

**Logging Strategy**
- Injectable Logger interface (no static console.log)
- Default: no-op logger (silent)
- Development: console logger implementation

**API Design Principles**
- Unified interface for batch and streaming
- Immutable return values (defensive copies)
- No internal state leakage

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 3 | Single candle ingestion |
| FR2 | Epic 3 | Batch candle ingestion |
| FR3 | Epic 3 | OHLCV candle format |
| FR4 | Epic 2 | PriceMove creation with polarity |
| FR5 | Epic 2 | Move extension on directional break |
| FR6 | Epic 2 | Move invalidation on opposite break |
| FR7 | Epic 2 | Child move attachment |
| FR8 | Epic 2 | Generation tracking |
| FR9 | Epic 2 | Parent-child relationships |
| FR10 | Epic 2 | Move origins tracking |
| FR11 | Epic 4 | Active/Closed distinction |
| FR12 | Epic 4 | Get active moves |
| FR13 | Epic 4 | Get all moves |
| FR14 | Epic 4 | Structure consistency |
| FR15 | Epic 7 | getStack(timestamp) |
| FR16 | Epic 7 | getMove(generation, timestamp) |
| FR17 | Epic 4 | Fractal layer iteration |
| FR18 | Epic 5 | Debug output |
| FR19 | Epic 5 | Active moves listing |
| FR20 | Epic 5 | Lifecycle event logging |
| FR21 | Epic 1, 6 | ES module import |
| FR22 | Epic 3 | Unified batch/stream API |
| FR23 | Epic 6 | Clean public API |
| FR24 | Epic 1, 3 | Decimal precision (big.js) |
| FR25 | Epic 1, 3 | Deterministic output |

## Epic List

### Epic 1: Project Foundation & Monorepo Migration
Developer has a clean, testable project structure conforming to DDD/Hexagonal architecture, ready for development.

**FRs covered:** FR21, FR24, FR25 (foundation)
**NFRs addressed:** NFR11, NFR12, NFR14, NFR15, NFR16

### Epic 2: Core Fractal Construction Logic
Developer can build a correct fractal structure from candles, with working extension/invalidation logic.

**FRs covered:** FR4, FR5, FR6, FR7, FR8, FR9, FR10
**NFRs addressed:** NFR7, NFR8

### Epic 3: Candle Ingestion & Structure Building
Developer can feed the fractal structure with candles, either one-by-one (streaming) or in batch (historical).

**FRs covered:** FR1, FR2, FR3, FR22, FR24, FR25
**NFRs addressed:** NFR1, NFR2, NFR7

### Epic 4: Structure State Management & Querying
Developer can query the fractal structure state, retrieve active/closed moves, and navigate through fractal layers.

**FRs covered:** FR11, FR12, FR13, FR14, FR17
**NFRs addressed:** NFR3, NFR4, NFR5, NFR6, NFR8

### Epic 5: Debug & Validation Tooling
Developer can debug and visually validate the fractal structure, with event logs and active moves listings.

**FRs covered:** FR18, FR19, FR20
**NFRs addressed:** NFR9, NFR10, NFR13

### Epic 6: Clean Public API & Library Packaging
Developer can import the library as a clean ES module, with correct TypeScript types and encapsulated API.

**FRs covered:** FR21, FR23
**NFRs addressed:** NFR13, NFR14, NFR15, NFR16

### Epic 7: Point-in-Time Queries (Post-MVP)
Developer can query the fractal state at a specific timestamp for historical analysis and backtesting.

**FRs covered:** FR15, FR16
**NFRs addressed:** NFR4

**Note:** This epic is marked Post-MVP in the Architecture document but FRs exist in the PRD.

## Epic 1: Project Foundation & Monorepo Migration

Developer has a clean, testable project structure conforming to DDD/Hexagonal architecture, ready for development.

### Story 1.1: Initialize pnpm Monorepo Structure

As a **developer**,
I want **a pnpm monorepo structure with workspace configuration**,
So that **I can organize code into separate packages (core, visualizer) with shared dependencies**.

**Acceptance Criteria:**

**Given** the existing project root
**When** the monorepo initialization is complete
**Then** a `pnpm-workspace.yaml` file exists defining `packages/*`
**And** a root `package.json` exists with workspace scripts
**And** `packages/core/` directory structure exists with its own `package.json`
**And** `packages/visualizer/` directory structure exists (empty placeholder)
**And** `pnpm install` succeeds without errors

### Story 1.2: Configure TypeScript with Shared Base Config

As a **developer**,
I want **a shared TypeScript configuration with strict settings**,
So that **all packages use consistent TypeScript rules and ESM/NodeNext resolution**.

**Acceptance Criteria:**

**Given** the monorepo structure from Story 1.1
**When** TypeScript configuration is complete
**Then** a `tsconfig.base.json` exists at root with strict mode, ES2022 target, NodeNext resolution
**And** `packages/core/tsconfig.json` extends the base config
**And** `packages/visualizer/tsconfig.json` extends the base config
**And** `tsc --noEmit` succeeds without errors

### Story 1.3: Configure Vitest Testing Framework

As a **developer**,
I want **Vitest configured for workspace-wide testing**,
So that **I can write and run tests for domain rules with comprehensive coverage**.

**Acceptance Criteria:**

**Given** the monorepo structure with TypeScript
**When** Vitest configuration is complete
**Then** `vitest.workspace.ts` exists at root
**And** `packages/core/vitest.config.ts` exists
**And** a sample test file in `packages/core/src/` passes
**And** `pnpm test` runs all workspace tests
**And** coverage reporting is enabled

### Story 1.4: Configure Biome for Linting and Formatting

As a **developer**,
I want **Biome configured for unified linting and formatting**,
So that **code quality is enforced consistently across all packages**.

**Acceptance Criteria:**

**Given** the monorepo structure
**When** Biome configuration is complete
**Then** `biome.json` exists at root with TypeScript strict rules
**And** `pnpm lint` runs Biome lint on all packages
**And** `pnpm format` runs Biome format on all packages
**And** no linting errors on initial configuration

### Story 1.5: Migrate Existing Code to Monorepo

As a **developer**,
I want **existing source code migrated to packages/core/src/**,
So that **the brownfield code is preserved and ready for refactoring**.

**Acceptance Criteria:**

**Given** existing code in `src/` directory
**When** migration is complete
**Then** all files from `src/` are moved to `packages/core/src/`
**And** import paths are updated for ESM (.js extensions)
**And** `pnpm build` in packages/core succeeds
**And** existing functionality is preserved (smoke test passes)

### Story 1.6: Fix Architecture Violations in Domain Layer

As a **developer**,
I want **architecture violations corrected in the domain layer**,
So that **the domain is pure with no infrastructure leakage**.

**Acceptance Criteria:**

**Given** migrated code in packages/core/src/
**When** architecture fixes are complete
**Then** no `console.log` calls exist in `domain/` directory
**And** no imports from `infrastructure/` exist in `domain/` directory
**And** duplicate Candle interface is eliminated (single source of truth)
**And** `isInvalidatedBy()` correctly checks boundary conditions
**And** all existing tests pass

### Story 1.7: Create Injectable Logger Interface

As a **developer**,
I want **an injectable Logger interface with NoopLogger and ConsoleLogger implementations**,
So that **domain code can log without direct console dependencies**.

**Acceptance Criteria:**

**Given** the domain layer without console.log
**When** Logger implementation is complete
**Then** `Logger` interface exists in `application/ports/`
**And** `NoopLogger` implementation exists (silent, default)
**And** `ConsoleLogger` implementation exists in `infrastructure/logging/`
**And** domain entities accept optional Logger via constructor/factory
**And** tests verify both logger implementations work correctly

## Epic 2: Core Fractal Construction Logic

Developer can build a correct fractal structure from candles, with working extension/invalidation logic.

### Story 2.1: Create PriceMove Entity with Polarity

As a **developer**,
I want **a PriceMove entity that correctly determines polarity from price data**,
So that **each move is classified as Up or Down based on price direction**.

**Acceptance Criteria:**

**Given** a candle with open and close prices
**When** a PriceMove is created from that candle
**Then** polarity is Up if close >= open
**And** polarity is Down if close < open
**And** PriceMove has id (UUID), timeRange, priceRange properties
**And** PriceMove is immutable after creation
**And** tests cover edge cases (close == open, extreme values)

### Story 2.2: Implement Move Extension Logic

As a **developer**,
I want **PriceMove to extend when a candidate breaks its directional boundary**,
So that **moves grow in their direction as price continues**.

**Acceptance Criteria:**

**Given** an active Up move with a high boundary
**When** a candidate has a higher high than the move's high
**Then** the move extends to include the candidate's high
**And** the move's timeRange extends to include the candidate's time

**Given** an active Down move with a low boundary
**When** a candidate has a lower low than the move's low
**Then** the move extends to include the candidate's low
**And** the move's timeRange extends to include the candidate's time

**And** extension uses big.js for price comparisons (no floating-point errors)
**And** tests verify extension behavior for both polarities

### Story 2.3: Implement Move Invalidation Logic

As a **developer**,
I want **PriceMove to close/invalidate when a candidate breaks the opposite boundary**,
So that **moves terminate when price reverses beyond their origin**.

**Acceptance Criteria:**

**Given** an active Up move with a low boundary (origin)
**When** a candidate has a lower low than the move's low
**Then** the move is invalidated/closed
**And** the move's state changes to Closed

**Given** an active Down move with a high boundary (origin)
**When** a candidate has a higher high than the move's high
**Then** the move is invalidated/closed
**And** the move's state changes to Closed

**And** invalidation uses big.js for price comparisons
**And** tests verify invalidation behavior for both polarities

### Story 2.4: Implement Child Move Attachment

As a **developer**,
I want **candidates that fit within parent boundaries to attach as child moves**,
So that **internal price movements are captured as nested structure**.

**Acceptance Criteria:**

**Given** an active parent move
**When** a candidate fits within the parent's price and time range
**And** the candidate does not extend or invalidate the parent
**Then** the candidate becomes a child move of the parent
**And** the child's englobingMove references the parent
**And** the parent's childMoves array includes the child
**And** tests verify child attachment for various scenarios

### Story 2.5: Implement Generation Tracking

As a **developer**,
I want **each child move to inherit parent generation + 1**,
So that **the fractal depth is tracked correctly**.

**Acceptance Criteria:**

**Given** a root move (no parent) created from first candle
**Then** the root move has generation = 0

**Given** a parent move with generation N
**When** a child move is attached to that parent
**Then** the child move has generation = N + 1

**And** generation is immutable after assignment
**And** tests verify generation inheritance through multiple levels

### Story 2.6: Implement Parent-Child Relationship Management

As a **developer**,
I want **bidirectional parent-child relationships maintained correctly**,
So that **the fractal tree can be traversed in both directions**.

**Acceptance Criteria:**

**Given** a parent move and a child move
**When** the child is attached to the parent
**Then** parent.childMoves contains the child
**And** child.englobingMove references the parent

**Given** a move being removed or archived
**When** cleanup occurs
**Then** relationships are properly maintained or cleaned up
**And** no orphaned references exist
**And** tests verify relationship integrity

### Story 2.7: Implement Move Origins Tracking

As a **developer**,
I want **moves to track their initial source moves and confirmed origins**,
So that **the provenance of each move is clear**.

**Acceptance Criteria:**

**Given** a new move created from a candle
**When** the move is initialized
**Then** originMoves contains the initial source move(s)
**And** confirmedOrigins is empty initially

**Given** an active move that gets extended by a candidate
**When** extension occurs
**Then** the extending candidate is added to confirmedOrigins
**And** originMoves remains unchanged

**And** tests verify origin tracking through extension sequences

## Epic 3: Candle Ingestion & Structure Building

Developer can feed the fractal structure with candles, either one-by-one (streaming) or in batch (historical).

### Story 3.1: Define Candle Data Structure

As a **developer**,
I want **a single Candle interface with OHLCV data**,
So that **candle data has a consistent format throughout the system**.

**Acceptance Criteria:**

**Given** the need for candle data input
**When** Candle interface is defined
**Then** Candle has open, high, low, close properties (using big.js or number)
**And** Candle has volume property
**And** Candle has openTime and closeTime timestamps (Unix milliseconds)
**And** single source of truth exists in domain/candle/
**And** tests validate Candle structure

### Story 3.2: Implement Single Candle Ingestion

As a **developer**,
I want **to add a single candle and update the fractal structure incrementally**,
So that **real-time streaming data can be processed**.

**Acceptance Criteria:**

**Given** an existing fractal structure (or empty structure)
**When** `addCandle(candle)` is called
**Then** a new PriceMove is created from the candle
**And** the move is processed against active moves (extend/invalidate/attach)
**And** the structure is updated accordingly
**And** operation completes in < 100ms (NFR1)
**And** tests verify incremental updates

### Story 3.3: Implement Batch Candle Ingestion

As a **developer**,
I want **to build the complete fractal structure from an array of candles**,
So that **historical data can be processed efficiently**.

**Acceptance Criteria:**

**Given** an array of candles in chronological order
**When** `buildFromCandles(candles[])` is called
**Then** the complete fractal structure is built
**And** each candle is processed in sequence
**And** 500k candles complete in < 60 seconds (NFR2)
**And** result is identical to calling addCandle() sequentially
**And** tests verify batch construction correctness

### Story 3.4: Implement PriceMoveStructure Orchestrator

As a **developer**,
I want **a PriceMoveStructure class that orchestrates move processing**,
So that **candle-to-structure logic is encapsulated**.

**Acceptance Criteria:**

**Given** a new candle to process
**When** PriceMoveStructure.addCandidate() is called
**Then** the structure determines if the candidate extends, invalidates, or attaches to existing moves
**And** appropriate domain methods are called on PriceMove entities
**And** structure state is updated atomically
**And** structure consistency is maintained (NFR8)
**And** tests verify orchestration logic

### Story 3.5: Ensure Deterministic Output

As a **developer**,
I want **the same candle sequence to always produce the same structure**,
So that **results are reproducible for testing and debugging**.

**Acceptance Criteria:**

**Given** a fixed sequence of candles
**When** the structure is built multiple times
**Then** the resulting structure is identical each time
**And** no random factors affect the outcome
**And** iteration order is deterministic (sorted maps/sets)
**And** tests verify reproducibility with various datasets

### Story 3.6: Implement Decimal Precision for Prices

As a **developer**,
I want **all price calculations to use big.js**,
So that **floating-point errors are eliminated**.

**Acceptance Criteria:**

**Given** price values in candles and moves
**When** comparisons or calculations are performed
**Then** big.js methods are used (.gt(), .lt(), .eq(), .gte(), .lte())
**And** no JavaScript comparison operators are used for prices
**And** precision is maintained through all operations
**And** tests verify precision with edge cases (very small differences)

## Epic 4: Structure State Management & Querying

Developer can query the fractal structure state, retrieve active/closed moves, and navigate through fractal layers.

### Story 4.1: Implement Move State (Active/Closed)

As a **developer**,
I want **moves to have a clear Active or Closed state**,
So that **I can distinguish between moves that can still extend and terminated moves**.

**Acceptance Criteria:**

**Given** a newly created PriceMove
**When** the move is initialized
**Then** the move has state = Active

**Given** an active move that gets invalidated
**When** invalidation occurs
**Then** the move's state changes to Closed
**And** state transition is immutable (Closed cannot become Active)
**And** tests verify state transitions

### Story 4.2: Implement Get Active Moves Query

As a **developer**,
I want **to retrieve all currently active moves across all generations**,
So that **I can see which moves are still growing**.

**Acceptance Criteria:**

**Given** a fractal structure with multiple moves
**When** `getActiveMoves()` is called
**Then** an array of all Active moves is returned
**And** moves are sorted by generation (ascending)
**And** returned moves are defensive copies (no mutation of internal state)
**And** operation is O(n) or better
**And** tests verify correct filtering

### Story 4.3: Implement Get All Moves Query

As a **developer**,
I want **to retrieve all moves (active and closed) in the structure**,
So that **I can inspect the complete fractal history**.

**Acceptance Criteria:**

**Given** a fractal structure with active and closed moves
**When** `getAllMoves()` is called
**Then** an array of all moves is returned
**And** moves include both Active and Closed states
**And** returned moves are defensive copies
**And** tests verify complete listing

### Story 4.4: Implement Structure Consistency Validation

As a **developer**,
I want **the structure to maintain consistency after any operation**,
So that **invariants are always respected**.

**Acceptance Criteria:**

**Given** any candle ingestion operation
**When** the operation completes
**Then** all parent-child relationships are valid
**And** all generation numbers are correct
**And** no orphaned moves exist
**And** all active moves have valid boundaries
**And** optional: validateStructure() method for explicit checks
**And** tests verify invariants after various operations

### Story 4.5: Implement Fractal Layer Iteration

As a **developer**,
I want **to iterate through fractal layers by depth level**,
So that **I can analyze the structure generation by generation**.

**Acceptance Criteria:**

**Given** a fractal structure with multiple generations
**When** iterating by layer
**Then** I can access moves at each generation level
**And** FractalLayer contains all moves at that depth
**And** layers are accessible by index (0, 1, 2, ...)
**And** `getLayerCount()` returns the maximum depth
**And** tests verify layer iteration

### Story 4.6: Implement Memory-Efficient Move Storage

As a **developer**,
I want **moves stored efficiently with linear memory scaling**,
So that **large datasets don't cause memory issues**.

**Acceptance Criteria:**

**Given** a structure processing many candles
**When** memory usage is measured
**Then** memory scales linearly with active structure size (NFR3)
**And** 500k+ candles are handled without degradation (NFR4)
**And** aggressive pruning archives closed moves without active descendants
**And** generation depth can grow unbounded (NFR6)
**And** tests verify memory behavior at scale

## Epic 5: Debug & Validation Tooling

Developer can debug and visually validate the fractal structure, with event logs and active moves listings.

### Story 5.1: Implement Debug Output After Each Candle

As a **developer**,
I want **debug information showing structure state after each candle**,
So that **I can observe how the structure evolves step by step**.

**Acceptance Criteria:**

**Given** debug mode is enabled via Logger
**When** a candle is processed
**Then** the logger outputs the current structure state
**And** output includes: candle info, moves affected, action taken
**And** debug output is optional (disabled by default with NoopLogger)
**And** tests verify debug output format

### Story 5.2: Implement Active Moves Listing Display

As a **developer**,
I want **to display active moves with key properties**,
So that **I can quickly see the current structure state**.

**Acceptance Criteria:**

**Given** a fractal structure with active moves
**When** `formatActiveMoves()` is called
**Then** a formatted string is returned with:
  - Move ID (shortened)
  - Polarity (Up/Down)
  - Price range (low - high)
  - Time range (start - end)
  - Generation level
**And** output is human-readable (console-friendly)
**And** tests verify formatting

### Story 5.3: Implement Move Lifecycle Event Logging

As a **developer**,
I want **move lifecycle events logged (creation, extension, closure)**,
So that **I can trace what happened to each move**.

**Acceptance Criteria:**

**Given** a Logger is configured
**When** a move is created
**Then** logger.debug logs "Move created: {id}, polarity: {polarity}, gen: {gen}"

**When** a move is extended
**Then** logger.debug logs "Move extended: {id}, new boundary: {value}"

**When** a move is closed/invalidated
**Then** logger.debug logs "Move closed: {id}, reason: invalidation"

**And** log levels are appropriate (debug for events, info for summaries)
**And** tests verify event logging

### Story 5.4: Implement Graceful Error Handling

As a **developer**,
I want **malformed candle data handled gracefully**,
So that **the system doesn't crash on bad input**.

**Acceptance Criteria:**

**Given** a candle with invalid data (missing fields, wrong types, NaN values)
**When** the candle is processed
**Then** an error is returned (or thrown)
**And** the structure state remains unchanged
**And** no crash occurs (NFR9)
**And** error message indicates what was wrong
**And** tests verify error handling for various invalid inputs

### Story 5.5: Implement Memory Leak Prevention

As a **developer**,
I want **no memory leaks during long-running sessions**,
So that **the system remains stable over extended periods**.

**Acceptance Criteria:**

**Given** a long-running session processing many candles
**When** memory is monitored
**Then** memory footprint remains stable over time (NFR10)
**And** no growing references to archived moves
**And** WeakRef or explicit cleanup used where appropriate
**And** tests verify memory stability (if feasible)

## Epic 6: Clean Public API & Library Packaging

Developer can import the library as a clean ES module, with correct TypeScript types and encapsulated API.

### Story 6.1: Define Public API Surface

As a **developer**,
I want **a clean public API exported from the package**,
So that **consumers only see intended entry points**.

**Acceptance Criteria:**

**Given** the packages/core package
**When** the package is built
**Then** `src/index.ts` exports only public API
**And** exports include: FractalEngine, Candle type, PriceMove type, Polarity type
**And** internal implementation details are not exported
**And** barrel exports are organized by category
**And** tests verify export surface

### Story 6.2: Implement FractalEngine Facade

As a **developer**,
I want **a FractalEngine class as the main entry point**,
So that **consumers have a simple, unified API**.

**Acceptance Criteria:**

**Given** a consumer importing the library
**When** FractalEngine is instantiated
**Then** it provides: addCandle(), buildFromCandles(), getActiveMoves(), getAllMoves()
**And** optional: setLogger() for debug configuration
**And** internal domain objects are not exposed
**And** returned values are immutable/defensive copies
**And** tests verify facade behavior

### Story 6.3: Export TypeScript Types Correctly

As a **developer**,
I want **TypeScript types correctly exported and usable**,
So that **consumers get full type safety**.

**Acceptance Criteria:**

**Given** the built package
**When** a consumer imports types
**Then** Candle, PriceMove, Polarity, FractalLayer types are available
**And** `import type { ... }` works correctly
**And** no type errors when using the API
**And** d.ts files are generated alongside .js
**And** tests verify type exports (compilation test)

### Story 6.4: Configure ESM Module Resolution

As a **developer**,
I want **ESM module resolution working correctly**,
So that **Node.js and bundlers can import the library**.

**Acceptance Criteria:**

**Given** the package.json configuration
**When** the package is consumed
**Then** `"type": "module"` is set
**And** exports field defines entry points
**And** imports with .js extensions resolve correctly
**And** Node.js 18+ can import the package
**And** tests verify import in consumer project

### Story 6.5: Update CLAUDE.md Documentation

As a **developer**,
I want **CLAUDE.md updated with complete API documentation**,
So that **LLM assistants can help with the library**.

**Acceptance Criteria:**

**Given** the completed library
**When** CLAUDE.md is updated
**Then** architecture section reflects final structure
**And** public API is documented with examples
**And** domain concepts (PriceMove, generation, extension) are explained
**And** usage patterns for batch and streaming are shown
**And** file is optimized for LLM consumption (NFR13)

## Epic 7: Point-in-Time Queries (Post-MVP)

Developer can query the fractal state at a specific timestamp for historical analysis and backtesting.

**Note:** This epic is marked Post-MVP in the Architecture document.

### Story 7.1: Implement getStack(timestamp) Query

As a **developer**,
I want **to query the complete fractal state at a specific timestamp**,
So that **I can analyze historical structure at any point in time**.

**Acceptance Criteria:**

**Given** a fractal structure built from candles
**When** `getStack(timestamp)` is called
**Then** the complete fractal state at that moment is returned
**And** all generations visible at that time are included
**And** parent-child relationships reflect the state at that timestamp
**And** timestamp is in Unix milliseconds
**And** tests verify point-in-time accuracy

### Story 7.2: Implement getMove(generation, timestamp) Query

As a **developer**,
I want **to get a specific generation's active move at a given timestamp**,
So that **I can inspect individual generation states**.

**Acceptance Criteria:**

**Given** a fractal structure with multiple generations
**When** `getMove(generation, timestamp)` is called
**Then** the active move at that generation and time is returned
**And** null/undefined is returned if no move was active
**And** move reflects the state at that exact timestamp
**And** tests verify generation-specific queries

### Story 7.3: Implement Historical State Reconstruction

As a **developer**,
I want **efficient historical state reconstruction**,
So that **point-in-time queries perform well on large datasets**.

**Acceptance Criteria:**

**Given** a large dataset (500k+ candles)
**When** historical queries are made
**Then** query performance is acceptable (< 1 second)
**And** memory overhead for history is bounded
**And** implementation considers snapshot or event-sourcing approach
**And** tests verify performance at scale

