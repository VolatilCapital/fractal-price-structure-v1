# Fractal Price Structure - Logic Specification

## Overview

This document specifies the fractal price structure logic - how candlestick data is transformed into a hierarchical structure of nested price movements.

## Core Concepts

### PriceMove

A **PriceMove** represents a directional price movement:

| Property | Description |
|----------|-------------|
| `polarity` | Direction: `Up` (bullish) or `Down` (bearish) |
| `priceRange` | Price bounds: `[low, high]` |
| `timeRange` | Time bounds: `[start, end]` |
| `generation` | Hierarchy level: 0 = root, 1 = child of root, etc. |
| `state` | `Active` (ongoing) or `Closed` (invalidated) |
| `childMoves` | Nested moves contained within this move |
| `englobingMove` | Parent move that contains this move |

### Polarity Determination

From a candle:
- **Up** if `close >= open`
- **Down** if `close < open`

## Fractal Building Rules

### Rule 1: Extension

A move can be **extended** when a new candidate breaks its directional boundary:

| Current Polarity | Extension Condition | Action |
|------------------|---------------------|--------|
| Up | `candidate.high > current.high` | Extend `current.high` and `timeRange.end` |
| Down | `candidate.low < current.low` | Extend `current.low` and `timeRange.end` |

**Result**: The current move grows to encompass the new price action.

### Rule 2: Invalidation (Closure)

A move is **invalidated/closed** when a candidate breaks the opposite boundary:

| Current Polarity | Invalidation Condition | Action |
|------------------|------------------------|--------|
| Up | `candidate.low < current.low` | Close the move, set `closedAt` |
| Down | `candidate.high > current.high` | Close the move, set `closedAt` |

**Result**: The move is marked as closed and removed from active moves.

### Rule 3: Internal Child (Englobment)

If a candidate neither extends nor invalidates a move, it becomes an **internal child**:

- Condition: Candidate fits entirely within the parent's price and time range
- Action:
  - Add candidate to parent's `childMoves[]`
  - Set candidate's `englobingMove` to parent
  - **Update candidate's `generation` = parent.generation + 1**

### Rule 4: New Root

If a candidate cannot extend any active move, it becomes a **new root**:

- Added to active moves
- `generation = 0`
- May still be englobed by a larger existing move (checked after creation)

## Generation Hierarchy

```
Generation 0: Root moves (largest, longest-duration trends)
    └── Generation 1: Direct children of roots
        └── Generation 2: Children of Gen 1
            └── ... (recursive)
```

**Key invariant**: A child's generation = parent's generation + 1

## Processing Flow

```
For each candle:
  1. Create PriceMove from candle (polarity, priceRange, timeRange)
  2. For each active move:
     a. Try to extend with candidate
     b. If extended → DONE (candidate absorbed)
     c. If invalidated → close the active move, continue
  3. If no extension occurred:
     a. Candidate becomes new root (generation = 0)
     b. Add to active moves
     c. Check if any existing move englobes this new root
        - If yes: set englobingMove, add to parent's childMoves
        - Update generation = englobingMove.generation + 1
```

## Expected Structure Properties

### Invariants (must always be true)

1. **Bidirectional relationships**: If A is in B's `childMoves`, then A's `englobingMove` is B
2. **Generation consistency**: `child.generation === parent.generation + 1`
3. **No duplicates**: A move appears only once in any `childMoves` array
4. **Active tracking**: All active moves are in the active set
5. **Price containment**: Child's priceRange is within parent's priceRange
6. **Time containment**: Child's timeRange is within parent's timeRange

### Expected Metrics

For a healthy fractal structure:

| Metric | Expected |
|--------|----------|
| Generations | > 1 (should have hierarchy) |
| Moves with parent | > 0 (children exist) |
| Moves with children | > 0 (parents exist) |
| Closed moves | > 0 (invalidations occur) |

## Current Implementation Issues

### Issue 1: Generation Never Updated

**Location**: `PriceMoveStructure.add()` and `PriceMove.tryExtendWith()`

**Problem**: When a move becomes a child (via `englobingMove`), its `generation` is never updated from the default 0.

**Fix**: After setting `englobingMove`, update `generation`:
```typescript
candidate.englobingMove = parent
candidate.generation = parent.generation + 1  // MISSING!
```

### Issue 2: Duplicate Children

**Location**: `PriceMove.tryExtendWith()` and `PriceMoveStructure.add()`

**Problem**:
1. `tryExtendWith()` adds candidate to `childMoves` when it's an internal child
2. `add()` also checks for englobment and adds to `childMoves`
3. Same move can be added twice

**Fix**: Check before adding to `childMoves`:
```typescript
if (!parent.childMoves.includes(candidate)) {
  parent.childMoves.push(candidate)
}
```

### Issue 3: Side Effects in canExtendWith

**Location**: `PriceMoveRules.canExtendWith()`

**Problem**: This function is named like a predicate (returns boolean) but calls `tryExtendWith()` which modifies state.

**Fix**: Separate the check from the action, or rename to make side effects clear.

## Validation Criteria

A valid fractal structure must pass:

1. **No duplicate children**: `move.childMoves` has no duplicates
2. **Bidirectional links**: englobingMove ↔ childMoves are consistent
3. **Generation hierarchy**: children have generation = parent.generation + 1
4. **Multiple generations exist**: structure has depth > 1
5. **Active/Closed consistency**: closed moves not in active set

## Test Data Expectations

For 1000 daily BTC candles:

| Metric | Minimum Expected |
|--------|------------------|
| Total moves | 1000 |
| Unique moves | 1000 (no duplicates) |
| Generations | >= 2 |
| Moves with parent | > 100 |
| Root moves | < 50 |
| Closed moves | > 10 |
