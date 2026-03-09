/**
 * Factory for creating Observable Plot marks that highlight
 * structural events at the current cursor time.
 *
 * Shows flash effects on moves that just had an event
 * (Created, Extended, Terminated, Archived).
 */
import * as Plot from '@observablehq/plot'
import type { StructureEvent } from '../../domain/index.js'
import { EVENT_COLORS as CHART_EVENT_COLORS } from '../../domain/index.js'

/** Event type to highlight color mapping — from centralized charter */
const EVENT_COLORS: Record<string, string> = {
  Created: CHART_EVENT_COLORS.Created,
  Extended: CHART_EVENT_COLORS.Extended,
  Terminated: CHART_EVENT_COLORS.Terminated,
  Archived: CHART_EVENT_COLORS.Archived,
}

/** Event type to symbol mapping for dots */
const EVENT_SYMBOLS: Record<string, string> = {
  Created: '+',
  Extended: '→',
  Terminated: '×',
  Archived: '○',
}

export interface EventHighlightOptions {
  events: StructureEvent[]
  cursorTime: number
  /** How many candle intervals to look back for "recent" events */
  lookbackMs?: number
}

/**
 * Get events that are "active" at the cursor time.
 * An event is active if its timestamp matches the cursor time exactly,
 * or is within the lookback window.
 */
export function getActiveEvents(
  events: StructureEvent[],
  cursorTime: number,
  lookbackMs: number = 0,
): StructureEvent[] {
  const minTime = cursorTime - lookbackMs
  return events.filter(e => e.timestamp >= minTime && e.timestamp <= cursorTime)
}

/**
 * Create highlight marks for active events.
 * Shows a bright border around the move and a symbol dot at the event location.
 */
export function createEventHighlightMarks(options: EventHighlightOptions) {
  const { events, cursorTime, lookbackMs = 0 } = options
  const activeEvents = getActiveEvents(events, cursorTime, lookbackMs)

  if (activeEvents.length === 0) return []

  const marks: (ReturnType<typeof Plot.rect> | ReturnType<typeof Plot.text>)[] = []

  // Bright border highlight on affected moves
  marks.push(Plot.rect(activeEvents, {
    x1: (d: StructureEvent) => d.timeRange.start,
    x2: (d: StructureEvent) => d.timeRange.end,
    y1: (d: StructureEvent) => d.priceRange.low,
    y2: (d: StructureEvent) => d.priceRange.high,
    fill: 'none',
    stroke: (d: StructureEvent) => EVENT_COLORS[d.eventType] ?? '#fff',
    strokeWidth: 2.5,
    strokeOpacity: 0.9,
  }))

  // Event type symbol at top-right of the move
  marks.push(Plot.text(activeEvents, {
    x: (d: StructureEvent) => d.timeRange.end,
    y: (d: StructureEvent) => d.priceRange.high,
    text: (d: StructureEvent) => EVENT_SYMBOLS[d.eventType] ?? '?',
    fill: (d: StructureEvent) => EVENT_COLORS[d.eventType] ?? '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    dx: -8,
    dy: -4,
  }))

  return marks
}
