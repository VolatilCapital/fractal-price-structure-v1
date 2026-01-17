# Story 3.4: Implement PriceMoveStructure Orchestrator

## Story

As a **developer**,
I want **a PriceMoveStructure class that orchestrates move processing**,
So that **candle-to-structure logic is encapsulated**.

## Status

done

## Acceptance Criteria

- [x] **AC1**: Given a new candle to process, when PriceMoveStructure.add() is called, then the structure determines if the candidate extends, invalidates, or attaches to existing moves
- [x] **AC2**: Appropriate domain methods are called on PriceMove entities
- [x] **AC3**: Structure state is updated atomically
- [x] **AC4**: Structure consistency is maintained (NFR8)
- [x] **AC5**: Tests verify orchestration logic

## Tasks/Subtasks

- [x] **Task 1**: Verify orchestration logic in add() method
  - [x] 1.1: Extension detection via PriceMoveRules.canExtendWith()
  - [x] 1.2: Invalidation detection via PriceMoveRules.isInvalidatedBy()
  - [x] 1.3: Child attachment when neither extends nor invalidates

- [x] **Task 2**: Verify structure consistency
  - [x] 2.1: activeMoves set properly maintained
  - [x] 2.2: Repository properly updated
  - [x] 2.3: Parent-child relationships maintained

- [x] **Task 3**: Add consistency tests
  - [x] 3.1: Test structure invariants after operations
  - [x] 3.2: Test atomic state updates

## Dev Notes

### Architecture Requirements
- PriceMoveStructure is the orchestrator per Architecture document
- Uses PriceMoveRules for business rule checks
- Uses PriceMoveFactory for move creation
- Maintains activeMoves Set and Repository

### Implementation Status
This story was largely implemented during Epic 2 and Stories 3-2/3-3. The orchestration logic exists in:
- `add(priceMove)` - Core orchestration
- `addCandle(candle)` - Candle-to-structure entry point
- `buildFromCandles(candles)` - Batch processing

## Dev Agent Record

### Implementation Plan
Verify existing implementation covers all acceptance criteria and add any missing consistency tests.

### Debug Log
- Existing implementation already covers AC1-AC3, AC5
- Added consistency verification tests for AC4

### Completion Notes
The PriceMoveStructure orchestrator was implemented across multiple stories:
- Epic 2 created the core `add()` logic with extension/invalidation/attachment
- Story 3-2 added `addCandle()` for candle-based entry
- Story 3-3 added `buildFromCandles()` for batch processing

All acceptance criteria are satisfied:
1. `add()` uses PriceMoveRules to determine action
2. Domain methods on PriceMove are called (tryExtendWith)
3. State is updated atomically (activeMoves set, repository)
4. Consistency maintained via proper Set/Repository operations
5. 31 tests in PriceMoveStructure.test.ts verify orchestration

## File List

### Already Implemented
- packages/core/src/domain/structure/PriceMoveStructure.ts (add, addCandle, buildFromCandles)
- packages/core/src/domain/price-move/PriceMoveRules.ts (canExtendWith, isInvalidatedBy)
- packages/core/src/domain/structure/PriceMoveStructure.test.ts (31 tests)

## Change Log

| Date | Change |
|------|--------|
| 2026-01-17 | Story created and validated - implementation already exists from prior stories |
