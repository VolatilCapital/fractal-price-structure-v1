import { PriceMove } from "../price-move/PriceMove.js"
import { PriceMoveRepository } from "./PriceMoveRepository.js"
import { PriceMoveRules } from "../price-move/PriceMoveRules.js"
import { PriceMoveLoggerFile } from "../../infrastructure/adapters/PriceMoveLoggerFile.js"

export class PriceMoveStructure {
  private activeMoves: Set<PriceMove> = new Set()

  constructor(
    private readonly repo: PriceMoveRepository,
    private readonly logger: typeof PriceMoveLoggerFile = PriceMoveLoggerFile
  ) { }

  public add(priceMove: PriceMove): void {
    for (const active of this.activeMoves) {
      if (PriceMoveRules.canExtendWith(active, priceMove)) {
        active.tryExtendWith(priceMove)
        this.repo.save(priceMove)
        return
      }

      if (PriceMoveRules.isInvalidatedBy(active, priceMove)) {
        active.tryExtendWith(priceMove)
        this.activeMoves.delete(active)
      }
    }

    // Ce move ne prolonge rien : il devient une nouvelle racine
    this.activeMoves.add(priceMove)
    this.repo.save(priceMove)

    // Vérifie s'il est englobé par un move plus large déjà existant
    for (const potentialParent of this.repo.findAll()) {
      if (
        potentialParent !== priceMove &&
        potentialParent.timeRange.includes(priceMove.timeRange.start) &&
        potentialParent.timeRange.includes(priceMove.timeRange.end) &&
        potentialParent.priceRange.contains(priceMove.priceRange)
      ) {
        priceMove.englobingMove = potentialParent
        potentialParent.childMoves.push(priceMove)

        this.logger.logAttachment(priceMove, potentialParent)
        break
      }
    }
  }

  public getActiveMoves(): PriceMove[] {
    return this.repo.findActive()
  }

  public getAllMoves(): PriceMove[] {
    return this.repo.findAll()
  }
}
