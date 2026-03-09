<script setup lang="ts">
/**
 * Playback controls component.
 * Play/pause/stop/step buttons with speed selector.
 */
import { computed } from 'vue'
import type { PlaybackState } from '../../../domain/index.js'
import { PlaybackMode, PLAYBACK_SPEEDS } from '../../../domain/index.js'

const props = defineProps<{
  playbackState: PlaybackState
}>()

const emit = defineEmits<{
  play: []
  pause: []
  stop: []
  stepForward: []
  stepBackward: []
  speedUp: []
  speedDown: []
}>()

const isPlaying = computed(() => props.playbackState.mode === PlaybackMode.Playing)
const isPaused = computed(() => props.playbackState.mode === PlaybackMode.Paused)
const speedLabel = computed(() => PLAYBACK_SPEEDS[props.playbackState.speedIndex]?.label ?? 'Normal')
</script>

<template>
  <v-card elevation="0" class="pa-2">
    <div class="d-flex align-center justify-center ga-2">
      <!-- Step backward -->
      <v-btn
        icon
        variant="text"
        :disabled="isPlaying"
        @click="emit('stepBackward')"
        aria-label="Step backward"
        data-testid="btn-step-backward"
      >
        <v-icon>mdi-skip-previous</v-icon>
      </v-btn>

      <!-- Stop -->
      <v-btn icon variant="text" @click="emit('stop')" aria-label="Stop" data-testid="btn-stop">
        <v-icon>mdi-stop</v-icon>
      </v-btn>

      <!-- Play/Pause toggle -->
      <v-btn
        icon
        variant="flat"
        color="primary"
        size="large"
        @click="isPlaying ? emit('pause') : emit('play')"
        :aria-label="isPlaying ? 'Pause' : 'Play'"
        data-testid="btn-play-pause"
      >
        <v-icon>{{ isPlaying ? 'mdi-pause' : 'mdi-play' }}</v-icon>
      </v-btn>

      <!-- Step forward -->
      <v-btn
        icon
        variant="text"
        :disabled="isPlaying"
        @click="emit('stepForward')"
        aria-label="Step forward"
        data-testid="btn-step-forward"
      >
        <v-icon>mdi-skip-next</v-icon>
      </v-btn>

      <!-- Speed controls -->
      <v-btn
        icon
        variant="text"
        size="small"
        @click="emit('speedDown')"
        :disabled="props.playbackState.speedIndex <= 0"
        aria-label="Slower"
        data-testid="btn-speed-down"
      >
        <v-icon size="small">mdi-minus</v-icon>
      </v-btn>
      <v-chip size="small" variant="outlined" data-testid="speed-chip">
        {{ speedLabel }}
      </v-chip>
      <v-btn
        icon
        variant="text"
        size="small"
        @click="emit('speedUp')"
        :disabled="props.playbackState.speedIndex >= 3"
        aria-label="Faster"
        data-testid="btn-speed-up"
      >
        <v-icon size="small">mdi-plus</v-icon>
      </v-btn>
    </div>
  </v-card>
</template>
