<script setup lang="ts">
/**
 * Time slider component for timeline navigation.
 */
import { computed } from 'vue'
import type { Candle } from '@fractal-price-structure/core'

const props = defineProps<{
  cursorIndex: number
  totalCandles: number
  candles: Candle[]
}>()

const emit = defineEmits<{
  seek: [index: number]
}>()

const sliderValue = computed({
  get: () => props.cursorIndex,
  set: (value: number) => emit('seek', value),
})

const maxIndex = computed(() => Math.max(0, props.totalCandles - 1))

// Format date for display
const formatDate = (index: number): string => {
  if (!props.candles.length || index < 0 || index >= props.candles.length) {
    return ''
  }
  const candle = props.candles[index]
  return new Date(candle.openTime).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const startDate = computed(() => formatDate(0))
const endDate = computed(() => formatDate(props.totalCandles - 1))
</script>

<template>
  <v-card elevation="0" class="pa-2" data-testid="time-slider">
    <div class="d-flex align-center">
      <span class="text-caption mr-2" data-testid="time-slider-start">{{ startDate }}</span>
      <v-slider
        v-model="sliderValue"
        :min="0"
        :max="maxIndex"
        :step="1"
        hide-details
        density="compact"
        color="primary"
        track-color="grey-lighten-3"
        class="flex-grow-1"
        data-testid="time-slider-input"
      >
        <template #thumb-label="{ modelValue }">
          {{ formatDate(modelValue as number) }}
        </template>
      </v-slider>
      <span class="text-caption ml-2" data-testid="time-slider-end">{{ endDate }}</span>
    </div>
  </v-card>
</template>
