import { DateTime } from "luxon"
import type { PriceMove } from "../../domain/price-move/PriceMove.js"
import * as fs from "fs"
import * as path from "path"

export class PriceMoveTreeFilePrinter {
    private static logDir: string = "./logs"
    private static logFile: string = "price-move-tree.log"
    private static buffer: string[] = []

    public static setLogDirectory(dir: string): void {
        PriceMoveTreeFilePrinter.logDir = dir
        fs.mkdirSync(PriceMoveTreeFilePrinter.logDir, { recursive: true })
    }

    public static print(move: PriceMove, level = 0): void {
        const indent = "  ".repeat(level)
        const status = move.isClosed() ? "🔴" : "🟢"

        const start = DateTime.fromMillis(move.timeRange.start).toFormat("yyyy-MM-dd HH:mm")
        const end = DateTime.fromMillis(move.timeRange.end).toFormat("yyyy-MM-dd HH:mm")

        const line = `${indent}${status} ${move.id.toString()} | ${move.polarity} | ${move.priceRange.toString()} | ${start} → ${end}`
        console.log(line)
        PriceMoveTreeFilePrinter.buffer.push(line)

        for (const child of move.childMoves) {
            PriceMoveTreeFilePrinter.print(child, level + 1)
        }

        if (level === 0) {
            PriceMoveTreeFilePrinter.flushToFile()
        }
    }

    private static flushToFile(): void {
        const fullPath = path.join(PriceMoveTreeFilePrinter.logDir, PriceMoveTreeFilePrinter.logFile)
        fs.writeFileSync(fullPath, PriceMoveTreeFilePrinter.buffer.join("\n"))
        PriceMoveTreeFilePrinter.buffer = []
    }
}
