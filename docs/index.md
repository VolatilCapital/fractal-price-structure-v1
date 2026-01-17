# Project Documentation Index

## Fractal Price Structure

> TypeScript tool for generating hierarchical fractal structures from candlestick price data.

---

## Project Overview

| Attribute | Value |
|-----------|-------|
| **Type** | Monolith (single cohesive codebase) |
| **Language** | TypeScript 5.9.3 |
| **Runtime** | Node.js (ES Modules) |
| **Architecture** | Clean/Hexagonal (DDD) |
| **Data Source** | Binance REST API |

### Quick Reference

- **Entry Point**: `src/main.ts`
- **Tech Stack**: TypeScript, Node.js, axios, luxon, big.js
- **Architecture Pattern**: Clean Architecture with Domain-Driven Design
- **Primary Domain Entity**: `PriceMove`

---

## Generated Documentation

### Core Documentation

| Document | Description |
|----------|-------------|
| [Project Overview](./project-overview.md) | High-level project summary and purpose |
| [Architecture](./architecture.md) | Detailed architecture documentation with diagrams |
| [Data Models](./data-models.md) | Domain entities, value objects, and relationships |
| [Source Tree Analysis](./source-tree-analysis.md) | Annotated directory structure |
| [Development Guide](./development-guide.md) | Setup, commands, and development workflow |

### Not Generated (Not Applicable)

- **API Contracts** - This is a library/CLI tool, not an HTTP service
- **Deployment Guide** - No deployment configuration found
- **UI Components** - Backend-only project

---

## Existing Documentation

| Document | Type | Description |
|----------|------|-------------|
| [README.md](../README.md) | Readme | Basic project description |
| [CLAUDE.md](../CLAUDE.md) | AI Guide | Detailed guidance for AI assistants |

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm v8+

### Quick Start

```bash
# Install dependencies
npm install

# Run the application
npm run dev
```

### Output

After running, check:
- `.cache/` - Cached candle data
- `.logs/` - Execution logs
- `.logs/fractal-layers/` - Exported JSON layers

---

## Architecture Summary

```
src/
├── domain/           # Business logic (PriceMove, PriceMoveStructure)
├── application/      # Use cases (BuildPriceMovesFromCandles, etc.)
├── infrastructure/   # External adapters (Binance API, repositories)
└── shared/           # Cross-cutting value objects
```

### Key Domain Concepts

1. **PriceMove**: Directional price movement (Up/Down)
2. **Extension Logic**: How moves grow or close based on price action
3. **Fractal Layers**: Hierarchical nesting of price movements

---

## Technical Debt & Known Issues

| Severity | Issue |
|----------|-------|
| 🔴 High | No test suite configured |
| 🔴 High | Infrastructure dependency in domain layer |
| 🟡 Medium | Duplicate Candle interface |
| 🟡 Medium | Console.log in domain code |

---

## Next Steps for Development

1. **Add Vitest** for unit testing
2. **Fix architecture violations** (inject logger)
3. **Remove duplicate Candle** definition
4. **Make configuration external** (CLI args or config file)

---

*Documentation generated: 2026-01-16*
*Scan level: Exhaustive (all source files read)*
