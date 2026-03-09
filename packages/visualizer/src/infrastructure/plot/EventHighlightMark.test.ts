import { describe, it, expect } from 'vitest'
import { Polarity } from '@fractal-price-structure/core'
import { getActiveEvents, eventOpacity } from './EventHighlightMark.js'
import type { StructureEvent } from '../../domain/index.js'

function makeEvent(overrides: Partial<StructureEvent> & { timestamp: number; eventType: string }): StructureEvent {
  return {
    id: 'evt-' + Math.random(),
    moveId: 'move-1',
    rang: 0,
    polarity: Polarity.Up,
    priceRange: { low: 100, high: 110 },
    timeRange: { start: 1000, end: 2000 },
    ...overrides,
  } as StructureEvent
}

describe('getActiveEvents', () => {
  it('returns empty for no events', () => {
    expect(getActiveEvents([], 1000)).toHaveLength(0)
  })

  it('returns events matching exact cursor time', () => {
    const events = [
      makeEvent({ timestamp: 1000, eventType: 'Created' }),
      makeEvent({ timestamp: 2000, eventType: 'Extended' }),
      makeEvent({ timestamp: 3000, eventType: 'Terminated' }),
    ]
    const active = getActiveEvents(events, 2000)
    expect(active).toHaveLength(1)
    expect(active[0].eventType).toBe('Extended')
  })

  it('returns events within lookback window', () => {
    const events = [
      makeEvent({ timestamp: 1000, eventType: 'Created' }),
      makeEvent({ timestamp: 1800, eventType: 'Extended' }),
      makeEvent({ timestamp: 2000, eventType: 'Terminated' }),
      makeEvent({ timestamp: 3000, eventType: 'Archived' }),
    ]
    const active = getActiveEvents(events, 2000, 500)
    expect(active).toHaveLength(2) // 1800 and 2000
  })

  it('excludes future events', () => {
    const events = [
      makeEvent({ timestamp: 5000, eventType: 'Created' }),
    ]
    const active = getActiveEvents(events, 3000, 1000)
    expect(active).toHaveLength(0)
  })
})

describe('eventOpacity', () => {
  it('returns 0.9 when no lookback', () => {
    const event = makeEvent({ timestamp: 1000, eventType: 'Created' })
    expect(eventOpacity(event, 1000, 0)).toBe(0.9)
  })

  it('returns 0.9 for event exactly at cursor time', () => {
    const event = makeEvent({ timestamp: 2000, eventType: 'Created' })
    expect(eventOpacity(event, 2000, 1000)).toBe(0.9)
  })

  it('fades linearly with age', () => {
    const event = makeEvent({ timestamp: 1500, eventType: 'Created' })
    const opacity = eventOpacity(event, 2000, 1000)
    // age=500, lookback=1000 → 0.9 - 0.5 * 0.75 = 0.525
    expect(opacity).toBeCloseTo(0.525, 2)
  })

  it('clamps to minimum 0.15 at max age', () => {
    const event = makeEvent({ timestamp: 1000, eventType: 'Created' })
    const opacity = eventOpacity(event, 2000, 1000)
    // age=1000, lookback=1000 → 0.9 - 1.0 * 0.75 = 0.15
    expect(opacity).toBeCloseTo(0.15, 2)
  })
})
