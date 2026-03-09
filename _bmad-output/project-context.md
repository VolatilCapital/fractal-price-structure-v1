---
project_name: 'fractal-price-structure'
user_name: 'Maître'
date: '2026-01-17'
sections_completed: ['technology_stack', 'implementation_rules', 'naming', 'architecture', 'anti_patterns']
status: 'complete'
---

# Project Context for AI Agents

_Critical rules and patterns for implementing code in this project. Focus on unobvious details that agents might miss._

> **Technical Reference**: See [docs/protocole-construction.md](../docs/protocole-construction.md) for the authoritative specification of fractal construction rules.

---

## Technology Stack & Versions

| Technology | Version | Notes |
|------------|---------|-------|
| TypeScript | 5.9.3 | Strict mode, noImplicitAny |
| Node.js | 18+ | ES2022 target |
| Module System | ESM | NodeNext resolution, `.js` extensions required |
| pnpm | Latest | Workspace monorepo |
| Vitest | 4.x | Testing framework |
| Biome | Latest | Linting + formatting |
| big.js | 7.0.1 | Decimal precision for all price calculations |
| luxon | 3.7.2 | Date/time handling |
| Vue | 3.5.x | UI framework (visualizer package) |
| Vuetify | 4.x | UI component library — Material Design 3, no `v-main__wrap` inner wrapper |
| Vite | 7.x | Build tool (visualizer package) |

## Critical Implementation Rules

### TypeScript/ESM Rules

- **ALWAYS** use `.js` extension in imports (NodeNext requirement)
- **NEVER** use `any` type - strict mode enforced
- Use `type` imports for type-only imports: `import type { Foo } from './foo.js'`
- All exports must be explicit via `index.ts` files

### Domain Layer Rules (STRICT)

- **NO** imports from `infrastructure/` in domain code
- **NO** `console.log` - inject `Logger` interface instead
- **NO** `new Date()` - inject time service if needed
- **NO** direct HTTP calls - use infrastructure adapters
- All business rules must be pure functions
- Entities should be immutable or use explicit mutation methods

### Decimal Precision Rules

- **ALWAYS** use `big.js` for price calculations
- **NEVER** use JavaScript `>`, `<`, `==` for price comparisons
- Use big.js methods: `.gt()`, `.lt()`, `.eq()`, `.gte()`, `.lte()`
- Example: `if (price1.gt(price2))` NOT `if (price1 > price2)`

### Testing Rules

- Tests co-located with source: `PriceMove.test.ts` next to `PriceMove.ts`
- Use Vitest (not Jest)
- Domain tests must not require infrastructure
- Test file naming: `*.test.ts`

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files (classes) | PascalCase | `PriceMove.ts` |
| Directories | kebab-case | `price-move/` |
| Classes | PascalCase | `PriceMoveStructure` |
| Functions | camelCase | `tryExtendWith` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_TIMEOUT` |
| Private fields | underscore prefix | `_childMoves` |
| Interfaces | PascalCase, no I prefix | `Logger` not `ILogger` |

## Architecture Boundaries

```
domain/      → Pure logic, no infrastructure imports
application/ → Use cases, defines ports (interfaces)
infrastructure/ → Implements ports, external integrations
```

Dependencies flow INWARD only: infrastructure → application → domain

## Anti-Patterns to Avoid

| Don't | Do Instead |
|-------|------------|
| `console.log` in domain | Inject `Logger` interface |
| `import axios` in domain | Use infrastructure adapter |
| `if (price1 > price2)` | `if (price1.gt(price2))` |
| `new Date()` in domain | Inject clock service |
| Mutable entity state | Return new instance |
| `import './foo'` | `import './foo.js'` |

## Core Domain Concept: PriceMove

A PriceMove represents a directional price movement with:
- **Polarity**: Up or Down
- **Extension**: Move extends when price breaks directional boundary
- **Invalidation**: Move terminates when reference level is broken
- **Three States**: Growing (active) → Reference (terminated, serves as level) → Archived (no longer relevant)
- **Generation**: Child moves inherit generation from parent + 1
- **Englobment**: Parent-child relationships form fractal hierarchy

