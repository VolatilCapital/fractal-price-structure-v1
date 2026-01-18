/**
 * Structure events derived from PriceMove state changes.
 * Pure TypeScript - no Vue imports.
 */
import type { Polarity } from '@fractal-price-structure/core'

export type EventType = 'Created' | 'Extended' | 'Terminated' | 'Archived'

export interface StructureEvent {
  /** Unique identifier for this event */
  id: string
  /** Timestamp when the event occurred */
  timestamp: number
  /** Type of event */
  eventType: EventType
  /** ID of the PriceMove this event relates to */
  moveId: string
  /** Rang of the move at event time */
  rang: number
  /** Degre of the move (only for Terminated/Archived) */
  degre?: number
  /** Polarity of the move */
  polarity: Polarity
  /** Price range at event time */
  priceRange: {
    low: number
    high: number
  }
  /** Time range at event time */
  timeRange: {
    start: number
    end: number
  }
}

export function createEventId(eventType: EventType, moveId: string, timestamp: number): string {
  return `${eventType}-${moveId}-${timestamp}`
}
