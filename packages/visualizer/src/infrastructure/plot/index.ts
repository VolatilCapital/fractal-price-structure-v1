/**
 * Observable Plot mark factories.
 * Pure functions with no Vue dependencies.
 */
export { createCandlestickMarks, type CandlestickMarkOptions } from './CandlestickMark.js'
export {
  createPriceMoveMarks,
  createParentChildLinkMarks,
  getStateColor,
  filterMoves,
  type PriceMoveMarkOptions,
} from './PriceMoveMark.js'
export { createTimeCursorMark, type TimeCursorMarkOptions } from './TimeCursorMark.js'
export {
  createFractalLayersMarks,
  prepareFractalLayersData,
  computeLayersChartHeight,
  type FractalLayersMarkOptions,
} from './FractalLayersMark.js'
export {
  createEventHighlightMarks,
  getActiveEvents,
  eventOpacity,
  type EventHighlightOptions,
} from './EventHighlightMark.js'
export {
  getVisibleCandles,
  getVisibleMoves,
  getOptimizationLevel,
  getFullDataRange,
  type OptimizationResult,
} from './ChartOptimizer.js'
