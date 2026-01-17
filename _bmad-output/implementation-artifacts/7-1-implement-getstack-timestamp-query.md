# Story 7.1: Implement getStack(timestamp) Query

## Story

As a **developer**,
I want **to query the complete fractal state at a specific timestamp**,
So that **I can analyze historical structure at any point in time**.

## Status

done

## Acceptance Criteria

- [x] **AC1**: Given a fractal structure built from candles, when `getStack(timestamp)` is called, then the complete fractal state at that moment is returned
- [x] **AC2**: All generations visible at that time are included
- [x] **AC3**: Parent-child relationships reflect the state at that timestamp
- [x] **AC4**: Timestamp is in Unix milliseconds
- [x] **AC5**: Tests verify point-in-time accuracy

## Tasks/Subtasks

- [x] **Task 1**: Add closure timestamp tracking to PriceMove
  - [x] 1.1: Add optional `closedAt?: number` field to PriceMove
  - [x] 1.2: Update `tryExtendWith` to set closedAt when move is invalidated
  - [x] 1.3: Update tests to verify closedAt is set correctly

- [x] **Task 2**: Implement getStack(timestamp) query
  - [x] 2.1: Add `getStack(timestamp: number)` method to PriceMoveStructure
  - [x] 2.2: Filter moves that were active at timestamp (started before and not closed yet)
  - [x] 2.3: Add `getStack(timestamp: number)` to FractalEngine facade

- [x] **Task 3**: Implement helper method wasActiveAt(timestamp)
  - [x] 3.1: Add `wasActiveAt(timestamp: number)` method to PriceMove
  - [x] 3.2: Return true if move had started and wasn't closed at that time

- [x] **Task 4**: Write comprehensive tests
  - [x] 4.1: Test getStack returns correct moves at various timestamps
  - [x] 4.2: Test moves not yet started are excluded
  - [x] 4.3: Test closed moves are excluded after closure
  - [x] 4.4: Test all generations are included
  - [x] 4.5: Test empty result for timestamp before any moves

## Dev Notes

### Architecture Requirements
- Query must be O(n) where n is total moves
- Return defensive copies (no internal state mutation)
- Use existing PriceMove/PriceMoveStructure patterns

### Technical Specifications
- Per PRD FR15: Developer can query the complete fractal state at a specific timestamp (getStack)
- Per Architecture: Point-in-time queries are Post-MVP but FRs exist in PRD
- Timestamp format: Unix milliseconds (consistent with Candle.openTime/closeTime)

### Implementation Approach
1. Add `closedAt?: number` to track when move was closed/invalidated
2. A move was active at timestamp T if:
   - `move.timeRange.start <= T` (move had started)
   - AND (`move.closedAt === undefined` OR `move.closedAt > T`) (move wasn't closed yet)

## Dev Agent Record

### Implementation Plan
1. Modify PriceMove to add closedAt field
2. Update tryExtendWith to set closedAt on invalidation
3. Add wasActiveAt(timestamp) helper to PriceMove
4. Add getStack(timestamp) to PriceMoveStructure
5. Expose via FractalEngine facade
6. Write comprehensive tests

### Debug Log
- Build succeeds with no TypeScript errors
- 233 tests pass (232 core + 1 visualizer)

### Completion Notes
Implemented point-in-time query `getStack(timestamp)`:

1. **PriceMove.closedAt** - New optional field tracking when move was closed
   - Set to candidate's start time during invalidation in `tryExtendWith`
   - Undefined for active moves

2. **PriceMove.wasActiveAt(timestamp)** - Helper method
   - Returns true if move had started AND wasn't closed yet at timestamp
   - Handles edge cases (exact start time, never closed)

3. **PriceMoveStructure.getStack(timestamp)** - Core implementation
   - Filters all moves using wasActiveAt
   - Returns sorted by generation

4. **FractalEngine.getStack(timestamp)** - Public facade method

5. **17 new tests** covering:
   - Empty result for timestamp before moves
   - Active move at timestamp
   - Moves started after timestamp excluded
   - Closed moves excluded after closure
   - Sorting by generation
   - Edge cases (exact timestamps, closure timing)

## File List

### Modified
- packages/core/src/domain/price-move/PriceMove.ts (closedAt field, wasActiveAt method)
- packages/core/src/domain/structure/PriceMoveStructure.ts (getStack method)
- packages/core/src/FractalEngine.ts (getStack facade method)
- packages/core/src/FractalEngine.test.ts (17 new tests)

### Created
- _bmad-output/implementation-artifacts/7-1-implement-getstack-timestamp-query.md

## Change Log

| Date | Change |
|------|--------|
| 2026-01-17 | Story created |
| 2026-01-17 | Implementation complete - getStack + wasActiveAt + closedAt tracking, all 233 tests passing |
