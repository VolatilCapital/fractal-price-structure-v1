/**
 * Data source configuration for the visualizer.
 * Pure domain type - no infrastructure imports.
 */

export interface DataSource {
  /** Unique identifier */
  readonly id: string
  /** Human-readable label */
  readonly label: string
  /** Path to fixture JSON file */
  readonly fixturePath: string
  /** Symbol being tracked */
  readonly symbol: string
  /** Timeframe interval */
  readonly interval: string
}

/** Available data sources */
export const DATA_SOURCES: readonly DataSource[] = [
  {
    id: 'eurusd-5m',
    label: 'EURUSD 5m',
    fixturePath: '/fixtures/eurusd-5m.json',
    symbol: 'EURUSD',
    interval: '5m',
  },
  {
    id: 'btcusdt-1d',
    label: 'BTCUSDT 1D',
    fixturePath: '/fixtures/btcusdt-1d.json',
    symbol: 'BTCUSDT',
    interval: '1D',
  },
] as const

export const DEFAULT_DATA_SOURCE_ID = 'eurusd-5m'

export function findDataSource(id: string): DataSource | undefined {
  return DATA_SOURCES.find((ds) => ds.id === id)
}

export function getDefaultDataSource(): DataSource {
  const source = findDataSource(DEFAULT_DATA_SOURCE_ID)
  if (!source) {
    throw new Error(`Default data source '${DEFAULT_DATA_SOURCE_ID}' not found`)
  }
  return source
}
