# Validation : Protocole de Construction vs Implémentation

Comparaison entre `docs/protocole-construction.md` (spécification) et le code source (`PriceMoveStructure.ts`, `PriceMove.ts`, `BuildPriceMovesFromCandles.ts`).

## 1. Règles du protocole NON implémentées

### 1.1 Transition Reference → Archived non automatique (Section 13.3)

Le protocole stipule que la transition **Reference → Archived** se déclenche quand la structure parente est elle-même terminée. L'implémentation ne fait jamais cette transition automatiquement — `archiveOrphanedStructures()` est une opération manuelle basée sur un timestamp, pas un déclenchement sémantique.

### 1.2 Promotion des sous-structures (Sections 5.3 et 12.5)

Le protocole décrit un mécanisme de "promotion" : quand une sous-structure interne B casse une borne de A, B et le mouvement cassant X deviennent des composantes directes de A. L'implémentation ne fait pas cette promotion. Dans `handleCascadeTermination()`, le parent est terminé et le mouvement cassant devient une nouvelle racine, mais les relations parent/enfant ne sont pas réassignées.

### 1.3 Distinction "en attente" vs "composante formelle" (Section 12.4)

Le protocole spécifie que `parent_id` est assigné au moment où la structure devient une composante formelle (quand elle casse une borne). Dans l'implémentation, `addSubStructure()` assigne immédiatement `parentStructure` dès qu'un mouvement est ajouté, sans distinction.

### 1.4 Récursion contextuelle (Section 4.3 et 9.3)

Le protocole décrit un traitement récursif où chaque structure a son propre contexte avec des niveaux relatifs (section 5.2). L'implémentation utilise `findDeepestGrowingStructure()` pour trouver la structure la plus profonde, mais ne crée pas de pile de contextes indépendants.

## 2. Divergences entre l'implémentation et le protocole

### 2.1 PriceMoveRules.isInvalidatedBy (deprecated)

Utilise `priceRange.low` / `priceRange.high` (bornes globales) au lieu du `currentReferenceLevel`. La méthode `processCandidate()` dans `PriceMove.ts` fait correctement la vérification avec `currentReferenceLevel`, mais `PriceMoveRules.isInvalidatedBy` est incohérente. Marquée deprecated mais toujours disponible.

### 2.2 Priorité extension vs invalidation

Dans `processCandidate()`, l'extension est vérifiée **avant** l'invalidation. Le cas englobant est intercepté en amont par `isEngulfingCandle()` dans `PriceMoveStructure.ts`. Architecture différente de la spec (qui décrit un test simultané des quatre cas) mais fonctionnellement correcte.

### 2.3 Bougie englobante simplifiée (Section 10)

Le protocole décrit un traitement séquentiel en deux étapes. L'implémentation simplifie : elle étend la structure avec le high (mutation directe de `priceRange`/`timeRange`) avant de la terminer avec le low, **sans** mettre à jour le `currentReferenceLevel` lors de l'extension intermédiaire, et sans ajouter de `referenceLevel`.

### 2.4 Cascade : extension du protocole

L'implémentation permet au parent survivant d'absorber le mouvement cassant (`extended-internal` ou `extended-boundary`), plutôt que de créer systématiquement une nouvelle racine. C'est une extension utile du protocole.

### 2.5 Propriété `correction`

Le code assigne `brokenStructure.correction = breakingMove`. Le protocole ne définit pas formellement cette propriété — la section 5.3 parle de "correction de A" comme un concept, pas une référence directe.

## 3. Ambiguïtés du protocole résolues par le code

| Ambiguïté | Choix de l'implémentation |
|-----------|--------------------------|
| Égalité exacte (high == borne) | Pas de déclenchement (strict `>` / `<`) |
| Doji (close == open) | Traité comme Up |
| Plusieurs structures Growing actives | Traitement de la plus profonde via `findDeepestGrowingStructure()` |
| Post-cascade : que faire du mouvement cassant ? | Tentative d'absorption par le parent survivant |
| Extension : mise à jour temporelle ? | Oui, `timeRange.end` est mis à jour |
| Niveau de référence initial | Borne opposée de la structure (cohérent avec section 3.1) |
| Calcul du rang | `rang = max(subStructures.rang) + 1` (profondeur d'arbre) |
| Calcul du degré | À la terminaison uniquement (Growing n'a jamais de degré) |

## Tableau récapitulatif

| # | Nature | Sévérité | Description |
|---|--------|----------|-------------|
| 1 | Non implémenté | Moyenne | Transition automatique Reference → Archived |
| 2 | Non implémenté | **Haute** | Promotion des sous-structures internes |
| 3 | Non implémenté | Moyenne | Distinction "en attente" vs "composante formelle" |
| 4 | Non implémenté | **Haute** | Récursion contextuelle avec niveaux relatifs |
| 5 | Divergence | Moyenne | `PriceMoveRules.isInvalidatedBy` deprecated mais incohérent |
| 6 | Divergence | Moyenne | Bougie englobante simplifiée |
| 7 | Divergence | Basse | `correction` comme référence directe |
| 8 | Ambiguïté | Info | Égalité exacte = pas de déclenchement |
| 9 | Ambiguïté | Info | Doji traité comme Up |
| 10 | Ambiguïté | Info | Post-cascade : absorption par parent survivant |
