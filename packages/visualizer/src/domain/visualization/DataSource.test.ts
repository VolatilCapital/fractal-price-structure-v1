import { describe, it, expect } from 'vitest'
import {
  DATA_SOURCES,
  DEFAULT_DATA_SOURCE_ID,
  findDataSource,
  getDefaultDataSource,
} from './DataSource.js'

describe('DataSource', () => {
  it('should have at least one data source', () => {
    expect(DATA_SOURCES.length).toBeGreaterThan(0)
  })

  it('should find a data source by id', () => {
    const source = findDataSource('eurusd-5m')
    expect(source).toBeDefined()
    expect(source!.symbol).toBe('EURUSD')
  })

  it('should return undefined for unknown id', () => {
    expect(findDataSource('unknown')).toBeUndefined()
  })

  it('should return the default data source', () => {
    const source = getDefaultDataSource()
    expect(source.id).toBe(DEFAULT_DATA_SOURCE_ID)
  })

  it('each data source should have required fields', () => {
    for (const source of DATA_SOURCES) {
      expect(source.id).toBeTruthy()
      expect(source.label).toBeTruthy()
      expect(source.fixturePath).toMatch(/^\/fixtures\//)
      expect(source.symbol).toBeTruthy()
      expect(source.interval).toBeTruthy()
    }
  })
})
