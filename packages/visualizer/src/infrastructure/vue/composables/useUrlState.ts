/**
 * Composable for syncing visualizer state with URL query parameters.
 * Enables sharing a specific view (cursor position, data source, open panels).
 */
import { watch, type Ref } from 'vue'

export interface UrlStateOptions {
  cursorIndex: Ref<number>
  seekTo: (index: number) => void
  currentSourceId: Ref<string>
  changeSource: (id: string) => void
  panels: Record<string, Ref<boolean>>
}

/**
 * Read initial state from URL on setup, then keep URL updated as state changes.
 */
export function useUrlState(options: UrlStateOptions) {
  const { cursorIndex, seekTo, currentSourceId, changeSource, panels } = options

  // --- Read from URL on init ---
  function readFromUrl() {
    const params = new URLSearchParams(window.location.search)

    const sourceParam = params.get('source')
    if (sourceParam && sourceParam !== currentSourceId.value) {
      changeSource(sourceParam)
    }

    const cursorParam = params.get('cursor')
    if (cursorParam !== null) {
      const idx = parseInt(cursorParam, 10)
      if (!isNaN(idx) && idx >= 0) {
        // Defer seek to after data is loaded
        setTimeout(() => seekTo(idx), 100)
      }
    }

    for (const [key, panelRef] of Object.entries(panels)) {
      const val = params.get(key)
      if (val !== null) {
        panelRef.value = val === '1'
      }
    }
  }

  // --- Write to URL on change ---
  function writeToUrl() {
    const params = new URLSearchParams()

    params.set('source', currentSourceId.value)
    params.set('cursor', String(cursorIndex.value))

    for (const [key, panelRef] of Object.entries(panels)) {
      if (panelRef.value) {
        params.set(key, '1')
      }
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState(null, '', newUrl)
  }

  // Read on init
  readFromUrl()

  // Write on changes (debounced via replaceState)
  watch(
    [cursorIndex, currentSourceId, ...Object.values(panels)],
    writeToUrl,
    { flush: 'post' },
  )
}
