import * as fs from 'node:fs';
import * as path from 'node:path';
import type { PriceMove } from '../../domain/price-move/PriceMove.js';

export class PriceMoveLoggerFile {
  private static logDir: string = './logs';
  private static logFile: string = 'price-move.log';

  public static setLogDirectory(dir: string): void {
    PriceMoveLoggerFile.logDir = dir;
    fs.mkdirSync(PriceMoveLoggerFile.logDir, { recursive: true });
  }

  private static writeToFile(message: string): void {
    const fullPath = path.join(PriceMoveLoggerFile.logDir, PriceMoveLoggerFile.logFile);
    fs.appendFileSync(fullPath, `${message}\n`);
  }

  public static logNewMove(move: PriceMove): void {
    const msg = `[New] ${move.id.toString()} | ${move.polarity} | ${move.priceRange.toString()} | ${move.timeRange.toString()}`;
    console.log(msg);
    PriceMoveLoggerFile.writeToFile(msg);
  }

  public static logClosure(move: PriceMove): void {
    const msg = `[Closed] ${move.id.toString()} | Final range: ${move.priceRange.toString()}`;
    console.log(msg);
    PriceMoveLoggerFile.writeToFile(msg);
  }

  public static logAttachment(child: PriceMove, parent: PriceMove): void {
    const msg = `🔗 ${child.id.toString()} rattaché à ${parent.id.toString()} (englobement)`;
    console.log(msg);
    PriceMoveLoggerFile.writeToFile(msg);
  }
}
