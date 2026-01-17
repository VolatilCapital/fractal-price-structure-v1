# Story 3.5: Ensure Deterministic Output

## Story

As a **developer**,
I want **the fractal structure to be built deterministically**,
So that **given the same input candles, I always get the same output structure**.

## Status

done

## Acceptance Criteria

- [x] **AC1**: Given identical input candles, when processed multiple times, then the output structure is identical
- [x] **AC2**: PriceMove IDs are generated deterministically based on candle index
- [x] **AC3**: Tests verify reproducibility across multiple runs
- [x] **AC4**: Deterministic mode is opt-in (non-deterministic mode still available for production)

## Tasks/Subtasks

- [x] **Task 1**: Implement deterministic ID generation
  - [x] 1.1: Add `PriceMoveId.fromIndex(index)` for index-based IDs
  - [x] 1.2: Add `PriceMoveId.fromString(value)` for deserialization
  - [x] 1.3: Add `PriceMoveId.equals(other)` for comparison

- [x] **Task 2**: Implement deterministic factory method
  - [x] 2.1: Add `PriceMoveFactory.fromCandleWithIndex(candle, index)`

- [x] **Task 3**: Implement deterministic batch processing
  - [x] 3.1: Add `buildFromCandlesDeterministic(candles)` to PriceMoveStructure
  - [x] 3.2: Use index-based IDs for each candle

- [x] **Task 4**: Write comprehensive tests
  - [x] 4.1: Test identical IDs across multiple runs
  - [x] 4.2: Test index-based ID format
  - [x] 4.3: Test large indices (hex encoding)
  - [x] 4.4: Test full structure reproducibility
  - [x] 4.5: Test active moves consistency
  - [x] 4.6: Test error handling with index info
  - [x] 4.7: Test equivalence with non-deterministic version

## Dev Notes

### Architecture Requirements
- Per PRD NFR3: Same input → same output for reproducibility
- Deterministic mode is opt-in via `buildFromCandlesDeterministic()`
- Production uses `buildFromCandles()` with random UUIDs

### ID Format
Deterministic IDs follow UUID format: `00000000-0000-0000-0000-XXXXXXXXXXXX`
where X is the hexadecimal representation of the index (12 chars, zero-padded).

## Dev Agent Record

### Implementation Plan
1. Add deterministic ID generation to PriceMoveId
2. Add factory method with index parameter
3. Add deterministic batch method to PriceMoveStructure
4. Write comprehensive reproducibility tests

### Debug Log
- 118 tests pass after implementation
- Build succeeds with no TypeScript errors

### Completion Notes
Implemented deterministic output support:

1. **PriceMoveId enhancements**:
   - `fromIndex(index)`: Creates deterministic UUID-like ID from index
   - `fromString(value)`: Reconstructs ID from string (for deserialization)
   - `equals(other)`: Compares two IDs for equality

2. **PriceMoveFactory enhancement**:
   - `fromCandleWithIndex(candle, index)`: Creates PriceMove with deterministic ID

3. **PriceMoveStructure enhancement**:
   - `buildFromCandlesDeterministic(candles)`: Batch processing with deterministic IDs

4. **7 new tests** covering:
   - Identical IDs across multiple runs
   - Index-based ID format verification
   - Large indices with hex encoding
   - Full structure reproducibility
   - Active moves consistency across runs
   - Error handling with index info
   - Equivalence with non-deterministic version

## File List

### Modified
- packages/core/src/domain/price-move/PriceMoveId.ts (fromIndex, fromString, equals)
- packages/core/src/domain/price-move/PriceMoveFactory.ts (fromCandleWithIndex)
- packages/core/src/domain/structure/PriceMoveStructure.ts (buildFromCandlesDeterministic)
- packages/core/src/domain/structure/PriceMoveStructure.test.ts (7 new tests)

## Change Log

| Date | Change |
|------|--------|
| 2026-01-17 | Story created |
| 2026-01-17 | Implementation complete - deterministic IDs + batch method + 7 tests, 118 total tests passing |
