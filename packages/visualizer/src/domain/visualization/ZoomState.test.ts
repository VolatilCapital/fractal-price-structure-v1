import { describe, it, expect } from 'vitest'
import {
  createZoomState,
  resetZoom,
  isZoomed,
  zoomAtPoint,
  pan,
} from './ZoomState.js'

describe('ZoomState', () => {
  describe('createZoomState', () => {
    it('creates unzoomed state', () => {
      const state = createZoomState()
      expect(state.timeMin).toBeUndefined()
      expect(state.timeMax).toBeUndefined()
    })
  })

  describe('isZoomed', () => {
    it('returns false for default state', () => {
      expect(isZoomed(createZoomState())).toBe(false)
    })

    it('returns true when timeMin is set', () => {
      expect(isZoomed({ timeMin: 100 })).toBe(true)
    })

    it('returns true when timeMax is set', () => {
      expect(isZoomed({ timeMax: 200 })).toBe(true)
    })
  })

  describe('resetZoom', () => {
    it('returns unzoomed state', () => {
      const state = resetZoom()
      expect(isZoomed(state)).toBe(false)
    })
  })

  describe('zoomAtPoint', () => {
    const dataMin = 0
    const dataMax = 1000

    it('zooms in (factor < 1) centered on a point', () => {
      const state = createZoomState()
      const zoomed = zoomAtPoint(state, 500, 0.5, dataMin, dataMax)
      expect(zoomed.timeMin).toBeDefined()
      expect(zoomed.timeMax).toBeDefined()
      // Range should be halved
      const range = zoomed.timeMax! - zoomed.timeMin!
      expect(range).toBeCloseTo(500, 0)
      // Center should still be ~500
      const center = (zoomed.timeMin! + zoomed.timeMax!) / 2
      expect(center).toBeCloseTo(500, 0)
    })

    it('zooms out and resets when fully zoomed out', () => {
      const state = { timeMin: 250, timeMax: 750 }
      const zoomed = zoomAtPoint(state, 500, 10, dataMin, dataMax)
      // Should reset to unzoomed
      expect(isZoomed(zoomed)).toBe(false)
    })

    it('preserves center ratio when zooming off-center', () => {
      const state = createZoomState()
      // Zoom in at 25% position
      const zoomed = zoomAtPoint(state, 250, 0.5, dataMin, dataMax)
      expect(zoomed.timeMin).toBeDefined()
      // Center at 250 should be at 25% of new range
      const range = zoomed.timeMax! - zoomed.timeMin!
      const ratio = (250 - zoomed.timeMin!) / range
      expect(ratio).toBeCloseTo(0.25, 1)
    })

    it('clamps to data bounds', () => {
      const state = createZoomState()
      // Zoom at the very start
      const zoomed = zoomAtPoint(state, 0, 0.5, dataMin, dataMax)
      expect(zoomed.timeMin).toBeGreaterThanOrEqual(dataMin)
    })
  })

  describe('pan', () => {
    const dataMin = 0
    const dataMax = 1000

    it('pans the viewport by a positive delta', () => {
      const state = { timeMin: 200, timeMax: 600 }
      const panned = pan(state, 100, dataMin, dataMax)
      expect(panned.timeMin).toBe(300)
      expect(panned.timeMax).toBe(700)
    })

    it('pans the viewport by a negative delta', () => {
      const state = { timeMin: 200, timeMax: 600 }
      const panned = pan(state, -100, dataMin, dataMax)
      expect(panned.timeMin).toBe(100)
      expect(panned.timeMax).toBe(500)
    })

    it('clamps to data start when panning left', () => {
      const state = { timeMin: 50, timeMax: 450 }
      const panned = pan(state, -200, dataMin, dataMax)
      expect(panned.timeMin).toBe(0)
      expect(panned.timeMax).toBe(400)
    })

    it('clamps to data end when panning right', () => {
      const state = { timeMin: 600, timeMax: 1000 }
      const panned = pan(state, 200, dataMin, dataMax)
      expect(panned.timeMax).toBe(1000)
      expect(panned.timeMin).toBe(600)
    })
  })
})
