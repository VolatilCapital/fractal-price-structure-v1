---
title: 'Audit & Refactor — Package Core DDD/Hexagonal/TypeScript'
type: 'refactor'
created: '2026-05-11'
status: 'draft'
context: []
---

<frozen-after-approval>

## Intent

**Problem:** The core package has accumulated technical debt across multiple dimensions: misplaced repository interfaces (domain instead of application/ports), a 852-line orchestrator mixing domain/application responsibilities, deprecated API cruft, inconsistent use of the protocol's `currentReferenceLevel` in legacy rules, and redundant/overlapping use cases. While functional, the codebase has drifted from the intended hexagonal architecture documented in `architecture.md`.

**Approach:** Iterative refactor in priority order: (P1) fix architecture boundary violations (move repositories/ports to correct layers), (P2) harden TypeScript strictness (remove `!` assertions, add exhaustiveness checks), (P3) split the oversized PriceMoveStructure orchestrator, (P4) remove legacy deprecated APIs, (P5) add missing test coverage for critical paths (cascade termination, detach).

## Boundaries & Constraints

**Always:**
- Preserve all existing business logic and fractal protocol rules
- All tests must continue to pass after each incremental change
- Domain layer must have zero infrastructure imports (except big.js)
- Follow project conventions: `.js` extensions in imports, `#` private fields, PascalCase files, kebab-case dirs
- Use `big.js` via the `Price` utility for all price comparisons

**Ask First:**
- Removing exported deprecated types/functions (breaking change to public API)
- Renaming public classes or methods
- Changing the `FractalLayer` interface shape
- Adding new dependencies

**Never:**
- Change fractal construction protocol logic
- Introduce new frameworks or libraries
- Add speculative abstractions not justified by current use
- Remove test coverage for existing scenarios
- Create breaking changes silently

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Candle with NaN price | `{open: NaN}` | `CandleIngestionError` thrown or `{success: false}` | Validation rejects before domain processing |
| Empty candle array | `buildFromCandles([])` | `[]` returned, structure empty | N/A |
| Move terminated while processing cascade | Break detected during parent iteration | All ancestors up to surviving parent terminated, surviving parent returned | No crash, consistent state |
| pruneClosedMoves with future timestamp | `pruneClosedMoves(9999999999999)` | All eligible archived/reference moves pruned | Non-finite timestamp ignored |
| getStack with timestamp before any move | `getStack(0)` | `[]` empty array | N/A |
| Detach move with children | Move removed from graph | Children become root moves (parentStructure = undefined) | No orphan references remain |
| Deepest growing structure with > 10 levels | Deep tree | Correctly finds leaf Growing node | Stack-safe (iterative, not recursive overflow) |

## Code Map

- `packages/core/src/domain/price-move/PriceMove.ts` -- Core entity, polarity, processCandidate, state transitions, legacy aliases
- `packages/core/src/domain/price-move/PriceMoveState.ts` -- string union Growing/Reference/Archived
- `packages/core/src/domain/price-move/PriceMoveFactory.ts` -- Factory + deprecated PriceMoveFactory object
- `packages/core/src/domain/price-move/PriceMoveId.ts` -- Value object with UUID/deterministic generation
- `packages/core/src/domain/price-move/PriceMoveRules.ts` -- Legacy compatibility rules (isInvalidatedBy uses wrong reference level)
- `packages/core/src/domain/price-move/ReferenceLevel.ts` -- Reference level interface
- `packages/core/src/domain/price-move/Polarity.ts` -- Up/Down discriminated union
- `packages/core/src/domain/structure/PriceMoveStructure.ts` -- 852-line orchestrator (domain+application mixed)
- `packages/core/src/domain/structure/PriceMoveRepository.ts` -- Port interface (misplaced in domain, should be application/ports)
- `packages/core/src/domain/structure/FractalLayer.ts` -- Layer type
- `packages/core/src/domain/candle/Candle.ts` -- Candle type + validation + type guard
- `packages/core/src/domain/candle/CandleFactory.ts` -- Factory + InvalidCandleError + fromBinanceKline
- `packages/core/src/domain/candle/CandleRepository.ts` -- Port interface (misplaced in domain)
- `packages/core/src/domain/logger/Logger.ts` -- Logger interface + NoopLogger
- `packages/core/src/shared/Price.ts` -- big.js decimal wrapper
- `packages/core/src/shared/PriceRange.ts` -- PriceRange value object
- `packages/core/src/shared/TimeRange.ts` -- TimeRange value object
- `packages/core/src/shared/Candle.ts` -- Deprecated re-export (should point to domain/candle)
- `packages/core/src/application/use-cases/BuildPriceMovesFromCandles.ts` -- Use case
- `packages/core/src/application/use-cases/BuildRecursiveFractal.ts` -- Recursive fractal builder (uses deprecated childMoves)
- `packages/core/src/application/use-cases/buildFractalLevels.ts` -- Alternate fractal builder (overlapping with above)
- `packages/core/src/application/use-cases/BuildFractalLayersFromMoves.ts` -- Inline stub repo hack
- `packages/core/src/application/use-cases/FractalPriceMoveBuilder.ts` -- Fractal builder via repo factory
- `packages/core/src/application/use-cases/FetchCandlesUseCase.ts` -- Simple fetch use case
- `packages/core/src/application/ports/PriceMoveRepositoryFactory.ts` -- Port type for repo factory
- `packages/core/src/FractalEngine.ts` -- Main facade (clean delegation)
- `packages/core/src/infrastructure/repositories/InMemoryPriceMoveRepository.ts` -- In-memory impl
- `packages/core/src/infrastructure/logging/ConsoleLogger.ts` -- Console logger impl
- `packages/core/src/index.ts` -- Public API exports

</frozen-after-approval>

## Tasks & Acceptance

**Execution:**

### P1 — Fix Architecture Boundary Violations

- [ ] `packages/core/src/domain/structure/PriceMoveRepository.ts` -- MOVE to `application/ports/PriceMoveRepository.ts` -- Repository interface is an application concern (port), not domain
- [ ] `packages/core/src/domain/candle/CandleRepository.ts` -- MOVE to `application/ports/CandleRepository.ts` -- Candle repository is an infrastructure port, not domain
- [ ] `packages/core/src/domain/logger/Logger.ts` -- Keep in domain but verify no infrastructure dependency -- Logger is a domain concept (pure interface), correctly placed
- [ ] Update ALL imports across codebase after moving repository interfaces -- Compile check -- Must pass `pnpm typecheck`
- [ ] `packages/core/src/domain/structure/PriceMoveStructure.ts` -- MOVE to `application/orchestrator/PriceMoveStructure.ts` -- This file orchestrates domain entities + repository, it belongs in application layer

### P2 — TypeScript Strictness Hardening

- [ ] `packages/core/src/domain/price-move/PriceMove.ts` -- REMOVE `this.degre!` non-null assertion in `#propagateDegreToChildren` -- Replace with explicit guard to prevent potential runtime crash
- [ ] `packages/core/src/domain/price-move/PriceMoveRules.ts` -- FIX `isInvalidatedBy` to use `currentReferenceLevel` instead of `priceRange.low/high` -- Protocol section 3 says invalidation is against reference level, not structure bounds
- [ ] `packages/core/src/domain/structure/PriceMoveStructure.ts` -- FIX `formatActiveMoves` label from "[Gen" to "[Rang" -- Uses legacy terminology, inconsistent with field name
- [ ] `packages/core/src/application/use-cases/BuildRecursiveFractal.ts` -- REPLACE deprecated `childMoves` with `subStructures` -- Uses deprecated property

### P3 — Reduce File Size & Responsibilities

- [ ] `packages/core/src/domain/structure/PriceMoveStructure.ts` -- EXTRACT `CandleIngestionError`, `CandleResult`, `BatchIngestionResult` types to dedicated file -- Types clutter the orchestrator
- [ ] `packages/core/src/domain/price-move/PriceMove.ts` -- MARK all deprecated getter/setter pairs for removal in next major -- Add `@deprecated` with migration path
- [ ] `packages/core/src/application/use-cases/BuildFractalLayersFromMoves.ts` -- REFACTOR inline stub repository to use proper InMemoryPriceMoveRepository -- Ad-hoc stub is hacky and fragile

### P4 — Remove Dead/Overlapping Code

- [ ] `packages/core/src/application/use-cases/buildFractalLevels.ts` -- DELETE or consolidate with BuildFractalLayersFromMoves.ts -- Redundant/overlapping use case
- [ ] `packages/core/src/main.ts` -- FIX use of deprecated `englobingMove`, `childMoves` -- Dogfood your own API
- [ ] `packages/core/src/domain/price-move/PriceMoveFactory.ts` -- REMOVE deprecated `PriceMoveFactory` object, keep only named functions -- Factory object is just a wrapper with no added value

### P5 — Test Coverage Gaps

- [ ] `packages/core/src/domain/structure/PriceMoveStructure.test.ts` -- ADD test for `#handleCascadeTermination` -- Multi-level cascade with surviving parent, currently untested directly
- [ ] `packages/core/src/domain/structure/PriceMoveStructure.test.ts` -- ADD test for `#detachMove` -- Graph integrity after detach (children become roots, parent refs cleaned)
- [ ] `packages/core/src/domain/structure/PriceMoveStructure.test.ts` -- ADD test for `#isEngulfingCandle` boundary cases -- When exactly at the boundary (equality case)

### P6 — Validation

- [ ] Run `pnpm typecheck` -- Must pass with zero errors
- [ ] Run `pnpm test` -- All existing tests must pass
- [ ] Run `pnpm lint` -- Must pass with zero errors

**Acceptance Criteria:**
- Given the core package, when `pnpm typecheck` runs, then zero errors
- Given the core package, when `pnpm test` runs, then all tests pass
- Given the refactored codebase, when inspected, then no repository interfaces remain in `domain/`
- Given the refactored codebase, when inspected, then `PriceMoveStructure` lives in `application/` not `domain/`
- Given the refactored codebase, when inspected, then `isInvalidatedBy` uses `currentReferenceLevel` not `priceRange` bounds
- Given the refactored codebase, when `FractalEngine` public API is used, then behavior is identical to pre-refactor

## Verification

**Commands:**
- `cd packages/core && pnpm typecheck` -- expected: zero errors
- `cd packages/core && pnpm test` -- expected: all tests pass
- `cd packages/core && pnpm lint` -- expected: zero errors
- `pnpm typecheck` (from root) -- expected: all packages pass

**Manual checks (if no CLI):**
- Verify no `import` from `infrastructure/` exists in any `domain/` file (grep)
- Verify `PriceMoveRepository` is imported from `application/ports/` not `domain/structure/`
- Verify `buildRecursiveFractalRoots` uses `subStructures` not `childMoves`
