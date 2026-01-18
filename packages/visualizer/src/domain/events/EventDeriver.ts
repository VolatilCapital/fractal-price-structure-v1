/**
 * Service that derives structure events by comparing move states between candles.
 * Since FractalEngine doesn't emit events directly, we derive them by analyzing
 * the state changes of PriceMoves as candles are processed.
 *
 * Pure TypeScript - no Vue imports.
 */
import type { PriceMove, Candle, FractalEngine } from '@fractal-price-structure/core'
import { PriceMoveState } from '@fractal-price-structure/core'
import type { StructureEvent, EventType } from './StructureEvent.js'
import { createEventId } from './StructureEvent.js'

interface MoveSnapshot {
  id: string
  state: PriceMoveState
  rang: number
  degre?: number
  priceRange: { low: number; high: number }
  timeRange: { start: number; end: number }
  polarity: import('@fractal-price-structure/core').Polarity
}

function takeMoveSnapshot(move: PriceMove): MoveSnapshot {
  return {
    id: move.id.toString(),
    state: move.state,
    rang: move.rang,
    degre: move.degre,
    priceRange: {
      low: Number(move.priceRange.low),
      high: Number(move.priceRange.high),
    },
    timeRange: {
      start: move.timeRange.start,
      end: move.timeRange.end,
    },
    polarity: move.polarity,
  }
}

/**
 * Derive all structure events by replaying candles through a fresh engine
 * and comparing states after each candle.
 */
export function deriveEvents(
  candles: Candle[],
  engineFactory: () => FractalEngine
): StructureEvent[] {
  const events: StructureEvent[] = []
  const previousSnapshots = new Map<string, MoveSnapshot>()

  // Create a fresh engine for replay
  const engine = engineFactory()

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i]
    const candleTime = candle.openTime

    // Add this candle to the engine
    engine.addCandle(candle)

    // Get all moves after processing this candle
    const allMoves = engine.getAllMoves()
    const currentSnapshots = new Map<string, MoveSnapshot>()

    for (const move of allMoves) {
      const snapshot = takeMoveSnapshot(move)
      currentSnapshots.set(snapshot.id, snapshot)

      const previousSnapshot = previousSnapshots.get(snapshot.id)

      if (!previousSnapshot) {
        // CREATED: Move exists now but didn't exist before
        events.push(createEvent('Created', snapshot, move.timeRange.start))
      } else {
        // Check for state changes
        if (previousSnapshot.state === PriceMoveState.Growing && snapshot.state === PriceMoveState.Reference) {
          // TERMINATED: Was Growing, now Reference
          events.push(createEvent('Terminated', snapshot, move.terminatedAt ?? candleTime))
        } else if (previousSnapshot.state === PriceMoveState.Reference && snapshot.state === PriceMoveState.Archived) {
          // ARCHIVED: Was Reference, now Archived
          events.push(createEvent('Archived', snapshot, move.archivedAt ?? candleTime))
        } else if (
          previousSnapshot.state === PriceMoveState.Growing &&
          snapshot.state === PriceMoveState.Growing &&
          (previousSnapshot.priceRange.high !== snapshot.priceRange.high ||
            previousSnapshot.priceRange.low !== snapshot.priceRange.low)
        ) {
          // EXTENDED: Still Growing but price range changed
          events.push(createEvent('Extended', snapshot, candleTime))
        }
      }
    }

    // Update previous snapshots for next iteration
    previousSnapshots.clear()
    for (const [id, snapshot] of currentSnapshots) {
      previousSnapshots.set(id, snapshot)
    }
  }

  // Sort events by timestamp
  events.sort((a, b) => a.timestamp - b.timestamp)

  return events
}

function createEvent(
  eventType: EventType,
  snapshot: MoveSnapshot,
  timestamp: number
): StructureEvent {
  return {
    id: createEventId(eventType, snapshot.id, timestamp),
    timestamp,
    eventType,
    moveId: snapshot.id,
    rang: snapshot.rang,
    degre: snapshot.degre,
    polarity: snapshot.polarity,
    priceRange: snapshot.priceRange,
    timeRange: snapshot.timeRange,
  }
}

/**
 * Get events that occurred at or before a given timestamp.
 */
export function getEventsAtTime(events: StructureEvent[], timestamp: number): StructureEvent[] {
  return events.filter(e => e.timestamp <= timestamp)
}

/**
 * Get events that occurred after a given timestamp (for graying out).
 */
export function getFutureEvents(events: StructureEvent[], timestamp: number): StructureEvent[] {
  return events.filter(e => e.timestamp > timestamp)
}
