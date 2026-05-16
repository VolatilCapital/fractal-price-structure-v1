import { CachedCandleRepository } from "./infrastructure/repositories/CachedCandleRepository.js"
import { InMemoryPriceMoveRepository } from "./infrastructure/repositories/InMemoryPriceMoveRepository.js"
import { PriceMoveStructure } from "./application/orchestrator/PriceMoveStructure.js"
import { BuildPriceMovesFromCandles } from "./application/use-cases/BuildPriceMovesFromCandles.js"
import type { PriceMove } from "./domain/price-move/PriceMove.js"
import { PriceMoveLoggerFile } from "./infrastructure/adapters/PriceMoveLoggerFile.js"
import { PriceMoveTreeFilePrinter } from "./infrastructure/adapters/PriceMoveTreeFilePrinter.js"
import { buildRecursiveFractalRoots } from "./application/use-cases/BuildRecursiveFractal.js"
import { FractalLayerExporter } from "./infrastructure/exporters/FractalLayerExporter.js"
import type { FractalLayer } from "./domain/structure/FractalLayer.js"

async function main() {
  try {
    const symbol = "BTCUSDT"
    const interval = "1m"
    const limit = 10000
    const cacheDir = "./.cache"
    const logDir = "./.logs"

    // Configure loggers
    PriceMoveLoggerFile.setLogDirectory(logDir)
    PriceMoveTreeFilePrinter.setLogDirectory(logDir)

    // Chargement des bougies
    const candleRepo = new CachedCandleRepository(cacheDir)
    const candles = await candleRepo.getCandles(symbol, interval, limit)

    // Construction des PriceMoves initiaux
    const repository = new InMemoryPriceMoveRepository()
    const structure = new PriceMoveStructure(repository)
    const builder = new BuildPriceMovesFromCandles(structure)
    builder.build(candles)

    // Récupération des racines (sans parent)
    const roots = structure.getAllMoves().filter(m => !m.parentStructure)

    // 🌳 Affichage des racines
    console.log("\n🌳 Arbre fractal des PriceMoves (racines uniquement)\n")
    for (const root of roots) {
      PriceMoveTreeFilePrinter.print(root)
    }

    // 🌲 Profondeur fractale
    function getDepth(move: PriceMove): number {
      if (move.subStructures.length === 0) return 1
      return 1 + Math.max(...move.subStructures.map(getDepth))
    }

    const maxDepth = Math.max(...roots.map(getDepth))
    console.log(`\n🌲 Profondeur fractale maximale : ${maxDepth}\n`)

    const all = structure.getAllMoves()
    const withChildren = all.filter(m => m.subStructures.length > 0)
    console.log(`🔢 Moves avec enfants internes : ${withChildren.length} / ${all.length}`)

    // 🌐 Couches fractales récursives
    console.log("\n🌐 Couches fractales construites récursivement")
    const layers: FractalLayer[] = buildRecursiveFractalRoots(roots, 5)

    for (const layer of layers) {
      console.log(`\n🧬 Niveau ${layer.level} : ${layer.moves.length} PriceMoves`)
      for (const move of layer.moves) {
        PriceMoveTreeFilePrinter.print(move)
      }
    }

    // 💾 Export JSON des couches
    FractalLayerExporter.exportLayersToJson(layers, logDir)

  } catch (err) {
    console.error("❌ Erreur dans le main:", err)
  }
}

main()
