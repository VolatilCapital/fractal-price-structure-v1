/**
 * Playback state for the visualization player controls.
 * Pure TypeScript - no Vue imports.
 */

export enum PlaybackMode {
  Playing = 'playing',
  Paused = 'paused',
  Stopped = 'stopped',
}

export enum PlaybackDirection {
  Forward = 'forward',
  Backward = 'backward',
}

export interface PlaybackSpeed {
  label: string
  ms: number
}

export const PLAYBACK_SPEEDS: PlaybackSpeed[] = [
  { label: 'Slow', ms: 1000 },
  { label: 'Normal', ms: 500 },
  { label: 'Fast', ms: 200 },
  { label: 'Very Fast', ms: 50 },
]

export interface PlaybackState {
  mode: PlaybackMode
  direction: PlaybackDirection
  speedIndex: number
}

export function createPlaybackState(): PlaybackState {
  return {
    mode: PlaybackMode.Stopped,
    direction: PlaybackDirection.Forward,
    speedIndex: 1, // Normal speed
  }
}

export function getSpeedMs(state: PlaybackState): number {
  return PLAYBACK_SPEEDS[state.speedIndex]?.ms ?? 500
}

export function play(state: PlaybackState): PlaybackState {
  return { ...state, mode: PlaybackMode.Playing }
}

export function pause(state: PlaybackState): PlaybackState {
  return { ...state, mode: PlaybackMode.Paused }
}

export function stop(state: PlaybackState): PlaybackState {
  return { ...state, mode: PlaybackMode.Stopped }
}

export function setSpeed(state: PlaybackState, speedIndex: number): PlaybackState {
  const clampedIndex = Math.max(0, Math.min(speedIndex, PLAYBACK_SPEEDS.length - 1))
  return { ...state, speedIndex: clampedIndex }
}

export function setDirection(state: PlaybackState, direction: PlaybackDirection): PlaybackState {
  return { ...state, direction }
}
