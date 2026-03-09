<script setup lang="ts">
/**
 * Structure Stack panel.
 * Shows all active fractal structures at the current cursor time,
 * organized by rang (deepest first), with key properties.
 */
import { computed } from 'vue'
import type { FractalEngine } from '@fractal-price-structure/core'
import { PriceMoveState } from '@fractal-price-structure/core'
import { POLARITY_COLORS, STATE_COLORS } from '../../../domain/index.js'

const props = defineProps<{
  engine: FractalEngine | null
  cursorTime: number
}>()

const stack = computed(() => {
  if (!props.engine) return []
  return props.engine.getStack(props.cursorTime).reverse() // highest rang first
})

const summary = computed(() => {
  const moves = stack.value
  if (!moves.length) return null
  const growing = moves.filter(m => m.isGrowing()).length
  const reference = moves.filter(m => m.isReference()).length
  const maxRang = moves.length ? moves[0].rang : 0
  return { total: moves.length, growing, reference, maxRang }
})

function formatPrice(price: number): string {
  return price < 10 ? price.toFixed(5) : price < 1000 ? price.toFixed(2) : price.toFixed(0)
}

function polarityIcon(polarity: string): string {
  return polarity === 'up' ? 'mdi-arrow-up-bold' : 'mdi-arrow-down-bold'
}

function polarityColor(polarity: string): string {
  return polarity === 'up' ? POLARITY_COLORS.Up : POLARITY_COLORS.Down
}

function stateLabel(state: PriceMoveState): string {
  switch (state) {
    case PriceMoveState.Growing: return 'Growing'
    case PriceMoveState.Reference: return 'Reference'
    case PriceMoveState.Archived: return 'Archived'
  }
}

function stateColor(state: PriceMoveState): string {
  switch (state) {
    case PriceMoveState.Growing: return STATE_COLORS.Growing
    case PriceMoveState.Reference: return STATE_COLORS.Reference
    case PriceMoveState.Archived: return STATE_COLORS.Archived
  }
}

function amplitude(low: number, high: number): string {
  const pct = ((high - low) / low * 100)
  return pct < 0.01 ? pct.toFixed(4) : pct.toFixed(2)
}
</script>

<template>
  <div class="structure-stack">
    <!-- Summary header -->
    <div v-if="summary" class="stack-summary px-3 py-1">
      <span class="text-caption">
        <strong>{{ summary.total }}</strong> structures actives
        &mdash;
        <span :style="{ color: STATE_COLORS.Growing }">{{ summary.growing }} growing</span>,
        <span :style="{ color: STATE_COLORS.Reference }">{{ summary.reference }} ref</span>
        &mdash;
        rang max <strong>{{ summary.maxRang }}</strong>
      </span>
    </div>

    <div v-if="!stack.length" class="text-caption text-disabled pa-3">
      Aucune structure active
    </div>

    <!-- Stack table -->
    <table v-else class="stack-table">
      <thead>
        <tr>
          <th>Rang</th>
          <th>Dir</th>
          <th>Prix</th>
          <th>Ampl.</th>
          <th>Réf.</th>
          <th>État</th>
          <th>Sub</th>
          <th>Deg</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="move in stack"
          :key="move.id.toString()"
          :class="{ 'row-growing': move.isGrowing(), 'row-reference': move.isReference() }"
        >
          <td class="text-center">
            <strong>{{ move.rang }}</strong>
          </td>
          <td class="text-center">
            <v-icon
              :icon="polarityIcon(move.polarity)"
              :color="polarityColor(move.polarity)"
              size="x-small"
            />
          </td>
          <td class="text-no-wrap">
            {{ formatPrice(move.priceRange.low) }} → {{ formatPrice(move.priceRange.high) }}
          </td>
          <td class="text-right text-no-wrap">
            {{ amplitude(move.priceRange.low, move.priceRange.high) }}%
          </td>
          <td class="text-right text-no-wrap ref-level">
            {{ formatPrice(move.currentReferenceLevel) }}
          </td>
          <td class="text-center">
            <v-chip
              :color="stateColor(move.state)"
              size="x-small"
              variant="flat"
              density="compact"
            >
              {{ stateLabel(move.state) }}
            </v-chip>
          </td>
          <td class="text-center">
            {{ move.subStructures.length || '—' }}
          </td>
          <td class="text-center">
            {{ move.degre ?? '—' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.structure-stack {
  font-size: 12px;
  overflow-y: auto;
  height: 100%;
}

.stack-summary {
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(128, 128, 128, 0.05);
}

.stack-table {
  width: 100%;
  border-collapse: collapse;
}

.stack-table th {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 8px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.3);
  text-align: left;
  position: sticky;
  top: 0;
  background: rgb(var(--v-theme-surface));
  z-index: 1;
}

.stack-table td {
  padding: 3px 8px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.1);
}

.row-growing {
  background: rgba(102, 187, 106, 0.06);
}

.row-reference {
  background: rgba(255, 167, 38, 0.04);
}

.ref-level {
  font-family: monospace;
  opacity: 0.7;
}
</style>
