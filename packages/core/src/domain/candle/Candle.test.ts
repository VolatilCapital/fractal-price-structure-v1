import { describe, it, expect } from "vitest"
import { isCandle, validateCandle, type Candle } from "./Candle.js"
import { CandleFactory, InvalidCandleError } from "./CandleFactory.js"

describe("Candle interface", () => {
  describe("structure validation", () => {
    it("should have all required OHLCV properties", () => {
      const candle: Candle = {
        openTime: 1704067200000,
        closeTime: 1704067260000,
        open: 100,
        high: 105,
        low: 99,
        close: 103,
        volume: 1000,
      }

      expect(candle.open).toBeDefined()
      expect(candle.high).toBeDefined()
      expect(candle.low).toBeDefined()
      expect(candle.close).toBeDefined()
      expect(candle.volume).toBeDefined()
    })

    it("should have openTime and closeTime as Unix milliseconds", () => {
      const candle: Candle = {
        openTime: 1704067200000, // 2024-01-01 00:00:00 UTC
        closeTime: 1704067260000, // 2024-01-01 00:01:00 UTC
        open: 100,
        high: 105,
        low: 99,
        close: 103,
        volume: 1000,
      }

      // Verify these are Unix milliseconds (large numbers)
      expect(candle.openTime).toBeGreaterThan(1000000000000)
      expect(candle.closeTime).toBeGreaterThan(candle.openTime)
    })
  })
})

describe("isCandle type guard", () => {
  it("should return true for valid candle objects", () => {
    const candle = {
      openTime: 1704067200000,
      closeTime: 1704067260000,
      open: 100,
      high: 105,
      low: 99,
      close: 103,
      volume: 1000,
    }

    expect(isCandle(candle)).toBe(true)
  })

  it("should return false for null", () => {
    expect(isCandle(null)).toBe(false)
  })

  it("should return false for undefined", () => {
    expect(isCandle(undefined)).toBe(false)
  })

  it("should return false for primitives", () => {
    expect(isCandle(42)).toBe(false)
    expect(isCandle("candle")).toBe(false)
    expect(isCandle(true)).toBe(false)
  })

  it("should return false for objects missing fields", () => {
    expect(isCandle({ openTime: 1000 })).toBe(false)
    expect(isCandle({ open: 100, high: 105 })).toBe(false)
  })

  it("should return false for objects with wrong field types", () => {
    expect(
      isCandle({
        openTime: "1704067200000", // string instead of number
        closeTime: 1704067260000,
        open: 100,
        high: 105,
        low: 99,
        close: 103,
        volume: 1000,
      })
    ).toBe(false)
  })
})

describe("validateCandle", () => {
  const validCandle = {
    openTime: 1704067200000,
    closeTime: 1704067260000,
    open: 100,
    high: 105,
    low: 99,
    close: 103,
    volume: 1000,
  }

  it("should validate a correct candle", () => {
    const result = validateCandle(validCandle)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("should reject non-object input", () => {
    const result = validateCandle(null)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain(
      "Invalid candle structure: missing or invalid required fields"
    )
  })

  it("should reject openTime >= closeTime", () => {
    const result = validateCandle({
      ...validCandle,
      openTime: 1704067260000,
      closeTime: 1704067200000,
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("openTime"))).toBe(true)
  })

  it("should reject low > high", () => {
    const result = validateCandle({
      ...validCandle,
      low: 110,
      high: 105,
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("low") && e.includes("high"))).toBe(true)
  })

  it("should reject open outside low-high range", () => {
    const result = validateCandle({
      ...validCandle,
      open: 90, // below low of 99
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("open"))).toBe(true)
  })

  it("should reject close outside low-high range", () => {
    const result = validateCandle({
      ...validCandle,
      close: 110, // above high of 105
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("close"))).toBe(true)
  })

  it("should reject negative volume", () => {
    const result = validateCandle({
      ...validCandle,
      volume: -100,
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("volume"))).toBe(true)
  })

  it("should reject NaN values", () => {
    const result = validateCandle({
      ...validCandle,
      open: Number.NaN,
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("not a valid finite number"))).toBe(true)
  })

  it("should reject Infinity values", () => {
    const result = validateCandle({
      ...validCandle,
      high: Number.POSITIVE_INFINITY,
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("not a valid finite number"))).toBe(true)
  })

  it("should reject negative prices", () => {
    const result = validateCandle({
      ...validCandle,
      open: -10,
      low: -15,
      high: -5,
      close: -8,
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("cannot be negative"))).toBe(true)
  })

  it("should reject non-positive timestamps", () => {
    const result = validateCandle({
      ...validCandle,
      openTime: 0,
      closeTime: 1000,
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes("must be positive"))).toBe(true)
  })

  describe("edge cases", () => {
    it("should accept zero volume", () => {
      const result = validateCandle({
        ...validCandle,
        volume: 0,
      })
      expect(result.valid).toBe(true)
    })

    it("should accept equal open and close (doji candle)", () => {
      const result = validateCandle({
        ...validCandle,
        open: 100,
        close: 100,
        high: 105,
        low: 95,
      })
      expect(result.valid).toBe(true)
    })

    it("should accept all OHLC equal (flat candle)", () => {
      const result = validateCandle({
        ...validCandle,
        open: 100,
        high: 100,
        low: 100,
        close: 100,
      })
      expect(result.valid).toBe(true)
    })

    it("should accept very small price differences", () => {
      const result = validateCandle({
        ...validCandle,
        open: 100.00001,
        high: 100.00002,
        low: 100.00000,
        close: 100.00001,
      })
      expect(result.valid).toBe(true)
    })

    it("should accept very large prices", () => {
      const result = validateCandle({
        ...validCandle,
        open: 1e15,
        high: 1.1e15,
        low: 0.9e15,
        close: 1.05e15,
      })
      expect(result.valid).toBe(true)
    })
  })
})

describe("CandleFactory", () => {
  const validCandleData = {
    openTime: 1704067200000,
    closeTime: 1704067260000,
    open: 100,
    high: 105,
    low: 99,
    close: 103,
    volume: 1000,
  }

  describe("create", () => {
    it("should create a valid candle", () => {
      const candle = CandleFactory.create(validCandleData)

      expect(candle.openTime).toBe(1704067200000)
      expect(candle.closeTime).toBe(1704067260000)
      expect(candle.open).toBe(100)
      expect(candle.high).toBe(105)
      expect(candle.low).toBe(99)
      expect(candle.close).toBe(103)
      expect(candle.volume).toBe(1000)
    })

    it("should return a frozen object", () => {
      const candle = CandleFactory.create(validCandleData)
      expect(Object.isFrozen(candle)).toBe(true)
    })

    it("should throw InvalidCandleError for invalid data", () => {
      expect(() =>
        CandleFactory.create({
          ...validCandleData,
          low: 200, // greater than high
        })
      ).toThrow(InvalidCandleError)
    })

    it("should include validation errors in exception", () => {
      let thrownError: InvalidCandleError | null = null

      try {
        CandleFactory.create({
          ...validCandleData,
          low: 200,
        })
      } catch (error) {
        thrownError = error as InvalidCandleError
      }

      expect(thrownError).not.toBeNull()
      expect(thrownError).toBeInstanceOf(InvalidCandleError)
      if (thrownError !== null) {
        expect(thrownError.validationErrors.length).toBeGreaterThan(0)
      }
    })
  })

  describe("tryCreate", () => {
    it("should return candle for valid data", () => {
      const candle = CandleFactory.tryCreate(validCandleData)

      expect(candle).not.toBeNull()
      expect(candle?.open).toBe(100)
    })

    it("should return null for invalid data", () => {
      const candle = CandleFactory.tryCreate({
        ...validCandleData,
        low: 200,
      })

      expect(candle).toBeNull()
    })

    it("should return null for non-candle objects", () => {
      expect(CandleFactory.tryCreate(null)).toBeNull()
      expect(CandleFactory.tryCreate({})).toBeNull()
      expect(CandleFactory.tryCreate("candle")).toBeNull()
    })
  })

  describe("fromBinanceKline", () => {
    it("should parse Binance kline array format", () => {
      const kline = [
        1704067200000, // Open time
        "100.00", // Open (string)
        "105.00", // High (string)
        "99.00", // Low (string)
        "103.00", // Close (string)
        "1000.00", // Volume (string)
        1704067260000, // Close time
        "103000.00", // Quote asset volume
        100, // Number of trades
        "500.00", // Taker buy base volume
        "51500.00", // Taker buy quote volume
        "0", // Ignore
      ]

      const candle = CandleFactory.fromBinanceKline(kline)

      expect(candle.openTime).toBe(1704067200000)
      expect(candle.closeTime).toBe(1704067260000)
      expect(candle.open).toBe(100)
      expect(candle.high).toBe(105)
      expect(candle.low).toBe(99)
      expect(candle.close).toBe(103)
      expect(candle.volume).toBe(1000)
    })

    it("should throw for array with insufficient elements", () => {
      expect(() => CandleFactory.fromBinanceKline([1, 2, 3])).toThrow(InvalidCandleError)
    })

    it("should throw for non-array input", () => {
      expect(() => CandleFactory.fromBinanceKline({} as unknown[])).toThrow()
    })
  })
})
