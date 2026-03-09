import { describe, it, expect } from 'vitest'
import { PriceMove, Polarity, PriceMoveId, PriceRange, TimeRange } from '@fractal-price-structure/core'
import { getHierarchyIds, buildMoveIndex } from './HoverDecorator.js'

function makeMove(id: string): PriceMove {
  return new PriceMove({
    id: PriceMoveId.fromString(id),
    priceRange: new PriceRange(100, 110),
    timeRange: new TimeRange(1000, 2000),
    polarity: Polarity.Up,
  })
}

describe('getHierarchyIds', () => {
  it('returns just the move ID when no parent or children', () => {
    const move = makeMove('m1')
    const ids = getHierarchyIds(move)
    expect(ids).toEqual(new Set(['m1']))
  })

  it('includes parent ID', () => {
    const parent = makeMove('parent')
    const child = makeMove('child')
    parent.addSubStructure(child)

    const ids = getHierarchyIds(child)
    expect(ids.has('child')).toBe(true)
    expect(ids.has('parent')).toBe(true)
  })

  it('includes child IDs', () => {
    const parent = makeMove('parent')
    const c1 = makeMove('c1')
    const c2 = makeMove('c2')
    parent.addSubStructure(c1)
    parent.addSubStructure(c2)

    const ids = getHierarchyIds(parent)
    expect(ids.has('parent')).toBe(true)
    expect(ids.has('c1')).toBe(true)
    expect(ids.has('c2')).toBe(true)
  })

  it('includes parent + children for a middle node', () => {
    const grandparent = makeMove('gp')
    const parent = makeMove('parent')
    const child = makeMove('child')
    grandparent.addSubStructure(parent)
    parent.addSubStructure(child)

    const ids = getHierarchyIds(parent)
    expect(ids.has('parent')).toBe(true)
    expect(ids.has('gp')).toBe(true)   // parent's parent
    expect(ids.has('child')).toBe(true) // parent's child
    expect(ids.size).toBe(3)
  })
})

describe('buildMoveIndex', () => {
  it('creates a map from ID to move', () => {
    const m1 = makeMove('m1')
    const m2 = makeMove('m2')
    const index = buildMoveIndex([m1, m2])
    expect(index.get('m1')).toBe(m1)
    expect(index.get('m2')).toBe(m2)
    expect(index.size).toBe(2)
  })
})
