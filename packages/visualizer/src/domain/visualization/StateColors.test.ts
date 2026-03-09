import { describe, it, expect } from 'vitest'
import {
  POLARITY_COLORS,
  STATE_COLORS,
  LEVEL_COLORS,
  STATE_OPACITY,
  EVENT_COLORS,
} from './StateColors.js'

describe('Color Charter Coherence', () => {
  it('polarity colors are distinct from state indicator colors', () => {
    // Direction (blue/red) must never be confused with state indicators
    const polarityValues = Object.values(POLARITY_COLORS)
    const stateValues = Object.values(STATE_COLORS)
    for (const p of polarityValues) {
      for (const s of stateValues) {
        expect(p).not.toBe(s)
      }
    }
  })

  it('polarity colors are distinct from each other', () => {
    expect(POLARITY_COLORS.Up).not.toBe(POLARITY_COLORS.Down)
  })

  it('level colors are distinct from polarity colors', () => {
    const polarityValues = Object.values(POLARITY_COLORS)
    const levelValues = Object.values(LEVEL_COLORS)
    for (const p of polarityValues) {
      for (const l of levelValues) {
        expect(p).not.toBe(l)
      }
    }
  })

  it('state indicator Growing matches level Accroissement (both green = growth)', () => {
    // Coherence: Growing state and extension level share the "growth" semantic
    expect(STATE_COLORS.Growing).toBe(LEVEL_COLORS.Accroissement)
  })

  it('state indicator Reference matches level Cassure (both orange = break/freeze)', () => {
    // Coherence: Reference state and invalidation level share the "break" semantic
    expect(STATE_COLORS.Reference).toBe(LEVEL_COLORS.Cassure)
  })

  it('event colors are coherent with structural semantics', () => {
    expect(EVENT_COLORS.Created).toBe(LEVEL_COLORS.Accroissement)   // birth = growth
    expect(EVENT_COLORS.Extended).toBe(POLARITY_COLORS.Up)           // continuation = movement (blue)
    expect(EVENT_COLORS.Terminated).toBe(LEVEL_COLORS.Cassure)       // end = break
    expect(EVENT_COLORS.Archived).toBe(STATE_COLORS.Archived)        // historical = grey
  })

  it('state opacity has decreasing fill values: Growing > Reference > Archived', () => {
    expect(STATE_OPACITY.Growing.fill).toBeGreaterThan(STATE_OPACITY.Reference.fill)
    expect(STATE_OPACITY.Reference.fill).toBeGreaterThan(STATE_OPACITY.Archived.fill)
  })

  it('state opacity has decreasing stroke values: Growing > Reference > Archived', () => {
    expect(STATE_OPACITY.Growing.stroke).toBeGreaterThan(STATE_OPACITY.Reference.stroke)
    expect(STATE_OPACITY.Reference.stroke).toBeGreaterThan(STATE_OPACITY.Archived.stroke)
  })
})
