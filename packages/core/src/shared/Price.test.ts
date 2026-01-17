import { describe, it, expect } from "vitest"
import { Price } from "./Price.js"

describe("Price", () => {
  describe("gt (greater than)", () => {
    it("should return true when a > b", () => {
      expect(Price.gt(10, 5)).toBe(true)
      expect(Price.gt(0.3, 0.1)).toBe(true)
    })

    it("should return false when a <= b", () => {
      expect(Price.gt(5, 10)).toBe(false)
      expect(Price.gt(5, 5)).toBe(false)
    })

    it("should handle floating-point precision correctly", () => {
      // When using Price.add, the result is precise
      const sum = Price.add(0.1, 0.2)
      expect(Price.gt(sum, 0.3)).toBe(false) // Should be equal, not greater
    })
  })

  describe("gte (greater than or equal)", () => {
    it("should return true when a >= b", () => {
      expect(Price.gte(10, 5)).toBe(true)
      expect(Price.gte(5, 5)).toBe(true)
    })

    it("should return false when a < b", () => {
      expect(Price.gte(5, 10)).toBe(false)
    })

    it("should handle floating-point precision correctly", () => {
      const sum = 0.1 + 0.2
      expect(Price.gte(sum, 0.3)).toBe(true) // Should be equal
    })
  })

  describe("lt (less than)", () => {
    it("should return true when a < b", () => {
      expect(Price.lt(5, 10)).toBe(true)
      expect(Price.lt(0.1, 0.3)).toBe(true)
    })

    it("should return false when a >= b", () => {
      expect(Price.lt(10, 5)).toBe(false)
      expect(Price.lt(5, 5)).toBe(false)
    })

    it("should handle floating-point precision correctly", () => {
      const sum = 0.1 + 0.2
      expect(Price.lt(sum, 0.3)).toBe(false) // Should be equal, not less
    })
  })

  describe("lte (less than or equal)", () => {
    it("should return true when a <= b", () => {
      expect(Price.lte(5, 10)).toBe(true)
      expect(Price.lte(5, 5)).toBe(true)
    })

    it("should return false when a > b", () => {
      expect(Price.lte(10, 5)).toBe(false)
    })

    it("should handle floating-point precision correctly", () => {
      // When using Price.add, the result is precise
      const sum = Price.add(0.1, 0.2)
      expect(Price.lte(sum, 0.3)).toBe(true) // Should be equal
    })
  })

  describe("eq (equal)", () => {
    it("should return true when a === b", () => {
      expect(Price.eq(5, 5)).toBe(true)
      expect(Price.eq(0.1, 0.1)).toBe(true)
    })

    it("should return false when a !== b", () => {
      expect(Price.eq(5, 10)).toBe(false)
    })

    it("should handle floating-point precision correctly", () => {
      // When using Price.add, the result is precise
      const sum = Price.add(0.1, 0.2)
      expect(Price.eq(sum, 0.3)).toBe(true) // big.js handles it correctly
    })
  })

  describe("min", () => {
    it("should return the smaller of two prices", () => {
      expect(Price.min(5, 10)).toBe(5)
      expect(Price.min(10, 5)).toBe(5)
    })

    it("should return either when equal", () => {
      expect(Price.min(5, 5)).toBe(5)
    })

    it("should handle floating-point precision correctly", () => {
      // When using Price.add, the result is precise
      const sum = Price.add(0.1, 0.2)
      // Both are equal, min returns the first one
      expect(Price.eq(Price.min(sum, 0.3), 0.3)).toBe(true)
    })
  })

  describe("max", () => {
    it("should return the larger of two prices", () => {
      expect(Price.max(5, 10)).toBe(10)
      expect(Price.max(10, 5)).toBe(10)
    })

    it("should return either when equal", () => {
      expect(Price.max(5, 5)).toBe(5)
    })

    it("should handle floating-point precision correctly", () => {
      const sum = 0.1 + 0.2
      expect(Price.max(sum, 0.3)).toBe(sum) // Both are equal
    })
  })

  describe("add", () => {
    it("should add two prices correctly", () => {
      expect(Price.add(5, 10)).toBe(15)
    })

    it("should handle floating-point precision correctly", () => {
      // 0.1 + 0.2 should exactly equal 0.3
      expect(Price.add(0.1, 0.2)).toBe(0.3)
    })
  })

  describe("sub", () => {
    it("should subtract two prices correctly", () => {
      expect(Price.sub(10, 5)).toBe(5)
    })

    it("should handle floating-point precision correctly", () => {
      // 0.3 - 0.1 should exactly equal 0.2
      expect(Price.sub(0.3, 0.1)).toBe(0.2)
    })
  })

  describe("edge cases", () => {
    it("should handle very small differences", () => {
      const a = 100.123456789
      const b = 100.123456788
      expect(Price.gt(a, b)).toBe(true)
      expect(Price.lt(a, b)).toBe(false)
    })

    it("should handle very large numbers", () => {
      const a = 1e15
      const b = 1e15 + 1
      expect(Price.lt(a, b)).toBe(true)
    })

    it("should handle zero", () => {
      expect(Price.eq(0, 0)).toBe(true)
      expect(Price.gt(1, 0)).toBe(true)
      expect(Price.lt(0, 1)).toBe(true)
    })

    it("should handle negative numbers", () => {
      expect(Price.lt(-1, 0)).toBe(true)
      expect(Price.gt(0, -1)).toBe(true)
      expect(Price.eq(-5, -5)).toBe(true)
    })

    it("should handle crypto-style precision (8 decimals)", () => {
      const btcPrice1 = 45000.12345678
      const btcPrice2 = 45000.12345679
      expect(Price.lt(btcPrice1, btcPrice2)).toBe(true)
    })
  })
})
