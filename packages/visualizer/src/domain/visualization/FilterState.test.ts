import { describe, it, expect } from 'vitest'
import {
  createFilterState,
  setShowGrowing,
  setShowReference,
  setShowArchived,
  serializeFilterState,
  deserializeFilterState,
} from './FilterState.js'

describe('FilterState', () => {
  describe('createFilterState', () => {
    it('should create state with default values', () => {
      const state = createFilterState()

      expect(state.showGrowing).toBe(true)
      expect(state.showReference).toBe(true)
      expect(state.showArchived).toBe(false)
      expect(state.displayMode).toBe('rectangle')
    })
  })

  describe('setShowGrowing', () => {
    it('should toggle showGrowing to false', () => {
      const state = createFilterState()
      const newState = setShowGrowing(state, false)

      expect(newState.showGrowing).toBe(false)
      expect(state.showGrowing).toBe(true) // original unchanged
    })

    it('should toggle showGrowing to true', () => {
      const state = setShowGrowing(createFilterState(), false)
      const newState = setShowGrowing(state, true)

      expect(newState.showGrowing).toBe(true)
    })
  })

  describe('setShowReference', () => {
    it('should toggle showReference to false', () => {
      const state = createFilterState()
      const newState = setShowReference(state, false)

      expect(newState.showReference).toBe(false)
      expect(state.showReference).toBe(true) // original unchanged
    })

    it('should toggle showReference to true', () => {
      const state = setShowReference(createFilterState(), false)
      const newState = setShowReference(state, true)

      expect(newState.showReference).toBe(true)
    })
  })

  describe('setShowArchived', () => {
    it('should toggle showArchived to true', () => {
      const state = createFilterState()
      const newState = setShowArchived(state, true)

      expect(newState.showArchived).toBe(true)
      expect(state.showArchived).toBe(false) // original unchanged
    })
  })

  describe('serialization', () => {
    it('should serialize and deserialize state correctly', () => {
      const state = createFilterState()
      state.showGrowing = false
      state.showReference = false

      const serialized = serializeFilterState(state)
      const deserialized = deserializeFilterState(serialized)

      expect(deserialized).not.toBeNull()
      expect(deserialized!.showGrowing).toBe(false)
      expect(deserialized!.showReference).toBe(false)
      expect(deserialized!.showArchived).toBe(false)
    })

    it('should handle invalid JSON gracefully', () => {
      const result = deserializeFilterState('invalid json')
      expect(result).toBeNull()
    })

    it('should use defaults for missing properties', () => {
      const result = deserializeFilterState('{}')

      expect(result).not.toBeNull()
      expect(result!.showGrowing).toBe(true)
      expect(result!.showReference).toBe(true)
      expect(result!.showArchived).toBe(false)
    })
  })
})
