import { PriceMove } from "../../domain/price-move/PriceMove"
import * as fs from "fs"
import * as path from "path"

export class PriceMoveLoggerFile {
    private static logDir: string = "./logs"
    private static logFile: string = "price-move.log"

    public static setLogDirectory(dir: string): void {
        this.logDir = dir
        fs.mkdirSync(this.logDir, { recursive: true })
    }

    private static writeToFile(message: string): void {
        const fullPath = path.join(this.logDir, this.logFile)
        fs.appendFileSync(fullPath, message + "\n")
    }

    public static logNewMove(move: PriceMove): void {
        const msg = `[New] ${move.id.toString()} | ${move.polarity} | ${move.priceRange.toString()} | ${move.timeRange.toString()}`
        console.log(msg)
        this.writeToFile(msg)
    }

    public static logClosure(move: PriceMove): void {
        const msg = `[Closed] ${move.id.toString()} | Final range: ${move.priceRange.toString()}`
        console.log(msg)
        this.writeToFile(msg)
    }

    public static logAttachment(child: PriceMove, parent: PriceMove): void {
        const msg = `🔗 ${child.id.toString()} rattaché à ${parent.id.toString()} (englobement)`
        console.log(msg)
        this.writeToFile(msg)
    }
} 
