# @fractal-price-structure/visualizer

Visualization tools for fractal price structures - web app and terminal.

## Quick Start

### Web Visualizer (Vue.js + Observable Plot)

```bash
pnpm visualizer:dev
```

Opens http://localhost:5173 with:
- Interactive candlestick chart with PriceMove overlays
- Time-travel playback controls (play/pause/step)
- Filter panel for degré levels and sub-structures
- Events log showing structure changes

**Keyboard shortcuts:**
- `Space` - Play/Pause
- `←` / `→` - Step backward/forward
- `Home` / `End` - Jump to start/end

### Terminal Debug Visualizer

```bash
pnpm --filter @fractal-price-structure/visualizer dev:terminal
```

Outputs real-time fractal structure events to the console.

## Library Usage

```typescript
import { DebugVisualizer } from '@fractal-price-structure/visualizer'

const visualizer = new DebugVisualizer()
await visualizer.run()
```

## Architecture

The web visualizer follows DDD/Hexagonal architecture:

```
src/
├── domain/           # Pure business logic
│   ├── visualization/  # VisualizationState, PlaybackState, FilterState
│   └── events/         # StructureEvent, EventDeriver, EventFilter
├── application/      # Use cases
│   ├── ports/          # CandleLoader, ChartRenderer interfaces
│   └── use-cases/      # LoadCandles, PlaybackController
└── infrastructure/   # Implementations
    ├── loaders/        # JsonCandleLoader
    ├── plot/           # Observable Plot mark factories
    └── vue/            # Vue components and composables
```

## Color Coding

| State | Color | Description |
|-------|-------|-------------|
| Growing | 🟢 Green | Active move, still extending |
| Reference | 🟠 Orange | Terminated, became reference level |
| Archived | ⬜ Gray | Historical, no longer active |

## Build

```bash
# Build library (TypeScript)
pnpm --filter @fractal-price-structure/visualizer build

# Build web app (Vite)
pnpm --filter @fractal-price-structure/visualizer build:web
```

## Data Format

The web visualizer loads candles from JSON files. Supported formats:

```json
// Direct array
[{ "openTime": 123, "open": 100, ... }, ...]

// Wrapped format
{ "candles": [{ "openTime": 123, "open": 100, ... }, ...] }
```

Place fixture files in `public/fixtures/` for static serving.
