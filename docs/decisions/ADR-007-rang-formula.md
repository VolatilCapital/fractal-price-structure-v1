# ADR-007 — Formule de calcul du `rang` : compter ou non les extensions homopolarisées

## État
Accepted (2026-05-16) — Option C appliquée. `rang` inchangé, `rangContrasted` ajouté en complément.

## Contexte

L'étude empirique (`docs/empirical/rang-distribution.md`) a révélé une longue queue dans la distribution des rangs :

- **EURUSD-5m** (192 bougies) : rang max = **78**, avec un seul move par rang au-delà de rang 6.
- **BTCUSDT-1d** (1000 bougies) : rang max = **369**, idem.

La trace bougie-par-bougie (`docs/empirical/candle-trace-eurusd.md`) a expliqué le mécanisme :

> À chaque bougie qui étend la borne directionnelle d'un parent (cassure de boundary, code `extended-boundary` dans `PriceMoveStructure.add`), le nouveau move est ajouté comme `subStructure` du parent étendu. La propagation `recalculateRang()` incrémente alors le rang du parent (et de ses ancêtres) selon la formule `rang = max(subStructures.rang) + 1`.

Donc une chaîne de bougies qui étendent successivement dans le même sens (par exemple 10 bougies down qui cassent successivement le low) produit un parent de rang 10, sans pour autant représenter une vraie imbrication fractale.

### Citation protocole §5.3

> Quand une sous-structure B (interne) grandit et casse une borne de la structure A (parente) :
> **Cassure de la borne haute de A (même sens pour une hausse) :**
> - B complète devient la **correction de A** (de H_A jusqu'au plus bas de B)
> - A s'étend avec une nouvelle impulsion
> - Cette nouvelle impulsion de A est **composée** de la **structure interne de B**

Le texte distingue deux entités : (1) B lui-même devient une *correction* de A ; (2) la nouvelle impulsion de A est composée de la **structure interne** de B — pas de B lui-même.

Le code actuel **n'opère pas cette distinction** : tout candidat qui casse une borne est ajouté brut comme sub-structure.

### Démonstration empirique

Script `tools/rang-contrasted.ts` calcule, post-hoc, un `rangContrasted` qui ne compte que les sub-structures de polarité **opposée** :

| Fixture | `rang` max actuel | `rangContrasted` max |
|---------|-------------------|----------------------|
| EURUSD-5m (192 bougies) | 78 | **10** |
| BTCUSDT-1d (1000 bougies) | 369 | **13** |

La queue 14-78 (EURUSD) et 14-369 (BTCUSDT) disparaît complètement. La distribution résultante est saine et bornée, et reflète la **vraie profondeur d'imbrication par changement de polarité** — ce que le protocole §5.3 entend par "imbrication fractale".

## Options

### A. Statu quo — `rang = max(subStructures.rang) + 1`
- Inclut toutes les sub-structures, qu'elles soient de même polarité (extensions de borne) ou opposées (corrections).
- ✅ Pas de changement de comportement.
- ❌ Le rang n'est pas un invariant fractal — il croît avec le nombre cumulé de cassures de borne dans une lignée.
- ❌ Sur des séries longues, le rang devient inutilement grand et masque la vraie structure (cf. queue 14-369 sur BTCUSDT).
- ❌ Mauvais candidat pour un seuil de filtrage `minRang` exploitable (cf. ADR-003).

### B. Variante contrastée — `rangContrasted` : ne compter que les sub-structures de polarité opposée
- Formule :
  ```
  rangContrasted(m) = 0 si m n'a pas de sub-structures
                    = max(sub.rangContrasted) + 1 sur sub de polarité opposée
                    = max(sub.rangContrasted) sans incrément si tous les subs sont de même polarité
  ```
- ✅ Aligné avec §5.3 (la correction est ce qui crée la hiérarchie).
- ✅ Distribution bornée et stable : 0..10 sur 192 bougies, 0..13 sur 1000 bougies.
- ✅ Le rang devient un vrai invariant fractal exploitable comme seuil de filtrage.
- ❌ **Breaking change** sémantique : tous les tests, requêtes API et consommateurs qui s'appuient sur la valeur de `rang` voient leurs nombres changer.
- ❌ La memoization devient plus subtile (la formule dépend de la polarité).

### C. Ajouter un champ complémentaire `rangContrasted` sans toucher au `rang` existant
- Conserver `rang` tel quel (compatibilité).
- Ajouter `rangContrasted: number` calculé lazy au moment de la lecture (méthode dérivée), ou calculé incrémentalement comme `rang`.
- L'API publique expose les deux : `getStructuresAtMinRang(N)` et `getStructuresAtMinRangContrasted(N)`.
- ✅ Aucune régression pour les consommateurs existants.
- ✅ Les filtres ADR-003 peuvent reposer sur `rangContrasted` immédiatement.
- ❌ Deux notions concurrentes à documenter et entretenir.
- ❌ Le `rang` "ancien" reste affiché par défaut, ce qui peut continuer à induire en erreur.

### D. Renommer `rang` en `chainDepth` et créer `rang` = la nouvelle formule
- Inverser les rôles : la formule actuelle devient un détail interne (renommé), et `rang` représente l'invariant fractal proprement défini.
- ✅ L'API publique reflète la sémantique attendue.
- ❌ Renommage massif, breaking pour tout consommateur.
- ❌ Difficile à versionner proprement.

## Recommandation

**Option C** — ajouter `rangContrasted` comme champ complémentaire dans une première phase, en gardant `rang` tel quel.

Justification :

1. **Zero régression** : les 357 tests existants et les consommateurs continuent de passer sans modification.
2. **Validation empirique facile** : on peut lancer les filtres ADR-003 sur `rangContrasted` et comparer la lisibilité du visualizer.
3. **Décision réversible** : si après expérimentation `rangContrasted` se révèle être la bonne sémantique, on pourra basculer en option B/D dans une version majeure ultérieure (`v2`), avec dépréciation propre du `rang` historique.
4. **Préserve la lecture du protocole** : §5.3 décrit une distinction sémantique. Conserver les deux notions dans le code reflète une compréhension nuancée — le `rang` actuel mesure "la profondeur cumulée de cassures de borne", `rangContrasted` mesure "la profondeur fractale au sens des corrections imbriquées". Les deux sont des vérités sur la structure, à des niveaux d'agrégation différents.

## Conséquences si tranché (option C)

- **Code** :
  - Nouveau champ `rangContrasted: number` sur `PriceMove` (private + public getter).
  - Recalcul propagé dans `recalculateRang()` (ou méthode jumelle `recalculateRangContrasted()` appelée au même moment).
  - Nouvelle API publique `engine.getStructuresAtMinRangContrasted(N)` et `engine.getStructuresAtRangContrastedRange(min, max)`.
- **Tests** :
  - Tests d'invariance du `rang` existant : aucun changement.
  - Nouveaux tests sur `rangContrasted` (au minimum : un cas extensions homopolarisées → `rangContrasted=0`, un cas correction → `rangContrasted≥1`).
- **Documentation** :
  - `data-models.md` documente les deux champs avec leurs sémantiques distinctes.
  - `protocole-construction.md` ou `specification-fractale.md` ajoute une section "Profondeur cumulée vs profondeur fractale" qui formalise la distinction.
- **Visualizer** :
  - Slider `minRangContrasted` à côté de `minRang` dans FilterPanel.
  - Toggle "Métrique de rang" pour choisir laquelle prime dans l'affichage.

## Lien avec les autres ADR

- **ADR-003** (filtrage du bruit) : la recommandation B+E peut maintenant s'appuyer sur `rangContrasted` plutôt que `rang`, ce qui produira des seuils beaucoup plus pertinents (ex : `minRangContrasted ≥ 2` est un signal fort, vs `minRang ≥ 2` qui inclut encore beaucoup d'inflation).
- **ADR-002** (bougie englobante) : la promotion §5.3 n'étant pas implémentée, le mécanisme `extended-boundary → addSubStructure` est la voie principale d'imbrication. Si on implémente un jour la promotion, `rang` pourrait redevenir conforme à `rangContrasted` "naturellement" — à reconsidérer alors.
