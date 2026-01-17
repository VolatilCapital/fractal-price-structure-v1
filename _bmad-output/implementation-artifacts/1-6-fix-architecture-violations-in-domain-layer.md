# Story 1.6: Fix Architecture Violations in Domain Layer

Status: done

## Story

As a **developer**,
I want **architecture violations corrected in the domain layer**,
So that **the domain is pure with no infrastructure leakage**.

## Acceptance Criteria

1. **Given** migrated code in packages/core/src/
   **When** architecture fixes are complete
   **Then** no `console.log` calls exist in `domain/` directory

2. **And** no imports from `infrastructure/` exist in `domain/` directory

3. **And** duplicate Candle interface is eliminated (single source of truth)

4. **And** `isInvalidatedBy()` correctly checks boundary conditions

5. **And** all existing tests pass

## Tasks / Subtasks

- [x] Task 1: Remove console.log calls from domain layer (AC: #1)
  - [x] Remove console.log from PriceMove.tryExtendWith()
  - [x] Remove any other console.log in domain/

- [x] Task 2: Remove infrastructure imports from domain layer (AC: #2)
  - [x] Remove PriceMoveLoggerFile import from PriceMoveStructure.ts
  - [x] Update constructor to no longer require logger parameter

- [x] Task 3: Eliminate duplicate Candle interface (AC: #3)
  - [x] Keep single Candle in shared/Candle.ts
  - [x] Update domain/candle/Candle.ts to re-export from shared

- [x] Task 4: Fix isInvalidatedBy() boundary checks (AC: #4)
  - [x] Reviewed current implementation (returns !current.isActive())
  - [x] Implemented correct boundary checking logic (Up invalidated by lower low, Down by higher high)

- [x] Task 5: Validate all tests pass (AC: #5)
  - [x] Run pnpm test - 3 tests pass
  - [x] Build passes

## Dev Notes

### Architecture Violations Found
1. **PriceMove.ts** (lines 54, 66, 72, 73): Contains console.log calls with emojis
2. **PriceMoveStructure.ts** (line 4): Imports from infrastructure (PriceMoveLoggerFile)
3. **Duplicate Candle**: Both domain/candle/Candle.ts and shared/Candle.ts define Candle interface
4. **PriceMoveRules.isInvalidatedBy()**: Only checks `!current.isActive()`, doesn't actually check boundary conditions

### Remaining Lint Warnings
The linter shows warnings for the brownfield code (useImportType, noStaticOnlyClass, useNodejsImportProtocol, etc.) - these are style issues in the migrated code, not architecture violations. They can be addressed in a future cleanup story if desired.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Removed 4 console.log calls from PriceMove.tryExtendWith()
- Removed PriceMoveLoggerFile import and logger parameter from PriceMoveStructure
- Updated domain/candle/Candle.ts to re-export from shared/Candle.ts
- Fixed isInvalidatedBy() to check actual boundary conditions based on polarity
- Updated main.ts to use new PriceMoveStructure constructor signature
- Build passes, tests pass (3 tests)

### File List

**Modified Files:**
- packages/core/src/domain/price-move/PriceMove.ts (removed console.log calls)
- packages/core/src/domain/structure/PriceMoveStructure.ts (removed infrastructure import)
- packages/core/src/domain/candle/Candle.ts (re-export from shared)
- packages/core/src/domain/price-move/PriceMoveRules.ts (fixed isInvalidatedBy)
- packages/core/src/main.ts (updated constructor call)

### Change Log

- 2026-01-17: Story 1.6 started - Architecture violations analysis complete
- 2026-01-17: Story 1.6 completed - All architecture violations fixed
