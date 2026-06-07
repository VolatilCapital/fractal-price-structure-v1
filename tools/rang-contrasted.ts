/**
 * Empirical: compute an alternative `rangContrasted` for every move and
 * compare with the current `rang`.
 *
 * Hypothesis under test: the protocol §5.3 distinguishes "correction"
 * (opposite-polarity child = real hierarchy nesting) from "extension"
 * (same-polarity child = mere boundary growth at the same level).
 * The current `rang` formula counts both, which inflates the rang in
 * long unidirectional runs.
 *
 * `rangContrasted` only counts sub-structures of OPPOSITE polarity:
 *   rangContrasted = max(sub.rangContrasted for sub in subStructures
 *                                  if sub.polarity !== self.polarity) + 1
 *   (= 0 if there is no opposite-polarity sub)
 *
 * This script is READ-ONLY — it does NOT mutate the engine's `rang`. It
 * recomputes `rangContrasted` post-hoc from the existing tree and shows
 * the distribution side by side.
 *
 * Output: docs/empirical/rang-contrasted.md
 * Run:    pnpm exec tsx tools/rang-contrasted.ts
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

const contrastedCache = new WeakMap<PriceMove, number>()

function rangContrasted(move: PriceMove): number {
  const cached = contrastedCache.get(move)
  if (cached !== undefined) return cached

  const oppositeChildren = move.subStructures.filter(
    (s) => s.polarity !== move.polarity
  )
  let result: number
  if (oppositeChildren.length === 0) {
    // No opposite-polarity child: depth at this level is the max contrasted
    // depth of same-polarity children (extensions don't add a level), or 0.
    if (move.subStructures.length === 0) {
      result = 0
    } else {
      result = Math.max(...move.subStructures.map(rangContrasted))
    }
  } else {
    result = Math.max(...oppositeChildren.map(rangContrasted)) + 1
  }
  contrastedCache.set(move, result)
  return result
}

interface DistRow {
  rang: number
  countRang: number
  countContrasted: number
}

function analyze(fixturePath: string): string {
  const fixture: FixtureFile = JSON.parse(readFileSync(fixturePath, "utf-8"))
  const engine = new FractalEngine({ deterministic: true })
  engine.buildFromCandles(fixture.candles)
  const allMoves = engine.getAllMoves()

  const maxRang = Math.max(...allMoves.map((m) => m.rang))
  const maxContrasted = Math.max(...allMoves.map(rangContrasted))

  const rows: DistRow[] = []
  const maxLevel = Math.max(maxRang, maxContrasted)
  for (let r = 0; r <= maxLevel; r++) {
    rows.push({
      rang: r,
      countRang: allMoves.filter((m) => m.rang === r).length,
      countContrasted: allMoves.filter((m) => rangContrasted(m) === r).length,
    })
  }

  let md = ""
  md += `### Fixture : \`${fixturePath.split("/").pop()}\`\n\n`
  md += `- **Bougies** : ${fixture.count}\n`
  md += `- **Total moves** : ${allMoves.length}\n`
  md += `- **Rang max (formule actuelle)** : ${maxRang}\n`
  md += `- **Rang max (formule \`rangContrasted\`)** : ${maxContrasted}\n\n`

  md += `| Niveau | \`rang\` actuel | % | \`rangContrasted\` | % |\n`
  md += `|--------|----------------|---|---------------------|---|\n`
  for (const r of rows) {
    if (r.countRang === 0 && r.countContrasted === 0) continue
    const pctR = ((r.countRang / allMoves.length) * 100).toFixed(1)
    const pctC = ((r.countContrasted / allMoves.length) * 100).toFixed(1)
    md += `| ${r.rang} | ${r.countRang} | ${pctR}% | ${r.countContrasted} | ${pctC}% |\n`
  }
  md += `\n`

  md += `**Cumul "minRang ≥ N" — formule actuelle vs contrasted** :\n\n`
  md += `| Seuil ≥ N | Conservé (\`rang\`) | % | Conservé (\`rangContrasted\`) | % |\n`
  md += `|-----------|-------------------|---|------------------------------|---|\n`
  let cumR = allMoves.length
  let cumC = allMoves.length
  for (const r of rows) {
    const pR = ((cumR / allMoves.length) * 100).toFixed(1)
    const pC = ((cumC / allMoves.length) * 100).toFixed(1)
    md += `| ≥ ${r.rang} | ${cumR} | ${pR}% | ${cumC} | ${pC}% |\n`
    cumR -= r.countRang
    cumC -= r.countContrasted
    if (cumR === 0 && cumC === 0) break
  }
  md += `\n`

  return md
}

function main(): void {
  const today = new Date().toISOString().slice(0, 10)
  const fixtures = [
    "packages/core-v1/src/__fixtures__/eurusd-5m.json",
    "packages/core-v1/src/__fixtures__/btcusdt-1d.json",
  ]

  let report = ""
  report += `# Étude : \`rang\` actuel vs \`rangContrasted\` (variante A — ADR-007)\n\n`
  report += `> Produite le ${today} par \`tools/rang-contrasted.ts\`. Lecture seule, ne mute pas l'engine.\n\n`
  report += `## Hypothèse testée\n\n`
  report += `Le calcul actuel \`rang = max(subStructures.rang) + 1\` ne distingue pas :\n`
  report += `- les sub-structures de **polarité opposée** (corrections — vraie imbrication fractale per protocole §5.3) ;\n`
  report += `- les sub-structures de **même polarité** (extensions — raffinement de borne sans changement de niveau hiérarchique).\n\n`
  report += `On définit ici une alternative :\n\n`
  report += "```\n"
  report += `rangContrasted(m) = 0 si pas de sub-structures\n`
  report += `                  = max(sub.rangContrasted pour sub de polarité opposée) + 1\n`
  report += `                  = max(sub.rangContrasted) sans incrément si tous les subs sont même polarité\n`
  report += "```\n\n"
  report += `## Résultats\n\n`

  for (const f of fixtures) {
    report += analyze(resolve(REPO_ROOT, f))
  }

  report += `---\n\n`
  report += `## Lecture\n\n`
  report += `- Si \`rangContrasted\` réduit drastiquement la queue : la longue chaîne 7-369 sur BTCUSDT était essentiellement composée d'extensions homopolarisées, pas de corrections imbriquées.\n`
  report += `- Si les deux formules restent proches : alors la queue contient bien des inversions de polarité empilées, et la "vraie" profondeur fractale est élevée.\n`
  report += `- Le **seuil de filtrage exploitable** sur \`rangContrasted\` sera très probablement inférieur à celui sur \`rang\` (typiquement minRang ≥ 2 ou 3 suffirait).\n\n`
  report += `## Décision\n\nÀ trancher dans **ADR-007**. Cette étude est strictement informationnelle.\n`

  const outPath = resolve(REPO_ROOT, "docs/empirical/rang-contrasted.md")
  writeFileSync(outPath, report)
  console.log(`Rapport écrit dans ${outPath}`)
}

main()
