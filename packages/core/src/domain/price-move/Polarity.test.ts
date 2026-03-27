import { describe, it, expect } from "vitest"
import { Polarity } from "./Polarity.js"

describe("Polarity", () => {
  it("should have Up value equal to 'up'", () => {
    expect(Polarity.Up).toBe("up")
  })

  it("should have Down value equal to 'down'", () => {
    expect(Polarity.Down).toBe("down")
  })

  it("should have exactly two values", () => {
    const values = Object.values(Polarity)
    expect(values).toHaveLength(2)
  })

  it("Up and Down should be distinct", () => {
    expect(Polarity.Up).not.toBe(Polarity.Down)
  })

  it("should be usable as a discriminant in type checks", () => {
    const polarity: Polarity = Polarity.Up
    if (polarity === Polarity.Up) {
      expect(true).toBe(true)
    } else {
      expect.fail("Should have matched Up")
    }
  })
})
