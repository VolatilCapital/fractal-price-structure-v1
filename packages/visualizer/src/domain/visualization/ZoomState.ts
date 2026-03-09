/**
 * Zoom/pan state for the price chart viewport.
 * Pure TypeScript - no Vue imports.
 *
 * When timeMin/timeMax are undefined, the chart fits all data.
 */

export interface ZoomState {
  /** Visible time range start (undefined = fit to data) */
  timeMin?: number
  /** Visible time range end (undefined = fit to data) */
  timeMax?: number
}

export function createZoomState(): ZoomState {
  return {}
}

export function resetZoom(): ZoomState {
  return {}
}

export function isZoomed(state: ZoomState): boolean {
  return state.timeMin !== undefined || state.timeMax !== undefined
}

/**
 * Zoom in/out centered on a given time position.
 * factor < 1 = zoom in, factor > 1 = zoom out.
 */
export function zoomAtPoint(
  state: ZoomState,
  centerTime: number,
  factor: number,
  dataTimeMin: number,
  dataTimeMax: number,
): ZoomState {
  const currentMin = state.timeMin ?? dataTimeMin
  const currentMax = state.timeMax ?? dataTimeMax
  const currentRange = currentMax - currentMin

  // Relative position of center within current range (0..1)
  const ratio = (centerTime - currentMin) / currentRange

  const dataRange = dataTimeMax - dataTimeMin
  const minRange = dataRange * 0.001 // minimum 0.1% of total data range
  const newRange = Math.max(currentRange * factor, minRange)
  const newMin = centerTime - newRange * ratio
  const newMax = centerTime + newRange * (1 - ratio)

  // Clamp to data bounds
  const clampedMin = Math.max(newMin, dataTimeMin)
  const clampedMax = Math.min(newMax, dataTimeMax)

  // If fully zoomed out, return reset state
  if (clampedMin <= dataTimeMin && clampedMax >= dataTimeMax) {
    return {}
  }

  return { timeMin: clampedMin, timeMax: clampedMax }
}

/**
 * Pan the viewport by a time delta.
 */
export function pan(
  state: ZoomState,
  timeDelta: number,
  dataTimeMin: number,
  dataTimeMax: number,
): ZoomState {
  const currentMin = state.timeMin ?? dataTimeMin
  const currentMax = state.timeMax ?? dataTimeMax
  const range = currentMax - currentMin

  let newMin = currentMin + timeDelta
  let newMax = currentMax + timeDelta

  // Clamp: don't pan beyond data
  if (newMin < dataTimeMin) {
    newMin = dataTimeMin
    newMax = dataTimeMin + range
  }
  if (newMax > dataTimeMax) {
    newMax = dataTimeMax
    newMin = dataTimeMax - range
  }

  return { timeMin: newMin, timeMax: newMax }
}
