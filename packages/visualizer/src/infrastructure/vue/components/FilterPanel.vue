<script setup lang="ts">
/**
 * Filter panel component for controlling visibility.
 * Shows degre checkboxes and toggle switches.
 */
import type { FilterState, DisplayMode } from '../../../domain/index.js'

const props = defineProps<{
  filterState: FilterState
}>()

const emit = defineEmits<{
  toggleDegre: [degre: number]
  setShowSubStructures: [show: boolean]
  setShowArchived: [show: boolean]
  setShowUndefinedDegre: [show: boolean]
  setDisplayMode: [mode: DisplayMode]
}>()

// Available degre levels (0-5 typically)
const degreeLevels = [0, 1, 2, 3, 4, 5]

// Degre colors - must match PriceMoveMark.ts DEGRE_COLORS
const degreColors = [
  '#E91E63', // D0 - Pink
  '#9C27B0', // D1 - Purple
  '#3F51B5', // D2 - Indigo
  '#2196F3', // D3 - Blue
  '#00BCD4', // D4 - Cyan
  '#009688', // D5 - Teal
]

function isDegreVisible(degre: number): boolean {
  return props.filterState.visibleDegres.has(degre)
}

function getDegreColor(degre: number): string {
  return degreColors[degre % degreColors.length]
}
</script>

<template>
  <div class="pa-4">
    <h3 class="text-subtitle-1 mb-3">
      <v-icon icon="mdi-filter" class="mr-2" />
      Filters
    </h3>

    <!-- Display Mode -->
    <div class="mb-4">
      <div class="text-caption text-grey mb-2">Display Mode</div>
      <v-btn-toggle
        :model-value="filterState.displayMode"
        @update:model-value="emit('setDisplayMode', $event as DisplayMode)"
        mandatory
        density="compact"
        color="primary"
      >
        <v-btn value="rectangle" size="small">
          <v-icon icon="mdi-rectangle-outline" class="mr-1" />
          Rectangle
        </v-btn>
        <v-btn value="line" size="small">
          <v-icon icon="mdi-chart-line" class="mr-1" />
          Ligne
        </v-btn>
      </v-btn-toggle>
    </div>

    <v-divider class="mb-4" />

    <!-- Degre visibility -->
    <div class="mb-4">
      <div class="text-caption text-grey mb-2">Degre Levels</div>
      <div class="d-flex flex-wrap ga-1">
        <v-chip
          v-for="degre in degreeLevels"
          :key="degre"
          :color="isDegreVisible(degre) ? getDegreColor(degre) : 'grey'"
          :variant="isDegreVisible(degre) ? 'flat' : 'outlined'"
          size="small"
          @click="emit('toggleDegre', degre)"
          class="cursor-pointer"
        >
          D{{ degre }}
        </v-chip>
      </div>
    </div>

    <!-- Toggle switches -->
    <v-divider class="mb-4" />

    <v-switch
      :model-value="filterState.showSubStructures"
      @update:model-value="emit('setShowSubStructures', $event as boolean)"
      label="Show sub-structures"
      color="primary"
      density="compact"
      hide-details
      class="mb-2"
    />

    <v-switch
      :model-value="filterState.showArchived"
      @update:model-value="emit('setShowArchived', $event as boolean)"
      label="Show archived moves"
      color="primary"
      density="compact"
      hide-details
      class="mb-2"
    />

    <v-switch
      :model-value="filterState.showUndefinedDegre"
      @update:model-value="emit('setShowUndefinedDegre', $event as boolean)"
      label="Show growing (no degre)"
      color="primary"
      density="compact"
      hide-details
    />

    <!-- Legend -->
    <v-divider class="my-4" />

    <div class="text-caption text-grey mb-2">Legend - États</div>
    <div class="d-flex flex-column ga-1">
      <div class="d-flex align-center">
        <div class="legend-box" style="background-color: #4caf50"></div>
        <span class="text-caption ml-2">🟢 Growing (en construction)</span>
      </div>
      <div class="d-flex align-center">
        <div class="legend-box" style="background-color: #FF9800"></div>
        <span class="text-caption ml-2">🟠 Reference (niveau de cassure)</span>
      </div>
      <div class="d-flex align-center">
        <div class="legend-box" style="background-color: #9e9e9e"></div>
        <span class="text-caption ml-2">⬜ Archived (historique)</span>
      </div>
    </div>

    <v-divider class="my-4" />

    <div class="text-caption text-grey mb-2">Rang vs Degré</div>
    <div class="text-caption">
      <div><strong>Rang</strong> = complexité (bottom-up)</div>
      <div><strong>Degré</strong> = hiérarchie (top-down)</div>
    </div>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.legend-box {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  opacity: 0.7;
}
</style>
