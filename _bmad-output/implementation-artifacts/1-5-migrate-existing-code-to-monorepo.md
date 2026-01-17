# Story 1.5: Migrate Existing Code to Monorepo

Status: done

## Story

As a **developer**,
I want **existing source code migrated to packages/core/src/**,
So that **the brownfield code is preserved and ready for refactoring**.

## Acceptance Criteria

1. **Given** existing code in `src/` directory
   **When** migration is complete
   **Then** all files from `src/` are moved to `packages/core/src/`

2. **And** import paths are updated for ESM (.js extensions)

3. **And** `pnpm build` in packages/core succeeds

4. **And** existing functionality is preserved (smoke test passes)

## Tasks / Subtasks

- [x] Task 1: Copy source files (AC: #1)
  - [x] Copy domain/ to packages/core/src/domain/
  - [x] Copy application/ to packages/core/src/application/
  - [x] Copy infrastructure/ to packages/core/src/infrastructure/
  - [x] Copy shared/ to packages/core/src/shared/
  - [x] Copy main.ts to packages/core/src/main.ts

- [x] Task 2: Verify import paths (AC: #2)
  - [x] All imports already use .js extensions (ESM compliant)
  - [x] No path updates needed

- [x] Task 3: Update index.ts exports (AC: #3)
  - [x] Export main domain types (PriceMove, Polarity, etc.)
  - [x] Export shared types (PriceRange, TimeRange, Candle)
  - [x] Export application use cases

- [x] Task 4: Validate build (AC: #3)
  - [x] Run pnpm build - succeeds

- [x] Task 5: Validate tests (AC: #4)
  - [x] Run pnpm test - 3 tests pass

## Dev Notes

### Migration Notes
- Code was already ESM-compliant with .js extensions in imports
- Lint warnings exist in brownfield code - will be fixed in Story 1.6 and 1.7
- Original src/ directory preserved for reference until confirmed working

### Lint Issues Deferred to Story 1.6
- console.log calls in domain (PriceMove.ts)
- useImportType warnings (type-only imports)
- noUnusedVariables/noUnusedImports warnings
- useNodejsImportProtocol (node: prefix)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- ✅ Copied all source directories to packages/core/src/
- ✅ Updated index.ts with proper exports
- ✅ Build passes (pnpm build succeeds)
- ✅ Tests pass (3 tests)
- ✅ Lint has warnings from brownfield code (deferred to Story 1.6)

### File List

**New Files:**
- packages/core/src/domain/ (copied from src/domain/)
- packages/core/src/application/ (copied from src/application/)
- packages/core/src/infrastructure/ (copied from src/infrastructure/)
- packages/core/src/shared/ (copied from src/shared/)
- packages/core/src/main.ts (copied from src/main.ts)

**Modified Files:**
- packages/core/src/index.ts (added exports)

### Change Log

- 2026-01-17: Story 1.5 completed - Existing code migrated to monorepo
