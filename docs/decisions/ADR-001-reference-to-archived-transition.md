# ADR-001 — Transition `Reference → Archived` automatique ?

## État
Accepted (2026-05-16) — Variante prudente de l'option C : opt-in via `new FractalEngine({ autoArchive: true })`, par défaut désactivé pour préserver le comportement existant.

## Contexte

Le protocole (`docs/protocole-construction.md` §13.3) décrit trois états : **Growing → Reference → Archived**. La transition `Reference → Archived` est définie ainsi :

> "Reference → Archived : déclenché lorsque la structure parente est elle-même terminée."

L'implémentation actuelle (cf. `PriceMoveStructure.archiveOrphanedStructures`) **ne fait pas cette transition automatiquement** lors d'un `terminate()` du parent. À la place, elle expose une méthode publique `engine.archiveOrphanedStructures(beforeTimestamp)` que le consommateur doit appeler manuellement.

Le critère d'archivage codé est par ailleurs **temporel** (`move.timeRange.end < beforeTimestamp`) **et** absence d'enfants Growing — pas "parent en état Reference". C'est un GC plus permissif que la règle protocolaire.

**Conséquence observée** : la mémoire ne se libère jamais si le consommateur n'appelle pas explicitement la méthode. Avec les fixtures actuelles (`eurusd-5m.json`, `btcusdt-1d.json`), le compteur de moves Archived reste à **0** (cf. `memory/MEMORY.md`).

## Options

### A. Statu quo — transition manuelle
- ✅ Pas de changement de comportement runtime.
- ✅ Le consommateur garde un contrôle fin sur le GC.
- ❌ Écart permanent avec la spec.
- ❌ Risque d'OOM en exécution longue si le consommateur oublie l'appel.

### B. Transition automatique sur `terminate()` du parent — strictement spec
- ✅ Aligne le code avec la spec §13.3.
- ✅ Le consommateur n'a plus à gérer le GC manuellement.
- ❌ Change le comportement runtime — toute structure terminée dont le parent est aussi terminé bascule en Archived. Cela invalide certaines requêtes historiques (`getReferenceMoves()` rétrécit).
- ❌ Réduit la richesse de l'historique pour l'analyse a posteriori.

### C. Hybride — automatique avec option d'opt-out
- ✅ Comportement par défaut conforme à la spec.
- ✅ Le consommateur peut activer un mode "rétention longue" via `new FractalEngine({ autoArchive: false })`.
- ⚠️ Ajoute une option de configuration.

### D. Critère temporel renforcé — garder le GC actuel mais le déclencher automatiquement à chaque addCandle
- ❌ Diverge davantage de la spec.
- ❌ Pas une décision protocolaire — un détail d'implémentation.

## Recommandation

**Option C (hybride)**. Aligner le comportement par défaut avec la spec tout en laissant la porte ouverte aux usages qui ont besoin de l'historique Reference complet (visualisation, backtests, audits). Le défaut spec-conforme évite la fuite mémoire silencieuse ; l'opt-out préserve les usages actuels.

Avant d'implémenter, **ajouter un test** qui mesure le nombre de moves Archived sur les deux fixtures avant et après le changement, pour quantifier l'impact.

## Conséquences si tranché

- **Code** : dans `PriceMoveStructure.#handleCascadeTermination`, après le `terminate()` du parent, traverser ses `subStructures` et basculer celles en état Reference vers Archived (si pas de descendant Growing). Ajouter `archiveSubStructuresOf(move)` helper.
- **API publique** : option `autoArchive: boolean` ajoutée au constructeur `FractalEngine`. `archiveOrphanedStructures()` devient un fallback manuel (ou supprimé).
- **Doc** : préciser dans `data-models.md` que la transition Reference→Archived suit la spec par défaut.
- **Tests** : un test compte les moves Archived sur les fixtures (~> 0 attendu avec le nouveau comportement).
- **Mémoire** : `memory/MEMORY.md` note "0 moves Archived" devient obsolète — à mettre à jour.
