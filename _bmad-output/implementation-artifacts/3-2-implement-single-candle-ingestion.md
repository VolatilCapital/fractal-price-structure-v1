# Story 3.2: Implement Single Candle Ingestion

## Story

As a **developer**,
I want **to add a single candle and update the fractal structure incrementally**,
So that **real-time streaming data can be processed**.

## Status

done

## Acceptance Criteria

- [x] **AC1**: Given an existing fractal structure (or empty structure), when `addCandle(candle)` is called, then a new PriceMove is created from the candle
- [x] **AC2**: The move is processed against active moves (extend/invalidate/attach)
- [x] **AC3**: The structure is updated accordingly
- [x] **AC4**: Operation completes in < 100ms (NFR1)
- [x] **AC5**: Tests verify incremental updates

## Tasks/Subtasks

- [x] **Task 1**: Define the public API for single candle ingestion
  - [x] 1.1: Create `addCandle(candle: Candle)` method on PriceMoveStructure
  - [x] 1.2: Validate candle before processing

- [x] **Task 2**: Implement candle-to-move conversion
  - [x] 2.1: Use PriceMoveFactory.fromCandle() to create PriceMove
  - [x] 2.2: Set correct generation for new moves

- [x] **Task 3**: Implement structure update logic
  - [x] 3.1: Process new move against all active moves
  - [x] 3.2: Handle extension, invalidation, and child attachment
  - [x] 3.3: Maintain structure consistency

- [x] **Task 4**: Write comprehensive tests
  - [x] 4.1: Test adding single candle to empty structure
  - [x] 4.2: Test adding candle that extends active move
  - [x] 4.3: Test adding candle that invalidates active move
  - [x] 4.4: Test adding candle as child move
  - [x] 4.5: Test performance (< 100ms per call)

## Dev Notes

### Architecture Requirements
- PriceMoveStructure is the orchestrator
- PriceMoveFactory creates moves from candles
- Domain logic in PriceMove.tryExtendWith handles extension/invalidation

### Technical Specifications
- Per PRD FR1: System can ingest single candle incrementally
- Per PRD NFR1: < 100ms per addCandle() call
- Per Architecture: PriceMoveStructure orchestrates move processing

## Dev Agent Record

### Implementation Plan
1. Add imports for Candle, validateCandle, and PriceMoveFactory to PriceMoveStructure
2. Create CandleIngestionError for validation failures
3. Implement addCandle(candle) method that validates, creates move, and calls add()
4. Write 20 comprehensive tests covering all scenarios

### Debug Log
- 100 tests pass after implementation
- Build succeeds with no TypeScript errors
- Performance test confirms < 100ms per candle

### Completion Notes
Implemented single candle ingestion:

1. **addCandle(candle: Candle)** method on PriceMoveStructure
   - Validates candle before processing
   - Creates PriceMove using PriceMoveFactory.fromCandle()
   - Processes against existing structure (extend/invalidate/attach)
   - Returns the created PriceMove

2. **CandleIngestionError** for invalid candle handling
   - Contains validation errors array
   - Graceful error handling (structure unchanged on error)

3. **20 new tests** covering:
   - Adding to empty structure
   - Polarity detection (Up/Down)
   - TimeRange and PriceRange from candle
   - Candle validation
   - Extension behavior
   - Invalidation behavior
   - Child attachment
   - Performance (< 100ms)
   - Edge cases (doji, flat, zero volume)

## File List

### Modified
- packages/core/src/domain/structure/PriceMoveStructure.ts (addCandle method + CandleIngestionError)
- packages/core/src/index.ts (export CandleIngestionError)

### Created
- packages/core/src/domain/structure/PriceMoveStructure.test.ts (20 tests)

## Change Log

| Date | Change |
|------|--------|
| 2026-01-17 | Story created |
| 2026-01-17 | Implementation complete - addCandle + 20 tests, all 100 tests passing |
