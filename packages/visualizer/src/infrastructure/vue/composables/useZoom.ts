/**
 * Composable for chart zoom/pan interactions.
 * Handles wheel events (zoom) and drag events (pan).
 */
import { ref, type Ref } from 'vue'
import {
  createZoomState,
  resetZoom as resetZoomAction,
  isZoomed as isZoomedCheck,
  zoomAtPoint,
  pan as panAction,
} from '../../../domain/index.js'
import type { ZoomState } from '../../../domain/index.js'

const ZOOM_FACTOR = 0.15 // 15% per scroll step

export function useZoom(dataTimeMin: Ref<number>, dataTimeMax: Ref<number>) {
  const zoomState = ref<ZoomState>(createZoomState())

  function zoom(centerTime: number, deltaY: number) {
    const factor = deltaY > 0 ? 1 + ZOOM_FACTOR : 1 / (1 + ZOOM_FACTOR)
    zoomState.value = zoomAtPoint(
      zoomState.value,
      centerTime,
      factor,
      dataTimeMin.value,
      dataTimeMax.value,
    )
  }

  function panBy(timeDelta: number) {
    zoomState.value = panAction(
      zoomState.value,
      timeDelta,
      dataTimeMin.value,
      dataTimeMax.value,
    )
  }

  function resetZoom() {
    zoomState.value = resetZoomAction()
  }

  function isZoomed() {
    return isZoomedCheck(zoomState.value)
  }

  return {
    zoomState,
    zoom,
    panBy,
    resetZoom,
    isZoomed,
  }
}
