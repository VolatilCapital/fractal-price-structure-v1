/**
 * Manage playback state with play/pause/stop/step functions.
 */
import { ref, watch, onUnmounted, type ShallowRef } from 'vue'
import type { Candle } from '@fractal-price-structure/core'
import {
  createPlaybackState,
  createVisualizationState,
  PlaybackMode,
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
    if (newCandles.length > 0) {
      visualizationState.value = {
        ...visualizationState.value,
        totalCandles: newCandles.length,
        cursorIndex: newCandles.length - 1,
        cursorTime: newCandles[newCandles.length - 1].openTime,
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
  }
}
