# Story 3.6: Implement Decimal Precision for Prices

## Story

As a **developer**,
I want **all price calculations to use big.js**,
So that **floating-point errors are eliminated**.

## Status

done

## Acceptance Criteria

- [x] **AC1**: Given price values in candles and moves, when comparisons or calculations are performed, then big.js methods are used (.gt(), .lt(), .eq(), .gte(), .lte())
- [x] **AC2**: No JavaScript comparison operators are used for prices in core domain logic
- [x] **AC3**: Precision is maintained through all operations
- [x] **AC4**: Tests verify precision with edge cases (very small differences)

## Tasks/Subtasks

- [x] **Task 1**: Create Price utility module
  - [x] 1.1: Create `Price.ts` with big.js wrapper functions
  - [x] 1.2: Implement gt, gte, lt, lte, eq comparison methods
  - [x] 1.3: Implement min, max, add, sub arithmetic methods
  - [x] 1.4: Export from index.ts

- [x] **Task 2**: Update PriceRange to use Price module
  - [x] 2.1: Replace Math.min/max with Price.min/max
  - [x] 2.2: Replace comparison operators with Price methods

- [x] **Task 3**: Update PriceMove to use Price module
  - [x] 3.1: Replace extension comparisons with Price.gt/lt
  - [x] 3.2: Replace invalidation comparisons with Price.gt/lt

- [x] **Task 4**: Update PriceMoveRules to use Price module
  - [x] 4.1: Replace boundary comparisons with Price.gt/lt

- [x] **Task 5**: Update PriceMoveFactory to use Price module
  - [x] 5.1: Replace polarity comparison with Price.gte

- [x] **Task 6**: Update Candle validation to use Price module
  - [x] 6.1: Replace price comparisons with Price methods
  - [x] 6.2: Add early return for NaN/Infinity (big.js limitation)

- [x] **Task 7**: Write comprehensive tests
  - [x] 7.1: Test all Price module methods
  - [x] 7.2: Test floating-point precision scenarios
  - [x] 7.3: Test edge cases (very small differences, large numbers, negatives)
  - [x] 7.4: Test crypto-style precision (8 decimals)

## Dev Notes

### Architecture Requirements
- Per PRD FR24: System uses precise decimal arithmetic for all price calculations
- big.js is already a dependency in package.json
- Price module provides a facade over big.js for consistent usage

### Design Decisions
- **Price module as facade**: Rather than using big.js directly throughout the codebase, a Price utility module provides a clean API
- **Number type preserved**: Prices remain as JavaScript numbers for storage/transport; big.js is used only for comparisons
- **Early return for NaN/Infinity**: big.js cannot handle these values, so validation returns early

### Files Using Price Module
- `shared/Price.ts` - Core module
- `shared/PriceRange.ts` - Range comparisons and min/max
- `domain/price-move/PriceMove.ts` - Extension and invalidation logic
- `domain/price-move/PriceMoveRules.ts` - Rule checks
- `domain/price-move/PriceMoveFactory.ts` - Polarity determination
- `domain/candle/Candle.ts` - Validation logic

## Dev Agent Record

### Implementation Plan
1. Create Price utility module wrapping big.js
2. Update all price comparisons in domain layer
3. Write comprehensive tests for precision

### Debug Log
- 148 tests pass after implementation
- Build succeeds with no TypeScript errors
- Fixed early return in Candle validation for NaN/Infinity handling

### Completion Notes
Implemented decimal precision using big.js:

1. **Price utility module** (`shared/Price.ts`)
   - Wraps big.js for consistent API
   - Methods: gt, gte, lt, lte, eq, min, max, add, sub
   - Exported from index.ts

2. **Updated domain layer**
   - PriceRange: Uses Price.min/max and Price.gt/lte for comparisons
   - PriceMove: Uses Price.gt/lt for extension and invalidation logic
   - PriceMoveRules: Uses Price.gt/lt for boundary checks
   - PriceMoveFactory: Uses Price.gte for polarity determination
   - Candle validation: Uses Price methods with early return for NaN/Infinity

3. **30 new tests** covering:
   - All comparison methods (gt, gte, lt, lte, eq)
   - Arithmetic methods (add, sub)
   - Min/max functions
   - Floating-point precision scenarios
   - Edge cases (small differences, large numbers, negatives, crypto precision)

## File List

### Created
- packages/core/src/shared/Price.ts (Price utility module)
- packages/core/src/shared/Price.test.ts (30 tests)

### Modified
- packages/core/src/shared/PriceRange.ts (use Price module)
- packages/core/src/domain/price-move/PriceMove.ts (use Price module)
- packages/core/src/domain/price-move/PriceMoveRules.ts (use Price module)
- packages/core/src/domain/price-move/PriceMoveFactory.ts (use Price module)
- packages/core/src/domain/candle/Candle.ts (use Price module + early return)
- packages/core/src/index.ts (export Price)

## Change Log

| Date | Change |
|------|--------|
| 2026-01-17 | Story created |
| 2026-01-17 | Implementation complete - Price module + 30 tests, 148 total tests passing |
