# ADR-005 — Schéma JSON exporté (champs zombies `originIds`)

## État
Proposed

## Contexte

L'audit du sous-agent de régénération doc a observé :

> `FractalLayerExporter` lit toujours `origin`/`confirmedOrigins`, getters dépréciés. `origin` retourne toujours `[]` car le champ a été supprimé du domaine. L'export contient donc un champ `originIds: []` permanent.

Vérification (à confirmer dans `packages/core/src/infrastructure/exporters/FractalLayerExporter.ts`) : le schéma de sortie JSON publie des clés `originIds` et `confirmedOriginIds` qui sont **toujours des tableaux vides**, car les getters sous-jacents (`PriceMove.origin`, `PriceMove.confirmedOrigins`) sont des shims qui ont survécu au refactor mais ne sont plus alimentés.

**Conséquence** : tout consommateur du JSON exporté (visualizer, tests d'intégration, scripts d'analyse externe) reçoit des champs trompeurs. Soit ils les ignorent (et le schéma est pollué), soit ils s'en servent (et obtiennent des données fausses).

## Options

### A. Statu quo — préserver les champs zombies
- ❌ Schéma de sortie incohérent avec le modèle interne.
- ❌ Confusion documentée.

### B. Supprimer `originIds` / `confirmedOriginIds` du schéma
- ✅ Schéma propre.
- ❌ **Breaking change** si un consommateur externe lit ces clés.
- À mitiger : aujourd'hui ces clés sont toujours `[]`, donc retirer ne change rien à la sémantique observable.

### C. Remplacer par des champs utiles
- Remplacer `originIds: []` par `subStructureIds: [<ids>]` et `parentStructureId: <id|null>`.
- Ajouter `currentReferenceLevel`, `rang`, `degre`, `state` (déjà partiellement présents).
- ✅ Schéma exprime la vérité interne.
- ❌ Toujours un breaking change ; les consommateurs doivent migrer.

### D. Versionner le schéma
- Garder l'export legacy comme `v0` (avec `originIds: []` zombies, schémas connus).
- Exposer `FractalLayerExporter.exportV1(...)` avec le nouveau schéma propre.
- ✅ Zero breaking change.
- ❌ Maintient le bruit dans le code.

## Recommandation

**Option C (remplacer)**, car le risque de casser un consommateur externe est faible : les champs zombies sont toujours `[]`, donc tout consommateur sérieux les ignore déjà. Le breaking change est nominal.

Action concrète :

1. Lire `FractalLayerExporter.ts` et `PriceMoveExporter.ts` pour cartographier exactement les clés émises.
2. Définir un nouveau schéma documenté dans `data-models.md` (section "Exported JSON Schema").
3. Modifier les exporters pour produire ce schéma.
4. Ajouter un test snapshot du JSON pour les deux fixtures.

## Conséquences si tranché

- **Code** : `FractalLayerExporter` et `PriceMoveExporter` ne lisent plus `origin`/`confirmedOrigins`. Suppression possible de ces getters dépréciés (une fois zero consommateur identifié).
- **Doc** : `data-models.md` documente le schéma de sortie exact (clé par clé).
- **Test** : snapshot test (`expect(exportToJson()).toMatchSnapshot()`) pour figer le contrat.
- **Visualizer** : si le visualizer lit ces JSON, vérifier qu'il s'adapte. (Probablement non — il consomme l'in-memory engine, pas le JSON.)
