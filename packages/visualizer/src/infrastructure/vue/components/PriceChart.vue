<script setup lang="ts">
/**
 * Main price chart component using Observable Plot.
 * Renders candlesticks, price moves, and time cursor.
 * Supports zoom (wheel) and pan (drag).
 */
import { ref, watchEffect, onMounted, onUnmounted, computed } from 'vue'
import * as Plot from '@observablehq/plot'
import type { Candle, FractalEngine } from '@fractal-price-structure/core'
import type { FilterState, ZoomState, StructureEvent } from '../../../domain/index.js'
import { isZoomed } from '../../../domain/index.js'
import {
  createCandlestickMarks,
  createPriceMoveMarks,
  createParentChildLinkMarks,
  createEventHighlightMarks,
  filterMoves,
  createTimeCursorMark,
  getFullDataRange,
} from '../../plot/index.js'
import { useZoom } from '../composables/useZoom.js'
import {
  decorateMoveElements,
  attachHoverListeners,
  applyHighlightClasses,
  buildMoveIndex,
} from '../../plot/HoverDecorator.js'
import MiniMap from './MiniMap.vue'

const props = defineProps<{
  candles: Candle[]
  engine: FractalEngine | null
  cursorTime: number
  cursorIndex: number
  filterState: FilterState
  events: StructureEvent[]
}>()

const chartContainer = ref<HTMLDivElement>()
const containerHeight = ref(500)
let resizeObserver: ResizeObserver | null = null

// Data range (full extent)
const dataRange = computed(() => {
  if (!props.candles.length) return { timeMin: 0, timeMax: 1, priceMin: 0, priceMax: 1 }
  return getFullDataRange(props.candles)
})

const dataTimeMin = computed(() => dataRange.value.timeMin)
const dataTimeMax = computed(() => dataRange.value.timeMax)

// Zoom composable
const { zoomState, zoom, panBy, resetZoom, isZoomed: checkZoomed } = useZoom(dataTimeMin, dataTimeMax)

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

// Auto-detect candle interval for event flash lookback
const candleIntervalMs = computed(() => {
  if (props.candles.length < 2) return 300_000 // default 5min
  return props.candles[1].openTime - props.candles[0].openTime
})

// Compute visible time domain (zoom or full)
const visibleTimeDomain = computed((): [number, number] => {
  const z = zoomState.value
  return [
    z.timeMin ?? dataRange.value.timeMin,
    z.timeMax ?? dataRange.value.timeMax,
  ]
})

// Compute visible price domain (auto-fit to visible candles)
const visiblePriceDomain = computed((): [number, number] => {
  if (!isZoomed(zoomState.value)) {
    const padding = (dataRange.value.priceMax - dataRange.value.priceMin) * 0.1
    return [dataRange.value.priceMin - padding, dataRange.value.priceMax + padding]
  }
  // When zoomed, compute price range from visible candles
  const [tMin, tMax] = visibleTimeDomain.value
  const visibleCandles = props.candles.filter(c => c.openTime >= tMin && c.openTime <= tMax)
  if (visibleCandles.length === 0) {
    return [dataRange.value.priceMin, dataRange.value.priceMax]
  }
  let low = Infinity
  let high = -Infinity
  for (const c of visibleCandles) {
    if (c.low < low) low = c.low
    if (c.high > high) high = c.high
  }
  const padding = (high - low) * 0.1
  return [low - padding, high + padding]
})

// Render chart when dependencies change
watchEffect(() => {
  if (!chartContainer.value || !props.candles.length) return

  // Clear previous chart
  chartContainer.value.innerHTML = ''

  // Create marks
  const candlestickMarks = createCandlestickMarks({
    candles: props.candles,
    cursorTime: props.cursorTime,
  })

  const priceMoveMarks = createPriceMoveMarks({
    moves: allMoves.value,
    cursorTime: props.cursorTime,
    filterState: props.filterState,
    candles: props.candles,
  })

  const cursorMarks = createTimeCursorMark({
    cursorTime: props.cursorTime,
  })

  // Parent-child connection links (optional)
  const parentChildMarks = props.filterState.showParentChildLinks
    ? createParentChildLinkMarks(
        filterMoves(allMoves.value, props.filterState),
        props.cursorTime,
      )
    : []

  // Event highlights (flash on structural events at cursor, if enabled)
  // Lookback = 3 candles so flashes persist visibly during playback
  const eventHighlightMarks = props.filterState.showEventHighlights
    ? createEventHighlightMarks({
        events: props.events,
        cursorTime: props.cursorTime,
        lookbackMs: candleIntervalMs.value * 3,
      })
    : []

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
      domain: visibleTimeDomain.value,
      label: null,
    },
    y: {
      domain: visiblePriceDomain.value,
      label: 'Price',
      grid: true,
    },
    marks: [
      // Background grid
      Plot.gridY({ stroke: '#e0e0e0', strokeOpacity: 0.5 }),
      // Price moves (rendered first, behind candles)
      ...priceMoveMarks,
      // Parent-child links (between moves, behind candles)
      ...parentChildMarks,
      // Candlesticks
      ...candlestickMarks,
      // Event highlights (on top of candles for visibility)
      ...eventHighlightMarks,
      // Time cursor (shadow + foreground)
      ...cursorMarks,
    ],
    style: {
      background: 'transparent',
    },
  })

  chartContainer.value.appendChild(chart)

  // --- Hover highlight (non-reactive, pure DOM) ---
  // Clean up previous listeners
  if (hoverCleanup) hoverCleanup()

  const moveIndex = buildMoveIndex(allMoves.value)
  decorateMoveElements(chart, allMoves.value)
  hoverCleanup = attachHoverListeners(
    chartContainer.value,
    moveIndex,
    (moveId, hierarchyIds) => {
      if (!chartContainer.value) return
      applyHighlightClasses(chartContainer.value, moveId, hierarchyIds)
    },
  )
})

let hoverCleanup: (() => void) | null = null

// --- Zoom & Pan event handlers ---

function handleWheel(event: WheelEvent) {
  event.preventDefault()
  if (!chartContainer.value) return

  // Convert mouse X position to time
  const rect = chartContainer.value.getBoundingClientRect()
  const marginLeft = 60
  const marginRight = 20
  const plotWidth = rect.width - marginLeft - marginRight
  const mouseX = event.clientX - rect.left - marginLeft
  const ratio = Math.max(0, Math.min(1, mouseX / plotWidth))

  const [tMin, tMax] = visibleTimeDomain.value
  const centerTime = tMin + ratio * (tMax - tMin)

  zoom(centerTime, event.deltaY)
}

let isDragging = false
let dragStartX = 0

function handleMouseDown(event: MouseEvent) {
  if (event.button !== 0) return // left click only
  isDragging = true
  dragStartX = event.clientX
  event.preventDefault()
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging || !chartContainer.value) return

  const rect = chartContainer.value.getBoundingClientRect()
  const marginLeft = 60
  const marginRight = 20
  const plotWidth = rect.width - marginLeft - marginRight
  const dx = event.clientX - dragStartX

  const [tMin, tMax] = visibleTimeDomain.value
  const timePerPixel = (tMax - tMin) / plotWidth
  const timeDelta = -dx * timePerPixel

  panBy(timeDelta)
  dragStartX = event.clientX
}

function handleMouseUp() {
  isDragging = false
}

function handleDoubleClick() {
  resetZoom()
}

// Mini-map: pan to a center time
function handlePanTo(centerTime: number) {
  const [tMin, tMax] = visibleTimeDomain.value
  const halfSpan = (tMax - tMin) / 2
  const timeDelta = centerTime - (tMin + halfSpan)
  panBy(timeDelta)
}

onMounted(() => {
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('mousemove', handleMouseMove)
})

// Cleanup on unmount
onUnmounted(() => {
  resizeObserver?.disconnect()
  if (hoverCleanup) hoverCleanup()
  window.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('mousemove', handleMouseMove)
  if (chartContainer.value) {
    chartContainer.value.innerHTML = ''
  }
})
</script>

<template>
  <div class="chart-wrapper">
    <div
      ref="chartContainer"
      class="price-chart"
      data-testid="price-chart"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @dblclick="handleDoubleClick"
    >
    </div>
    <div v-if="checkZoomed()" class="zoom-indicator" @click="resetZoom">
      <v-icon size="small" class="mr-1">mdi-magnify-minus</v-icon>
      Reset zoom
    </div>
    <MiniMap
      v-if="checkZoomed()"
      :candles="candles"
      :full-time-min="dataRange.timeMin"
      :full-time-max="dataRange.timeMax"
      :full-price-min="dataRange.priceMin"
      :full-price-max="dataRange.priceMax"
      :view-time-min="visibleTimeDomain[0]"
      :view-time-max="visibleTimeDomain[1]"
      @pan-to="handlePanTo"
    />
  </div>
</template>

<style scoped>
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.price-chart {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.price-chart:active {
  cursor: grabbing;
}

.zoom-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  z-index: 10;
}

.zoom-indicator:hover {
  background: rgba(0, 0, 0, 0.9);
}

/* Hover highlight — applied via JS class toggling, targets dynamically generated SVG */
.price-chart :deep([data-move-id]) {
  transition: opacity 0.12s ease;
  cursor: pointer;
}

.price-chart :deep([data-move-id].move-hovered) {
  filter: brightness(1.5) saturate(1.3);
  stroke-width: 3px;
}

.price-chart :deep([data-move-id].move-highlighted) {
  filter: brightness(1.25);
}

.price-chart.has-hover :deep([data-move-id]:not(.move-hovered):not(.move-highlighted)) {
  opacity: 0.2 !important;
}
</style>
