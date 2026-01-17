# Story 1.3: Configure Vitest Testing Framework

Status: done

## Story

As a **developer**,
I want **Vitest configured for workspace-wide testing**,
So that **I can write and run tests for domain rules with comprehensive coverage**.

## Acceptance Criteria

1. **Given** the monorepo structure with TypeScript
   **When** Vitest configuration is complete
   **Then** `vitest.workspace.ts` exists at root

2. **And** `packages/core/vitest.config.ts` exists

3. **And** a sample test file in `packages/core/src/` passes

4. **And** `pnpm test` runs all workspace tests

5. **And** coverage reporting is enabled

## Tasks / Subtasks

- [x] Task 1: Add Vitest dependencies (AC: #1, #5)
  - [x] Add vitest to root devDependencies
  - [x] Add @vitest/coverage-v8 for coverage

- [x] Task 2: Create vitest.workspace.ts (AC: #1)
  - [x] Create workspace config at root
  - [x] Include core and visualizer packages

- [x] Task 3: Create packages/core/vitest.config.ts (AC: #2)
  - [x] Configure test environment (node)
  - [x] Configure coverage with v8 provider
  - [x] Set include/exclude patterns

- [x] Task 4: Create sample tests (AC: #3)
  - [x] Create packages/core/src/index.test.ts
  - [x] Create packages/visualizer/src/index.test.ts
  - [x] Verify tests pass

- [x] Task 5: Update package scripts (AC: #4)
  - [x] Update packages/core/package.json with test scripts
  - [x] Update packages/visualizer/package.json with test scripts
  - [x] Verify pnpm test works

## Dev Notes

### Architecture Requirements
- **Testing Framework**: Vitest 4.x [Source: architecture.md]
- **Coverage Provider**: v8 [Source: PRD NFR12]
- **Test Co-location**: Tests in src/**/*.test.ts [Source: architecture.md]

### Technical Specifications
- Workspace-level vitest.workspace.ts for monorepo
- Per-package vitest.config.ts for specific settings
- Coverage reports in text, json, html formats

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- ✅ Added vitest and @vitest/coverage-v8 to root devDependencies
- ✅ Created vitest.workspace.ts with both packages
- ✅ Created vitest.config.ts for core and visualizer packages
- ✅ Created sample tests for both packages
- ✅ Updated package.json scripts with test, test:watch, test:coverage
- ✅ Verified pnpm test runs successfully (3 tests passing)

### File List

**New Files:**
- vitest.workspace.ts
- packages/core/vitest.config.ts
- packages/core/src/index.test.ts
- packages/visualizer/vitest.config.ts
- packages/visualizer/src/index.test.ts

**Modified Files:**
- package.json (added vitest, @vitest/coverage-v8)
- packages/core/package.json (test scripts)
- packages/visualizer/package.json (test scripts)

### Change Log

- 2026-01-17: Story 1.3 completed - Vitest testing framework configured
