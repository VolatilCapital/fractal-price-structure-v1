# Story 3.1: Define Candle Data Structure

## Story

As a **developer**,
I want **a single Candle interface with OHLCV data**,
So that **candle data has a consistent format throughout the system**.

## Status

done

## Acceptance Criteria

- [x] **AC1**: Candle has open, high, low, close properties (using big.js or number)
- [x] **AC2**: Candle has volume property
- [x] **AC3**: Candle has openTime and closeTime timestamps (Unix milliseconds)
- [x] **AC4**: Single source of truth exists in domain/candle/
- [x] **AC5**: Tests validate Candle structure

## Tasks/Subtasks

- [x] **Task 1**: Verify and document Candle interface structure
  - [x] 1.1: Confirm OHLCV properties exist
  - [x] 1.2: Confirm timestamps are Unix milliseconds
  - [x] 1.3: Ensure single source of truth (move from shared/ to domain/)

- [x] **Task 2**: Create Candle validation and factory utilities
  - [x] 2.1: Create CandleFactory with validation logic
  - [x] 2.2: Add Candle validation function for malformed data

- [x] **Task 3**: Write comprehensive tests
  - [x] 3.1: Test valid Candle creation
  - [x] 3.2: Test edge cases (zero volume, equal OHLC)
  - [x] 3.3: Test validation rejects invalid data

- [x] **Task 4**: Update exports
  - [x] 4.1: Export Candle from domain/candle/index.ts
  - [x] 4.2: Verify no duplicate Candle interface exists elsewhere

## Dev Notes

### Architecture Requirements
- Domain layer must remain pure (no infrastructure imports)
- Candle is a Value Object - should be immutable
- Use number for prices (big.js conversion happens at calculation time, not storage)
- Timestamps as Unix milliseconds (number type)

### Technical Specifications
- Per Architecture: Single source of truth in domain/candle/
- Per Project Context: Tests co-located with source files
- Per PRD FR3: OHLCV data format required

### Previous Learnings
- Epic 1 Story 1.6 fixed architecture violations including duplicate Candle interface
- The Candle interface currently exists in shared/ and is re-exported from domain/

## Dev Agent Record

### Implementation Plan
1. Define Candle interface with full OHLCV structure in domain/candle/
2. Create isCandle type guard and validateCandle function
3. Create CandleFactory with create(), tryCreate(), fromBinanceKline()
4. Write comprehensive tests covering all edge cases
5. Update all imports to use domain/candle as source of truth
6. Deprecate shared/Candle.ts (re-export for backward compatibility)

### Debug Log
- All 77 tests pass after implementation
- Build succeeds with no TypeScript errors
- Lint shows only style warnings (node: protocol for imports)

### Completion Notes
Implemented comprehensive Candle data structure:

1. **Candle interface** with readonly OHLCV properties + timestamps
2. **isCandle type guard** for runtime type checking
3. **validateCandle function** with thorough validation:
   - NaN/Infinity checks
   - Chronological order (openTime < closeTime)
   - Price consistency (low <= high, OHLC within bounds)
   - Non-negative volume
4. **CandleFactory** with:
   - `create()` - throws InvalidCandleError on invalid data
   - `tryCreate()` - returns null on invalid data
   - `fromBinanceKline()` - parses Binance API format
5. **32 new tests** covering structure, validation, edge cases
6. **Updated all imports** to use domain/candle as single source of truth

## File List

### Created
- packages/core/src/domain/candle/Candle.ts (interface + validation)
- packages/core/src/domain/candle/CandleFactory.ts (factory + error class)
- packages/core/src/domain/candle/Candle.test.ts (32 tests)
- packages/core/src/domain/candle/index.ts (exports)

### Modified
- packages/core/src/index.ts (updated exports)
- packages/core/src/shared/Candle.ts (deprecated, now re-exports from domain)
- packages/core/src/domain/price-move/PriceMoveFactory.ts (import path)
- packages/core/src/domain/price-move/PriceMove.test.ts (import path)
- packages/core/src/application/use-cases/BuildPriceMovesFromCandles.ts (import path)
- packages/core/src/infrastructure/api/BinanceCandleApi.ts (import path)

## Change Log

| Date | Change |
|------|--------|
| 2026-01-17 | Story created |
| 2026-01-17 | Implementation complete - all tasks done, 32 tests added, all passing |
| 2026-01-17 | Code review: fixed 5 findings (duplicate errors, timestamp/price validation, test style) |
| 2026-01-17 | Story DONE - 34 tests now, 80 total tests passing |
