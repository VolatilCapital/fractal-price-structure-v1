/**
 * @fractal-price-structure/core
 *
 * Core library for building generation-based fractal price structures from candlestick data.
 *
 * @packageDocumentation
 */

export const VERSION = '1.0.0';

// Main entry point - Facade
export { FractalEngine, type FractalEngineOptions } from './FractalEngine.js';

// Domain exports
export { PriceMove } from './domain/price-move/PriceMove.js';
export { Polarity } from './domain/price-move/Polarity.js';
export { PriceMoveState } from './domain/price-move/PriceMoveState.js';
export { PriceMoveId } from './domain/price-move/PriceMoveId.js';
export { PriceMoveFactory } from './domain/price-move/PriceMoveFactory.js';
export {
  PriceMoveStructure,
  CandleIngestionError,
  type CandleResult,
  type BatchIngestionResult,
} from './domain/structure/PriceMoveStructure.js';
export type { FractalLayer } from './domain/structure/FractalLayer.js';

// Shared types
export { PriceRange } from './shared/PriceRange.js';
export { TimeRange } from './shared/TimeRange.js';
export { Price } from './shared/Price.js';

// Candle domain - single source of truth
export type { Candle, CandleValidationResult } from './domain/candle/index.js';
export { isCandle, validateCandle, CandleFactory, InvalidCandleError } from './domain/candle/index.js';

// Application use cases
export { BuildPriceMovesFromCandles } from './application/use-cases/BuildPriceMovesFromCandles.js';
export { buildRecursiveFractalRoots } from './application/use-cases/BuildRecursiveFractal.js';

// Logging
export type { Logger } from './application/ports/Logger.js';
export { NoopLogger, noopLogger } from './application/ports/Logger.js';
export { ConsoleLogger } from './infrastructure/logging/ConsoleLogger.js';
