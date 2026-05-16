# Mécanisme de calcul du `rang` — synthèse de l'investigation

> Document de synthèse pour l'auteur. Produit après une investigation BMAD du 2026-05-16. Consolidé à partir de :
> - `docs/empirical/rang-distribution.md` (distribution observée)
> - `docs/empirical/rang-trace.md` (trace du move de rang max)
> - `docs/empirical/candle-trace-eurusd.md` (trace bougie-par-bougie)
> - `docs/empirical/progressive/index.html` (visualisation pas-à-pas)
> - `docs/empirical/rang-contrasted.md` (comparaison avec une formule alternative)
> - `docs/decisions/ADR-007-rang-formula.md` (décision proposée)

## TL;DR

Le `rang` calculé par le code grimpe de **1 à chaque cassure de borne directionnelle dans une lignée**, peu importe la polarité de l'enfant. Sur les fixtures :

| Fixture | Bougies | `rang` max actuel | `rangContrasted` max (polarité opposée seule) |
|---------|---------|-------------------|-----------------------------------------------|
| EURUSD-5m | 192 | **78** | **10** |
| BTCUSDT-1d | 1000 | **369** | **13** |

La grande différence n'est pas un bug du protocole — c'est une **conséquence sémantique** d'une décision implicite dans le code : *chaque extension de borne ajoute une sub-structure et incrémente le rang*. Le protocole §5.3 distinguait pourtant clairement les deux cas.

## Ce qui se passe concrètement

### Étape 1 — bougie 1 arrive après la bougie 0

```
Bougie 0 : down [1.14494—1.14564]
  → crée move A (down, rang 0, [1.14494—1.14564])

Bougie 1 : down low=1.14464 < 1.14494 = A.low
  → casse la borne directionnelle (low) du parent down A
  → result = "extended-boundary"
  → A.priceRange s'étend à [1.14464—1.14564]
  → A.currentReferenceLevel passe à 1.14504 (high de la bougie 1)
  → Move B (down, rang 0, [1.14464—1.14504]) est créé
  → B est ajouté comme subStructure de A   ← CETTE LIGNE EST LA CAUSE
  → recalculateRang(A) : rang A = max(B.rang) + 1 = 1
```

Code responsable : `PriceMoveStructure.add()` ligne 99 (`deepestGrowing.addSubStructure(priceMove)` dans la branche `extended-boundary`) + `PriceMove.recalculateRang()` ligne 173.

### Étape N — N bougies down successives étendent la même chaîne

Si chaque bougie de B0 à B_N est down et casse le low de la précédente :

```
A     rang N
└── B1  rang N-1
    └── B2  rang N-2
        └── ...
            └── B_N  rang 0
```

Le rang grimpe linéairement avec N, **sans aucune correction** (mouvement opposé). C'est le pattern observé sur les fixtures : la queue "un move par rang" sur les hauts rangs correspond exactement à cette accumulation d'extensions homopolarisées.

### Visualisation pas à pas

`docs/empirical/progressive/index.html` (ouvrir dans un navigateur) montre les 8 premières bougies de EURUSD ingérées une par une. À chaque étape, on voit le rectangle du move racine s'allonger vers le bas et un nouveau rectangle plus petit apparaître à l'intérieur — c'est exactement la chaîne d'extensions décrite ci-dessus.

## Pourquoi le protocole semble dire autre chose

`docs/protocole-construction.md` §5.3 :

> Quand une sous-structure B (interne) grandit et casse une borne de la structure A (parente) :
> **Cassure de la borne haute de A (même sens pour une hausse) :**
> - B complète devient la **correction de A** (de H_A jusqu'au plus bas de B)
> - A s'étend avec une nouvelle impulsion
> - Cette nouvelle impulsion de A est **composée** de la **structure interne de B**

Lecture stricte : quand B casse la borne du parent dans le même sens, ce qui devient composante de A n'est pas B brut — c'est la **nouvelle impulsion** née de cette extension, et c'est elle qui hérite des enfants de B. B lui-même devient une *correction* (pas une composante hiérarchisée).

Le code actuel ne fait pas cette distinction : il ajoute B directement comme `subStructure`. C'est ce qui produit l'inflation linéaire.

## Pourquoi je ne change pas le code maintenant

Trois raisons :

1. **Décision protocolaire**. Modifier la formule du rang change le sens de l'API publique pour tous les consommateurs (visualizer, futurs scripts, exports JSON). C'est une décision d'auteur, pas une décision technique.
2. **Cadrage strict** (cf. mémoire `feedback_no_invented_heuristics`) : tout changement doit être motivé par la lecture du protocole + observations empiriques, pas par une intuition. La trace empirique et la lecture §5.3 convergent sur la même conclusion, mais l'arbitrage final reste à l'auteur.
3. **Réversibilité**. L'option C de l'ADR-007 (ajouter `rangContrasted` sans toucher au `rang`) permet de tester l'idée en production sans risquer un breaking change. C'est la voie la plus prudente.

## Question pour l'auteur

> Le `rang` actuel reflète **la profondeur cumulée de cassures de borne** dans une lignée. C'est une mesure légitime mais elle masque l'invariant fractal (changements de polarité).
>
> `rangContrasted` reflète **la profondeur d'imbrication par correction** (mouvement opposé), conforme à §5.3.
>
> Tu peux retenir **les deux** (option C — recommandé), **l'un ou l'autre** (option B ou D), ou **conserver le statu quo** (option A). Voir ADR-007 pour l'analyse complète des conséquences.

## Reproduire les chiffres

```bash
# Distribution actuelle
pnpm exec tsx tools/rang-distribution.ts

# Trace de la chaîne du move max-rang
pnpm exec tsx tools/rang-trace.ts

# Visualisation pas à pas (8 bougies par défaut)
pnpm exec tsx tools/render-progressive.ts

# Comparaison rang vs rangContrasted
pnpm exec tsx tools/rang-contrasted.ts
```

Tous les scripts sont en lecture seule — ils ne mutent pas la structure produite par `FractalEngine`.
