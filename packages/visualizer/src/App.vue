<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useEngine } from './infrastructure/vue/composables/useEngine.js'
import { usePlayback } from './infrastructure/vue/composables/usePlayback.js'
import { useFilters } from './infrastructure/vue/composables/useFilters.js'
import PriceChart from './infrastructure/vue/components/PriceChart.vue'
import PlaybackControls from './infrastructure/vue/components/PlaybackControls.vue'
import TimeSlider from './infrastructure/vue/components/TimeSlider.vue'
import FilterPanel from './infrastructure/vue/components/FilterPanel.vue'
import EventsLog from './infrastructure/vue/components/EventsLog.vue'

const drawer = ref(true)

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
</script>

<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar color="primary" density="compact">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-app-bar-title>
        <v-icon icon="mdi-chart-line" class="mr-2" />
        Fractal Visualizer
      </v-app-bar-title>
      <v-spacer />
      <span class="text-body-2 mr-4">{{ currentDate }}</span>
      <span class="text-body-2 mr-4">
        Candle {{ cursorIndex + 1 }} / {{ candles.length }}
      </span>
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
    <v-main>
      <!-- Loading State -->
      <v-container v-if="isLoading" fluid class="fill-height">
        <v-row align="center" justify="center">
          <v-col cols="auto">
            <v-progress-circular indeterminate color="primary" size="64" />
            <p class="mt-4 text-center">Loading candles...</p>
          </v-col>
        </v-row>
      </v-container>

      <!-- Error State -->
      <v-container v-else-if="error" fluid class="fill-height">
        <v-row align="center" justify="center">
          <v-col cols="auto">
            <v-alert type="error" prominent>
              <v-alert-title>Error loading data</v-alert-title>
              {{ error }}
            </v-alert>
          </v-col>
        </v-row>
      </v-container>

      <!-- Main Content -->
      <v-container v-else fluid class="pa-4">
        <!-- Playback Controls -->
        <v-row class="mb-2">
          <v-col cols="12">
            <PlaybackControls
              :playback-state="playbackState"
              @play="play"
              @pause="pause"
              @stop="stop"
              @step-forward="stepForward"
              @step-backward="stepBackward"
            />
          </v-col>
        </v-row>

        <!-- Time Slider -->
        <v-row class="mb-2">
          <v-col cols="12">
            <TimeSlider
              :cursor-index="cursorIndex"
              :total-candles="candles.length"
              :candles="candles"
              @seek="seekTo"
            />
          </v-col>
        </v-row>

        <!-- Price Chart -->
        <v-row>
          <v-col cols="12">
            <v-card elevation="2">
              <v-card-text class="pa-0">
                <PriceChart
                  :candles="candles"
                  :engine="engine"
                  :cursor-time="cursorTime"
                  :cursor-index="cursorIndex"
                  :filter-state="filterState"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Events Log -->
        <v-row class="mt-4">
          <v-col cols="12">
            <v-card elevation="2">
              <v-card-title class="text-body-1">
                <v-icon icon="mdi-format-list-bulleted" class="mr-2" />
                Events
              </v-card-title>
              <v-card-text class="pa-0">
                <EventsLog
                  :events="events"
                  :cursor-time="cursorTime"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
html, body {
  overflow: hidden;
}

.v-main {
  overflow-y: auto;
}
</style>
