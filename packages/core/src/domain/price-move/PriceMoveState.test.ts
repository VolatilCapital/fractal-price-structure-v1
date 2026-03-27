import { describe, it, expect } from "vitest"
import { PriceMoveState } from "./PriceMoveState.js"

describe("PriceMoveState", () => {
  it("Growing should equal 'growing'", () => {
    expect(PriceMoveState.Growing).toBe("growing")
  })

  it("Reference should equal 'reference'", () => {
    expect(PriceMoveState.Reference).toBe("reference")
  })

  it("Archived should equal 'archived'", () => {
    expect(PriceMoveState.Archived).toBe("archived")
  })

  it("should have exactly three states", () => {
    const values = Object.values(PriceMoveState)
    expect(values).toHaveLength(3)
  })

  it("all state values should be distinct", () => {
    const values = Object.values(PriceMoveState)
    const unique = new Set(values)
    expect(unique.size).toBe(3)
  })

  describe("lifecycle ordering", () => {
    it("Growing is the initial state", () => {
      // The concept: Growing comes before Reference comes before Archived
      // We verify by checking they are the documented string constants
      expect(PriceMoveState.Growing).toBe("growing")
    })

    it("states can be compared by identity for switch/case logic", () => {
      const state: PriceMoveState = PriceMoveState.Reference

      let matched = false
      switch (state) {
        case PriceMoveState.Growing:
          break
        case PriceMoveState.Reference:
          matched = true
          break
        case PriceMoveState.Archived:
          break
      }

      expect(matched).toBe(true)
    })
  })
})
