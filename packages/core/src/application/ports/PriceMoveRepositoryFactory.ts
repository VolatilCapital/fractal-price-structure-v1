import type { PriceMoveRepository } from "../../domain/structure/PriceMoveRepository.js"

/**
 * Port — factory for creating PriceMoveRepository instances.
 * Implementations live in the infrastructure layer.
 */
export type PriceMoveRepositoryFactory = () => PriceMoveRepository
