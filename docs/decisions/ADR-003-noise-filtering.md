# ADR-003 — Filtrage / exploitabilité des structures produites

## État
Accepted (2026-05-16) — Options B + E appliquées, avec utilisation de `rangContrasted` (ADR-007) plutôt que de `rang` comme métrique de filtrage.

## Contexte

Aujourd'hui, **chaque bougie produit un PriceMove**. Conséquence empirique (`memory/MEMORY.md`) :

> ~76% des moves sont des racines sans parent — chaque bougie crée un move indépendant.

Sur les fixtures actuelles, la sortie est saturée de mouvements de rang 0 qui rendent la lecture difficile. La question : comment exposer une vue exploitable sans dévier du protocole ?

**Cadrage strict** (cf. mémoire `feedback_no_invented_heuristics`) : aucune heuristique externe (ATR, seuils en %, indicateurs techniques, volatilité). Tout filtrage doit être **intrinsèque à la structure produite par le protocole**, dérivable uniquement des cassures et des highs/lows des bougies.

**Contrainte d'usage** : le système doit servir aussi bien le temps réel que le backtest, et produire des résultats *cohérents en échelle* sur 1m / 1h / 1d (invariance fractale).

## Options (toutes dérivables strictement du protocole)

### A. Statu quo — aucun filtre dans le noyau ni dans l'API
- Le consommateur trie en aval selon ses besoins.
- ✅ Library 100% neutre.
- ❌ Sortie inexploitable sur 1m sans travail externe.

### B. Filtre par **rang** en lecture
- Ajouter `engine.getStructuresAtMinRang(N)` et `engine.getStructuresAtRangRange(min, max)`.
- Le rang = profondeur d'imbrication structurelle, intrinsèque (calculé depuis `subStructures`).
- ✅ **Invariance d'échelle** : un même seuil donne le même type d'objet sur 1m, 1h, 1d.
- ✅ Aucune nouvelle notion introduite — le rang existe déjà.
- ⚠️ Le rang dépend de la profondeur de l'historique : un même actif sur 200 vs 10 000 bougies ne donne pas les mêmes valeurs absolues de rang max.

### C. Filtre par **état** en lecture (Reference uniquement)
- API existante : `engine.getReferenceMoves()` retourne déjà les structures terminées (stables).
- ✅ Sépare "en construction" de "validé".
- ❌ Ne diminue pas le bruit en lui-même — toutes les bougies terminées sont là aussi.

### D. Filtre combiné **rang ≥ N ET état = Reference**
- Ne renvoyer que les structures terminées de rang significatif.
- ✅ Signaux les plus "fiables" pour un usage trading.
- ⚠️ Plus restrictif — perd les structures en cours de formation (problème pour le temps réel).

### E. Exposer aussi le **move en cours de formation**
- Complément aux options B/D : `engine.getCurrentFormingMoves()` retourne les Growing au sommet de chaque rang, pour anticipation temps réel.
- ✅ Permet de suivre une structure dès qu'elle dépasse rang N, avant qu'elle ne se finalise.
- Combinable avec B/D.

## Recommandation

**Option B (filtre par rang en lecture) + Option E (move en cours)**.

Justification :
- Le **rang** est l'invariant fractal natif. Il dérive uniquement du protocole (cassures + subStructures), donc strictement conforme au cadrage.
- L'invariance d'échelle est préservée : tu peux relancer sur 1m, 1h, 1d, et un filtre `minRang=N` donne « le même genre d'objet » à chaque fois, simplement à des résolutions temporelles différentes.
- L'option E répond au besoin temps réel : pouvoir suivre une structure qui *vient* d'atteindre rang N sans attendre sa terminaison.
- Le noyau reste strictement neutre — aucune règle nouvelle dans `protocole-construction.md`.
- L'option C (état) reste exploitable en parallèle via l'API existante `getReferenceMoves()`.

**Action de préalable** : avant de fixer un `minRang` par défaut dans le visualizer, produire une étude empirique de la distribution des rangs sur les fixtures `eurusd-5m.json` et `btcusdt-1d.json` (durée moyenne d'un move par rang, nombre de moves par rang). Cela informe la valeur seuil pertinente *par observation*, pas par devination.

## Conséquences si tranché

- **Doc** : section "Filtrage par rang et invariance d'échelle" ajoutée dans `protocole-construction.md` ou `specification-fractale.md` (à décider).
- **Code API** : `getStructuresAtMinRang(N)`, `getStructuresAtRangRange(min, max)`, `getCurrentFormingMoves()` sur `FractalEngine`.
- **Visualizer** : ajouter un slider `minRang` à côté du `maxRang` existant.
- **Étude empirique** : script `tools/rang-distribution.ts` qui produit un rapport markdown dans `docs/empirical/rang-distribution.md`.
- **Mémoire** : mettre à jour `MEMORY.md` une fois l'étude faite (remplacer "0 moves Archived" et "76% racines" par des stats actualisées et liées à un filtre `minRang` par défaut).
