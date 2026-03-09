<script setup lang="ts">
/**
 * Events log component showing structure events.
 * Events after cursor time are grayed out.
 */
import { computed } from 'vue'
import type { StructureEvent, EventType } from '../../../domain/index.js'
import { EVENT_COLORS } from '../../../domain/index.js'

const props = defineProps<{
  events: StructureEvent[]
  cursorTime: number
}>()

// Sort events by timestamp descending (most recent first)
const sortedEvents = computed(() => {
  return [...props.events].sort((a, b) => b.timestamp - a.timestamp).slice(0, 100) // Limit to 100 events
})

// Get color for event type — uses centralized EVENT_COLORS from charter
function getEventColor(type: EventType): string {
  return EVENT_COLORS[type] ?? EVENT_COLORS.Archived
}

// Get icon for event type
function getEventIcon(type: EventType): string {
  switch (type) {
    case 'Created':
      return 'mdi-plus-circle'
    case 'Extended':
      return 'mdi-arrow-expand'
    case 'Terminated':
      return 'mdi-stop-circle'
    case 'Archived':
      return 'mdi-archive'
    default:
      return 'mdi-circle'
  }
}

// Format timestamp
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Check if event is in the future (after cursor)
function isFutureEvent(event: StructureEvent): boolean {
  return event.timestamp > props.cursorTime
}
</script>

<template>
  <v-list density="compact" class="events-log">
    <v-list-item
      v-for="event in sortedEvents"
      :key="event.id"
      :class="{ 'future-event': isFutureEvent(event) }"
      class="py-1"
    >
      <template #prepend>
        <v-icon :icon="getEventIcon(event.eventType)" :color="getEventColor(event.eventType)" size="small" />
      </template>

      <v-list-item-title class="text-body-2">
        <v-chip
          :color="getEventColor(event.eventType)"
          size="x-small"
          variant="flat"
          class="mr-2"
        >
          {{ event.eventType }}
        </v-chip>
        <span class="text-grey">Move {{ event.moveId.slice(0, 8) }}</span>
      </v-list-item-title>

      <v-list-item-subtitle class="text-caption">
        {{ formatTime(event.timestamp) }}
        <span class="ml-2 text-grey-darken-1">
          Rang {{ event.rang }}{{ event.degre !== undefined ? `, D${event.degre}` : '' }}
        </span>
      </v-list-item-subtitle>
    </v-list-item>

    <v-list-item v-if="sortedEvents.length === 0">
      <v-list-item-title class="text-grey text-center">
        No events yet
      </v-list-item-title>
    </v-list-item>
  </v-list>
</template>

<style scoped>
.events-log {
  max-height: 300px;
  overflow-y: auto;
}

.future-event {
  opacity: 0.4;
}
</style>
