import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FractalLayer } from '../../domain/structure/FractalLayer.js';

/**
 * Exports fractal layers to per-rang JSON files.
 *
 * Schema (ADR-005, accepted 2026-05-16):
 *   id: string
 *   polarity: "up" | "down"
 *   state: "growing" | "reference" | "archived"
 *   rang: number              // bottom-up complexity depth
 *   rangContrasted: number    // depth counting only opposite-polarity sub-structures (ADR-007)
 *   degre?: number            // top-down hierarchy position (assigned on terminate)
 *   priceRange: { low: number, high: number }
 *   timeRange: { start: number, end: number }
 *   currentReferenceLevel: number   // dynamic invalidation threshold (protocole §3.3)
 *   parentStructureId?: string
 *   subStructureIds: string[]
 *   breakingMoveId?: string         // candidate that terminated this structure (ADR-004)
 *
 * The legacy `originIds` / `confirmedOriginIds` fields are no longer written
 * — they were always [] in practice (see ADR-005 for the audit trail).
 */
export class FractalLayerExporter {
  public static exportLayersToJson(layers: FractalLayer[], baseDir: string): void {
    const exportDir = join(baseDir, 'fractal-layers');
    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true });
    }

    for (const layer of layers) {
      const exportData = layer.moves.map((m) => ({
        id: m.id.toString(),
        polarity: m.polarity,
        state: m.state,
        rang: m.rang,
        rangContrasted: m.rangContrasted,
        degre: m.degre,
        priceRange: { low: m.priceRange.low, high: m.priceRange.high },
        timeRange: { start: m.timeRange.start, end: m.timeRange.end },
        currentReferenceLevel: m.currentReferenceLevel,
        parentStructureId: m.parentStructure?.id.toString(),
        subStructureIds: m.subStructures.map((s) => s.id.toString()),
        breakingMoveId: m.breakingMove?.id.toString(),
      }));

      const filePath = join(exportDir, `layer-${layer.level}.json`);
      writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
    }
  }
}
