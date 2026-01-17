/**
 * Candle domain module - Single source of truth for candle data structure.
 *
 * All candle-related imports should come from this location.
 */
export type { Candle, CandleValidationResult } from "./Candle.js"
export { isCandle, validateCandle } from "./Candle.js"
export { CandleFactory, InvalidCandleError } from "./CandleFactory.js"
export type { CandleRepository } from "./CandleRepository.js"
