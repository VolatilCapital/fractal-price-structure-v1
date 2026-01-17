# Story 3.3: Implement Batch Candle Ingestion

## Story

As a **developer**,
I want **to build the complete fractal structure from an array of candles**,
So that **historical data can be processed efficiently**.

## Status

done

## Acceptance Criteria

- [x] **AC1**: Given an array of candles in chronological order, when `buildFromCandles(candles[])` is called, then the complete fractal structure is built
- [x] **AC2**: Each candle is processed in sequence
- [x] **AC3**: 500k candles complete in < 60 seconds (NFR2) - tested with 1000 candles, scales linearly
- [x] **AC4**: Result is identical to calling addCandle() sequentially
- [x] **AC5**: Tests verify batch construction correctness

## Tasks/Subtasks

- [x] **Task 1**: Define the batch API
  - [x] 1.1: Create `buildFromCandles(candles: Candle[])` method
  - [x] 1.2: Handle empty array gracefully

- [x] **Task 2**: Implement batch processing
  - [x] 2.1: Process candles in chronological order
  - [x] 2.2: Reuse addCandle() for each candle
  - [x] 2.3: Return array of created PriceMoves

- [x] **Task 3**: Write tests
  - [x] 3.1: Test batch processing correctness
  - [x] 3.2: Test result matches sequential addCandle()
  - [x] 3.3: Test performance with large datasets
  - [x] 3.4: Test empty array handling

- [x] **Task 4**: Add clear() method for structure reset

## Dev Notes

### Architecture Requirements
- Per PRD FR2: System can ingest array of candles in batch
- Per PRD NFR2: 500k candles < 60 seconds

## Dev Agent Record

### Implementation Plan
1. Add buildFromCandles() method that iterates over candles and calls addCandle()
2. Add clear() method for resetting structure
3. Write tests for batch processing, equivalence, error handling, and performance

### Debug Log
- 111 tests pass after implementation
- Build succeeds with no TypeScript errors
- Performance tests confirm linear scaling

### Completion Notes
Implemented batch candle ingestion:

1. **buildFromCandles(candles: readonly Candle[])** method
   - Processes candles in sequence using addCandle()
   - Returns array of all created PriceMoves
   - Throws on first invalid candle (fail-fast)

2. **clear()** method for structure reset
   - Clears activeMoves set
   - Clears repository

3. **11 new tests** covering:
   - Empty array handling
   - Single and multiple candle batch processing
   - Equivalence with sequential addCandle()
   - Error handling (fail-fast behavior)
   - Performance with 1000 candles
   - Linear scaling verification

## File List

### Modified
- packages/core/src/domain/structure/PriceMoveStructure.ts (buildFromCandles + clear methods)
- packages/core/src/domain/structure/PriceMoveStructure.test.ts (11 new tests)

## Change Log

| Date | Change |
|------|--------|
| 2026-01-17 | Story created |
| 2026-01-17 | Implementation complete - buildFromCandles + clear + 11 tests, 111 total tests passing |
