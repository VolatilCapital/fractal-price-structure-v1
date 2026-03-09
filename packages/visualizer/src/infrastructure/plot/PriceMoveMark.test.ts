import { describe, it, expect } from 'vitest'
import { Polarity } from '@fractal-price-structure/core'
import { getPolarityColor, getStateColor } from './PriceMoveMark.js'
import { POLARITY_COLORS, STATE_COLORS } from '../../domain/index.js'
import { PriceMoveState } from '@fractal-price-structure/core'

describe('getPolarityColor', () => {
  it('returns Up color for bullish moves', () => {
    expect(getPolarityColor(Polarity.Up)).toBe(POLARITY_COLORS.Up)
  })

  it('returns Down color for bearish moves', () => {
    expect(getPolarityColor(Polarity.Down)).toBe(POLARITY_COLORS.Down)
  })

  it('Up and Down colors are distinct', () => {
    expect(getPolarityColor(Polarity.Up)).not.toBe(getPolarityColor(Polarity.Down))
  })
})

describe('getStateColor', () => {
  it('returns correct color for each state', () => {
    expect(getStateColor(PriceMoveState.Growing)).toBe(STATE_COLORS.Growing)
    expect(getStateColor(PriceMoveState.Reference)).toBe(STATE_COLORS.Reference)
    expect(getStateColor(PriceMoveState.Archived)).toBe(STATE_COLORS.Archived)
  })
})
