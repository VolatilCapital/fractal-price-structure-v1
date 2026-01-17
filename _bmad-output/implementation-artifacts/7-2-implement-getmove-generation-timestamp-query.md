# Story 7.2: Implement getMove(generation, timestamp) Query

## Story

As a **developer**,
I want **to get a specific generation's active move at a given timestamp**,
So that **I can inspect individual generation states**.

## Status

done

## Acceptance Criteria

- [x] **AC1**: Given a fractal structure with multiple generations, when `getMove(generation, timestamp)` is called, then the active move at that generation and time is returned
- [x] **AC2**: null/undefined is returned if no move was active
- [x] **AC3**: Move reflects the state at that exact timestamp
- [x] **AC4**: Tests verify generation-specific queries

## Tasks/Subtasks

- [x] **Task 1**: Implement getMove(generation, timestamp) query
  - [x] 1.1: Add `getMove(generation: number, timestamp: number)` method to PriceMoveStructure
  - [x] 1.2: Filter by generation AND wasActiveAt(timestamp)
  - [x] 1.3: Add `getMove(generation, timestamp)` to FractalEngine facade

- [x] **Task 2**: Write comprehensive tests
  - [x] 2.1: Test returns undefined for non-existent generation
  - [x] 2.2: Test returns undefined for timestamp before move started
  - [x] 2.3: Test returns move at specific generation and timestamp
  - [x] 2.4: Test returns correct move after closure

## Dev Notes

### Architecture Requirements
- Leverages wasActiveAt from Story 7.1
- Returns first matching move at generation (deterministic due to structure)

### Technical Specifications
- Per PRD FR16: Developer can query a specific generation's active move at a given timestamp

### Implementation Approach
- Use findAll() filtered by generation AND wasActiveAt(timestamp)
- Return undefined if no match

## Dev Agent Record

### Implementation Plan
1. Add getMove(generation, timestamp) to PriceMoveStructure
2. Expose via FractalEngine facade
3. Write tests

### Debug Log
- Implemented alongside Story 7.1 for efficiency
- 233 tests pass

### Completion Notes
Implemented point-in-time generation query `getMove(generation, timestamp)`:

1. **PriceMoveStructure.getMove(generation, timestamp)** - Core implementation
   - Filters by generation AND wasActiveAt(timestamp)
   - Returns first match or undefined

2. **FractalEngine.getMove(generation, timestamp)** - Public facade method

3. **4 new tests** covering:
   - Undefined for non-existent generation
   - Undefined for timestamp before move started
   - Returns move at specific generation and timestamp
   - Correct behavior after closure

## File List

### Modified
- packages/core/src/domain/structure/PriceMoveStructure.ts (getMove method)
- packages/core/src/FractalEngine.ts (getMove facade method)
- packages/core/src/FractalEngine.test.ts (4 new tests)

### Created
- _bmad-output/implementation-artifacts/7-2-implement-getmove-generation-timestamp-query.md

## Change Log

| Date | Change |
|------|--------|
| 2026-01-17 | Story created |
| 2026-01-17 | Implementation complete - getMove query, all 233 tests passing |
