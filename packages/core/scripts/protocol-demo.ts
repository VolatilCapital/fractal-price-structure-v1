/**
 * Demo: Protocol compliance demonstration
 * Shows dynamic reference levels and engulfing candle handling
 *
 * Usage: npx tsx packages/core/scripts/protocol-demo.ts
 */
import { FractalEngine, ConsoleLogger } from "../src/index.js"
import type { Candle } from "../src/domain/candle/Candle.js"

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
}

function printHeader(title: string) {
  console.log(`\n${colors.bold}${colors.magenta}${"═".repeat(70)}${colors.reset}`)
  console.log(`${colors.bold}${colors.magenta}  ${title}${colors.reset}`)
  console.log(`${colors.bold}${colors.magenta}${"═".repeat(70)}${colors.reset}\n`)
}

function printSubheader(title: string) {
  console.log(`\n${colors.cyan}── ${title} ──${colors.reset}\n`)
}

function printMove(move: { id: { toString(): string }, polarity: string, priceRange: { low: number, high: number }, currentReferenceLevel: number, state: string }) {
  const stateEmoji = move.state === "growing" ? "🟢" : move.state === "reference" ? "🟠" : "⬜"
  const id = move.id.toString().slice(0, 8)
  const pol = move.polarity === "up" ? "▲" : "▼"

  console.log(
    `  ${stateEmoji} #${id} ${pol} [${move.priceRange.low.toFixed(0)}-${move.priceRange.high.toFixed(0)}] ` +
    `${colors.yellow}ref: ${move.currentReferenceLevel.toFixed(0)}${colors.reset}`
  )
}

/**
 * Protocol Example from section 14: 10-candle sequence
 */
function createProtocolExampleCandles(): Candle[] {
  const baseTime = 1704067200000 // Jan 1, 2024

  // From protocol section 14.1
  // | #   | High | Low | Side |
  const data = [
    { high: 105, low: 100, side: "up" },   // B1
    { high: 112, low: 104, side: "up" },   // B2
    { high: 108, low: 102, side: "down" }, // B3
    { high: 115, low: 107, side: "up" },   // B4
    { high: 113, low: 109, side: "down" }, // B5
    { high: 111, low: 106, side: "down" }, // B6
    { high: 110, low: 105, side: "down" }, // B7
    { high: 112, low: 108, side: "up" },   // B8
    { high: 118, low: 111, side: "up" },   // B9
    { high: 116, low: 110, side: "down" }, // B10
  ]

  return data.map((d, i) => ({
    openTime: baseTime + i * 60000,
    closeTime: baseTime + (i + 1) * 60000,
    open: d.side === "up" ? d.low + 1 : d.high - 1,
    high: d.high,
    low: d.low,
    close: d.side === "up" ? d.high - 1 : d.low + 1,
    volume: 1000,
  }))
}

/**
 * Creates candles that demonstrate engulfing behavior
 */
function createEngulfingExampleCandles(): Candle[] {
  const baseTime = 1704067200000

  return [
    // B1: Initial Up structure
    { openTime: baseTime, closeTime: baseTime + 60000, open: 101, high: 110, low: 100, close: 108, volume: 1000 },
    // B2: Extends the structure (ref evolves to 106)
    { openTime: baseTime + 60000, closeTime: baseTime + 120000, open: 107, high: 115, low: 106, close: 114, volume: 1000 },
    // B3: Green engulfing candle (breaks both high=115 and ref=106)
    { openTime: baseTime + 120000, closeTime: baseTime + 180000, open: 110, high: 125, low: 100, close: 122, volume: 1000 },
  ]
}

async function runProtocolExample() {
  printHeader("PROTOCOL EXAMPLE (Section 14)")

  const candles = createProtocolExampleCandles()
  const engine = new FractalEngine({ deterministic: true, logger: new ConsoleLogger() })

  console.log(`Processing ${candles.length} candles from protocol section 14...\n`)

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i]
    console.log(`${colors.bold}[B${i + 1}]${colors.reset} H:${candle.high} L:${candle.low} ${candle.close > candle.open ? "▲" : "▼"}`)

    engine.addCandle(candle)

    printSubheader(`State after B${i + 1}`)

    const growing = engine.getGrowingMoves()
    const reference = engine.getAllMoves().filter(m => m.state === "reference")

    if (growing.length > 0) {
      console.log(`${colors.green}Growing structures:${colors.reset}`)
      growing.forEach(printMove)
    }

    if (reference.length > 0) {
      console.log(`\n${colors.yellow}Reference structures:${colors.reset}`)
      reference.forEach(printMove)
    }

    console.log(`${colors.dim}${"─".repeat(50)}${colors.reset}`)
  }

  printSubheader("Final State")
  console.log(`Total moves: ${engine.getAllMoves().length}`)
  console.log(`Growing: ${engine.getGrowingMoves().length}`)
  console.log(`Reference: ${engine.getAllMoves().filter(m => m.state === "reference").length}`)

  const validation = engine.validate()
  console.log(`\nStructure valid: ${validation.valid ? "✅" : "❌"}`)
}

async function runEngulfingExample() {
  printHeader("ENGULFING CANDLE EXAMPLE")

  const candles = createEngulfingExampleCandles()
  const engine = new FractalEngine({ deterministic: true, logger: new ConsoleLogger() })

  console.log("Demonstrating engulfing candle detection...\n")

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i]
    const color = candle.close > candle.open ? "Green" : "Red"
    console.log(`${colors.bold}[B${i + 1}]${colors.reset} H:${candle.high} L:${candle.low} ${color}`)

    const moveBefore = engine.getGrowingMoves()[0]
    if (moveBefore) {
      console.log(`  ${colors.dim}Before: ref=${moveBefore.currentReferenceLevel}, high=${moveBefore.priceRange.high}${colors.reset}`)
    }

    engine.addCandle(candle)

    const moveAfter = engine.getGrowingMoves()[0]
    if (moveAfter) {
      console.log(`  ${colors.green}After:  ref=${moveAfter.currentReferenceLevel}, high=${moveAfter.priceRange.high}${colors.reset}`)
    }

    console.log()
  }

  printSubheader("Final Structure")
  engine.getAllMoves().forEach(printMove)
}

async function runReferenceLevelEvolutionExample() {
  printHeader("REFERENCE LEVEL EVOLUTION")

  const baseTime = 1704067200000
  const candles: Candle[] = [
    // I1: Initial impulse
    { openTime: baseTime, closeTime: baseTime + 60000, open: 100, high: 105, low: 100, close: 104, volume: 1000 },
    // I2: Extension (ref evolves from 100 to 108)
    { openTime: baseTime + 60000, closeTime: baseTime + 120000, open: 109, high: 115, low: 108, close: 114, volume: 1000 },
    // I3: Another extension (ref evolves from 108 to 112)
    { openTime: baseTime + 120000, closeTime: baseTime + 180000, open: 114, high: 120, low: 112, close: 119, volume: 1000 },
    // Test: This would break old logic (110 > 100) but breaks new logic (110 < 112)
    { openTime: baseTime + 180000, closeTime: baseTime + 240000, open: 116, high: 118, low: 110, close: 111, volume: 1000 },
  ]

  const engine = new FractalEngine({ deterministic: true })

  console.log("Demonstrating how reference level evolves with each extension...\n")
  console.log(`${colors.cyan}Protocol section 3.3: "Le niveau de référence est toujours le dernier brin"${colors.reset}\n`)

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i]
    console.log(`${colors.bold}[Candle ${i + 1}]${colors.reset} H:${candle.high} L:${candle.low}`)

    engine.addCandle(candle)

    const move = engine.getGrowingMoves()[0]
    if (move) {
      console.log(`  Structure: [${move.priceRange.low}-${move.priceRange.high}]`)
      console.log(`  ${colors.yellow}Reference Level: ${move.currentReferenceLevel}${colors.reset}`)
      console.log(`  State: ${move.state}`)
    } else {
      console.log(`  ${colors.red}No growing structure (terminated)${colors.reset}`)
    }
    console.log()
  }

  console.log(`${colors.green}Note: Candle 4 with low=110 breaks the structure because 110 < 112 (evolved ref)${colors.reset}`)
  console.log(`${colors.dim}With old logic (checking against structure low=100), it would NOT have broken.${colors.reset}`)
}

async function main() {
  console.log("\n")
  console.log(`${colors.bold}${colors.magenta}╔════════════════════════════════════════════════════════════════════════╗${colors.reset}`)
  console.log(`${colors.bold}${colors.magenta}║       FRACTAL PROTOCOL DEMONSTRATION                                   ║${colors.reset}`)
  console.log(`${colors.bold}${colors.magenta}║       Dynamic Reference Levels & Engulfing Candles                     ║${colors.reset}`)
  console.log(`${colors.bold}${colors.magenta}╚════════════════════════════════════════════════════════════════════════╝${colors.reset}`)

  await runReferenceLevelEvolutionExample()
  await runEngulfingExample()
  await runProtocolExample()

  console.log(`\n${colors.dim}Done.${colors.reset}\n`)
}

main().catch(console.error)
