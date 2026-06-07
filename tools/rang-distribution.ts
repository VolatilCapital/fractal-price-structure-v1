/**
 * Empirical study — rang distribution.
 *
 * Loads each fixture, builds the fractal structure via FractalEngine, and
 * computes per-rang stats:
 *   - count of moves at this rang
 *   - average duration in candles (= number of subStructures recursively + 1 at leaf)
 *   - average duration in time (timeRange.end - timeRange.start)
 *   - state breakdown (Growing / Reference / Archived)
 *   - polarity breakdown (Up / Down)
 *   - one representative move with its priceRange + time anchor
 *
 * Output: prints a Markdown table to stdout and writes the same to
 * docs/empirical/rang-distribution.md.
 *
 * Run:  pnpm exec tsx tools/rang-distribution.ts
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
  source: string
  fetchedAt: string
  count: number
  candles: Candle[]
}

interface RangStats {
  rang: number
  count: number
  growing: number
  reference: number
  archived: number
  up: number
  down: number
  avgDurationMs: number
  avgSubStructureCount: number
  maxSubStructureCount: number
  exampleMove: PriceMove | null
}

function countDescendants(move: PriceMove): number {
  let total = move.subStructures.length
  for (const sub of move.subStructures) {
    total += countDescendants(sub)
  }
  return total
}

function analyzeFixture(fixturePath: string): {
  meta: FixtureFile
  stats: RangStats[]
  totalMoves: number
  maxRang: number
  rootShare: number
} {
  const raw = readFileSync(fixturePath, "utf-8")
  const fixture: FixtureFile = JSON.parse(raw)

  const engine = new FractalEngine({ deterministic: true })
  engine.buildFromCandles(fixture.candles)

  const allMoves = engine.getAllMoves()
  const maxRang = allMoves.reduce((m, x) => Math.max(m, x.rang), 0)

  const stats: RangStats[] = []
  for (let r = 0; r <= maxRang; r++) {
    const movesAtRang = allMoves.filter((m) => m.rang === r)
    if (movesAtRang.length === 0) continue

    const durationsMs = movesAtRang.map(
      (m) => m.timeRange.end - m.timeRange.start
    )
    const subCounts = movesAtRang.map((m) => countDescendants(m))

    stats.push({
      rang: r,
      count: movesAtRang.length,
      growing: movesAtRang.filter((m) => m.state === "growing").length,
      reference: movesAtRang.filter((m) => m.state === "reference").length,
      archived: movesAtRang.filter((m) => m.state === "archived").length,
      up: movesAtRang.filter((m) => m.polarity === "up").length,
      down: movesAtRang.filter((m) => m.polarity === "down").length,
      avgDurationMs:
        durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length,
      avgSubStructureCount:
        subCounts.reduce((a, b) => a + b, 0) / subCounts.length,
      maxSubStructureCount: Math.max(...subCounts),
      exampleMove: movesAtRang[0] ?? null,
    })
  }

  const roots = allMoves.filter((m) => !m.parentStructure)
  return {
    meta: fixture,
    stats,
    totalMoves: allMoves.length,
    maxRang,
    rootShare: roots.length / allMoves.length,
  }
}

function formatDuration(ms: number, interval: string): string {
  const seconds = ms / 1000
  const minutes = seconds / 60
  const hours = minutes / 60
  const days = hours / 24

  if (interval === "1d") {
    return `${days.toFixed(1)} j`
  }
  if (interval === "1h") {
    return `${hours.toFixed(1)} h`
  }
  if (interval === "5m" || interval === "1m" || interval === "15m") {
    return `${minutes.toFixed(1)} min`
  }
  return `${ms.toFixed(0)} ms`
}

function renderFixtureReport(
  fixturePath: string,
  data: ReturnType<typeof analyzeFixture>
): string {
  const { meta, stats, totalMoves, maxRang, rootShare } = data

  let md = ""
  md += `### Fixture : \`${fixturePath.split("/").pop()}\`\n\n`
  md += `- **Symbole** : ${meta.symbol}\n`
  md += `- **Intervalle** : ${meta.interval}\n`
  md += `- **Bougies** : ${meta.count}\n`
  md += `- **Total moves construits** : ${totalMoves}\n`
  md += `- **Rang maximum** : ${maxRang}\n`
  md += `- **Part de racines (moves sans parent)** : ${(rootShare * 100).toFixed(1)}%\n\n`

  md += `| Rang | Nb moves | %    | Growing | Reference | Archived | Up | Down | Durée moy. | Sub-struct moy. | Sub-struct max |\n`
  md += `|------|----------|------|---------|-----------|----------|----|----|------------|------------------|----------------|\n`

  for (const s of stats) {
    const pct = ((s.count / totalMoves) * 100).toFixed(1)
    md += `| ${s.rang} | ${s.count} | ${pct}% | ${s.growing} | ${s.reference} | ${s.archived} | ${s.up} | ${s.down} | ${formatDuration(s.avgDurationMs, meta.interval)} | ${s.avgSubStructureCount.toFixed(1)} | ${s.maxSubStructureCount} |\n`
  }

  md += `\n`

  // Cumul: combien de moves restent si on filtre minRang ≥ N
  md += `**Si on filtrait \`minRang ≥ N\`, combien resterait-il ?**\n\n`
  md += `| Seuil minRang | Moves conservés | % du total |\n`
  md += `|---------------|-----------------|-----------|\n`
  let cumul = totalMoves
  for (const s of stats) {
    md += `| ≥ ${s.rang} | ${cumul} | ${((cumul / totalMoves) * 100).toFixed(1)}% |\n`
    cumul -= s.count
  }

  md += `\n`
  return md
}

function main(): void {
  const fixtures = [
    "packages/core-v1/src/__fixtures__/eurusd-5m.json",
    "packages/core-v1/src/__fixtures__/btcusdt-1d.json",
  ]

  const today = new Date().toISOString().slice(0, 10)

  let report = ""
  report += `# Étude empirique — Distribution des rangs\n\n`
  report += `> Produite le ${today} par \`tools/rang-distribution.ts\`. Reproduisible via :\n`
  report += `> \`\`\`bash\n`
  report += `> pnpm exec tsx tools/rang-distribution.ts\n`
  report += `> \`\`\`\n\n`
  report += `## Objet\n\n`
  report += `Quantifier la distribution des moves par rang sur chacune des deux fixtures, pour informer le choix d'un seuil de filtrage \`minRang\` (cf. ADR-003).\n\n`
  report += `## Méthode\n\n`
  report += `Pour chaque fixture :\n`
  report += `1. Charger les bougies brutes.\n`
  report += `2. Construire la structure via \`FractalEngine.buildFromCandles\` (deterministic, sans logger).\n`
  report += `3. Pour chaque rang \`r\` rencontré, calculer :\n`
  report += `   - nombre de moves à ce rang ;\n`
  report += `   - répartition Growing / Reference / Archived ;\n`
  report += `   - répartition Up / Down ;\n`
  report += `   - durée moyenne d'un move (timeRange.end - timeRange.start) ;\n`
  report += `   - nombre moyen et max de sub-structures descendantes (récursivement).\n`
  report += `4. Afficher pour chaque seuil candidat \`minRang ≥ N\` combien de moves seraient conservés.\n\n`
  report += `**Contrainte de cadrage** : aucune heuristique externe — uniquement les highs/lows et les cassures de structure produites par le protocole.\n\n`
  report += `---\n\n`
  report += `## Résultats\n\n`

  for (const fixture of fixtures) {
    const fixturePath = resolve(REPO_ROOT, fixture)
    console.log(`\n=== Analyse de ${fixture} ===`)
    const data = analyzeFixture(fixturePath)
    const section = renderFixtureReport(fixture, data)
    report += section
    process.stdout.write(section)
  }

  report += `---\n\n`
  report += `## Lecture\n\n`
  report += `- La colonne **% du total** indique l'inflation produite par les racines de bas rang. Si la part du rang 0 est très élevée, c'est le bruit micro qui domine la sortie.\n`
  report += `- La colonne **Durée moyenne** mesure la dispersion temporelle des structures par rang. On s'attend à voir cette durée croître monotonement avec le rang (un move de rang plus élevé absorbe par construction des sub-structures plus courtes).\n`
  report += `- Le tableau **\`minRang ≥ N\`** est l'outil principal pour choisir un seuil par défaut côté visualizer / API : il dit combien de moves sont conservés et quel pourcentage de la sortie totale ils représentent.\n\n`
  report += `## Décision\n\n`
  report += `À discuter avec l'auteur — la valeur seuil dépend du compromis lisibilité/richesse souhaité. L'étude fournit les données, pas la décision.\n`

  const outPath = resolve(REPO_ROOT, "docs/empirical/rang-distribution.md")
  writeFileSync(outPath, report)
  console.log(`\n→ Rapport écrit dans ${outPath}`)
}

main()
