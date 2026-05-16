# Trace de moves à rang max — annexe à `docs/empirical/rang-distribution.md`

# Trace du move de rang max — EURUSD 5m

**Fixture** : eurusd-5m.json (192 bougies)

**Move racine de rang max** : id=`00000000`, rang=78, polarité=down, état=growing
- priceRange : [1.14464 — 1.14564]
- timeRange : 2026-03-16T01:00:00.000Z → 2026-03-16T01:09:59.999Z
- currentReferenceLevel : 1.14504
- nombre de sub-structures directes : 1
- parentStructure : (racine)

## Répartition des sub-structures DIRECTES par rang

| Rang | Nombre | Polarités | États |
|------|--------|-----------|-------|
| 77 | 1 | up=0 down=1 | G=1 R=0 A=0 |

## Descente le long de la chaîne de plus haut rang

À chaque étape, on prend la sub-structure de rang le plus élevé (celle qui détermine `rang(parent) = max + 1`).

| Étape | id      | rang | polarité | état      | nb sub | priceRange                  |
|-------|---------|------|----------|-----------|--------|------------------------------|
| 0 | `00000000` | 78 | down | growing | 1 | [1.14464 — 1.14564] |
| 1 | `00000001` | 77 | down | growing | 1 | [1.14434 — 1.14504] |
| 2 | `00000002` | 76 | down | growing | 2 | [1.14419 — 1.14479] |
| 3 | `00000004` | 75 | down | growing | 3 | [1.14401 — 1.14461] |
| 4 | `0000000c` | 74 | up | growing | 2 | [1.14401 — 1.14434] |
| 5 | `0000000e` | 73 | down | growing | 1 | [1.14402 — 1.14432] |
| 6 | `0000000f` | 72 | down | growing | 1 | [1.14395 — 1.14417] |
| 7 | `00000010` | 71 | down | growing | 1 | [1.1439 — 1.14416] |
| 8 | `00000011` | 70 | down | growing | 1 | [1.1436 — 1.14412] |
| 9 | `00000012` | 69 | down | growing | 1 | [1.14355 — 1.14396] |
| 10 | `00000013` | 68 | up | growing | 1 | [1.14355 — 1.14396] |
| 11 | `00000014` | 67 | down | growing | 1 | [1.14361 — 1.14396] |

## Lecture

- Si la **descente est strictement linéaire** (chaque parent n'a qu'1 sub-structure et son rang = rang(sub)+1), alors la queue "un move par rang" reflète une chaîne d'imbrications dans un seul sens — produite par le protocole, pas un bug.
- Si à un étage la **sub-structure de plus haut rang est isolée parmi plusieurs frères**, ça veut dire que c'est UNE branche profonde qui tire le rang vers le haut, et que les autres sub-structures sont des frères "plats" (rang faible).
- Si la chaîne **descend très profond sans branchement**, c'est l'indice que `recalculateRang` propage agressivement.

---

# Trace du move de rang max — BTCUSDT 1d

**Fixture** : btcusdt-1d.json (1000 bougies)

**Move racine de rang max** : id=`00000001`, rang=369, polarité=up, état=growing
- priceRange : [27192 — 30036]
- timeRange : 2023-04-25T00:00:00.000Z → 2023-04-26T23:59:59.999Z
- currentReferenceLevel : 27235
- nombre de sub-structures directes : 1
- parentStructure : (racine)

## Répartition des sub-structures DIRECTES par rang

| Rang | Nombre | Polarités | États |
|------|--------|-----------|-------|
| 368 | 1 | up=1 down=0 | G=1 R=0 A=0 |

## Descente le long de la chaîne de plus haut rang

À chaque étape, on prend la sub-structure de rang le plus élevé (celle qui détermine `rang(parent) = max + 1`).

| Étape | id      | rang | polarité | état      | nb sub | priceRange                  |
|-------|---------|------|----------|-----------|--------|------------------------------|
| 0 | `00000001` | 369 | up | growing | 1 | [27192 — 30036] |
| 1 | `00000002` | 368 | up | growing | 2 | [27235 — 30036] |
| 2 | `00000007` | 367 | down | growing | 1 | [27666.95 — 29337.34] |
| 3 | `00000008` | 366 | up | growing | 2 | [27872 — 29266.66] |
| 4 | `0000000d` | 365 | down | growing | 3 | [26361.2 — 29138.29] |
| 5 | `00000018` | 364 | down | growing | 3 | [26080.5 — 27485.33] |
| 6 | `0000001e` | 363 | down | growing | 1 | [25871.89 — 27219.61] |
| 7 | `0000001f` | 362 | up | growing | 1 | [25871.89 — 26932.16] |
| 8 | `00000020` | 361 | up | growing | 1 | [26327.24 — 26932.16] |
| 9 | `00000021` | 360 | up | growing | 1 | [26551 — 28261.32] |
| 10 | `00000022` | 359 | up | growing | 1 | [26764.36 — 28447.14] |
| 11 | `00000023` | 358 | down | growing | 1 | [27524.6 — 28447.14] |

## Lecture

- Si la **descente est strictement linéaire** (chaque parent n'a qu'1 sub-structure et son rang = rang(sub)+1), alors la queue "un move par rang" reflète une chaîne d'imbrications dans un seul sens — produite par le protocole, pas un bug.
- Si à un étage la **sub-structure de plus haut rang est isolée parmi plusieurs frères**, ça veut dire que c'est UNE branche profonde qui tire le rang vers le haut, et que les autres sub-structures sont des frères "plats" (rang faible).
- Si la chaîne **descend très profond sans branchement**, c'est l'indice que `recalculateRang` propage agressivement.

---

