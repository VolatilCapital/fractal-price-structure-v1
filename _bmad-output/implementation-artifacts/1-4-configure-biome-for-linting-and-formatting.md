# Story 1.4: Configure Biome for Linting and Formatting

Status: done

## Story

As a **developer**,
I want **Biome configured for unified linting and formatting**,
So that **code quality is enforced consistently across all packages**.

## Acceptance Criteria

1. **Given** the monorepo structure
   **When** Biome configuration is complete
   **Then** `biome.json` exists at root with TypeScript strict rules

2. **And** `pnpm lint` runs Biome lint on all packages

3. **And** `pnpm format` runs Biome format on all packages

4. **And** no linting errors on initial configuration

## Tasks / Subtasks

- [x] Task 1: Add Biome dependency (AC: #1)
  - [x] Add @biomejs/biome to root devDependencies

- [x] Task 2: Create biome.json (AC: #1)
  - [x] Create biome.json at root
  - [x] Configure TypeScript strict rules
  - [x] Configure formatter (space indent, single quotes, semicolons)
  - [x] Configure linter with recommended rules

- [x] Task 3: Update root scripts (AC: #2, #3)
  - [x] Add lint, lint:fix scripts
  - [x] Add format, format:fix scripts
  - [x] Add check, check:fix scripts

- [x] Task 4: Update package scripts (AC: #2, #3)
  - [x] Update packages/core/package.json with lint/format scripts
  - [x] Update packages/visualizer/package.json with lint/format scripts

- [x] Task 5: Validate no linting errors (AC: #4)
  - [x] Run pnpm lint - no errors
  - [x] Run pnpm format - no formatting issues

## Dev Notes

### Architecture Requirements
- **Linting/Formatting**: Biome (replaces ESLint + Prettier) [Source: architecture.md]
- **Code Style**: Single quotes, trailing commas, semicolons [Source: project-context.md]

### Technical Specifications
- Biome v2.x with schema 2.0.0
- Includes only packages/**/*.ts files
- Strict rules: noExplicitAny, noUnusedVariables, noUnusedImports

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- ✅ Added @biomejs/biome v2.3.11 to root devDependencies
- ✅ Created biome.json with TypeScript strict rules and v2 schema
- ✅ Added lint, lint:fix, format, format:fix, check, check:fix scripts to root
- ✅ Updated package scripts to use biome lint/format
- ✅ Validated: pnpm lint and pnpm format pass with no errors

### File List

**New Files:**
- biome.json

**Modified Files:**
- package.json (added biome scripts, @biomejs/biome dependency)
- packages/core/package.json (lint/format scripts)
- packages/visualizer/package.json (lint/format scripts)

### Change Log

- 2026-01-17: Story 1.4 completed - Biome linting and formatting configured
