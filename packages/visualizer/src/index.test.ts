import { describe, it, expect } from "vitest"
import { VERSION, DebugVisualizer, generateSampleCandles } from "./index.js"

describe("Visualizer Package", () => {
  it("should export VERSION", () => {
    expect(VERSION).toBe("1.1.0")
  })

  it("should export DebugVisualizer class", () => {
    expect(DebugVisualizer).toBeDefined()
  })

  it("should export generateSampleCandles function", () => {
    expect(generateSampleCandles).toBeDefined()
  })
})

describe("generateSampleCandles", () => {
  it("should generate the specified number of candles", () => {
    const candles = generateSampleCandles(10)
    expect(candles.length).toBe(10)
  })

  it("should generate valid candle data", () => {
    const candles = generateSampleCandles(5)

    for (const candle of candles) {
      expect(candle.openTime).toBeGreaterThan(0)
      expect(candle.closeTime).toBeGreaterThan(candle.openTime)
      expect(candle.high).toBeGreaterThanOrEqual(candle.open)
      expect(candle.high).toBeGreaterThanOrEqual(candle.close)
      expect(candle.low).toBeLessThanOrEqual(candle.open)
      expect(candle.low).toBeLessThanOrEqual(candle.close)
      expect(candle.volume).toBeGreaterThan(0)
    }
  })

  it("should use custom base price and volatility", () => {
    const candles = generateSampleCandles(5, 500, 10)

    // Price should be around 500 (±volatility*count)
    const avgPrice = candles.reduce((sum, c) => sum + c.close, 0) / candles.length
    expect(avgPrice).toBeGreaterThan(400)
    expect(avgPrice).toBeLessThan(600)
  })
})

describe("DebugVisualizer", () => {
  it("should create with default engine", () => {
    const viz = new DebugVisualizer()
    expect(viz.getEngine()).toBeDefined()
  })

  it("should load candles", () => {
    const viz = new DebugVisualizer()
    const candles = generateSampleCandles(10)

    viz.loadCandles(candles)

    const engine = viz.getEngine()
    expect(engine.getAllMoves().length).toBe(10)
  })
})
