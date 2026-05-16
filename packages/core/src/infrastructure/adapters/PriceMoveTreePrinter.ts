import { DateTime } from 'luxon';
import type { PriceMove } from '../../domain/price-move/PriceMove.js';

export class PriceMoveTreePrinter {
  public static print(move: PriceMove, level = 0): void {
    const indent = '  '.repeat(level);
    const status = move.isClosed() ? '🔴' : '🟢';

    const start = DateTime.fromMillis(move.timeRange.start).toFormat('yyyy-MM-dd HH:mm');
    const end = DateTime.fromMillis(move.timeRange.end).toFormat('yyyy-MM-dd HH:mm');

    console.log(
      `${indent}${status} ${move.id.toString()} | ${move.polarity} | ${move.priceRange.toString()} | ${start} → ${end}`,
    );

    for (const child of move.subStructures) {
      PriceMoveTreePrinter.print(child, level + 1);
    }
  }
}
