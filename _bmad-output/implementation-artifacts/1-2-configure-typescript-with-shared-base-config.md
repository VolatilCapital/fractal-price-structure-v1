# Story 1.2: Configure TypeScript with Shared Base Config

Status: done

## Story

As a **developer**,
I want **a shared TypeScript configuration with strict settings**,
So that **all packages use consistent TypeScript rules and ESM/NodeNext resolution**.

## Acceptance Criteria

1. **Given** the monorepo structure from Story 1.1
   **When** TypeScript configuration is complete
   **Then** a `tsconfig.base.json` exists at root with strict mode, ES2022 target, NodeNext resolution

2. **And** `packages/core/tsconfig.json` extends the base config

3. **And** `packages/visualizer/tsconfig.json` extends the base config

4. **And** `tsc --noEmit` succeeds without errors (on packages)

## Tasks / Subtasks

- [x] Task 1: Create tsconfig.base.json (AC: #1)
  - [x] Create `tsconfig.base.json` at project root
  - [x] Configure strict mode, ES2022 target, NodeNext resolution
  - [x] Set declaration, declarationMap, sourceMap options

- [x] Task 2: Update packages/core/tsconfig.json (AC: #2)
  - [x] Extend from tsconfig.base.json
  - [x] Configure composite: true for project references
  - [x] Set outDir and rootDir

- [x] Task 3: Update packages/visualizer/tsconfig.json (AC: #3)
  - [x] Extend from tsconfig.base.json
  - [x] Configure composite: true
  - [x] Add reference to core package

- [x] Task 4: Validate TypeScript compilation (AC: #4)
  - [x] Run `tsc --noEmit` on core package
  - [x] Run `tsc --noEmit` on visualizer package
  - [x] Verify no errors

## Dev Notes

### Architecture Requirements
- **Module System**: ESM with NodeNext resolution [Source: project-context.md]
- **TypeScript Version**: 5.x with strict mode [Source: architecture.md]
- **Project References**: Composite builds for monorepo [Source: architecture.md]

### Technical Specifications
- tsconfig.base.json contains shared compiler options
- Each package extends base and adds package-specific settings
- Visualizer references Core for type checking

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- ✅ Created tsconfig.base.json with strict mode, ES2022, NodeNext
- ✅ Updated packages/core/tsconfig.json with composite: true
- ✅ Updated packages/visualizer/tsconfig.json with reference to core
- ✅ Updated root tsconfig.json with project references
- ✅ Validated tsc --noEmit on both packages - no errors

### File List

**New Files:**
- tsconfig.base.json

**Modified Files:**
- tsconfig.json (updated to use references and extend base)
- packages/core/tsconfig.json (added composite: true)
- packages/visualizer/tsconfig.json (added composite: true, reference to core)

### Change Log

- 2026-01-17: Story 1.2 completed - TypeScript shared base config configured
