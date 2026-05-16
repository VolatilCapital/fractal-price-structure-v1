# Architecture Decision Records

Ce dossier rassemble les décisions techniques **à trancher par l'auteur du projet**. Chaque ADR documente :

- Le **contexte** (ce qui est observé dans le code et la spec aujourd'hui).
- Les **options** considérées avec leurs conséquences.
- L'**état** : `Proposed` (en attente d'arbitrage) | `Accepted` (tranché) | `Rejected` | `Superseded`.

Ces ADRs ont été produits par l'audit BMAD du 2026-05-16. Tant qu'ils sont en `Proposed`, le code peut continuer à fonctionner selon le statu quo — mais chaque ADR identifie un écart entre la spec (`protocole-construction.md`) et l'implémentation qui mérite une décision explicite.

## Index

| ADR | Sujet | État |
|-----|-------|------|
| [ADR-001](./ADR-001-reference-to-archived-transition.md) | Transition automatique `Reference → Archived` lors de la terminaison du parent | **Accepted (opt-in)** |
| [ADR-002](./ADR-002-engulfing-candle-promotion.md) | Bougie englobante : nouvelle structure orpheline ou attachée au parent (promotion §12.4) | **Accepted** |
| [ADR-003](./ADR-003-noise-filtering.md) | Filtrage du bruit / définition d'un mouvement significatif | **Accepted** |
| [ADR-004](./ADR-004-impulsion-correction-terminology.md) | Statut de "Impulsion / Correction" dans le protocole | **Accepted** |
| [ADR-005](./ADR-005-export-json-schema.md) | Schéma JSON exporté (champs `originIds` zombies) | **Accepted** |
| [ADR-006](./ADR-006-legacy-src-root.md) | Sort du dossier `/src/` racine pré-monorepo | **Accepted** |
| [ADR-007](./ADR-007-rang-formula.md) | Formule du `rang` : compter ou non les extensions de même polarité | **Accepted** |

## Convention

Format ADR minimal (inspiré de Michael Nygard) :

```
# ADR-NNN — Titre court

## État
Proposed | Accepted | Rejected | Superseded by ADR-XXX

## Contexte
(2–6 lignes — ce qu'on observe aujourd'hui)

## Options
### A. Statu quo
- Conséquences positives / négatives

### B. Alternative 1
- ...

### C. Alternative 2
- ...

## Recommandation
(Préférence de l'auditeur, avec justification courte. L'utilisateur peut diverger.)

## Conséquences si tranché
(Ce qui change concrètement dans le code et la doc si une option est retenue.)
```
