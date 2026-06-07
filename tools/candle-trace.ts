/**
 * Candle-by-candle trace.
 *
 * Runs FractalEngine on the first N candles of EURUSD with a capturing
 * Logger and a state snapshot after each candle, to surface exactly which
 * protocol rule produces each new move / sub-structure / extension.
 *
 * Output: docs/empirical/candle-trace-eurusd.md
 *
 * Run:  pnpm exec tsx tools/candle-trace.ts [N=15]
 */

import { readFileSync, writeFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { FractalEngine } from "../packages/core-v1/src/FractalEngine.js"
import type { Candle } from "../packages/core-v1/src/domain/candle/Candle.js"
import type { Logger } from "../packages/core-v1/src/domain/logger/Logger.js"
import type { PriceMove } from "../packages/core-v1/src/domain/price-move/PriceMove.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, "..")
const N = Number(process.argv[2] ?? 15)

class CapturingLogger implements Logger {
  public messages: string[] = []
  debug(msg: string): void {
    this.messages.push(msg)
  }
  info(msg: string): void {
    this.messages.push(`INFO: ${msg}`)
  }
  warn(msg: string): void {
    this.messages.push(`WARN: ${msg}`)
  }
  error(msg: string): void {
    this.messages.push(`ERROR: ${msg}`)
  }
  reset(): void {
    this.messages = []
  }
}

function shortId(m: PriceMove): string {
  return m.id.toString().slice(-8)
}

function snapshotMove(m: PriceMove): string {
  const pol = m.polarity
  const state = m.state.slice(0, 1).toUpperCase() // G / R / A
  const range = `[${m.priceRange.low}-${m.priceRange.high}]`
  const parent = m.parentStructure ? `parent=${shortId(m.parentStructure)}` : "root"
  const sub = m.subStructures.length
  return `${shortId(m)} ${pol} ${state} rang=${m.rang} ${range} ref=${m.currentReferenceLevel} sub=${sub} ${parent}`
}

interface FixtureFile {
  symbol: string
  interval: string
  count: number
  candles: Candle[]
}

function main(): void {
  const fixturePath = resolve(
    REPO_ROOT,
    "packages/core-v1/src/__fixtures__/eurusd-5m.json"
  )
  const fixture: FixtureFile = JSON.parse(readFileSync(fixturePath, "utf-8"))
  const candles = fixture.candles.slice(0, N)

  const logger = new CapturingLogger()
  const engine = new FractalEngine({ deterministic: true, logger })

  let md = ""
  md += `# Trace bougie-par-bougie — EURUSD-5m (${N} premières bougies)\n\n`
  md += `Objectif : identifier par quelle règle du protocole chaque move / sub-structure / extension est créée.\n\n`
  md += `Format : pour chaque bougie, on liste\n`
  md += `1. la bougie ingérée (open, high, low, close, polarité dérivée) ;\n`
  md += `2. les messages debug émis par PriceMoveStructure pendant le traitement ;\n`
  md += `3. l'état complet de la structure après ingestion (tous les moves connus).\n\n`
  md += `Tags du logger : \`[ADD]\` ingestion candidate, \`[EXTEND]\` extended-boundary, \`[INTERNAL]\` extended-internal, \`[BREAK]\` cassure, \`[ROOT]\` création racine, \`[ENGULFING]\` bougie englobante, \`[INTERNAL-AFTER-CASCADE]\` interne après cassure parent.\n\n`
  md += `---\n\n`

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]!
    const polarity = c.close >= c.open ? "up" : "down"
    md += `## Bougie ${i} (${new Date(c.openTime).toISOString().slice(11, 19)})\n\n`
    md += `- **OHLC** : open=${c.open}, high=${c.high}, low=${c.low}, close=${c.close} → polarité dérivée du PriceMove : ${polarity}\n\n`

    logger.reset()
    engine.addCandle(c)

    md += `**Trace du protocole** :\n\n`
    md += `\`\`\`\n`
    for (const m of logger.messages) {
      md += `${m}\n`
    }
    md += `\`\`\`\n\n`

    md += `**État après ingestion** : ${engine.getAllMoves().length} moves connus\n\n`
    const allMoves = engine.getAllMoves()
    md += `| Move | Polarité | État | Rang | priceRange | refLevel | subs | parent |\n`
    md += `|------|---------|------|------|------------|----------|------|--------|\n`
    for (const m of allMoves) {
      const pol = m.polarity
      const state = m.state
      const range = `[${m.priceRange.low}—${m.priceRange.high}]`
      const ref = m.currentReferenceLevel
      const sub = m.subStructures.length
      const parent = m.parentStructure ? shortId(m.parentStructure) : "—"
      md += `| \`${shortId(m)}\` | ${pol} | ${state} | ${m.rang} | ${range} | ${ref} | ${sub} | ${parent} |\n`
    }
    md += `\n---\n\n`
  }

  // Final hierarchy: walk down from highest-rang move
  md += `## Hiérarchie finale (descente depuis le move de rang max)\n\n`
  const allMoves = engine.getAllMoves()
  const maxRang = Math.max(...allMoves.map((m) => m.rang))
  const top = allMoves.find((m) => m.rang === maxRang)
  if (top) {
    md += `Move racine de rang max : \`${shortId(top)}\`, rang ${top.rang}, ${top.polarity}\n\n`
    md += `\`\`\`\n`
    function walk(m: PriceMove, indent: string): void {
      md += `${indent}${snapshotMove(m)}\n`
      for (const sub of m.subStructures) {
        walk(sub, indent + "  ")
      }
    }
    walk(top, "")
    md += `\`\`\`\n`
  }

  const outPath = resolve(REPO_ROOT, "docs/empirical/candle-trace-eurusd.md")
  writeFileSync(outPath, md)
  console.log(`Trace écrite dans ${outPath} (${candles.length} bougies)`)
  console.log(`Max rang atteint après ${candles.length} bougies : ${maxRang}`)
}

main()
