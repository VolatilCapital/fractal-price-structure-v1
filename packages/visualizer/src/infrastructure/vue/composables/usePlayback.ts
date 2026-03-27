/**
 * Manage playback state with play/pause/stop/step functions.
 */
import { ref, watch, onUnmounted, type ShallowRef } from 'vue'
import type { Candle } from '@fractal-price-structure/core'
import {
  createPlaybackState,
  createVisualizationState,
  PlaybackMode,
  PlaybackDirection,
  PLAYBACK_SPEEDS,
} from '../../../domain/index.js'
import type { PlaybackState, VisualizationState } from '../../../domain/index.js'
import {
  startPlayback,
  pausePlayback,
  stopPlayback,
  stepForward as stepForwardUseCase,
  stepBackward as stepBackwardUseCase,
  seekToIndex,
  tick,
  getPlaybackInterval,
} from '../../../application/index.js'

export function usePlayback(candles: ShallowRef<Candle[]>) {
  const playbackState = ref<PlaybackState>(createPlaybackState())
  const visualizationState = ref<VisualizationState>(createVisualizationState(0))

  let intervalId: ReturnType<typeof setInterval> | null = null

  // Initialize visualization state when candles are loaded
  watch(candles, (newCandles) => {
    const lastCandle = newCandles[newCandles.length - 1]
    if (newCandles.length > 0 && lastCandle !== undefined) {
      visualizationState.value = {
        ...visualizationState.value,
        totalCandles: newCandles.length,
        cursorIndex: newCandles.length - 1,
        cursorTime: lastCandle.openTime,
      }
    }
  }, { immediate: true })

  function getState() {
    return {
      playback: playbackState.value,
      visualization: visualizationState.value,
    }
  }

  function setState(newState: { playback: PlaybackState; visualization: VisualizationState }) {
    playbackState.value = newState.playback
    visualizationState.value = newState.visualization
  }

  function startInterval() {
    if (intervalId) {
      clearInterval(intervalId)
    }
    const interval = getPlaybackInterval(getState())
    intervalId = setInterval(() => {
      const newState = tick(getState(), candles.value)
      if (newState) {
        setState(newState)
      }
      // If paused during tick (end reached), clear interval
      if (playbackState.value.mode !== PlaybackMode.Playing) {
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
      }
    }, interval)
  }

  function stopInterval() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function play() {
    const newState = startPlayback(getState())
    setState(newState)
    startInterval()
  }

  function pause() {
    const newState = pausePlayback(getState())
    setState(newState)
    stopInterval()
  }

  function stop() {
    const newState = stopPlayback(getState(), candles.value)
    setState(newState)
    stopInterval()
  }

  function stepForward() {
    const newState = stepForwardUseCase(getState(), candles.value)
    setState(newState)
  }

  function stepBackward() {
    const newState = stepBackwardUseCase(getState(), candles.value)
    setState(newState)
  }

  function seekTo(index: number) {
    const newState = seekToIndex(getState(), index, candles.value)
    setState(newState)
  }

  function changeSpeed(speedIndex: number) {
    const clamped = Math.max(0, Math.min(PLAYBACK_SPEEDS.length - 1, speedIndex))
    playbackState.value = { ...playbackState.value, speedIndex: clamped }
    // Restart interval if currently playing to apply new speed
    if (playbackState.value.mode === PlaybackMode.Playing) {
      startInterval()
    }
  }

  function speedUp() {
    changeSpeed(playbackState.value.speedIndex + 1)
  }

  function speedDown() {
    changeSpeed(playbackState.value.speedIndex - 1)
  }

  function toggleDirection() {
    const newDir = playbackState.value.direction === PlaybackDirection.Forward
      ? PlaybackDirection.Backward
      : PlaybackDirection.Forward
    playbackState.value = { ...playbackState.value, direction: newDir }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopInterval()
  })

  return {
    playbackState,
    visualizationState,
    play,
    pause,
    stop,
    stepForward,
    stepBackward,
    seekTo,
    changeSpeed,
    speedUp,
    speedDown,
    toggleDirection,
  }
}
