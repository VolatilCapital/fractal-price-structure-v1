# ADR-004 — Statut de "Impulsion / Correction" dans le protocole

## État
Accepted (2026-05-16) — Option C appliquée : champ `correction` renommé en `breakingMove`, helpers `isImpulsion()` / `isCorrection()` ajoutés sur PriceMove. Compat preserved via getter/setter `correction`.

## Contexte

L'audit documentation a révélé que :

- Le **protocole** (`protocole-construction.md`) définit seulement deux primitives : **Mouvement Haussier** et **Mouvement Baissier**. Tout est dérivé de ces deux types via les règles de dépassement / cassure.
- La **spécification fractale** (`specification-fractale.md` §4) introduit les termes **Impulsion** et **Correction** comme « *Trading terminology* », sans axiome fondamental — c'est une **couche terminologique** importée de l'analyse Elliott Wave.
- Le **code** ne mentionne ni `impulsion` ni `correction` comme primitive. Le champ `correction` sur `PriceMove` désigne uniquement « le candidat qui a cassé cette structure » (cf. `PriceMoveStructure.ts:214`, `terminate` flow). Sémantique de débordement, pas Elliott Wave.

**Risque** : un consommateur qui lit `specification-fractale.md` croit que Impulsion/Correction sont des classifications algorithmiques produites par le système. Or elles sont absentes de l'API. Cela crée une attente non satisfaite et obscurcit le contrat réel.

## Options

### A. Statu quo — terminologie informelle dans `specification-fractale.md`
- ❌ Confusion persistante entre primitive protocole et couche terminologique trading.
- ❌ Le champ `correction` du code a une sémantique différente du terme "correction" trading.

### B. Retirer Impulsion / Correction du protocole et de la spec
- Garder seulement Mouvement Up/Down + sub-structures + rang.
- ✅ Cohérence parfaite spec-code.
- ❌ Perte d'un vocabulaire trading utile pour discuter avec des utilisateurs métier.

### C. Conserver Impulsion / Correction mais formaliser comme **couche analytique dérivée**
- Définir clairement dans la doc que :
  - **Impulsion** = un mouvement Up ou Down dont au moins une sub-structure est dans le sens principal et étend la borne directionnelle.
  - **Correction** = un mouvement opposé au mouvement parent, contenu dans le `currentReferenceLevel` du parent.
- Exposer optionnellement `move.isImpulsion()` / `move.isCorrection()` comme helpers dérivés (jamais des champs persistés).
- ✅ Vocabulaire trading préservé.
- ✅ Sémantique claire : c'est une lecture analytique, pas un état primaire.
- ⚠️ Le champ existant `correction: PriceMove` doit être renommé pour éviter la confusion (proposition : `breakingMove` ou `terminatingMove`).

### D. Renommer le champ `correction` sans toucher au reste
- Renommer `correction` → `breakingMove` partout dans le code et l'export JSON.
- ✅ Élimine l'ambiguïté.
- ❌ Breaking change pour les consommateurs existants de l'API ou des exports.
- ❌ Ne traite pas le fond (Impulsion/Correction comme termes).

## Recommandation

**Option C** : conserver le vocabulaire Impulsion/Correction comme couche analytique dérivée, en le formalisant dans la doc. **Renommer le champ `correction` en `breakingMove`** pour libérer le terme. C'est la combinaison qui apporte le plus de clarté.

Ordre d'application suggéré :

1. Renommer `correction` → `breakingMove` (avec getter `correction` déprécié pour back-compat, comme on l'a fait pour childMoves/englobingMove).
2. Ajouter `move.isImpulsion()` / `move.isCorrection()` comme helpers (TBD : règle exacte à co-écrire avec l'auteur).
3. Mettre à jour `specification-fractale.md` et `protocole-construction.md` pour expliciter que Impulsion/Correction sont **lus** sur la structure produite par le protocole, pas **produits** par lui.

## Conséquences si tranché

- **Code** : nouveau champ `breakingMove` sur `PriceMove`. `correction` reste comme getter déprécié pendant N versions.
- **Tests** : tests existants utilisant `move.correction` continuent de passer (via le getter déprécié).
- **Doc** : section "Vocabulaire dérivé" ajoutée dans `specification-fractale.md`.
- **Export JSON** : conserver `correction` dans le schéma pour compat, ajouter `breakingMove` en miroir, marquer `correction` deprecated dans `data-models.md`.

## Lien

- ADR-002 dépend implicitement du nom du champ. Si l'option C est retenue ici, mettre à jour ADR-002 pour parler de `breakingMove` au lieu de `correction`.
