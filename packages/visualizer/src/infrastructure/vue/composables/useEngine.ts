/**
 * Reactive wrapper for FractalEngine with computed moves at cursor time.
 * Supports switching between data sources dynamically.
 */
import { ref, shallowRef } from 'vue'
import type { Candle, FractalEngine } from '@fractal-price-structure/core'
import { FractalEngine as FractalEngineClass } from '@fractal-price-structure/core'
import type { StructureEvent, DataSource } from '../../../domain/index.js'
import { getDefaultDataSource } from '../../../domain/index.js'
import { loadCandles } from '../../../application/index.js'
import { JsonCandleLoader } from '../../loaders/JsonCandleLoader.js'

export function useEngine() {
  const candles = shallowRef<Candle[]>([])
  const engine = shallowRef<FractalEngine | null>(null)
  const events = shallowRef<StructureEvent[]>([])
  const isLoading = ref(true)
  const error = ref<string | null>(null)
  const currentSource = shallowRef<DataSource>(getDefaultDataSource())

  async function load(source?: DataSource) {
    isLoading.value = true
    error.value = null

    const dataSource = source ?? currentSource.value
    currentSource.value = dataSource

    try {
      const loader = new JsonCandleLoader(dataSource.fixturePath)
      const result = await loadCandles({
        candleLoader: loader,
        engineFactory: () => new FractalEngineClass({ deterministic: true }),
      })

      candles.value = result.candles
      engine.value = result.engine
      events.value = result.events
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('Failed to load candles:', e)
    } finally {
      isLoading.value = false
    }
  }

  return {
    candles,
    engine,
    events,
    isLoading,
    error,
    currentSource,
    load,
  }
}
