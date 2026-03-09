/**
 * Smoke tests — verifies Playwright can control the visualizer UI.
 * Not a functional test suite, just automation anchors validation.
 */
import { test, expect } from '@playwright/test'

test.describe('Visualizer automation anchors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for the app to finish loading (loading indicator gone)
    await page.waitForSelector('[data-testid="loading-indicator"]', { state: 'hidden', timeout: 15000 })
  })

  test('app renders and candle counter is visible', async ({ page }) => {
    await expect(page.locator('[data-testid="app"]')).toBeVisible()
    await expect(page.locator('[data-testid="candle-counter"]')).toBeVisible()
    await expect(page.locator('[data-testid="price-chart"]')).toBeVisible()
  })

  test('playback controls are reachable', async ({ page }) => {
    await expect(page.locator('[data-testid="btn-play-pause"]')).toBeVisible()
    await expect(page.locator('[data-testid="btn-step-forward"]')).toBeVisible()
    await expect(page.locator('[data-testid="btn-step-backward"]')).toBeVisible()
    await expect(page.locator('[data-testid="btn-stop"]')).toBeVisible()
  })

  test('step forward advances cursor via window.__visualizer__', async ({ page }) => {
    // Seek to a non-end position first
    await page.evaluate(() => (window as any).__visualizer__.seekTo(0))
    await page.locator('[data-testid="btn-step-forward"]').click()
    const after = await page.evaluate(() => (window as any).__visualizer__.cursorIndex)
    expect(after).toBe(1)
  })

  test('seekTo via window.__visualizer__ updates cursor', async ({ page }) => {
    await page.evaluate(() => (window as any).__visualizer__.seekTo(10))
    const index = await page.evaluate(() => (window as any).__visualizer__.cursorIndex)
    expect(index).toBe(10)
    await expect(page.locator('[data-testid="candle-counter"]')).toContainText('11')
  })

  test('filter panel is accessible', async ({ page }) => {
    await expect(page.locator('[data-testid="filter-panel"]')).toBeVisible()
    await expect(page.locator('[data-testid="chip-degre-0"]')).toBeVisible()
    await expect(page.locator('[data-testid="switch-growing"]')).toBeVisible()
  })

  test('time slider is present', async ({ page }) => {
    await expect(page.locator('[data-testid="time-slider"]')).toBeVisible()
  })
})
