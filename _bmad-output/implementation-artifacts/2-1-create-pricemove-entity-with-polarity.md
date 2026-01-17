# Story 2.1: Create PriceMove Entity with Polarity

Status: done

## Story

As a **developer**,
I want **a PriceMove entity that correctly determines polarity from price data**,
So that **each move is classified as Up or Down based on price direction**.

## Acceptance Criteria

1. **Given** a candle with open and close prices
   **When** a PriceMove is created from that candle
   **Then** polarity is Up if close >= open

2. **And** polarity is Down if close < open

3. **And** PriceMove has id (UUID), timeRange, priceRange properties

4. **And** PriceMove is immutable after creation (id is readonly)

5. **And** tests cover edge cases (close == open, extreme values)

## Tasks / Subtasks

- [x] Task 1: Verify PriceMove entity exists with correct properties (AC: #3)
  - [x] Has id (PriceMoveId/UUID)
  - [x] Has timeRange (TimeRange)
  - [x] Has priceRange (PriceRange)
  - [x] Has polarity (Polarity)

- [x] Task 2: Verify PriceMoveFactory determines polarity correctly (AC: #1, #2)
  - [x] Polarity is Up when close >= open
  - [x] Polarity is Down when close < open

- [x] Task 3: Verify id is immutable (AC: #4)
  - [x] id is readonly in PriceMove class

- [x] Task 4: Add comprehensive tests (AC: #5)
  - [x] Test polarity Up when close > open
  - [x] Test polarity Up when close == open (edge case)
  - [x] Test polarity Down when close < open
  - [x] Test PriceMove has correct timeRange
  - [x] Test PriceMove has correct priceRange
  - [x] Test extreme values (tiny and large numbers)

## Dev Notes

### Existing Code Analysis
- PriceMove entity already exists with all required properties
- PriceMoveFactory.fromCandle() already implements polarity logic correctly
- id is already readonly in PriceMove
- Added comprehensive unit tests (14 tests)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Verified existing PriceMove entity has all required properties
- Verified PriceMoveFactory.fromCandle() implements polarity logic correctly
- Added 14 unit tests covering:
  - Polarity determination (Up/Down/edge case)
  - TimeRange and PriceRange mapping
  - UUID generation and uniqueness
  - Initial state verification
  - Extreme price values
- All 26 tests pass

### File List

**New Files:**
- packages/core/src/domain/price-move/PriceMove.test.ts (14 tests)

### Change Log

- 2026-01-17: Story 2.1 started - Existing code verified, tests needed
- 2026-01-17: Story 2.1 completed - 14 tests added, all pass
