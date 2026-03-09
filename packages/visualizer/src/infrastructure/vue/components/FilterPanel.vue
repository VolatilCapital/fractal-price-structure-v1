<script setup lang="ts">
/**
 * Filter panel component for controlling visibility.
 * Shows degre checkboxes and toggle switches.
 */
import type { FilterState, DisplayMode } from '../../../domain/index.js'
import { STATE_COLORS } from '../../../domain/index.js'

export interface FractalStats {
  totalMoves: number
  growing: number
  reference: number
  archived: number
  layerCount: number
}

const props = defineProps<{
  filterState: FilterState
  maxAvailableRang?: number
  stats?: FractalStats
}>()

const emit = defineEmits<{
  toggleDegre: [degre: number]
  setShowSubStructures: [show: boolean]
  setShowGrowing: [show: boolean]
  setShowReference: [show: boolean]
  setShowArchived: [show: boolean]
  setShowUndefinedDegre: [show: boolean]
  setShowParentChildLinks: [show: boolean]
  setShowEventHighlights: [show: boolean]
  setDisplayMode: [mode: DisplayMode]
  setMaxRang: [maxRang: number | undefined]
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
  <div class="pa-4" data-testid="filter-panel">
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
        data-testid="display-mode-toggle"
      >
        <v-btn value="rectangle" size="small" data-testid="display-mode-rectangle">
          <v-icon icon="mdi-rectangle-outline" class="mr-1" />
          Rectangle
        </v-btn>
        <v-btn value="line" size="small" data-testid="display-mode-line">
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
          :data-testid="`chip-degre-${degre}`"
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
      data-testid="switch-growing"
    >
      <template #label>
        <span class="d-flex align-center">
          <span class="state-dot" :style="{ backgroundColor: STATE_COLORS.Growing }"></span>
          <span>
            <strong>Growing</strong>
            <span class="text-caption text-grey ml-1">en construction, actif</span>
          </span>
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
      data-testid="switch-reference"
    >
      <template #label>
        <span class="d-flex align-center">
          <span class="state-dot" :style="{ backgroundColor: STATE_COLORS.Reference }"></span>
          <span>
            <strong>Reference</strong>
            <span class="text-caption text-grey ml-1">figé, niveau de cassure</span>
          </span>
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
      data-testid="switch-archived"
    >
      <template #label>
        <span class="d-flex align-center">
          <span class="state-dot" :style="{ backgroundColor: STATE_COLORS.Archived }"></span>
          <span>
            <strong>Archived</strong>
            <span class="text-caption text-grey ml-1">historique, inactif</span>
          </span>
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
      data-testid="switch-sub-structures"
    />

    <v-switch
      :model-value="filterState.showParentChildLinks"
      @update:model-value="emit('setShowParentChildLinks', $event as boolean)"
      label="Liens parent-enfant"
      color="primary"
      density="compact"
      hide-details
      class="mt-1"
      data-testid="switch-parent-child-links"
    />

    <v-switch
      :model-value="filterState.showEventHighlights"
      @update:model-value="emit('setShowEventHighlights', $event as boolean)"
      label="Flash événements"
      color="primary"
      density="compact"
      hide-details
      class="mt-1"
      data-testid="switch-event-highlights"
    />

    <!-- Rang filter -->
    <v-divider class="my-4" />

    <div class="text-caption text-grey mb-2">Rang maximum</div>
    <div class="d-flex align-center ga-2">
      <v-slider
        :model-value="filterState.maxRang ?? (maxAvailableRang ?? 25)"
        @update:model-value="emit('setMaxRang', $event === (maxAvailableRang ?? 25) ? undefined : $event as number)"
        :min="0"
        :max="maxAvailableRang ?? 25"
        :step="1"
        density="compact"
        hide-details
        thumb-label
        color="primary"
        data-testid="slider-max-rang"
      />
      <span class="text-caption" style="min-width: 32px">
        {{ filterState.maxRang ?? 'All' }}
      </span>
    </div>

    <!-- Info -->
    <v-divider class="my-4" />

    <div class="text-caption text-grey mb-2">Légende</div>
    <div class="text-caption legend-section">
      <div class="legend-item">
        <span class="legend-swatch" :style="{ backgroundColor: '#42A5F5' }"></span>
        <span>Haussier (Up)</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch" :style="{ backgroundColor: '#EF5350' }"></span>
        <span>Baissier (Down)</span>
      </div>
      <div class="legend-item">
        <span class="legend-line" :style="{ backgroundColor: '#66BB6A' }"></span>
        <span>Accroissement (extension)</span>
      </div>
      <div class="legend-item">
        <span class="legend-line" :style="{ backgroundColor: '#FFA726' }"></span>
        <span>Cassure (invalidation)</span>
      </div>
    </div>

    <v-divider class="my-4" />

    <div class="text-caption text-grey mb-2">Hiérarchie fractale</div>
    <div class="text-caption">
      <div><strong>Rang</strong> = complexité (bottom-up) — épaisseur du trait</div>
      <div><strong>Degré</strong> = hiérarchie (top-down) — assigné à la terminaison</div>
      <div class="mt-1 text-grey">Plus le rang est élevé, plus le move englobe de sous-structures</div>
    </div>

    <!-- Keyboard shortcuts -->
    <v-divider class="my-4" />

    <div class="text-caption text-grey mb-2">Raccourcis clavier</div>
    <div class="text-caption shortcuts-grid">
      <kbd>Espace</kbd><span>Play / Pause</span>
      <kbd>← →</kbd><span>Bougie précédente / suivante</span>
      <kbd>[ ]</kbd><span>Ralentir / accélérer</span>
      <kbd>Home End</kbd><span>Début / fin</span>
      <kbd>Molette</kbd><span>Zoom</span>
      <kbd>Glisser</kbd><span>Pan horizontal</span>
      <kbd>Double-clic</kbd><span>Reset zoom</span>
    </div>

    <!-- Stats -->
    <template v-if="stats">
      <v-divider class="my-4" />
      <div class="text-caption text-grey mb-2">Statistiques</div>
      <div class="text-caption stats-grid" data-testid="fractal-stats">
        <div>Moves</div><div class="text-right">{{ stats.totalMoves }}</div>
        <div :style="{ color: STATE_COLORS.Growing }">Growing</div><div class="text-right">{{ stats.growing }}</div>
        <div :style="{ color: STATE_COLORS.Reference }">Reference</div><div class="text-right">{{ stats.reference }}</div>
        <div :style="{ color: STATE_COLORS.Archived }">Archived</div><div class="text-right">{{ stats.archived }}</div>
        <div>Couches (rang)</div><div class="text-right">{{ stats.layerCount }}</div>
      </div>
    </template>
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

.stats-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 12px;
}

.legend-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 3px 10px;
  align-items: center;
}

.shortcuts-grid kbd {
  background: rgba(128, 128, 128, 0.15);
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 10px;
  font-family: monospace;
  white-space: nowrap;
}

.legend-swatch {
  width: 14px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
  opacity: 0.7;
}

.legend-line {
  width: 14px;
  height: 3px;
  border-radius: 1px;
  flex-shrink: 0;
}
</style>
