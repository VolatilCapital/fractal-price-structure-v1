<script setup lang="ts">
/**
 * Mini-map overview component.
 * Shows a small line chart of the full price range with a viewport rectangle
 * indicating the currently visible area. Visible only when zoomed.
 * Click to pan the main chart to that position.
 */
import { ref, watchEffect, onUnmounted } from 'vue'
import * as Plot from '@observablehq/plot'
import type { Candle } from '@fractal-price-structure/core'

const props = defineProps<{
  candles: Candle[]
  fullTimeMin: number
  fullTimeMax: number
  fullPriceMin: number
  fullPriceMax: number
  viewTimeMin: number
  viewTimeMax: number
}>()

const emit = defineEmits<{
  panTo: [centerTime: number]
}>()

const miniMapContainer = ref<HTMLDivElement>()
const WIDTH = 200
const HEIGHT = 50
const MARGIN = { left: 0, right: 0, top: 2, bottom: 2 }

watchEffect(() => {
  if (!miniMapContainer.value || !props.candles.length) return
  miniMapContainer.value.innerHTML = ''

  const chart = Plot.plot({
    width: WIDTH,
    height: HEIGHT,
    marginLeft: MARGIN.left,
    marginRight: MARGIN.right,
    marginTop: MARGIN.top,
    marginBottom: MARGIN.bottom,
    x: {
      type: 'time',
      domain: [props.fullTimeMin, props.fullTimeMax],
      axis: null,
    },
    y: {
      domain: [props.fullPriceMin, props.fullPriceMax],
      axis: null,
    },
    marks: [
      // Price line (close prices)
      Plot.line(props.candles, {
        x: 'openTime',
        y: 'close',
        stroke: '#90CAF9',
        strokeWidth: 1,
      }),
      // Viewport rectangle
      Plot.rect([{ x1: props.viewTimeMin, x2: props.viewTimeMax }], {
        x1: 'x1',
        x2: 'x2',
        y1: props.fullPriceMin,
        y2: props.fullPriceMax,
        fill: 'rgba(255, 255, 255, 0.15)',
        stroke: 'rgba(255, 255, 255, 0.6)',
        strokeWidth: 1,
      }),
    ],
    style: {
      background: 'transparent',
    },
  })

  miniMapContainer.value.appendChild(chart)
})

function handleClick(event: MouseEvent) {
  if (!miniMapContainer.value) return
  const rect = miniMapContainer.value.getBoundingClientRect()
  const ratio = (event.clientX - rect.left) / rect.width
  const centerTime = props.fullTimeMin + ratio * (props.fullTimeMax - props.fullTimeMin)
  emit('panTo', centerTime)
}

onUnmounted(() => {
  if (miniMapContainer.value) {
    miniMapContainer.value.innerHTML = ''
  }
})
</script>

<template>
  <div
    ref="miniMapContainer"
    class="mini-map"
    @click="handleClick"
  />
</template>

<style scoped>
.mini-map {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 200px;
  height: 50px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: crosshair;
  z-index: 10;
  overflow: hidden;
}
</style>
