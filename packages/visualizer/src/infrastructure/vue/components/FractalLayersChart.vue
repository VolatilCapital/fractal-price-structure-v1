<script setup lang="ts">
/**
 * Fractal Layers swim-lane chart component.
 * Renders each rang level as a horizontal band with moves as bars.
 * Shows parent-child relationships with connection lines.
 */
import { ref, watchEffect, onMounted, onUnmounted } from 'vue'
import * as Plot from '@observablehq/plot'
import type { Candle, FractalEngine } from '@fractal-price-structure/core'
import type { FilterState } from '../../../domain/index.js'
import {
  createFractalLayersMarks,
  computeLayersChartHeight,
  getFullDataRange,
  createTimeCursorMark,
} from '../../plot/index.js'

const props = defineProps<{
  candles: Candle[]
  engine: FractalEngine | null
  cursorTime: number
  filterState: FilterState
}>()

const chartContainer = ref<HTMLDivElement>()
const chartWidth = ref(1200)
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (!chartContainer.value) return
  resizeObserver = new ResizeObserver((entries) => {
    const w = entries[0]?.contentRect.width
    if (w && w > 100) chartWidth.value = w
  })
  resizeObserver.observe(chartContainer.value)
})

watchEffect(() => {
  if (!chartContainer.value || !props.candles.length || !props.engine) return

  chartContainer.value.innerHTML = ''

  const allMoves = props.engine.getAllMoves()
  const dataRange = getFullDataRange(props.candles)

  const { marks, maxRang } = createFractalLayersMarks({
    moves: allMoves,
    cursorTime: props.cursorTime,
    filterState: props.filterState,
    candles: props.candles,
  })

  const chartHeight = computeLayersChartHeight(maxRang)

  const cursorMark = createTimeCursorMark({ cursorTime: props.cursorTime })

  const chart = Plot.plot({
    width: chartWidth.value,
    height: chartHeight,
    marginLeft: 60,
    marginRight: 20,
    marginTop: 10,
    marginBottom: 30,
    x: {
      type: 'time',
      domain: [dataRange.timeMin, dataRange.timeMax],
      label: null,
    },
    y: {
      type: 'band',
      domain: Array.from({ length: maxRang + 1 }, (_, i) => i),
      label: 'Rang',
      reverse: true,
    },
    marks: [
      Plot.gridX({ stroke: '#e0e0e0', strokeOpacity: 0.3 }),
      ...marks,
      cursorMark,
    ],
    style: {
      background: 'transparent',
    },
  })

  chartContainer.value.appendChild(chart)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  if (chartContainer.value) {
    chartContainer.value.innerHTML = ''
  }
})
</script>

<template>
  <div ref="chartContainer" class="fractal-layers-chart" data-testid="fractal-layers-chart"></div>
</template>

<style scoped>
.fractal-layers-chart {
  width: 100%;
  min-height: 100px;
}
</style>
