<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { useEngine } from './infrastructure/vue/composables/useEngine.js'
import { usePlayback } from './infrastructure/vue/composables/usePlayback.js'
import { useFilters } from './infrastructure/vue/composables/useFilters.js'
import PriceChart from './infrastructure/vue/components/PriceChart.vue'
import PlaybackControls from './infrastructure/vue/components/PlaybackControls.vue'
import TimeSlider from './infrastructure/vue/components/TimeSlider.vue'
import FilterPanel from './infrastructure/vue/components/FilterPanel.vue'
import EventsLog from './infrastructure/vue/components/EventsLog.vue'

const drawer = ref(true)
const eventsOpen = ref(false)

// Composables
const { candles, engine, events, isLoading, error, load } = useEngine()
const { playbackState, visualizationState, play, pause, stop, stepForward, stepBackward, seekTo } = usePlayback(candles)
const { filterState, toggleDegre, setShowSubStructures, setShowGrowing, setShowReference, setShowArchived, setShowUndefinedDegre, setDisplayMode } = useFilters()

// Computed
const cursorTime = computed(() => visualizationState.value.cursorTime)
const cursorIndex = computed(() => visualizationState.value.cursorIndex)

// Current candle info
const currentCandle = computed(() => {
  if (!candles.value.length) return null
  return candles.value[cursorIndex.value]
})

const currentDate = computed(() => {
  if (!currentCandle.value) return ''
  return new Date(currentCandle.value.openTime).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

// Load data on mount
onMounted(async () => {
  await load()
})

// Keyboard shortcuts
function handleKeydown(event: KeyboardEvent) {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return
  }

  switch (event.code) {
    case 'Space':
      event.preventDefault()
      if (playbackState.value.mode === 'playing') {
        pause()
      } else {
        play()
      }
      break
    case 'ArrowLeft':
      event.preventDefault()
      stepBackward()
      break
    case 'ArrowRight':
      event.preventDefault()
      stepForward()
      break
    case 'Home':
      event.preventDefault()
      seekTo(0)
      break
    case 'End':
      event.preventDefault()
      seekTo(candles.value.length - 1)
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// Expose state and controls for E2E automation (dev only)
if (import.meta.env.DEV) {
  watch(
    [cursorIndex, cursorTime, playbackState, candles],
    () => {
      ;(window as Window & { __visualizer__?: unknown }).__visualizer__ = {
        get cursorIndex() { return cursorIndex.value },
        get cursorTime() { return cursorTime.value },
        get totalCandles() { return candles.value.length },
        get playbackMode() { return playbackState.value.mode },
        play,
        pause,
        stop,
        stepForward,
        stepBackward,
        seekTo,
      }
    },
    { immediate: true },
  )
}
</script>

<template>
  <v-app data-testid="app">
    <!-- App Bar -->
    <v-app-bar color="primary" density="compact" data-testid="app-bar">
      <v-app-bar-nav-icon @click="drawer = !drawer" data-testid="nav-toggle" />
      <v-app-bar-title>
        <v-icon icon="mdi-chart-line" class="mr-2" />
        Fractal Visualizer
      </v-app-bar-title>
      <v-spacer />
      <span class="text-body-2 mr-4" data-testid="current-date">{{ currentDate }}</span>
      <span class="text-body-2 mr-4" data-testid="candle-counter">
        Candle {{ cursorIndex + 1 }} / {{ candles.length }}
      </span>
      <v-btn
        :icon="eventsOpen ? 'mdi-chevron-down' : 'mdi-format-list-bulleted'"
        variant="text"
        density="compact"
        class="mr-2"
        @click="eventsOpen = !eventsOpen"
        data-testid="events-toggle-btn"
      />
    </v-app-bar>

    <!-- Filter Panel (Navigation Drawer) -->
    <v-navigation-drawer v-model="drawer" width="300">
      <FilterPanel
        :filter-state="filterState"
        @toggle-degre="toggleDegre"
        @set-show-sub-structures="setShowSubStructures"
        @set-show-growing="setShowGrowing"
        @set-show-reference="setShowReference"
        @set-show-archived="setShowArchived"
        @set-show-undefined-degre="setShowUndefinedDegre"
        @set-display-mode="setDisplayMode"
      />
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main class="main-layout">
      <!-- Loading State -->
      <div v-if="isLoading" class="fill-height d-flex align-center justify-center" data-testid="loading-indicator">
        <div class="text-center">
          <v-progress-circular indeterminate color="primary" size="64" />
          <p class="mt-4">Loading candles...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="fill-height d-flex align-center justify-center pa-4" data-testid="error-state">
        <v-alert type="error" prominent>
          <v-alert-title>Error loading data</v-alert-title>
          {{ error }}
        </v-alert>
      </div>

      <!-- Normal layout: flex column, full height -->
      <div v-else class="content-layout">
        <!-- Controls strip (compact) -->
        <div class="controls-strip px-3 pt-2 pb-1 flex-shrink-0">
          <PlaybackControls
            :playback-state="playbackState"
            @play="play"
            @pause="pause"
            @stop="stop"
            @step-forward="stepForward"
            @step-backward="stepBackward"
          />
          <TimeSlider
            :cursor-index="cursorIndex"
            :total-candles="candles.length"
            :candles="candles"
            @seek="seekTo"
            class="mt-1"
          />
        </div>

        <!-- Chart fills remaining space -->
        <div class="chart-area flex-grow-1">
          <PriceChart
            :candles="candles"
            :engine="engine"
            :cursor-time="cursorTime"
            :cursor-index="cursorIndex"
            :filter-state="filterState"
          />
        </div>

        <!-- Events bottom panel (collapsible) -->
        <div class="events-panel">
          <div class="events-handle" @click="eventsOpen = !eventsOpen">
            <v-icon size="small" class="mr-2">mdi-format-list-bulleted</v-icon>
            <span class="text-caption font-weight-medium">Événements</span>
            <v-spacer />
            <v-icon size="small">{{ eventsOpen ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
          </div>
          <v-expand-transition>
            <div v-show="eventsOpen" class="events-content">
              <EventsLog
                :events="events"
                :cursor-time="cursorTime"
              />
            </div>
          </v-expand-transition>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<style>
html, body {
  overflow: hidden;
  height: 100%;
}

/* Force v-main to be a full-height flex column */
.v-main {
  display: flex !important;
  flex-direction: column;
  overflow: hidden !important;
}

.content-layout {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.chart-area {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.events-panel {
  flex-shrink: 0;
  border-top: 1px solid rgba(128, 128, 128, 0.2);
}

.events-handle {
  display: flex;
  align-items: center;
  padding: 6px 16px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.events-handle:hover {
  background: rgba(128, 128, 128, 0.08);
}

.events-content {
  height: 240px;
  overflow-y: auto;
}
</style>
