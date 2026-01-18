/**
 * Reactive wrapper for FractalEngine with computed moves at cursor time.
 */
import { ref, shallowRef } from 'vue'
import type { Candle, FractalEngine } from '@fractal-price-structure/core'
import { FractalEngine as FractalEngineClass } from '@fractal-price-structure/core'
import type { StructureEvent } from '../../../domain/index.js'
import { loadCandles } from '../../../application/index.js'
import { JsonCandleLoader } from '../../loaders/JsonCandleLoader.js'

export function useEngine() {
  const candles = shallowRef<Candle[]>([])
  const engine = shallowRef<FractalEngine | null>(null)
  const events = shallowRef<StructureEvent[]>([])
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  async function load() {
    isLoading.value = true
    error.value = null

    try {
      const loader = new JsonCandleLoader('/fixtures/btcusdt-1d.json')
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
    load,
  }
}
