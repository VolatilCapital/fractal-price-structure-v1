/**
 * Filter criteria for structure events.
 * Pure TypeScript - no Vue imports.
 */
import type { EventType, StructureEvent } from './StructureEvent.js'

export interface EventFilterState {
  /** Set of event types to show (empty = show all) */
  eventTypes: Set<EventType>
  /** Filter by specific rang (undefined = show all) */
  rangFilter?: number
  /** Filter by specific degre (undefined = show all) */
  degreFilter?: number
}

export function createEventFilterState(): EventFilterState {
  return {
    eventTypes: new Set(['Created', 'Extended', 'Terminated', 'Archived']),
    rangFilter: undefined,
    degreFilter: undefined,
  }
}

export function toggleEventType(state: EventFilterState, eventType: EventType): EventFilterState {
  const newTypes = new Set(state.eventTypes)
  if (newTypes.has(eventType)) {
    newTypes.delete(eventType)
  } else {
    newTypes.add(eventType)
  }
  return { ...state, eventTypes: newTypes }
}

export function setRangFilter(state: EventFilterState, rang: number | undefined): EventFilterState {
  return { ...state, rangFilter: rang }
}

export function setDegreFilter(state: EventFilterState, degre: number | undefined): EventFilterState {
  return { ...state, degreFilter: degre }
}

/**
 * Check if an event matches the filter criteria.
 */
export function matchesFilter(state: EventFilterState, event: StructureEvent): boolean {
  // Check event type
  if (state.eventTypes.size > 0 && !state.eventTypes.has(event.eventType)) {
    return false
  }

  // Check rang filter
  if (state.rangFilter !== undefined && event.rang !== state.rangFilter) {
    return false
  }

  // Check degre filter
  if (state.degreFilter !== undefined && event.degre !== state.degreFilter) {
    return false
  }

  return true
}

/**
 * Filter a list of events.
 */
export function filterEvents(state: EventFilterState, events: StructureEvent[]): StructureEvent[] {
  return events.filter(event => matchesFilter(state, event))
}
