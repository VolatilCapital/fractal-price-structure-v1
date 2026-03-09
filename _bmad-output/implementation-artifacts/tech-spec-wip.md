---
title: 'Align Code with Fractal Construction Protocol'
slug: 'align-fractal-protocol'
created: '2026-01-21'
status: 'complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['TypeScript', 'big.js', 'Vitest']
files_to_modify:
  - packages/core/src/domain/price-move/PriceMove.ts
  - packages/core/src/domain/price-move/ReferenceLevel.ts
  - packages/core/src/domain/structure/PriceMoveStructure.ts
  - packages/core/src/domain/price-move/PriceMove.test.ts
code_patterns: ['Domain-driven design', 'Immutable price comparisons with big.js']
test_patterns: ['Co-located tests', 'Vitest']
---

# Tech-Spec: Align Code with Fractal Construction Protocol

**Created:** 2026-01-21

## Overview

### Problem Statement

The code implementation diverges from the documented fractal construction protocol (`docs/protocole-construction.md`). The critical difference is in **invalidation detection**: the protocol specifies that invalidation should check against the **reference level** (opposite bound of the last extending move), not against the structure's global bounds.

### Solution

Implement the "brin de référence" (reference strand) concept:
1. Track the last extending move as the reference strand
2. Use its opposite bound as the invalidation level
3. Update the reference level dynamically on each extension
4. Add engulfing candle handling with color heuristic

### Scope

**In Scope:**
- Implement dynamic reference level tracking
- Fix invalidation logic to use reference level instead of structure bounds
- Add engulfing candle detection and sequential processing
- Update tests to verify protocol compliance
- Self-review and fix any issues

**Out of Scope:**
- Parent assignment timing (current immediate assignment is acceptable)
- Degree calculation changes
- Memory optimization/archiving logic changes

## Context for Development

### Codebase Patterns

- Use `big.js` for all price comparisons: `.gt()`, `.lt()`, `.gte()`, `.lte()`
- Domain layer must remain pure (no infrastructure imports)
- Tests co-located with source files
- ESM with `.js` extensions in imports

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `docs/protocole-construction.md` | Authoritative protocol specification |
| `packages/core/src/domain/price-move/PriceMove.ts` | Main entity - needs reference level logic |
| `packages/core/src/domain/price-move/ReferenceLevel.ts` | Reference level type definition |
| `packages/core/src/domain/structure/PriceMoveStructure.ts` | Structure management - needs engulfing logic |
| `packages/core/src/domain/price-move/PriceMove.test.ts` | Tests to update |

### Technical Decisions

1. **Reference Level Storage**: Store `currentReferenceLevel: Price` on PriceMove, updated on each boundary extension
2. **Engulfing Detection**: Check if candidate breaks both bounds; use candle color (close > open = green) to determine processing order
3. **Backward Compatibility**: Keep legacy property aliases but mark as deprecated

## Implementation Plan

### Tasks

#### Task 1: Add currentReferenceLevel to PriceMove
- Add `currentReferenceLevel: Price` property
- Initialize to opposite bound on construction
- Update in `processCandidate()` when extending boundary

#### Task 2: Fix invalidation logic in processCandidate()
- Change invalidation check from `this.priceRange.low/high` to `this.currentReferenceLevel`
- For Up move: invalidation when `candidate.low < currentReferenceLevel`
- For Down move: invalidation when `candidate.high > currentReferenceLevel`

#### Task 3: Add engulfing candle handling
- Detect engulfing: candidate breaks both directional bound AND reference level
- Determine order via color heuristic (green = process low first, red = process high first)
- Split processing into two sequential operations

#### Task 4: Update tests
- Add tests for dynamic reference level updates
- Add tests for invalidation against reference level (not structure bounds)
- Add tests for engulfing candle handling

#### Task 5: Self-review and fix
- Run tests, fix failures
- Verify protocol compliance with example from section 14

### Acceptance Criteria

**AC1: Reference Level Initialization**
- Given: A new PriceMove is created with polarity Up and priceRange [100, 110]
- When: The move is constructed
- Then: currentReferenceLevel equals 100 (the low, opposite to Up direction)

**AC2: Reference Level Updates on Extension**
- Given: An Up move with currentReferenceLevel=100
- When: Extended by a candidate with low=105, high=115
- Then: currentReferenceLevel updates to 105 (the extending move's low)

**AC3: Invalidation Uses Reference Level**
- Given: An Up move with priceRange [100, 120] and currentReferenceLevel=108
- When: A candidate with low=106 arrives (below ref level but above structure low)
- Then: The move is broken (invalidated)

**AC4: Engulfing Candle - Green**
- Given: An Up move and a green engulfing candle (close > open) that breaks both bounds
- When: Processing the candle
- Then: Low is processed first (potential invalidation), then high (potential extension)

**AC5: Protocol Example Compliance**
- Given: The 10-candle example from protocol section 14
- When: Processing through the engine
- Then: Final state matches protocol's expected output

## Additional Context

### Dependencies

None - all changes are within the domain layer.

### Testing Strategy

1. Unit tests for PriceMove reference level logic
2. Integration tests with the 10-candle example from protocol
3. Run full test suite to catch regressions

### Notes

- The protocol example in section 14.3 shows specific expected states - use as validation
- Key insight: reference level is the LOW of the last Up-extending move (or HIGH for Down)
