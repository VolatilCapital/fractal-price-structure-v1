---
title: 'Fractal Visualizer Web Application'
slug: 'fractal-visualizer-web'
created: '2026-01-18'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - Vue.js 3.5.x (Composition API, script setup)
  - Vuetify 3.x (v-app, v-app-bar, v-navigation-drawer, grid system)
  - Observable Plot 0.6.x (ruleX for candlestick, lineY for series)
  - TypeScript 5.9.x (strict mode, .js extensions)
  - Vite 6.x (ESM, Vue plugin)
  - Vitest 4.x (unit tests)
files_to_modify:
  - packages/visualizer/package.json
  - packages/visualizer/vite.config.ts
  - packages/visualizer/index.html
  - packages/visualizer/tsconfig.json
  - packages/visualizer/src/main.ts
  - packages/visualizer/src/App.vue
  - packages/visualizer/src/domain/**
  - packages/visualizer/src/application/**
  - packages/visualizer/src/infrastructure/**
code_patterns:
  - DDD/Hexagonal Architecture (domain/application/infrastructure)
  - Vue Composition API with script setup
  - Reactive state with ref/computed/watch
  - Observable Plot marks (ruleX, lineY, ruleY)
  - TypeScript strict with .js imports
test_patterns:
  - Vitest for unit tests
  - Co-located tests (*.test.ts)
  - Vue Test Utils for components (deferred)
---

# Tech-Spec: Fractal Visualizer Web Application

**Created:** 2026-01-18

## Overview

### Problem Statement

The fractal price structure library (`@fractal-price-structure/core`) produces complex hierarchical data (PriceMoves with rang, degre, states) that is difficult to understand and debug using only terminal output. Developers and analysts need a visual, interactive way to:
- See the price chart with fractal structures overlaid
- Understand the relationship between rangs and degres
- Track events (extensions, invalidations, creations) as they occur
- Navigate through time to understand how the structure evolved

### Solution

Build a web-based visualizer using Vue.js + Vuetify + Observable Plot that provides:
1. **Main Price Panel**: Candlestick chart with PriceMove overlays, filterable by degre
2. **Events Panel**: Console-like log of structure events with filtering
3. **Time-Travel Controls**: Music player-style controls (play/pause/stop) to step through candles
4. **Time Cursor**: Vertical line showing current position, with future data grayed out (not hidden)

### Scope

**In Scope:**
- Web application in `packages/visualizer`
- Candlestick chart with Observable Plot
- PriceMove overlay visualization with state colors (Growing/Reference/Archived)
- Filter controls for degre levels and sub-structure visibility
- Events panel with filtering by type, rang, degre
- Time-travel with play/pause/stop controls
- Visual graying of future data when navigating in the past
- Load candles from pre-cached JSON file
- DDD/Hexagonal architecture following core package patterns

**Out of Scope:**
- Live Binance API connection (future)
- Persistent storage / database
- User authentication
- Mobile-specific UI
- Tree diagram visualization (may be added later if needed)

## Context for Development

### Codebase Patterns

The project follows DDD/Hexagonal architecture:
- **Domain Layer**: Pure business logic, no infrastructure imports
- **Application Layer**: Use cases, ports (interfaces)
- **Infrastructure Layer**: Implementations (Vue components, Observable Plot adapters)

Key patterns from `packages/core`:
- TypeScript strict mode with `.js` extension in imports
- Value objects for domain concepts
- Injectable interfaces (Logger pattern)
- Co-located tests (`*.test.ts`)

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `packages/core/src/FractalEngine.ts` | Main API: `getStack()`, `getGrowingMoves()`, `getReferenceMoves()`, `getArchivedMoves()` |
| `packages/core/src/domain/price-move/PriceMove.ts` | PriceMove entity: `rang`, `degre`, `state`, `wasActiveAt(timestamp)`, `subStructures` |
| `packages/core/src/domain/price-move/PriceMoveState.ts` | State enum: `Growing`, `Reference`, `Archived` |
| `packages/core/src/domain/price-move/Polarity.ts` | Polarity enum: `Up`, `Down` |
| `packages/core/src/index.ts` | Public exports from core package |
| `packages/visualizer/src/index.ts` | Existing DebugVisualizer (terminal-based, to preserve) |
| `packages/core/src/__fixtures__/btcusdt-1d.json` | Sample candle data for testing |
| `.cache/BTCUSDT-1d.json` | Cached BTC daily candles |

### Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI Framework | Vue.js 3.5.x + Vuetify 3.x | User preference, modern component library |
| Charting | Observable Plot 0.6.x | User expertise, excellent for statistical charts |
| State Management | Vue Composition API + reactive | Simple, no need for Vuex/Pinia for prototype |
| Build Tool | Vite 6.x | Fast, native ESM support, Vue ecosystem |
| Architecture | DDD/Hexagonal | Consistency with core package |
| Candlestick impl | 2x Plot.ruleX marks | One thin (high-low), one thick (open-close) with color |

### Core API Available

```typescript
// From FractalEngine
engine.getGrowingMoves(): PriceMove[]      // Currently growing structures
engine.getReferenceMoves(): PriceMove[]    // Terminated, serving as reference
engine.getArchivedMoves(): PriceMove[]     // Archived (no longer active)
engine.getStack(timestamp): PriceMove[]    // All moves active at timestamp
engine.getMove(rang, timestamp): PriceMove // Specific move at rang+time
engine.getAllMoves(): PriceMove[]          // All moves
engine.getLayers(): FractalLayer[]         // Organized by rang level

// From PriceMove
move.rang: number                          // Depth in hierarchy (0=candle)
move.degre?: number                        // Complexity (set at termination)
move.state: PriceMoveState                 // Growing | Reference | Archived
move.polarity: Polarity                    // Up | Down
move.priceRange: { low, high }
move.timeRange: { start, end }
move.subStructures: PriceMove[]            // Child structures
move.parentStructure?: PriceMove           // Parent structure
move.terminatedAt?: number                 // When terminated
move.wasActiveAt(timestamp): boolean       // Was active at time T?
```

## Implementation Plan

### Phase 1: Project Setup

- [ ] **Task 1.1: Update package.json with Vue/Vite dependencies**
  - File: `packages/visualizer/package.json`
  - Action: Add Vue 3, Vuetify 3, Observable Plot, Vite, and related dependencies
  - Notes: Keep existing dependencies, add new ones. Update scripts for `dev` and `build`

- [ ] **Task 1.2: Create Vite configuration**
  - File: `packages/visualizer/vite.config.ts` (new)
  - Action: Configure Vite with Vue plugin, Vuetify plugin, resolve aliases
  - Notes: Set `resolve.alias` for `@/` pointing to `src/`

- [ ] **Task 1.3: Create HTML entry point**
  - File: `packages/visualizer/index.html` (new)
  - Action: Create minimal HTML with `<div id="app">` and script to main.ts
  - Notes: Include viewport meta tag for responsive design

- [ ] **Task 1.4: Update TypeScript configuration**
  - File: `packages/visualizer/tsconfig.json`
  - Action: Add Vite/Vue types, update includes for `.vue` files
  - Notes: Add `"types": ["vite/client"]`, `"jsx": "preserve"`

### Phase 2: Domain Layer

- [ ] **Task 2.1: Create VisualizationState value object**
  - File: `packages/visualizer/src/domain/visualization/VisualizationState.ts` (new)
  - Action: Define state interface with `cursorTime`, `cursorIndex`, `isPlaying`, `playbackSpeed`
  - Notes: Pure TypeScript, no Vue imports

- [ ] **Task 2.2: Create PlaybackState value object**
  - File: `packages/visualizer/src/domain/visualization/PlaybackState.ts` (new)
  - Action: Define `PlaybackMode` enum (Playing, Paused, Stopped) and state interface
  - Notes: Include `speed` (ms per candle) and `direction` (forward/backward)

- [ ] **Task 2.3: Create FilterState value object**
  - File: `packages/visualizer/src/domain/visualization/FilterState.ts` (new)
  - Action: Define filter criteria: `visibleDegres: Set<number>`, `showSubStructures: boolean`, `showArchived: boolean`, `showUndefinedDegre: boolean`
  - Notes: Pure TypeScript with immutable update methods
  - **Filter semantics for undefined degre**: Growing moves have `degre: undefined`. When `showUndefinedDegre` is true (default), Growing moves are always shown regardless of degre filter. When false, only terminated moves with defined degre matching the filter are shown.

- [ ] **Task 2.4: Create StructureEvent type**
  - File: `packages/visualizer/src/domain/events/StructureEvent.ts` (new)
  - Action: Define event types and structure
  - Notes: Event types and their derivation logic:
    ```typescript
    type EventType = 'Created' | 'Extended' | 'Terminated' | 'Archived'

    interface StructureEvent {
      id: string
      timestamp: number        // When the event occurred
      eventType: EventType
      moveId: string           // PriceMove.id
      rang: number             // PriceMove.rang at event time
      degre?: number           // PriceMove.degre (only for Terminated/Archived)
      polarity: Polarity
      priceRange: { low: number, high: number }
    }
    ```

- [ ] **Task 2.5: Create EventFilter value object**
  - File: `packages/visualizer/src/domain/events/EventFilter.ts` (new)
  - Action: Define filter criteria: `eventTypes: Set<EventType>`, `rangFilter?: number`, `degreFilter?: number`
  - Notes: Include `matches(event: StructureEvent): boolean` method

- [ ] **Task 2.6: Create EventDeriver service** *(NEW - addresses F1/F2)*
  - File: `packages/visualizer/src/domain/events/EventDeriver.ts` (new)
  - Action: Service that derives events by comparing move snapshots between candles
  - Notes: **Event derivation logic** (since FractalEngine doesn't emit events):
    ```typescript
    // Compare moves at candle N-1 vs candle N to derive events:
    //
    // CREATED: Move exists at N but not at N-1 (new move)
    //   → timestamp = move.timeRange.start
    //
    // EXTENDED: Move exists at both, but priceRange or timeRange changed
    //   → timestamp = candle[N].openTime
    //   → Only for Growing moves that expanded their boundaries
    //
    // TERMINATED: Move was Growing at N-1, is Reference at N
    //   → timestamp = move.terminatedAt
    //
    // ARCHIVED: Move was Reference at N-1, is Archived at N
    //   → timestamp = move.archivedAt
    //
    // Implementation: Process all candles sequentially, building a Map<moveId, lastSeenState>
    // and emitting events when states differ.
    ```

- [ ] **Task 2.7: Create domain index exports**
  - File: `packages/visualizer/src/domain/index.ts` (new)
  - Action: Export all domain types from visualization/ and events/
  - Notes: Use `export type` for type-only exports

### Phase 3: Application Layer

- [ ] **Task 3.1: Create CandleLoader port interface**
  - File: `packages/visualizer/src/application/ports/CandleLoader.ts` (new)
  - Action: Define interface with `loadCandles(): Promise<Candle[]>`
  - Notes: Import `Candle` type from `@fractal-price-structure/core`

- [ ] **Task 3.2: Create ChartRenderer port interface**
  - File: `packages/visualizer/src/application/ports/ChartRenderer.ts` (new)
  - Action: Define interface for rendering chart with candles, moves, cursor
  - Notes: Abstract away Observable Plot specifics

- [ ] **Task 3.3: Create LoadCandles use case**
  - File: `packages/visualizer/src/application/use-cases/LoadCandles.ts` (new)
  - Action: Use case that loads candles via CandleLoader port and builds FractalEngine
  - Notes: Return both candles and engine instance

- [ ] **Task 3.4: Create PlaybackController use case**
  - File: `packages/visualizer/src/application/use-cases/PlaybackController.ts` (new)
  - Action: Orchestrate playback: step forward/backward, play/pause/stop
  - Notes: Pure logic, no Vue dependencies

- [ ] **Task 3.5: Create application index exports**
  - File: `packages/visualizer/src/application/index.ts` (new)
  - Action: Export all ports and use cases
  - Notes: Keep exports organized by category

### Phase 4: Infrastructure - Vue Setup

- [ ] **Task 4.1: Create Vue app entry point**
  - File: `packages/visualizer/src/main.ts` (new)
  - Action: Create Vue app, install Vuetify, mount to #app
  - Notes: Import Vuetify CSS and MDI icons. **Coexistence with terminal visualizer**: This file is ONLY for the web app. The existing `index.ts` with `DebugVisualizer` remains unchanged as the library export.

- [ ] **Task 4.2: Create root App.vue component**
  - File: `packages/visualizer/src/App.vue` (new)
  - Action: Create Vuetify layout with v-app, v-app-bar, v-navigation-drawer, v-main
  - Notes: Use `<script setup lang="ts">` syntax. Include loading state and error boundary.
  - **Error handling**: Wrap main content in a try/catch pattern. Display v-alert for errors. Show v-progress-circular during loading.

- [ ] **Task 4.3: Create useEngine composable**
  - File: `packages/visualizer/src/infrastructure/vue/composables/useEngine.ts` (new)
  - Action: Reactive wrapper for FractalEngine with computed moves at cursor time
  - Notes: Expose `candles`, `engine`, `movesAtCursor`, `allMoves`, `events`, `isLoading`, `error`
  - **Event derivation integration**: On candle load, run EventDeriver to generate all events. Store in reactive `events` ref.

- [ ] **Task 4.4: Create usePlayback composable**
  - File: `packages/visualizer/src/infrastructure/vue/composables/usePlayback.ts` (new)
  - Action: Manage playback state with play/pause/stop/step functions
  - Notes: Use `setInterval` for auto-advance, expose `cursorIndex`, `cursorTime`
  - **Keyboard shortcuts**: Add event listeners for spacebar (play/pause), left/right arrows (step), Home/End (first/last candle)

- [ ] **Task 4.5: Create useFilters composable**
  - File: `packages/visualizer/src/infrastructure/vue/composables/useFilters.ts` (new)
  - Action: Manage filter state with toggles for degre, substructures, archived, undefinedDegre
  - Notes: **localStorage persistence** (IN SCOPE): Save filter state to `localStorage` key `fractal-visualizer-filters`. Restore on app load. Use `JSON.stringify/parse` with fallback to defaults on parse error.

### Phase 5: Infrastructure - Observable Plot Adapters

**Observable Plot + Vue Integration Strategy** *(addresses F3)*:
Observable Plot creates/replaces DOM nodes on each render - it doesn't patch. Strategy:
1. Use a `ref<HTMLDivElement>` for the chart container
2. In `watchEffect`, call `Plot.plot()` which returns an SVG element
3. Clear container (`container.innerHTML = ''`) then append new SVG
4. This is the standard pattern - Plot is designed for full re-renders
5. **Performance**: For <500 candles, full re-render is fast (<50ms). For >500, see Task 5.5.

- [ ] **Task 5.1: Create CandlestickMark factory**
  - File: `packages/visualizer/src/infrastructure/plot/CandlestickMark.ts` (new)
  - Action: Factory function returning Plot marks for candlestick
  - Notes: **Correct Observable Plot API for candlesticks**:
    ```javascript
    // ruleX is correct - it creates vertical lines at X positions
    // For OHLC with time on X-axis:
    Plot.ruleX(candles, {
      x: "openTime",           // X position (time)
      y1: "low", y2: "high",   // Vertical extent (wick)
      stroke: "#666",
      strokeWidth: 1,
      opacity: d => d.openTime <= cursorTime ? 1 : 0.3
    }),
    Plot.ruleX(candles, {
      x: "openTime",
      y1: "open", y2: "close", // Body
      stroke: d => d.close >= d.open ? "#4CAF50" : "#F44336",
      strokeWidth: 6,
      opacity: d => d.openTime <= cursorTime ? 1 : 0.3
    })
    ```

- [ ] **Task 5.2: Create PriceMoveMark factory**
  - File: `packages/visualizer/src/infrastructure/plot/PriceMoveMark.ts` (new)
  - Action: Factory function returning Plot marks for PriceMove visualization
  - Notes: Use `Plot.rect()` for price range boxes or `Plot.areaY()` for filled regions. Color by state (green/orange/gray), apply filter visibility.
    ```javascript
    Plot.rect(moves, {
      x1: d => d.timeRange.start,
      x2: d => d.timeRange.end,
      y1: d => d.priceRange.low,
      y2: d => d.priceRange.high,
      fill: d => stateColor(d.state),
      fillOpacity: 0.2,
      stroke: d => stateColor(d.state),
      strokeWidth: 1
    })
    ```

- [ ] **Task 5.3: Create TimeCursorMark factory**
  - File: `packages/visualizer/src/infrastructure/plot/TimeCursorMark.ts` (new)
  - Action: Factory function returning vertical ruleX at cursor position
  - Notes: Blue line (#2196F3), strokeWidth 2, full height via `y1: -Infinity, y2: Infinity`

- [ ] **Task 5.4: Create plot index exports**
  - File: `packages/visualizer/src/infrastructure/plot/index.ts` (new)
  - Action: Export all mark factories
  - Notes: Keep as pure functions, no Vue dependencies

- [ ] **Task 5.5: Add performance optimization for large datasets** *(NEW - addresses F4)*
  - File: `packages/visualizer/src/infrastructure/plot/ChartOptimizer.ts` (new)
  - Action: Implement viewport-based data windowing
  - Notes: **Performance thresholds and strategy**:
    - **< 500 candles**: No optimization needed, render all
    - **500-2000 candles**: Window to visible range + 50 candle buffer on each side
    - **> 2000 candles**: Add data aggregation (combine candles into OHLC summaries)
    - Implementation: `getVisibleCandles(candles, viewportStart, viewportEnd, buffer=50)`
    - Moves are always filtered to visible time range
    - Chart axes use full data range for proper scaling

### Phase 6: Infrastructure - Vue Components

- [ ] **Task 6.1: Create PriceChart.vue component**
  - File: `packages/visualizer/src/infrastructure/vue/components/PriceChart.vue` (new)
  - Action: Render Observable Plot chart with candlesticks, moves, cursor
  - Notes: **DOM management pattern**:
    ```vue
    <template>
      <div ref="chartContainer" class="price-chart"></div>
    </template>
    <script setup lang="ts">
    import { ref, watchEffect, onUnmounted } from 'vue'
    import * as Plot from '@observablehq/plot'

    const chartContainer = ref<HTMLDivElement>()

    watchEffect(() => {
      if (!chartContainer.value) return
      // Clear previous chart
      chartContainer.value.innerHTML = ''
      // Create new chart
      const svg = Plot.plot({ marks: [...] })
      chartContainer.value.appendChild(svg)
    })

    onUnmounted(() => {
      // Cleanup if needed
      if (chartContainer.value) chartContainer.value.innerHTML = ''
    })
    </script>
    ```

- [ ] **Task 6.2: Create PlaybackControls.vue component**
  - File: `packages/visualizer/src/infrastructure/vue/components/PlaybackControls.vue` (new)
  - Action: Vuetify buttons for play/pause/stop/step, speed selector
  - Notes: Use MDI icons: mdi-play, mdi-pause, mdi-stop, mdi-skip-next, mdi-skip-previous

- [ ] **Task 6.3: Create TimeSlider.vue component**
  - File: `packages/visualizer/src/infrastructure/vue/components/TimeSlider.vue` (new)
  - Action: v-slider for timeline navigation, displays current date/time
  - Notes: Min=0, max=candles.length-1, emits cursorIndex changes

- [ ] **Task 6.4: Create FilterPanel.vue component**
  - File: `packages/visualizer/src/infrastructure/vue/components/FilterPanel.vue` (new)
  - Action: Checkboxes for degre visibility, toggle for substructures/archived
  - Notes: Place in v-navigation-drawer

- [ ] **Task 6.5: Create EventsLog.vue component**
  - File: `packages/visualizer/src/infrastructure/vue/components/EventsLog.vue` (new)
  - Action: Scrollable list of structure events with filtering
  - Notes: Gray out events after cursor time, color-code by event type

### Phase 7: Infrastructure - Data Loading

- [ ] **Task 7.1: Create JsonCandleLoader adapter**
  - File: `packages/visualizer/src/infrastructure/loaders/JsonCandleLoader.ts` (new)
  - Action: Implement CandleLoader port, fetch JSON from fixtures
  - Notes: Use `fetch()` to load from `/fixtures/btcusdt-1d.json`

- [ ] **Task 7.2: Copy fixture file to public directory**
  - File: `packages/visualizer/public/fixtures/btcusdt-1d.json` (new)
  - Action: Copy fixture from core package for static serving
  - Notes: Vite serves `public/` as static assets

### Phase 8: Integration

- [ ] **Task 8.1: Wire up App.vue with all components**
  - File: `packages/visualizer/src/App.vue`
  - Action: Import and compose all components, connect composables
  - Notes: Pass props and events between components

- [ ] **Task 8.2: Configure dual entry points** *(addresses F6)*
  - File: `packages/visualizer/package.json`
  - Action: Configure package for both library exports and web app
  - Notes: **Dual entry point setup**:
    ```json
    {
      "main": "./dist/index.js",           // Library: DebugVisualizer
      "types": "./dist/index.d.ts",
      "exports": {
        ".": {
          "types": "./dist/index.d.ts",
          "import": "./dist/index.js"
        }
      },
      "scripts": {
        "build": "tsc",                     // Build library (unchanged)
        "build:web": "vite build",          // Build web app
        "dev": "vite",                      // Run web dev server
        "dev:terminal": "tsx src/btc-demo.ts"  // Run terminal demo
      }
    }
    ```
  - The existing `index.ts` exports `DebugVisualizer` (library usage)
  - The new `main.ts` bootstraps Vue app (web usage)
  - Vite only processes `main.ts` entry, library build uses `tsc`

- [ ] **Task 8.3: Update Vite config for web build output**
  - File: `packages/visualizer/vite.config.ts`
  - Action: Configure output to `dist-web/` to avoid conflicts with library `dist/`
  - Notes:
    ```typescript
    export default defineConfig({
      build: {
        outDir: 'dist-web',
        emptyOutDir: true
      }
    })
    ```

- [ ] **Task 8.4: Update root package.json**
  - File: `package.json` (root)
  - Action: Add scripts for visualizer
  - Notes:
    ```json
    {
      "visualizer:dev": "pnpm --filter @fractal-price-structure/visualizer dev",
      "visualizer:build": "pnpm --filter @fractal-price-structure/visualizer build:web"
    }
    ```

### Phase 9: Polish & Testing

- [ ] **Task 9.1: Add unit tests for domain layer**
  - Files: `packages/visualizer/src/domain/**/*.test.ts` (new)
  - Action: Test FilterState, EventFilter, PlaybackState logic
  - Notes: Use Vitest, co-located tests

- [ ] **Task 9.2: Style refinements**
  - File: `packages/visualizer/src/App.vue` and components
  - Action: Adjust colors, spacing, responsiveness
  - Notes: Ensure chart fills available space

- [ ] **Task 9.3: Add error handling**
  - Files: Various components
  - Action: Handle loading errors, empty data states
  - Notes: Show user-friendly messages

## Acceptance Criteria

### Core Functionality

- [ ] **AC1**: Given the visualizer is started, when the app loads, then candles are fetched from JSON and displayed as a candlestick chart
- [ ] **AC2**: Given candles are loaded, when the FractalEngine processes them, then PriceMoves are overlaid on the chart with correct colors (green=Growing, orange=Reference, gray=Archived)
- [ ] **AC3**: Given PriceMoves are displayed, when I toggle a degre filter off, then moves of that degre are hidden from the chart
- [ ] **AC4**: Given the chart is displayed, when I move the time slider, then a vertical cursor line moves to that position

### Time-Travel

- [ ] **AC5**: Given the cursor is at position N, when I view the chart, then candles after position N are dimmed (opacity ~0.3)
- [ ] **AC6**: Given the cursor is at position N, when I view the moves, then only moves that existed at that time (via `wasActiveAt()`) are shown at full opacity
- [ ] **AC7**: Given the events panel is displayed, when the cursor is at position N, then events after that time are grayed out

### Playback Controls

- [ ] **AC8**: Given playback is stopped, when I click Play, then the cursor auto-advances one candle at a time at the configured speed
- [ ] **AC9**: Given playback is playing, when I click Pause, then the cursor stops advancing
- [ ] **AC10**: Given playback is paused, when I click Stop, then the cursor resets to position 0
- [ ] **AC11**: Given the cursor is at position N, when I click Step Forward, then the cursor moves to position N+1
- [ ] **AC12**: Given the cursor is at position N > 0, when I click Step Backward, then the cursor moves to position N-1

### Events Panel

- [ ] **AC13**: Given the engine has processed candles, when I view the events panel, then I see a chronological list of structure events (Created, Extended, Terminated, Archived)
- [ ] **AC14**: Given the events panel is displayed, when I filter by event type, then only matching events are shown
- [ ] **AC15**: Given the events panel is displayed, when I filter by rang, then only events for moves of that rang are shown

### Architecture

- [ ] **AC16**: Given the domain layer code, when I inspect imports, then there are NO imports from Vue, Vuetify, or Observable Plot
- [ ] **AC17**: Given the application layer code, when I inspect imports, then there are NO imports from infrastructure layer
- [ ] **AC18**: Given the visualizer package, when I run `pnpm dev`, then a local dev server starts and the app is accessible in browser

### New ACs (from review fixes)

- [ ] **AC19**: Given filter settings are changed, when I reload the page, then filter settings are restored from localStorage
- [ ] **AC20**: Given the chart is focused, when I press spacebar, then playback toggles between play and pause
- [ ] **AC21**: Given the chart is focused, when I press left/right arrow keys, then the cursor steps backward/forward one candle
- [ ] **AC22**: Given a dataset with 1000+ candles, when the chart renders, then only visible candles + buffer are rendered (windowing)
- [ ] **AC23**: Given events are displayed, when I view the events panel, then events are derived from move state changes (Created, Extended, Terminated, Archived)
- [ ] **AC24**: Given the terminal visualizer is imported, when I call `DebugVisualizer` methods, then they work independently of the web app

## Additional Context

### Dependencies

**External libraries:**
- Vue 3.5.x - UI framework
- Vuetify 3.x - Component library
- Observable Plot 0.6.x - Charting
- Vite 6.x - Build tool
- @mdi/font - Material Design Icons

**Internal dependencies:**
- `@fractal-price-structure/core` - FractalEngine, PriceMove, Candle types

**Data dependencies:**
- `btcusdt-1d.json` fixture file for sample candles

### Testing Strategy

**Unit Tests (Vitest):**
- Domain layer: FilterState, EventFilter, PlaybackState
- Application layer: PlaybackController logic
- Infrastructure layer: Mark factories (pure functions)

**Manual Testing:**
- Visual verification of chart rendering
- Playback controls behavior
- Filter toggle responsiveness
- Time-travel visual feedback

**Deferred:**
- Vue component tests (Vue Test Utils)
- E2E tests (Playwright)
- Visual regression tests

### Notes

**Mitigated Risks** (addressed in this spec):
1. ~~Observable Plot integration with Vue reactivity~~ → DOM management pattern specified in Task 6.1
2. ~~Performance with large datasets~~ → Windowing strategy in Task 5.5
3. ~~Event generation~~ → EventDeriver service in Task 2.6 derives events from state changes
4. ~~Filter persistence~~ → localStorage in Task 4.5

**Remaining Risks:**
1. EventDeriver complexity - deriving events by comparing snapshots may have edge cases
2. PriceMove.rect() rendering with many overlapping moves may need z-index tuning

**Future Considerations (Out of Scope):**
- Live data streaming from Binance API
- Multiple timeframe comparison
- Drawing tools / annotations
- Export functionality (images, data)
- Tree diagram visualization of structure hierarchy

**Color Scheme:**
```
Growing:   #4CAF50 (Material Green 500)
Reference: #FF9800 (Material Orange 500)
Archived:  #9E9E9E (Material Gray 500)
Cursor:    #2196F3 (Material Blue 500)
Future:    opacity 0.3
```

**Playback Speeds:**
- Slow: 1000ms per candle
- Normal: 500ms per candle
- Fast: 200ms per candle
- Very Fast: 50ms per candle
