/**
 * Manage filter state with localStorage persistence.
 */
import { ref, watch, onMounted } from 'vue'
import {
  createFilterState,
  toggleDegre as toggleDegreAction,
  setShowSubStructures as setShowSubStructuresAction,
  setShowGrowing as setShowGrowingAction,
  setShowReference as setShowReferenceAction,
  setShowArchived as setShowArchivedAction,
  setShowUndefinedDegre as setShowUndefinedDegreAction,
  setShowParentChildLinks as setShowParentChildLinksAction,
  setShowEventHighlights as setShowEventHighlightsAction,
  setDisplayMode as setDisplayModeAction,
  setMaxRang as setMaxRangAction,
  serializeFilterState,
  deserializeFilterState,
} from '../../../domain/index.js'
import type { FilterState, DisplayMode } from '../../../domain/index.js'

const STORAGE_KEY = 'fractal-visualizer-filters'

export function useFilters() {
  const filterState = ref<FilterState>(createFilterState())

  // Load from localStorage on mount
  onMounted(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = deserializeFilterState(stored)
        if (parsed) {
          filterState.value = parsed
        }
      }
    } catch (e) {
      console.warn('Failed to load filter state from localStorage:', e)
    }
  })

  // Save to localStorage on change
  watch(filterState, (newState) => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeFilterState(newState))
    } catch (e) {
      console.warn('Failed to save filter state to localStorage:', e)
    }
  }, { deep: true })

  function toggleDegre(degre: number) {
    filterState.value = toggleDegreAction(filterState.value, degre)
  }

  function setShowSubStructures(show: boolean) {
    filterState.value = setShowSubStructuresAction(filterState.value, show)
  }

  function setShowGrowing(show: boolean) {
    filterState.value = setShowGrowingAction(filterState.value, show)
  }

  function setShowReference(show: boolean) {
    filterState.value = setShowReferenceAction(filterState.value, show)
  }

  function setShowArchived(show: boolean) {
    filterState.value = setShowArchivedAction(filterState.value, show)
  }

  function setShowUndefinedDegre(show: boolean) {
    filterState.value = setShowUndefinedDegreAction(filterState.value, show)
  }

  function setDisplayMode(mode: DisplayMode) {
    filterState.value = setDisplayModeAction(filterState.value, mode)
  }

  function setShowParentChildLinks(show: boolean) {
    filterState.value = setShowParentChildLinksAction(filterState.value, show)
  }

  function setShowEventHighlights(show: boolean) {
    filterState.value = setShowEventHighlightsAction(filterState.value, show)
  }

  function setMaxRang(maxRang: number | undefined) {
    filterState.value = setMaxRangAction(filterState.value, maxRang)
  }

  return {
    filterState,
    toggleDegre,
    setShowSubStructures,
    setShowGrowing,
    setShowReference,
    setShowArchived,
    setShowUndefinedDegre,
    setShowParentChildLinks,
    setShowEventHighlights,
    setDisplayMode,
    setMaxRang,
  }
}
