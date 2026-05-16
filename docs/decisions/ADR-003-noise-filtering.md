# ADR-003 — Filtrage du bruit / définition d'un mouvement significatif

## État
Proposed

## Contexte

Aujourd'hui, **chaque bougie produit un PriceMove**. La conséquence empirique (cf. `memory/MEMORY.md`) :

> ~76% des moves sont des racines sans parent — c'est structurellement attendu (chaque bougie crée un move indépendant).

Sur `btcusdt-1d.json` (1000 bougies), on obtient 25 rangs de profondeur. Sur `eurusd-5m.json` (216 bougies), 4 rangs. Le système est saturé de mouvements minuscules (1 tick, 1 bougie) qui polluent la lecture fractale.

Le protocole (`protocole-construction.md`) **ne définit pas de seuil de signification**. La règle "trois cas de figure" (dépassement même sens / opposé / aucun) traite n'importe quel mouvement de prix, quelle que soit son amplitude.

**Symptôme** : Les indicateurs techniques bâtis sur cette structure devraient distinguer "structure macro" et "bruit micro", mais aujourd'hui les deux sont mélangés dans le même flux.

## Options

### A. Statu quo — pas de filtrage interne
- ✅ Algorithme indépendant de toute heuristique.
- ✅ Toute l'information de marché est préservée — c'est au consommateur de filtrer en aval.
- ❌ Sortie inutilisable telle quelle pour des signaux.
- ❌ Coût mémoire / CPU linéaire en nombre de bougies, même pour du bruit.

### B. Seuil d'amplitude minimum (ATR-based)
- Avant ingestion, calculer l'ATR(N) sur les `lookback` dernières bougies. Ignorer toute bougie dont l'amplitude `high - low` est inférieure à `k * ATR` (k ~ 0.2–0.5).
- ✅ Adaptatif à la volatilité de chaque marché.
- ✅ Conserve l'algorithmique du protocole.
- ❌ Introduit un état temporel externe (fenêtre ATR).
- ❌ Choix de k arbitraire, à régler par actif.

### C. Seuil d'amplitude en pourcentage du prix
- Ignorer toute bougie dont `(high - low) / midPrice < seuil` (ex. 0.05%).
- ✅ Simple, sans état temporel.
- ❌ Pas adaptatif à la volatilité du marché ; un seuil unique conviendra à un actif mais pas à un autre.

### D. Agrégation pré-ingestion (timeframe coarsening)
- Fusionner les bougies micro avant de les passer à FractalEngine. Au lieu de filtrer, on diminue la résolution.
- ✅ Conserve toute l'information dans une représentation moins granulaire.
- ✅ Cohérent avec la philosophie "fractal" — c'est l'utilisateur qui choisit son échelle d'entrée.
- ❌ Décale le problème : le consommateur doit choisir la timeframe ; pas de filtrage automatique adaptatif.

### E. Filtrage post-construction (par `rang`)
- Construire l'arbre complet, puis exposer une API qui ne retourne que les structures de rang ≥ N.
- ✅ Zéro coût pour l'algorithme central.
- ✅ Le rang capture déjà une notion de complexité — c'est un proxy de "signification structurelle".
- ❌ Le rang dépend de la durée de l'historique : un rang 3 sur 200 bougies n'est pas comparable à un rang 3 sur 10 000 bougies.

### F. Hybride D + E — paramétrer en entrée *et* en sortie
- Le consommateur choisit la timeframe (coarsening si nécessaire) ET un filtre `minRang` en lecture.
- ✅ Sépare clairement les responsabilités.
- ✅ N'ajoute aucune heuristique dans le noyau.

## Recommandation

**Option F (hybride D+E)** comme philosophie : le noyau reste indépendant de tout seuil, et les deux leviers naturels (timeframe en entrée, rang en sortie) sont déjà disponibles.

Le visualizer expose **déjà** un filtre `maxRang` (cf. `MEMORY.md` "Filtre maxRang : Slider dans FilterPanel"). Étendre avec un `minRang` côté lecture serait trivial.

Avant d'ajouter quoi que ce soit dans le noyau, **mesurer** : sur les deux fixtures, quelle est la distribution des amplitudes des moves rang 0 vs rang ≥ 1 ? Si les moves rang ≥ 1 absorbent déjà l'essentiel du signal utile, l'option F est suffisante. Sinon, considérer l'option B comme couche de pré-traitement *optionnelle*.

L'option A (statu quo) doit être préservée comme **comportement par défaut** : la library reste neutre.

## Conséquences si tranché

- **Doc** : Ajouter un chapitre "Signal vs bruit" dans `protocole-construction.md` qui dit explicitement « le protocole ne définit pas de seuil. Le filtrage est une responsabilité du consommateur via le choix de timeframe et le filtrage par rang. »
- **Code** : Ajouter `getStructuresByRangRange(minRang, maxRang)` sur FractalEngine.
- **Visualizer** : Étendre `FilterPanel` avec un slider `minRang`.
- **Étude empirique** : produire un rapport `docs/empirical/rang-distribution.md` qui montre la distribution des amplitudes par rang sur les fixtures.
- **Optionnel** : adapter une couche `PreFilteringPipeline` (option B ou D) en option externe à FractalEngine, jamais dans le noyau.
