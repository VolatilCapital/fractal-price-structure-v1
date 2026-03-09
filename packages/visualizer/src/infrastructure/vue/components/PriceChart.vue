<script setup lang="ts">
/**
 * Main price chart component using Observable Plot.
 * Renders candlesticks, price moves, and time cursor.
 */
import { ref, watchEffect, onMounted, onUnmounted, computed } from 'vue'
import * as Plot from '@observablehq/plot'
import type { Candle, FractalEngine } from '@fractal-price-structure/core'
import type { FilterState } from '../../../domain/index.js'
import {
  createCandlestickMarks,
  createPriceMoveMarks,
  createTimeCursorMark,
  getFullDataRange,
} from '../../plot/index.js'

const props = defineProps<{
  candles: Candle[]
  engine: FractalEngine | null
  cursorTime: number
  cursorIndex: number
  filterState: FilterState
}>()

const chartContainer = ref<HTMLDivElement>()
const containerHeight = ref(500)
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (!chartContainer.value) return
  resizeObserver = new ResizeObserver((entries) => {
    const h = entries[0]?.contentRect.height
    if (h && h > 100) containerHeight.value = h
  })
  resizeObserver.observe(chartContainer.value)
})

// Get all moves from engine
const allMoves = computed(() => {
  if (!props.engine) return []
  return props.engine.getAllMoves()
})

// Render chart when dependencies change
watchEffect(() => {
  if (!chartContainer.value || !props.candles.length) return

  // Clear previous chart
  chartContainer.value.innerHTML = ''

  // Get data ranges for axis scaling
  const dataRange = getFullDataRange(props.candles)

  // Create marks
  const candlestickMarks = createCandlestickMarks({
    candles: props.candles,
    cursorTime: props.cursorTime,
  })

  const priceMoveMarks = createPriceMoveMarks({
    moves: allMoves.value,
    cursorTime: props.cursorTime,
    filterState: props.filterState,
  })

  const cursorMark = createTimeCursorMark({
    cursorTime: props.cursorTime,
  })

  // Create chart
  const chart = Plot.plot({
    width: chartContainer.value.clientWidth || 1200,
    height: containerHeight.value,
    marginLeft: 60,
    marginRight: 20,
    marginTop: 20,
    marginBottom: 40,
    x: {
      type: 'time',
      domain: [dataRange.timeMin, dataRange.timeMax],
      label: null,
    },
    y: {
      domain: (() => {
        const padding = (dataRange.priceMax - dataRange.priceMin) * 0.1
        return [dataRange.priceMin - padding, dataRange.priceMax + padding]
      })(),
      label: 'Price',
      grid: true,
    },
    marks: [
      // Background grid
      Plot.gridY({ stroke: '#e0e0e0', strokeOpacity: 0.5 }),
      // Price moves (rendered first, behind candles)
      ...priceMoveMarks,
      // Candlesticks
      ...candlestickMarks,
      // Time cursor
      cursorMark,
    ],
    style: {
      background: 'transparent',
    },
  })

  chartContainer.value.appendChild(chart)
})

// Cleanup on unmount
onUnmounted(() => {
  resizeObserver?.disconnect()
  if (chartContainer.value) {
    chartContainer.value.innerHTML = ''
  }
})
</script>

<template>
  <div ref="chartContainer" class="price-chart"></div>
</template>

<style scoped>
.price-chart {
  width: 100%;
  height: 100%;
}
</style>
