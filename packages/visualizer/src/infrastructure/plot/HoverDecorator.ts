/**
 * Hover decorator for PriceMove SVG elements.
 * Handles data-attribute stamping, event delegation, and CSS class toggling
 * for move hierarchy highlighting — without triggering Vue re-renders.
 */
import type { PriceMove } from '@fractal-price-structure/core'

const ATTR = 'data-move-id'
const CLASS_HOVERED = 'move-hovered'
const CLASS_HIGHLIGHTED = 'move-highlighted'
const CLASS_HAS_HOVER = 'has-hover'

/**
 * Get the set of IDs forming the hierarchy of a move:
 * the move itself, its parent, and its direct children.
 */
export function getHierarchyIds(move: PriceMove): Set<string> {
  const ids = new Set<string>()
  ids.add(move.id.toString())
  if (move.parentStructure) ids.add(move.parentStructure.id.toString())
  for (const child of move.subStructures) ids.add(child.id.toString())
  return ids
}

/**
 * Build a Map from move ID to PriceMove for O(1) lookup.
 */
export function buildMoveIndex(moves: PriceMove[]): Map<string, PriceMove> {
  const index = new Map<string, PriceMove>()
  for (const m of moves) index.set(m.id.toString(), m)
  return index
}

/**
 * Stamp data-move-id attributes on SVG elements that have a <title> containing the move tooltip.
 * This approach is robust: Observable Plot creates <title> children from the `title` channel.
 * We match by finding elements with <title> inside rect/line groups.
 */
export function decorateMoveElements(
  svgRoot: Element,
  moves: PriceMove[],
): void {
  // Build a quick lookup: first 8 chars of move ID → full ID
  // We use the tooltip text to match: tooltips start with "R{rang}"
  // Instead, we stamp ALL rect/line elements that have a <title> child
  // We need to match them to moves by their geometric properties

  // Simpler approach: stamp via the moves' unique coordinate signatures
  const moveById = new Map<string, PriceMove>()
  for (const m of moves) moveById.set(m.id.toString(), m)

  // Find all <rect> and <line> elements with <title> children
  const elements = svgRoot.querySelectorAll('rect[aria-label], line[aria-label]')
  // Observable Plot 0.6+ puts aria-label from the title channel

  // Alternative: find elements with <title> child
  const titledElements = svgRoot.querySelectorAll('rect, line')
  for (const el of titledElements) {
    const titleEl = el.querySelector('title')
    if (!titleEl) continue
    const text = titleEl.textContent ?? ''
    // Match tooltip format: "R{rang} D{degre}|..." or "R{rang} -|..."
    const match = text.match(/^R(\d+)/)
    if (!match) continue

    // Find the move by matching rang + price range from tooltip
    // Format: "R{rang} D{degre} | ▲ Up ...\n{low} → {high}\n..."
    const priceMatch = text.match(/([\d.]+)\s*→\s*([\d.]+)/)
    if (!priceMatch) continue

    const rangStr = match[1]
    const low = priceMatch[1]
    const high = priceMatch[2]
    if (rangStr === undefined || low === undefined || high === undefined) continue
    const rang = parseInt(rangStr)

    // Find matching move
    for (const m of moves) {
      if (m.rang !== rang) continue
      const digits = m.priceRange.high < 10 ? 5 : m.priceRange.high < 1000 ? 2 : 0
      if (m.priceRange.low.toFixed(digits) === low && m.priceRange.high.toFixed(digits) === high) {
        el.setAttribute(ATTR, m.id.toString())
        break
      }
    }
  }
}

/**
 * Attach hover event listeners using event delegation.
 * Returns a cleanup function to remove listeners.
 */
export function attachHoverListeners(
  container: HTMLElement,
  moveIndex: Map<string, PriceMove>,
  onHoverChange: (moveId: string | null, hierarchyIds: Set<string>) => void,
): () => void {
  let currentMoveId: string | null = null

  function handleMouseOver(event: Event) {
    const target = (event.target as Element).closest(`[${ATTR}]`)
    const moveId = target?.getAttribute(ATTR) ?? null

    if (moveId === currentMoveId) return
    currentMoveId = moveId

    if (moveId && moveIndex.has(moveId)) {
      const move = moveIndex.get(moveId)!
      const hierarchyIds = getHierarchyIds(move)
      onHoverChange(moveId, hierarchyIds)
    } else {
      onHoverChange(null, new Set())
    }
  }

  function handleMouseOut(event: Event) {
    const relatedTarget = (event as MouseEvent).relatedTarget as Element | null
    if (relatedTarget && container.contains(relatedTarget)) return
    currentMoveId = null
    onHoverChange(null, new Set())
  }

  container.addEventListener('mouseover', handleMouseOver)
  container.addEventListener('mouseout', handleMouseOut)

  return () => {
    container.removeEventListener('mouseover', handleMouseOver)
    container.removeEventListener('mouseout', handleMouseOut)
  }
}

/**
 * Apply highlight CSS classes to SVG elements.
 * - Hovered move gets `move-hovered`
 * - Hierarchy members get `move-highlighted`
 * - Container gets `has-hover` class to dim non-related elements
 */
export function applyHighlightClasses(
  container: HTMLElement,
  hoveredId: string | null,
  hierarchyIds: Set<string>,
): void {
  const elements = container.querySelectorAll(`[${ATTR}]`)

  if (!hoveredId) {
    // Clear all highlights
    container.classList.remove(CLASS_HAS_HOVER)
    for (const el of elements) {
      el.classList.remove(CLASS_HOVERED, CLASS_HIGHLIGHTED)
    }
    return
  }

  container.classList.add(CLASS_HAS_HOVER)
  for (const el of elements) {
    const id = el.getAttribute(ATTR)
    if (id === hoveredId) {
      el.classList.add(CLASS_HOVERED)
      el.classList.remove(CLASS_HIGHLIGHTED)
    } else if (id && hierarchyIds.has(id)) {
      el.classList.add(CLASS_HIGHLIGHTED)
      el.classList.remove(CLASS_HOVERED)
    } else {
      el.classList.remove(CLASS_HOVERED, CLASS_HIGHLIGHTED)
    }
  }
}
