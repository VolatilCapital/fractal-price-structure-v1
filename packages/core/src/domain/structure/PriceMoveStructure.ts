import type { PriceMove } from "../price-move/PriceMove.js"
import type { PriceMoveRepository } from "./PriceMoveRepository.js"
import { PriceMoveRules } from "../price-move/PriceMoveRules.js"

export class PriceMoveStructure {
  private activeMoves: Set<PriceMove> = new Set()

  constructor(
    private readonly repo: PriceMoveRepository
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

    // This move extends nothing: it becomes a new root
    this.activeMoves.add(priceMove)
    this.repo.save(priceMove)

    // Check if it's englobed by an existing larger move
    for (const potentialParent of this.repo.findAll()) {
      if (
        potentialParent !== priceMove &&
        potentialParent.timeRange.includes(priceMove.timeRange.start) &&
        potentialParent.timeRange.includes(priceMove.timeRange.end) &&
        potentialParent.priceRange.contains(priceMove.priceRange)
      ) {
        priceMove.englobingMove = potentialParent
        potentialParent.childMoves.push(priceMove)
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
