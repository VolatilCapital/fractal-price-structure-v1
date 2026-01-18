/**
 * Filter state for controlling visibility of price moves and events.
 * Pure TypeScript - no Vue imports.
 */

/** Display mode for price moves */
export type DisplayMode = 'rectangle' | 'line'

export interface FilterState {
  /** Display mode: rectangle (boxes) or line (diagonals) */
  displayMode: DisplayMode
  /** Set of visible degre levels (e.g., Set([0, 1, 2])) */
  visibleDegres: Set<number>
  /** Whether to show sub-structures within moves */
  showSubStructures: boolean
  /** Whether to show archived moves */
  showArchived: boolean
  /** Whether to show moves with undefined degre (Growing moves) */
  showUndefinedDegre: boolean
  /** Maximum rang level to display (undefined = all) */
  maxRang?: number
}

export function createFilterState(): FilterState {
  return {
    displayMode: 'rectangle',
    visibleDegres: new Set([0, 1, 2, 3, 4, 5]),
    showSubStructures: true,
    showArchived: false,
    showUndefinedDegre: true,
    maxRang: undefined,
  }
}

export function toggleDegre(state: FilterState, degre: number): FilterState {
  const newDegres = new Set(state.visibleDegres)
  if (newDegres.has(degre)) {
    newDegres.delete(degre)
  } else {
    newDegres.add(degre)
  }
  return { ...state, visibleDegres: newDegres }
}

export function setShowSubStructures(state: FilterState, show: boolean): FilterState {
  return { ...state, showSubStructures: show }
}

export function setShowArchived(state: FilterState, show: boolean): FilterState {
  return { ...state, showArchived: show }
}

export function setShowUndefinedDegre(state: FilterState, show: boolean): FilterState {
  return { ...state, showUndefinedDegre: show }
}

export function setMaxRang(state: FilterState, maxRang: number | undefined): FilterState {
  return { ...state, maxRang }
}

export function setDisplayMode(state: FilterState, displayMode: DisplayMode): FilterState {
  return { ...state, displayMode }
}

/**
 * Check if a move should be visible based on filter state.
 * @param degre - The degre of the move (undefined for Growing moves)
 * @param rang - The rang of the move
 * @param isArchived - Whether the move is archived
 */
export function isMoveVisible(
  state: FilterState,
  degre: number | undefined,
  rang: number,
  isArchived: boolean
): boolean {
  // Check archived filter
  if (isArchived && !state.showArchived) {
    return false
  }

  // Check rang filter
  if (state.maxRang !== undefined && rang > state.maxRang) {
    return false
  }

  // Check degre filter
  if (degre === undefined) {
    // Growing moves (undefined degre)
    return state.showUndefinedDegre
  }

  return state.visibleDegres.has(degre)
}

/**
 * Serialize filter state to JSON for localStorage.
 */
export function serializeFilterState(state: FilterState): string {
  return JSON.stringify({
    displayMode: state.displayMode,
    visibleDegres: Array.from(state.visibleDegres),
    showSubStructures: state.showSubStructures,
    showArchived: state.showArchived,
    showUndefinedDegre: state.showUndefinedDegre,
    maxRang: state.maxRang,
  })
}

/**
 * Deserialize filter state from JSON.
 */
export function deserializeFilterState(json: string): FilterState | null {
  try {
    const parsed = JSON.parse(json)
    return {
      displayMode: parsed.displayMode ?? 'rectangle',
      visibleDegres: new Set(parsed.visibleDegres ?? [0, 1, 2, 3, 4, 5]),
      showSubStructures: parsed.showSubStructures ?? true,
      showArchived: parsed.showArchived ?? false,
      showUndefinedDegre: parsed.showUndefinedDegre ?? true,
      maxRang: parsed.maxRang,
    }
  } catch {
    return null
  }
}
