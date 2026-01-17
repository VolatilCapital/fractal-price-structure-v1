# Story 1.1: Initialize pnpm Monorepo Structure

Status: done

## Story

As a **developer**,
I want **a pnpm monorepo structure with workspace configuration**,
So that **I can organize code into separate packages (core, visualizer) with shared dependencies**.

## Acceptance Criteria

1. **Given** the existing project root
   **When** the monorepo initialization is complete
   **Then** a `pnpm-workspace.yaml` file exists defining `packages/*`

2. **Given** the monorepo initialization is complete
   **When** checking the root directory
   **Then** a root `package.json` exists with workspace scripts

3. **Given** the monorepo initialization is complete
   **When** checking the packages directory
   **Then** `packages/core/` directory structure exists with its own `package.json`

4. **Given** the monorepo initialization is complete
   **When** checking the packages directory
   **Then** `packages/visualizer/` directory structure exists (empty placeholder)

5. **Given** the complete monorepo structure
   **When** running `pnpm install`
   **Then** the command succeeds without errors

## Tasks / Subtasks

- [x] Task 1: Create pnpm-workspace.yaml (AC: #1)
  - [x] Create `pnpm-workspace.yaml` at project root
  - [x] Define `packages/*` as workspace pattern

- [x] Task 2: Update root package.json for workspaces (AC: #2)
  - [x] Backup existing package.json
  - [x] Add workspace scripts (build, test, lint, format)
  - [x] Ensure "type": "module" is set
  - [x] Add root devDependencies for shared tooling

- [x] Task 3: Create packages/core structure (AC: #3)
  - [x] Create `packages/core/` directory
  - [x] Create `packages/core/package.json` with correct metadata
  - [x] Create `packages/core/src/` directory placeholder
  - [x] Set "type": "module" in package.json

- [x] Task 4: Create packages/visualizer placeholder (AC: #4)
  - [x] Create `packages/visualizer/` directory
  - [x] Create `packages/visualizer/package.json` with placeholder metadata
  - [x] Create `packages/visualizer/src/` directory placeholder

- [x] Task 5: Validate pnpm install (AC: #5)
  - [x] Run `pnpm install` to validate workspace configuration
  - [x] Verify no errors occur
  - [x] Verify node_modules structure is correct for workspaces

## Dev Notes

### Architecture Requirements
- **Monorepo Structure**: pnpm workspaces for package management [Source: architecture.md#Starter Template Evaluation]
- **Target Structure**: `packages/core/` and `packages/visualizer/` [Source: architecture.md#Target Structure]
- **Module System**: ESM with NodeNext resolution [Source: project-context.md#Technology Stack]

### Technical Specifications
- pnpm workspaces using `workspace:*` protocol for internal dependencies
- Root package.json should NOT have direct dependencies (only devDependencies for tooling)
- Each package has independent package.json with its own dependencies

### File Structure Reference
```
fractal-price-structure/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   └── package.json
│   └── visualizer/
│       ├── src/
│       └── package.json
├── pnpm-workspace.yaml
└── package.json
```

### Key Dependencies from Existing Project
Preserve these from current package.json:
- big.js: ^7.0.1 (decimal precision)
- luxon: ^3.7.2 (date/time handling)
- uuid: ^11.1.0 (entity IDs)
- axios: ^1.9.0 (HTTP client for Binance)

### Project Structure Notes

- This is a brownfield migration - existing code in `src/` will be migrated in Story 1.5
- For now, just establish the empty monorepo structure
- Keep existing `src/` directory intact until Story 1.5

### References

- [Source: architecture.md#Starter Template Evaluation] - pnpm monorepo decision
- [Source: architecture.md#Target Structure] - complete directory structure
- [Source: architecture.md#Initialization Commands] - setup commands
- [Source: prd.md#Developer Tool Specific Requirements] - ESM/TypeScript requirements

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No debug logs required for this infrastructure story.

### Completion Notes List

- ✅ Created pnpm-workspace.yaml with `packages/*` workspace pattern
- ✅ Updated root package.json with workspace scripts (build, test, lint, format, clean, dev)
- ✅ Created packages/core with package.json and src/index.ts placeholder
- ✅ Created packages/visualizer with package.json and src/index.ts placeholder (uses workspace:* to depend on core)
- ✅ Validated pnpm install - all 3 workspace projects recognized and installed successfully
- ✅ Existing src/ directory preserved for migration in Story 1.5

### File List

**New Files:**
- pnpm-workspace.yaml
- packages/core/package.json
- packages/core/src/index.ts
- packages/core/tsconfig.json
- packages/visualizer/package.json
- packages/visualizer/src/index.ts
- packages/visualizer/tsconfig.json
- tsconfig.base.json

**Modified Files:**
- package.json (updated for workspace scripts and private:true)
- pnpm-lock.yaml (updated by pnpm install)

### Change Log

- 2026-01-17: Story 1.1 completed - pnpm monorepo structure initialized
- 2026-01-17: Code review fixes - Added tsconfig.json files, fixed dev script path

