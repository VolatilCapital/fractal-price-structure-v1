import { describe, it, expect } from "vitest"
import { PriceMoveId } from "./PriceMoveId.js"

describe("PriceMoveId", () => {
  describe("create", () => {
    it("should create a valid UUID", () => {
      const id = PriceMoveId.create()
      expect(id.toString()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
    })

    it("should create unique IDs on successive calls", () => {
      const id1 = PriceMoveId.create()
      const id2 = PriceMoveId.create()
      expect(id1.toString()).not.toBe(id2.toString())
    })
  })

  describe("fromIndex", () => {
    it("should create a deterministic ID from index 0", () => {
      const id = PriceMoveId.fromIndex(0)
      expect(id.toString()).toBe("00000000-0000-0000-0000-000000000000")
    })

    it("should create a deterministic ID from index 1", () => {
      const id = PriceMoveId.fromIndex(1)
      expect(id.toString()).toBe("00000000-0000-0000-0000-000000000001")
    })

    it("should create a deterministic ID from a larger index", () => {
      const id = PriceMoveId.fromIndex(255)
      expect(id.toString()).toBe("00000000-0000-0000-0000-0000000000ff")
    })

    it("should produce same ID for same index", () => {
      const id1 = PriceMoveId.fromIndex(42)
      const id2 = PriceMoveId.fromIndex(42)
      expect(id1.toString()).toBe(id2.toString())
    })

    it("should produce different IDs for different indexes", () => {
      const id1 = PriceMoveId.fromIndex(10)
      const id2 = PriceMoveId.fromIndex(11)
      expect(id1.toString()).not.toBe(id2.toString())
    })
  })

  describe("fromString", () => {
    it("should preserve the given string value", () => {
      const value = "custom-id-value"
      const id = PriceMoveId.fromString(value)
      expect(id.toString()).toBe(value)
    })

    it("should accept a valid UUID string", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000"
      const id = PriceMoveId.fromString(uuid)
      expect(id.toString()).toBe(uuid)
    })
  })

  describe("equals", () => {
    it("should return true for two IDs with the same value", () => {
      const id1 = PriceMoveId.fromString("same-value")
      const id2 = PriceMoveId.fromString("same-value")
      expect(id1.equals(id2)).toBe(true)
    })

    it("should return false for two IDs with different values", () => {
      const id1 = PriceMoveId.fromString("value-a")
      const id2 = PriceMoveId.fromString("value-b")
      expect(id1.equals(id2)).toBe(false)
    })

    it("should be reflexive (id.equals(id))", () => {
      const id = PriceMoveId.create()
      expect(id.equals(id)).toBe(true)
    })

    it("should be symmetric (id1.equals(id2) == id2.equals(id1))", () => {
      const id1 = PriceMoveId.fromIndex(5)
      const id2 = PriceMoveId.fromIndex(5)
      expect(id1.equals(id2)).toBe(id2.equals(id1))
    })
  })

  describe("toString", () => {
    it("should return the string representation", () => {
      const id = PriceMoveId.fromString("test-123")
      expect(id.toString()).toBe("test-123")
    })
  })
})
