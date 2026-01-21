<script setup lang="ts">
/**
 * Filter panel component for controlling visibility.
 * Shows degre checkboxes and toggle switches.
 */
import type { FilterState, DisplayMode } from '../../../domain/index.js'
import { STATE_COLORS } from '../../../domain/index.js'

const props = defineProps<{
  filterState: FilterState
}>()

const emit = defineEmits<{
  toggleDegre: [degre: number]
  setShowSubStructures: [show: boolean]
  setShowGrowing: [show: boolean]
  setShowReference: [show: boolean]
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
      Filtres
    </h3>

    <!-- Display Mode -->
    <div class="mb-4">
      <div class="text-caption text-grey mb-2">Mode d'affichage</div>
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
      <div class="text-caption text-grey mb-2">Niveaux de degré</div>
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

    <!-- State visibility (Growing, Reference, Archived) -->
    <v-divider class="mb-4" />

    <div class="text-caption text-grey mb-2">États visibles</div>

    <v-switch
      :model-value="filterState.showGrowing"
      @update:model-value="emit('setShowGrowing', $event as boolean)"
      :color="STATE_COLORS.Growing"
      density="compact"
      hide-details
      class="mb-1"
    >
      <template #label>
        <span class="d-flex align-center">
          <span class="state-dot" :style="{ backgroundColor: STATE_COLORS.Growing }"></span>
          Growing (en construction)
        </span>
      </template>
    </v-switch>

    <v-switch
      :model-value="filterState.showReference"
      @update:model-value="emit('setShowReference', $event as boolean)"
      :color="STATE_COLORS.Reference"
      density="compact"
      hide-details
      class="mb-1"
    >
      <template #label>
        <span class="d-flex align-center">
          <span class="state-dot" :style="{ backgroundColor: STATE_COLORS.Reference }"></span>
          Reference (niveau de cassure)
        </span>
      </template>
    </v-switch>

    <v-switch
      :model-value="filterState.showArchived"
      @update:model-value="emit('setShowArchived', $event as boolean)"
      :color="STATE_COLORS.Archived"
      density="compact"
      hide-details
      class="mb-2"
    >
      <template #label>
        <span class="d-flex align-center">
          <span class="state-dot" :style="{ backgroundColor: STATE_COLORS.Archived }"></span>
          Archived (historique)
        </span>
      </template>
    </v-switch>

    <!-- Other toggles -->
    <v-divider class="mb-4" />

    <div class="text-caption text-grey mb-2">Options</div>

    <v-switch
      :model-value="filterState.showSubStructures"
      @update:model-value="emit('setShowSubStructures', $event as boolean)"
      label="Sous-structures"
      color="primary"
      density="compact"
      hide-details
    />

    <!-- Info -->
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

.state-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}
</style>
