/**
 * Empirical trace — show concrete shape of a high-rang move.
 *
 * Loads a fixture, builds the structure, isolates the move with the highest
 * rang, and walks down its sub-structure chain to show exactly how the rang
 * climbs. This is meant to answer: "what does a rang-78 move actually look
 * like?"
 *
 * Run:  pnpm exec tsx tools/rang-trace.ts [fixturePath]
 */

import { readFileSync, writeFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { FractalEngine } from "../packages/core-v1/src/FractalEngine.js"
import type { Candle } from "../packages/core-v1/src/domain/candle/Candle.js"
import type { PriceMove } from "../packages/core-v1/src/domain/price-move/PriceMove.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, "..")

interface FixtureFile {
  symbol: string
  interval: string
  count: number
  candles: Candle[]
}

function shortId(m: PriceMove): string {
  return m.id.toString().slice(-8)
}

function trace(fixturePath: string): string {
  const fixture: FixtureFile = JSON.parse(readFileSync(fixturePath, "utf-8"))
  const engine = new FractalEngine({ deterministic: true })
  engine.buildFromCandles(fixture.candles)

  const allMoves = engine.getAllMoves()
  const maxRang = Math.max(...allMoves.map((m) => m.rang))
  const topMoves = allMoves.filter((m) => m.rang === maxRang)
  const topMove = topMoves[0]
  if (!topMove) {
    return `No move found at max rang ${maxRang}`
  }

  let md = ""
  md += `# Trace du move de rang max — ${fixture.symbol} ${fixture.interval}\n\n`
  md += `**Fixture** : ${fixturePath.split("/").pop()} (${fixture.count} bougies)\n\n`
  md += `**Move racine de rang max** : id=\`${shortId(topMove)}\`, rang=${topMove.rang}, polarité=${topMove.polarity}, état=${topMove.state}\n`
  md += `- priceRange : [${topMove.priceRange.low} — ${topMove.priceRange.high}]\n`
  md += `- timeRange : ${new Date(topMove.timeRange.start).toISOString()} → ${new Date(topMove.timeRange.end).toISOString()}\n`
  md += `- currentReferenceLevel : ${topMove.currentReferenceLevel}\n`
  md += `- nombre de sub-structures directes : ${topMove.subStructures.length}\n`
  md += `- parentStructure : ${topMove.parentStructure ? shortId(topMove.parentStructure) : "(racine)"}\n\n`

  md += `## Répartition des sub-structures DIRECTES par rang\n\n`
  md += `| Rang | Nombre | Polarités | États |\n`
  md += `|------|--------|-----------|-------|\n`

  const subByRang = new Map<number, PriceMove[]>()
  for (const sub of topMove.subStructures) {
    const arr = subByRang.get(sub.rang) ?? []
    arr.push(sub)
    subByRang.set(sub.rang, arr)
  }
  const sortedRangs = [...subByRang.keys()].sort((a, b) => b - a)
  for (const r of sortedRangs) {
    const subs = subByRang.get(r) ?? []
    const ups = subs.filter((s) => s.polarity === "up").length
    const downs = subs.filter((s) => s.polarity === "down").length
    const growing = subs.filter((s) => s.state === "growing").length
    const reference = subs.filter((s) => s.state === "reference").length
    const archived = subs.filter((s) => s.state === "archived").length
    md += `| ${r} | ${subs.length} | up=${ups} down=${downs} | G=${growing} R=${reference} A=${archived} |\n`
  }
  md += `\n`

  md += `## Descente le long de la chaîne de plus haut rang\n\n`
  md += `À chaque étape, on prend la sub-structure de rang le plus élevé (celle qui détermine \`rang(parent) = max + 1\`).\n\n`
  md += `| Étape | id      | rang | polarité | état      | nb sub | priceRange                  |\n`
  md += `|-------|---------|------|----------|-----------|--------|------------------------------|\n`

  let current: PriceMove | undefined = topMove
  let step = 0
  const MAX_STEPS = 12
  while (current && step < MAX_STEPS) {
    md += `| ${step} | \`${shortId(current)}\` | ${current.rang} | ${current.polarity} | ${current.state} | ${current.subStructures.length} | [${current.priceRange.low} — ${current.priceRange.high}] |\n`
    if (current.subStructures.length === 0) break
    const next = current.subStructures.reduce(
      (best, s) => (s.rang > best.rang ? s : best),
      current.subStructures[0]!
    )
    current = next
    step++
  }

  md += `\n## Lecture\n\n`
  md += `- Si la **descente est strictement linéaire** (chaque parent n'a qu'1 sub-structure et son rang = rang(sub)+1), alors la queue \"un move par rang\" reflète une chaîne d'imbrications dans un seul sens — produite par le protocole, pas un bug.\n`
  md += `- Si à un étage la **sub-structure de plus haut rang est isolée parmi plusieurs frères**, ça veut dire que c'est UNE branche profonde qui tire le rang vers le haut, et que les autres sub-structures sont des frères "plats" (rang faible).\n`
  md += `- Si la chaîne **descend très profond sans branchement**, c'est l'indice que \`recalculateRang\` propage agressivement.\n`

  return md
}

const fixtures = [
  "packages/core-v1/src/__fixtures__/eurusd-5m.json",
  "packages/core-v1/src/__fixtures__/btcusdt-1d.json",
]

let output = `# Trace de moves à rang max — annexe à \`docs/empirical/rang-distribution.md\`\n\n`
for (const f of fixtures) {
  const trace_ = trace(resolve(REPO_ROOT, f))
  output += trace_
  output += `\n---\n\n`
  console.log(trace_)
}

const outPath = resolve(REPO_ROOT, "docs/empirical/rang-trace.md")
writeFileSync(outPath, output)
console.log(`\n→ Trace écrite dans ${outPath}`)
