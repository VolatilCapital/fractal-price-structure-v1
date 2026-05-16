import { Polarity } from "./Polarity.js"
import { PriceMoveState } from "./PriceMoveState.js"
import type { PriceMoveId } from "./PriceMoveId.js"
import type { PriceRange } from "../../shared/PriceRange.js"
import type { TimeRange } from "../../shared/TimeRange.js"
import type { ReferenceLevel } from "./ReferenceLevel.js"
import { Price } from "../../shared/Price.js"

/**
 * Résultat du traitement d'un candidat par processCandidate.
 * - 'extended-boundary': Le candidat a cassé la borne directionnelle (extension vraie)
 * - 'extended-internal': Le candidat est interne (ne casse aucune borne)
 * - 'broken': Le candidat a cassé la borne opposée (invalidation)
 */
export type CandidateResult = "extended-boundary" | "extended-internal" | "broken"

export class PriceMove {
  readonly id: PriceMoveId
  public timeRange: TimeRange
  public priceRange: PriceRange
  public polarity: Polarity
  public state: PriceMoveState = PriceMoveState.Growing

  /** Rang: profondeur dans la hiérarchie fractale (0 pour les racines) */
  public rang: number

  /**
   * Rang contrasted (ADR-007): profondeur d'imbrication fractale ne comptant
   * que les sub-structures de POLARITÉ OPPOSÉE (= corrections imbriquées).
   * Reflète l'invariant fractal au sens du protocole §5.3, sans inflation par
   * les extensions homopolarisées.
   *   = 0 si aucune sub-structure
   *   = max(sub.rangContrasted pour sub de polarité opposée) + 1
   *   = max(sub.rangContrasted) sans incrément si toutes les subs sont même polarité
   */
  public rangContrasted: number = 0

  /** Degré: calculé à la terminaison, représente la complexité de la sous-structure */
  public degre?: number

  /** Timestamp when this move was terminated (Growing → Reference) */
  public terminatedAt?: number

  /** Timestamp when this move was archived (Reference → Archived) */
  public archivedAt?: number

  /** Sous-structures fractales contenues dans ce mouvement */
  public subStructures: PriceMove[] = []

  /** Structure parente qui contient ce mouvement */
  public parentStructure?: PriceMove

  /** Niveaux de référence (pivots) créés par cette structure */
  public referenceLevels: ReferenceLevel[] = []

  /** Structure de correction opposée créée lors de la cassure */
  public correction?: PriceMove

  /**
   * Niveau de référence actuel pour la détection d'invalidation.
   * C'est la borne opposée du dernier brin d'extension (protocole section 3.3).
   * - Pour un mouvement Up: le LOW du dernier brin d'extension
   * - Pour un mouvement Down: le HIGH du dernier brin d'extension
   *
   * Initialisé à la borne opposée de la structure à la création,
   * puis mis à jour à chaque extension de frontière.
   */
  public currentReferenceLevel: number

  constructor(params: {
    id: PriceMoveId
    timeRange: TimeRange
    priceRange: PriceRange
    polarity: Polarity
    rang?: number
  }) {
    this.id = params.id
    this.timeRange = params.timeRange
    this.priceRange = params.priceRange
    this.polarity = params.polarity
    this.rang = params.rang ?? 0

    // Initialize reference level to opposite bound (protocole section 3.1)
    // Up move: reference = low (opposite to directional bound which is high)
    // Down move: reference = high (opposite to directional bound which is low)
    this.currentReferenceLevel = params.polarity === Polarity.Up
      ? params.priceRange.low
      : params.priceRange.high
  }

  /**
   * Traite un candidat pour déterminer s'il étend ou casse cette structure.
   *
   * Trois issues possibles:
   * - 'extended-boundary': Le candidat casse la frontière directionnelle (vraie extension)
   * - 'extended-internal': Le candidat est interne (ne casse aucune frontière)
   * - 'broken': Le candidat casse le niveau de référence (invalidation)
   *
   * IMPORTANT (protocole section 3.3): L'invalidation se vérifie contre le
   * currentReferenceLevel (borne opposée du dernier brin d'extension), pas
   * contre la borne globale de la structure.
   */
  public processCandidate(candidate: PriceMove): CandidateResult {
    if (this.state !== PriceMoveState.Growing) {
      // Une structure non-Growing ne peut pas être étendue
      return "broken"
    }

    const priceToTest =
      this.polarity === Polarity.Up
        ? candidate.priceRange.high
        : candidate.priceRange.low

    const borderToBreak =
      this.polarity === Polarity.Up
        ? this.priceRange.high
        : this.priceRange.low

    // Check for extension first (breaks directional boundary)
    if (
      (this.polarity === Polarity.Up && Price.gt(priceToTest, borderToBreak)) ||
      (this.polarity === Polarity.Down && Price.lt(priceToTest, borderToBreak))
    ) {
      // True extension: update price and time range
      this.priceRange = this.priceRange.extendWith(priceToTest)
      this.timeRange = this.timeRange.extendWith(candidate.timeRange.end)

      // Update reference level to the opposite bound of the extending candidate
      // (protocole section 3.3: "Le niveau de référence est toujours le dernier brin")
      this.currentReferenceLevel = this.polarity === Polarity.Up
        ? candidate.priceRange.low  // For Up: reference = low of extending move
        : candidate.priceRange.high // For Down: reference = high of extending move

      // Add reference level for the extending move
      this.#addReferenceLevel(candidate)

      return "extended-boundary"
    }

    // Check for break (invalidation - breaks reference level, NOT structure bounds)
    // Protocole section 3.2: "Si cassé [niveau de référence] → Terminaison"
    const invalidation =
      (this.polarity === Polarity.Up && Price.lt(candidate.priceRange.low, this.currentReferenceLevel)) ||
      (this.polarity === Polarity.Down && Price.gt(candidate.priceRange.high, this.currentReferenceLevel))

    if (invalidation) {
      return "broken"
    }

    // No boundary broken: internal movement
    return "extended-internal"
  }

  /**
   * Termine cette structure (Growing → Reference).
   * Appelé lors d'une cassure par un candidat.
   */
  public terminate(timestamp: number): void {
    if (this.state !== PriceMoveState.Growing) {
      return
    }
    this.state = PriceMoveState.Reference
    this.terminatedAt = timestamp
    this.#calculateDegre()
  }

  /**
   * Archive cette structure ET récursivement toutes ses sub-structures en
   * état Reference (protocole §13.3 : "Reference → Archived quand la
   * structure parente est terminée").
   *
   * Utilisé par PriceMoveStructure quand `autoArchive` est activé sur le
   * FractalEngine. Idempotent — appel sur un move déjà Archived est no-op.
   *
   * @param timestamp Horodatage de l'archivage.
   * @returns Le nombre de moves passés en Archived par cette opération.
   */
  public archiveReferenceDescendants(timestamp: number): number {
    let archived = 0
    for (const sub of this.subStructures) {
      if (sub.isReference()) {
        sub.archive(timestamp)
        archived++
      }
      // Récurser : un descendant peut lui aussi avoir des descendants Reference
      // (la cascade de terminaison peut avoir laissé plusieurs niveaux en Reference).
      archived += sub.archiveReferenceDescendants(timestamp)
    }
    return archived
  }

  /**
   * Archive cette structure (Reference → Archived).
   * Utilisé pour l'optimisation mémoire.
   */
  public archive(timestamp: number): void {
    if (this.state !== PriceMoveState.Reference) {
      return
    }
    this.state = PriceMoveState.Archived
    this.archivedAt = timestamp
  }

  /**
   * Recalcule le rang basé sur les sous-structures.
   * rang = max(subStructures.rang) + 1, ou 0 si pas de sous-structures.
   * Propage le recalcul vers les ancêtres (bottom-up).
   */
  public recalculateRang(): void {
    const oldRang = this.rang

    if (this.subStructures.length === 0) {
      this.rang = 0
    } else {
      const maxSubRang = Math.max(...this.subStructures.map(s => s.rang))
      this.rang = maxSubRang + 1
    }

    // Propagate to parent if rang changed
    if (this.rang !== oldRang && this.parentStructure) {
      this.parentStructure.recalculateRang()
    }
  }

  /**
   * Recalcule le rangContrasted (ADR-007) — profondeur d'imbrication par
   * sub-structure de polarité opposée. Propage vers le parent si la valeur
   * change.
   */
  public recalculateRangContrasted(): void {
    const oldValue = this.rangContrasted

    if (this.subStructures.length === 0) {
      this.rangContrasted = 0
    } else {
      const opposite = this.subStructures.filter(
        (s) => s.polarity !== this.polarity
      )
      if (opposite.length === 0) {
        // Pas de correction directe : on hérite du max des subs sans incrémenter
        this.rangContrasted = Math.max(
          ...this.subStructures.map((s) => s.rangContrasted)
        )
      } else {
        this.rangContrasted =
          Math.max(...opposite.map((s) => s.rangContrasted)) + 1
      }
    }

    if (this.rangContrasted !== oldValue && this.parentStructure) {
      this.parentStructure.recalculateRangContrasted()
    }
  }

  /**
   * Calcule le degré à la terminaison.
   * Le degré représente la position hiérarchique par rapport au parent.
   * degré(structure) = degré(parent) + 1
   * Les racines ont degré 0.
   *
   * Propage aussi le recalcul vers les sous-structures qui ont terminé
   * avant que ce parent n'ait son degré défini.
   */
  #calculateDegre(): void {
    if (this.parentStructure && this.parentStructure.degre !== undefined) {
      this.degre = this.parentStructure.degre + 1
    } else {
      // Root structure or parent not yet terminated
      this.degre = 0
    }

    // Propagate to terminated children that may have incorrect degre
    this.#propagateDegreToChildren()
  }

  /**
   * Propage le recalcul du degré vers les sous-structures terminées.
   * Nécessaire car les enfants peuvent terminer avant leur parent.
   */
  #propagateDegreToChildren(): void {
    if (this.degre === undefined) return
    const expectedDegre = this.degre + 1

    for (const child of this.subStructures) {
      if (child.state !== PriceMoveState.Growing && child.degre !== undefined) {
        // Child already terminated, recalculate its degre based on this parent
        if (child.degre !== expectedDegre) {
          child.degre = expectedDegre
          // Recursively propagate to grandchildren
          child.#propagateDegreToChildren()
        }
      }
    }
  }

  /**
   * Ajoute un niveau de référence basé sur le candidat qui a étendu la structure.
   */
  #addReferenceLevel(candidate: PriceMove): void {
    const level: ReferenceLevel = {
      price: this.polarity === Polarity.Up
        ? candidate.priceRange.high
        : candidate.priceRange.low,
      timestamp: candidate.timeRange.end,
      index: this.referenceLevels.length,
      move: candidate,
    }
    this.referenceLevels.push(level)
  }

  /**
   * Ajoute une sous-structure à ce mouvement.
   */
  public addSubStructure(sub: PriceMove): void {
    if (!this.subStructures.includes(sub)) {
      this.subStructures.push(sub)
      sub.parentStructure = this
      this.recalculateRang()
      this.recalculateRangContrasted()
    }
  }

  // ============================================
  // State Helpers
  // ============================================

  public isGrowing(): boolean {
    return this.state === PriceMoveState.Growing
  }

  public isReference(): boolean {
    return this.state === PriceMoveState.Reference
  }

  public isArchived(): boolean {
    return this.state === PriceMoveState.Archived
  }

  // ============================================
  // Legacy Compatibility (deprecated)
  // ============================================

  /**
   * @deprecated Use isGrowing() instead
   */
  public isActive(): boolean {
    return this.isGrowing()
  }

  /**
   * @deprecated Use isReference() or isArchived() instead
   */
  public isClosed(): boolean {
    return !this.isGrowing()
  }

  // Legacy property aliases for backward compatibility
  /**
   * @deprecated Use rang instead
   */
  public get generation(): number {
    return this.rang
  }

  public set generation(value: number) {
    this.rang = value
  }

  /**
   * @deprecated Use terminatedAt instead
   */
  public get closedAt(): number | undefined {
    return this.terminatedAt
  }

  public set closedAt(value: number | undefined) {
    this.terminatedAt = value
  }

  /**
   * @deprecated Use subStructures instead
   */
  public get childMoves(): PriceMove[] {
    return this.subStructures
  }

  public set childMoves(value: PriceMove[]) {
    this.subStructures = value
  }

  /**
   * @deprecated Use parentStructure instead
   */
  public get englobingMove(): PriceMove | undefined {
    return this.parentStructure
  }

  public set englobingMove(value: PriceMove | undefined) {
    this.parentStructure = value
  }

  /**
   * @deprecated No longer used - use referenceLevels instead
   */
  public get origin(): PriceMove[] {
    return []
  }

  public set origin(_value: PriceMove[]) {
    // No-op for backward compatibility
  }

  /**
   * @deprecated No longer used - use referenceLevels instead
   */
  public get confirmedOrigins(): PriceMove[] {
    return this.referenceLevels.map(r => r.move)
  }

  public set confirmedOrigins(_value: PriceMove[]) {
    // No-op for backward compatibility
  }

  /**
   * @deprecated Use processCandidate() instead
   */
  public tryExtendWith(candidate: PriceMove): boolean {
    const result = this.processCandidate(candidate)
    if (result === "broken") {
      this.terminate(candidate.timeRange.start)
      return false
    }
    // For backward compatibility: attach internal children only
    if (result === "extended-internal" && !this.subStructures.includes(candidate)) {
      this.addSubStructure(candidate)
    }
    return true
  }

  /**
   * Checks if this move was active at a specific timestamp.
   * A move was active at timestamp T if:
   * - The move had started (timeRange.start <= T)
   * - AND the move wasn't terminated yet (terminatedAt is undefined OR terminatedAt > T)
   *
   * @param timestamp - Unix timestamp in milliseconds
   * @returns true if the move was active at the given timestamp
   */
  public wasActiveAt(timestamp: number): boolean {
    // Move hadn't started yet
    if (this.timeRange.start > timestamp) {
      return false
    }
    // Move is still active (never terminated) or was terminated after the timestamp
    return this.terminatedAt === undefined || this.terminatedAt > timestamp
  }
}
