# Development Guide

## Prerequisites

- **Node.js**: v18+ (ES2022 support required)
- **npm**: v8+
- **TypeScript**: Installed as dev dependency (v5.9.3)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd fractal-price-structure

# Install dependencies
npm install
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Run the application directly with tsx (no build needed) |
| `npm run build` | Compile TypeScript to JavaScript in `dist/` |
| `npm run clean` | Remove the `dist/` directory |
| `npm test` | ⚠️ Not configured - returns error |

## Running the Application

```bash
# Development mode (recommended)
npm run dev

# Or build and run
npm run build
node dist/main.js
```

## Project Configuration

### TypeScript (`tsconfig.json`)

- **Target**: ES2022
- **Module**: NodeNext (ES Modules)
- **Strict mode**: Enabled
- **Output**: `dist/` directory
- **Import extensions**: `.js` required (NodeNext resolution)

### Package Configuration (`package.json`)

- **Type**: ES Module (`"type": "module"`)
- **No test framework configured**

## Environment Setup

No environment variables required. The application uses:

- **Cache directory**: `.cache/` (auto-created)
- **Log directory**: `.logs/` (auto-created)
- **Binance API**: Public endpoints, no API key needed

## Hardcoded Configuration

In `src/main.ts`:

```typescript
const symbol = "BTCUSDT"    // Trading pair
const interval = "1m"        // Candlestick interval
const limit = 10000          // Number of candles to fetch
const cacheDir = "./.cache"  // Cache location
const logDir = "./.logs"     // Logs location
```

## Output Files

After running:

- `.cache/BTCUSDT-1m.json` - Cached candle data (daily)
- `.logs/price-move.log` - Move creation/closure logs
- `.logs/price-move-tree.log` - Tree visualization
- `.logs/fractal-layers/layer-{n}.json` - Exported fractal layers

## Testing

⚠️ **No test suite currently configured**

Recommended setup:
```bash
npm install -D vitest
```

## Known Development Issues

1. **Console.log in domain code** - Should use injected logger
2. **Duplicate Candle interface** - Exists in `shared/` and `domain/candle/`
3. **Infrastructure dependency in domain** - `PriceMoveStructure` imports logger directly
