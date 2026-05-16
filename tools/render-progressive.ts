/**
 * Progressive renderer — one SVG per ingested candle.
 *
 * Pour chaque étape i de 1 à N, on (re)construit la structure depuis zéro
 * avec les i premières bougies de la fixture EURUSD-5m, puis on produit un
 * SVG montrant :
 *   - les bougies (chandeliers compacts) ;
 *   - les rectangles des PriceMoves connus (priceRange × timeRange) ;
 *   - le label rang + 8 derniers caractères de l'id ;
 *   - une ligne pointillée pour le currentReferenceLevel du move de rang max.
 *
 * Sortie :
 *   docs/empirical/progressive/step-NN.svg
 *   docs/empirical/progressive/index.html (mini diaporama)
 *
 * Run:
 *   pnpm exec tsx tools/render-progressive.ts [N=8]
 */

import { readFileSync, writeFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { FractalEngine } from "../packages/core/src/FractalEngine.js"
import type { Candle } from "../packages/core/src/domain/candle/Candle.js"
import type { PriceMove } from "../packages/core/src/domain/price-move/PriceMove.js"

// ───────────────────────────────────────────────────────────── Setup ──────

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, "..")
const N = Number(process.argv[2] ?? 8)

const OUT_DIR = resolve(REPO_ROOT, "docs/empirical/progressive")

// SVG layout
const SVG_W = 1100
const SVG_H = 620
const MARGIN = { top: 30, right: 220, bottom: 50, left: 70 }
const PLOT_W = SVG_W - MARGIN.left - MARGIN.right
const PLOT_H = SVG_H - MARGIN.top - MARGIN.bottom

// Colors
const C_CANDLE_UP = "#26a69a"
const C_CANDLE_DOWN = "#ef5350"
const C_AXIS = "#666"
const C_GRID = "#eee"
const C_MOVE_GROWING = "#2e7d32"
const C_MOVE_REFERENCE = "#ef6c00"
const C_MOVE_ARCHIVED = "#9e9e9e"
const C_FILL_UP = "#1976d2" // bleu (up)
const C_FILL_DOWN = "#c62828" // rouge (down)
const C_REF_LEVEL = "#7b1fa2"

interface FixtureFile {
  symbol: string
  interval: string
  count: number
  candles: Candle[]
}

// ────────────────────────────────────────────────────────── Helpers ───────

function shortId(m: PriceMove): string {
  return m.id.toString().slice(-8)
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function pad(n: number, width = 2): string {
  return n.toString().padStart(width, "0")
}

/**
 * Calcule l'enveloppe (xMin/xMax/yMin/yMax) à partir des bougies ET des moves
 * — un move peut s'étendre légèrement au-delà de la plage des bougies.
 */
function computeBounds(
  candles: Candle[],
  moves: PriceMove[]
): { xMin: number; xMax: number; yMin: number; yMax: number } {
  let yMin = Infinity
  let yMax = -Infinity
  let xMin = Infinity
  let xMax = -Infinity

  for (const c of candles) {
    if (c.low < yMin) yMin = c.low
    if (c.high > yMax) yMax = c.high
    if (c.openTime < xMin) xMin = c.openTime
    if (c.closeTime > xMax) xMax = c.closeTime
  }
  for (const m of moves) {
    if (m.priceRange.low < yMin) yMin = m.priceRange.low
    if (m.priceRange.high > yMax) yMax = m.priceRange.high
    if (m.timeRange.start < xMin) xMin = m.timeRange.start
    if (m.timeRange.end > xMax) xMax = m.timeRange.end
  }

  // marge verticale
  const ySpan = yMax - yMin || 1
  yMin -= ySpan * 0.08
  yMax += ySpan * 0.08

  return { xMin, xMax, yMin, yMax }
}

interface Scale {
  xScale(t: number): number
  yScale(p: number): number
  candleWidth: number
}

function makeScale(
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number },
  candleStep: number
): Scale {
  const xSpan = bounds.xMax - bounds.xMin || 1
  const ySpan = bounds.yMax - bounds.yMin || 1
  // candle drawn body width = fraction of the candleStep (5min = 300000ms)
  const candleWidthPx = (candleStep / xSpan) * PLOT_W * 0.6

  return {
    xScale: (t: number) =>
      MARGIN.left + ((t - bounds.xMin) / xSpan) * PLOT_W,
    yScale: (p: number) =>
      MARGIN.top + PLOT_H - ((p - bounds.yMin) / ySpan) * PLOT_H,
    candleWidth: candleWidthPx,
  }
}

// ─────────────────────────────────────────────── SVG element factories ────

function svgHeader(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_W}" height="${SVG_H}" viewBox="0 0 ${SVG_W} ${SVG_H}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11">`
}

function background(): string {
  return `<rect x="0" y="0" width="${SVG_W}" height="${SVG_H}" fill="#fafafa"/>`
}

function axes(
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number },
  scale: Scale,
  candles: Candle[]
): string {
  const parts: string[] = []

  // plot frame
  parts.push(
    `<rect x="${MARGIN.left}" y="${MARGIN.top}" width="${PLOT_W}" height="${PLOT_H}" fill="white" stroke="${C_AXIS}" stroke-width="0.5"/>`
  )

  // Y gridlines / labels
  const yTicks = 6
  for (let i = 0; i <= yTicks; i++) {
    const p = bounds.yMin + ((bounds.yMax - bounds.yMin) * i) / yTicks
    const y = scale.yScale(p)
    parts.push(
      `<line x1="${MARGIN.left}" y1="${y}" x2="${MARGIN.left + PLOT_W}" y2="${y}" stroke="${C_GRID}" stroke-width="0.5"/>`
    )
    parts.push(
      `<text x="${MARGIN.left - 6}" y="${y + 3}" text-anchor="end" fill="${C_AXIS}">${p.toFixed(5)}</text>`
    )
  }

  // X labels — un label par bougie (compact)
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]!
    const x = scale.xScale((c.openTime + c.closeTime) / 2)
    const t = new Date(c.openTime).toISOString().slice(11, 16)
    parts.push(
      `<text x="${x}" y="${MARGIN.top + PLOT_H + 14}" text-anchor="middle" fill="${C_AXIS}">${t}</text>`
    )
    parts.push(
      `<text x="${x}" y="${MARGIN.top + PLOT_H + 28}" text-anchor="middle" fill="${C_AXIS}" font-size="9">#${i}</text>`
    )
  }

  return parts.join("\n")
}

function candleMarks(candles: Candle[], scale: Scale): string {
  const parts: string[] = []
  for (const c of candles) {
    const cx = scale.xScale((c.openTime + c.closeTime) / 2)
    const yHigh = scale.yScale(c.high)
    const yLow = scale.yScale(c.low)
    const yOpen = scale.yScale(c.open)
    const yClose = scale.yScale(c.close)
    const up = c.close >= c.open
    const color = up ? C_CANDLE_UP : C_CANDLE_DOWN
    const bodyTop = Math.min(yOpen, yClose)
    const bodyBottom = Math.max(yOpen, yClose)
    const bodyH = Math.max(bodyBottom - bodyTop, 1)
    const w = Math.max(scale.candleWidth, 2)

    // wick
    parts.push(
      `<line x1="${cx}" y1="${yHigh}" x2="${cx}" y2="${yLow}" stroke="${color}" stroke-width="1"/>`
    )
    // body
    parts.push(
      `<rect x="${cx - w / 2}" y="${bodyTop}" width="${w}" height="${bodyH}" fill="${color}" stroke="${color}" stroke-width="0.5"/>`
    )
  }
  return parts.join("\n")
}

function moveRects(moves: PriceMove[], scale: Scale): string {
  const parts: string[] = []

  // tri par rang croissant → on dessine d'abord les petits (les grands se
  // superposent par-dessus avec des contours plus visibles)
  const sorted = [...moves].sort((a, b) => a.rang - b.rang)

  for (const m of sorted) {
    const x1 = scale.xScale(m.timeRange.start)
    const x2 = scale.xScale(m.timeRange.end)
    const y1 = scale.yScale(m.priceRange.high)
    const y2 = scale.yScale(m.priceRange.low)
    const x = Math.min(x1, x2)
    const y = Math.min(y1, y2)
    const w = Math.max(Math.abs(x2 - x1), 4)
    const h = Math.max(Math.abs(y2 - y1), 4)

    const stroke =
      m.state === "growing"
        ? C_MOVE_GROWING
        : m.state === "reference"
          ? C_MOVE_REFERENCE
          : C_MOVE_ARCHIVED
    const fill = m.polarity === "up" ? C_FILL_UP : C_FILL_DOWN
    const strokeDasharray = m.state === "archived" ? "4 3" : "none"

    parts.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" fill-opacity="0.07" stroke="${stroke}" stroke-width="1.2" stroke-dasharray="${strokeDasharray}"/>`
    )

    // label en haut à gauche du rectangle
    const labelY = y - 2 < MARGIN.top + 10 ? y + 12 : y - 2
    parts.push(
      `<text x="${x + 3}" y="${labelY}" fill="${stroke}" font-weight="600">r=${m.rang} ${shortId(m)}</text>`
    )
  }

  return parts.join("\n")
}

function referenceLevel(moves: PriceMove[], scale: Scale): string {
  if (moves.length === 0) return ""
  // move de plus haut rang ; en cas d'égalité, le plus ancien (timeRange.start min)
  const maxRang = Math.max(...moves.map((m) => m.rang))
  const top = moves
    .filter((m) => m.rang === maxRang)
    .sort((a, b) => a.timeRange.start - b.timeRange.start)[0]
  if (!top) return ""

  const y = scale.yScale(top.currentReferenceLevel)
  const parts: string[] = []
  parts.push(
    `<line x1="${MARGIN.left}" y1="${y}" x2="${MARGIN.left + PLOT_W}" y2="${y}" stroke="${C_REF_LEVEL}" stroke-width="1.2" stroke-dasharray="6 4"/>`
  )
  parts.push(
    `<text x="${MARGIN.left + PLOT_W - 4}" y="${y - 4}" text-anchor="end" fill="${C_REF_LEVEL}" font-weight="600">ref top r=${top.rang} : ${top.currentReferenceLevel}</text>`
  )
  return parts.join("\n")
}

function legend(stepIdx: number, totalSteps: number, candle: Candle, moves: PriceMove[]): string {
  const lx = MARGIN.left + PLOT_W + 20
  const parts: string[] = []
  let ly = MARGIN.top + 4

  parts.push(
    `<text x="${lx}" y="${ly}" font-size="13" font-weight="700" fill="#222">Étape ${stepIdx}/${totalSteps}</text>`
  )
  ly += 18
  const t = new Date(candle.openTime).toISOString().slice(11, 19)
  parts.push(
    `<text x="${lx}" y="${ly}" fill="#444">Bougie #${stepIdx - 1} @ ${t}</text>`
  )
  ly += 14
  parts.push(
    `<text x="${lx}" y="${ly}" fill="#444" font-size="10">O=${candle.open} H=${candle.high}</text>`
  )
  ly += 12
  parts.push(
    `<text x="${lx}" y="${ly}" fill="#444" font-size="10">L=${candle.low} C=${candle.close}</text>`
  )
  ly += 18

  // états
  parts.push(`<text x="${lx}" y="${ly}" font-weight="600" fill="#222">État des PriceMoves</text>`)
  ly += 14
  for (const [label, color] of [
    ["growing", C_MOVE_GROWING],
    ["reference", C_MOVE_REFERENCE],
    ["archived", C_MOVE_ARCHIVED],
  ] as const) {
    parts.push(
      `<rect x="${lx}" y="${ly - 9}" width="14" height="10" fill="none" stroke="${color}" stroke-width="1.2"/>`
    )
    parts.push(`<text x="${lx + 20}" y="${ly}" fill="#444">${label}</text>`)
    ly += 14
  }
  ly += 6
  parts.push(`<text x="${lx}" y="${ly}" font-weight="600" fill="#222">Polarité (remplissage)</text>`)
  ly += 14
  parts.push(
    `<rect x="${lx}" y="${ly - 9}" width="14" height="10" fill="${C_FILL_UP}" fill-opacity="0.25"/>`
  )
  parts.push(`<text x="${lx + 20}" y="${ly}" fill="#444">up</text>`)
  ly += 14
  parts.push(
    `<rect x="${lx}" y="${ly - 9}" width="14" height="10" fill="${C_FILL_DOWN}" fill-opacity="0.25"/>`
  )
  parts.push(`<text x="${lx + 20}" y="${ly}" fill="#444">down</text>`)
  ly += 22

  // stats moves
  parts.push(
    `<text x="${lx}" y="${ly}" font-weight="600" fill="#222">${moves.length} moves connus</text>`
  )
  ly += 14
  const maxRang = moves.length > 0 ? Math.max(...moves.map((m) => m.rang)) : 0
  parts.push(`<text x="${lx}" y="${ly}" fill="#444">rang max : ${maxRang}</text>`)
  ly += 14
  const growing = moves.filter((m) => m.state === "growing").length
  const ref = moves.filter((m) => m.state === "reference").length
  parts.push(
    `<text x="${lx}" y="${ly}" fill="#444" font-size="10">growing=${growing} reference=${ref}</text>`
  )

  return parts.join("\n")
}

// ──────────────────────────────────────────────────────── Render step ─────

function renderStep(
  stepIdx: number,
  totalSteps: number,
  candles: Candle[],
  candleStep: number
): string {
  const engine = new FractalEngine({ deterministic: true })
  engine.buildFromCandles(candles)
  const moves = engine.getAllMoves()
  const lastCandle = candles[candles.length - 1]!

  const bounds = computeBounds(candles, moves)
  const scale = makeScale(bounds, candleStep)

  const parts: string[] = []
  parts.push(svgHeader())
  parts.push(background())
  parts.push(axes(bounds, scale, candles))
  parts.push(candleMarks(candles, scale))
  parts.push(moveRects(moves, scale))
  parts.push(referenceLevel(moves, scale))
  parts.push(legend(stepIdx, totalSteps, lastCandle, moves))
  parts.push("</svg>")
  return parts.join("\n")
}

// ──────────────────────────────────────────────────────── Index HTML ──────

function renderIndexHtml(totalSteps: number): string {
  const cards: string[] = []
  for (let i = 1; i <= totalSteps; i++) {
    const file = `step-${pad(i)}.svg`
    cards.push(`
    <section class="step">
      <h2>Étape ${i} <span class="muted">— ${i} bougie${i > 1 ? "s" : ""} ingérée${i > 1 ? "s" : ""}</span></h2>
      <img src="${file}" alt="${escapeXml(file)}" loading="lazy"/>
    </section>`)
  }

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Construction progressive de la structure fractale — EURUSD-5m</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; max-width: 1180px; margin: 24px auto; padding: 0 16px; color: #222; background: #f5f5f5; }
  h1 { font-size: 22px; margin: 0 0 8px; }
  p.intro { color: #555; line-height: 1.5; }
  .legend { background: white; padding: 12px 16px; border-radius: 6px; margin: 16px 0 24px; border: 1px solid #ddd; font-size: 14px; line-height: 1.6; }
  .legend code { background: #f0f0f0; padding: 1px 5px; border-radius: 3px; font-size: 12px; }
  .step { background: white; padding: 8px 12px 16px; margin-bottom: 24px; border-radius: 6px; border: 1px solid #ddd; }
  .step h2 { font-size: 16px; margin: 8px 0 8px; }
  .step .muted { color: #888; font-weight: 400; font-size: 14px; }
  .step img { width: 100%; height: auto; display: block; }
</style>
</head>
<body>
<h1>Construction progressive de la structure fractale</h1>
<p class="intro">Fixture : <code>eurusd-5m.json</code> · ${totalSteps} bougies · construction <em>from scratch</em> à chaque étape via <code>FractalEngine.buildFromCandles</code>.</p>
<div class="legend">
  <strong>Comment lire chaque SVG :</strong><br/>
  • Chandeliers compacts au centre (vert = up, rouge = down).<br/>
  • Rectangles superposés = <strong>PriceMove</strong>s, dimensionnés en <code>priceRange × timeRange</code>.<br/>
  • Couleur de contour : vert <em>growing</em>, orange <em>reference</em>, gris <em>archived</em>.<br/>
  • Remplissage léger : bleu si <em>up</em>, rouge si <em>down</em>.<br/>
  • Étiquette de chaque rectangle : <code>r=&lt;rang&gt; &lt;id8&gt;</code>.<br/>
  • Ligne pointillée violette : <code>currentReferenceLevel</code> du PriceMove de rang max.
</div>
${cards.join("\n")}
</body>
</html>
`
}

// ────────────────────────────────────────────────────────────── Main ──────

function main(): void {
  const fixturePath = resolve(
    REPO_ROOT,
    "packages/core/src/__fixtures__/eurusd-5m.json"
  )
  const fixture: FixtureFile = JSON.parse(readFileSync(fixturePath, "utf-8"))
  const candles = fixture.candles.slice(0, N)
  const candleStep =
    candles.length >= 2
      ? candles[1]!.openTime - candles[0]!.openTime
      : 300000

  console.log(`Rendering ${N} étapes from ${fixturePath}`)

  for (let i = 1; i <= candles.length; i++) {
    const sliced = candles.slice(0, i)
    const svg = renderStep(i, candles.length, sliced, candleStep)
    const file = resolve(OUT_DIR, `step-${pad(i)}.svg`)
    writeFileSync(file, svg)
    console.log(`  ✓ ${file}`)
  }

  const indexPath = resolve(OUT_DIR, "index.html")
  writeFileSync(indexPath, renderIndexHtml(candles.length))
  console.log(`  ✓ ${indexPath}`)

  console.log(`\nOuvrir : file://${indexPath}`)
}

main()
