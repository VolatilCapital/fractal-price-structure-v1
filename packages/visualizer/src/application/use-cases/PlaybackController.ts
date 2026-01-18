/**
 * Use case for controlling playback of candle visualization.
 * Pure logic, no Vue dependencies.
 */
import type { PlaybackState, VisualizationState } from '../../domain/index.js'
import {
  PlaybackMode,
  PlaybackDirection,
  play,
  pause,
  stop,
  setSpeed,
  setDirection,
  getSpeedMs,
  setCursorIndex,
} from '../../domain/index.js'
import type { Candle } from '@fractal-price-structure/core'

export interface PlaybackControllerState {
  playback: PlaybackState
  visualization: VisualizationState
}

/**
 * Start playback.
 */
export function startPlayback(state: PlaybackControllerState): PlaybackControllerState {
  return {
    ...state,
    playback: play(state.playback),
  }
}

/**
 * Pause playback.
 */
export function pausePlayback(state: PlaybackControllerState): PlaybackControllerState {
  return {
    ...state,
    playback: pause(state.playback),
  }
}

/**
 * Stop playback and reset cursor to beginning.
 */
export function stopPlayback(
  state: PlaybackControllerState,
  candles: Candle[]
): PlaybackControllerState {
  const firstCandle = candles[0]
  return {
    playback: stop(state.playback),
    visualization: setCursorIndex(state.visualization, 0, firstCandle?.openTime ?? 0),
  }
}

/**
 * Step forward one candle.
 */
export function stepForward(
  state: PlaybackControllerState,
  candles: Candle[]
): PlaybackControllerState {
  const nextIndex = Math.min(state.visualization.cursorIndex + 1, candles.length - 1)
  const candle = candles[nextIndex]
  return {
    ...state,
    visualization: setCursorIndex(state.visualization, nextIndex, candle?.openTime ?? 0),
  }
}

/**
 * Step backward one candle.
 */
export function stepBackward(
  state: PlaybackControllerState,
  candles: Candle[]
): PlaybackControllerState {
  const prevIndex = Math.max(state.visualization.cursorIndex - 1, 0)
  const candle = candles[prevIndex]
  return {
    ...state,
    visualization: setCursorIndex(state.visualization, prevIndex, candle?.openTime ?? 0),
  }
}

/**
 * Jump to a specific candle index.
 */
export function seekToIndex(
  state: PlaybackControllerState,
  index: number,
  candles: Candle[]
): PlaybackControllerState {
  const clampedIndex = Math.max(0, Math.min(index, candles.length - 1))
  const candle = candles[clampedIndex]
  return {
    ...state,
    visualization: setCursorIndex(state.visualization, clampedIndex, candle?.openTime ?? 0),
  }
}

/**
 * Change playback speed.
 */
export function changeSpeed(
  state: PlaybackControllerState,
  speedIndex: number
): PlaybackControllerState {
  return {
    ...state,
    playback: setSpeed(state.playback, speedIndex),
  }
}

/**
 * Change playback direction.
 */
export function changeDirection(
  state: PlaybackControllerState,
  direction: PlaybackDirection
): PlaybackControllerState {
  return {
    ...state,
    playback: setDirection(state.playback, direction),
  }
}

/**
 * Advance one tick based on playback state.
 * Returns null if playback is not active.
 */
export function tick(
  state: PlaybackControllerState,
  candles: Candle[]
): PlaybackControllerState | null {
  if (state.playback.mode !== PlaybackMode.Playing) {
    return null
  }

  if (state.playback.direction === PlaybackDirection.Forward) {
    // Check if at end
    if (state.visualization.cursorIndex >= candles.length - 1) {
      return pausePlayback(state)
    }
    return stepForward(state, candles)
  } else {
    // Backward
    if (state.visualization.cursorIndex <= 0) {
      return pausePlayback(state)
    }
    return stepBackward(state, candles)
  }
}

/**
 * Get the current playback interval in milliseconds.
 */
export function getPlaybackInterval(state: PlaybackControllerState): number {
  return getSpeedMs(state.playback)
}

/**
 * Check if playback is active.
 */
export function isPlaying(state: PlaybackControllerState): boolean {
  return state.playback.mode === PlaybackMode.Playing
}
