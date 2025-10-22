import { writeFileSync, mkdirSync, existsSync } from "fs"
import { join } from "path"
import { FractalLayer } from "../../domain/structure/FractalLayer"

export class FractalLayerExporter {
  public static exportLayersToJson(layers: FractalLayer[], baseDir: string): void {
    const exportDir = join(baseDir, "fractal-layers")
    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true })
    }

    for (const layer of layers) {
      const exportData = layer.moves.map(m => ({
        id: m.id.toString(),
        polarity: m.polarity,
        state: m.state,
        priceRange: { low: m.priceRange.low, high: m.priceRange.high },
        timeRange: { start: m.timeRange.start, end: m.timeRange.end },
        originIds: m.origin.map(o => o.id.toString()),
        confirmedOriginIds: m.confirmedOrigins.map(o => o.id.toString())
      }))

      const filePath = join(exportDir, `layer-${layer.level}.json`)
      writeFileSync(filePath, JSON.stringify(exportData, null, 2), "utf-8")
    }
  }
}
