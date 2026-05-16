# Trace bougie-par-bougie — EURUSD-5m (8 premières bougies)

Objectif : identifier par quelle règle du protocole chaque move / sub-structure / extension est créée.

Format : pour chaque bougie, on liste
1. la bougie ingérée (open, high, low, close, polarité dérivée) ;
2. les messages debug émis par PriceMoveStructure pendant le traitement ;
3. l'état complet de la structure après ingestion (tous les moves connus).

Tags du logger : `[ADD]` ingestion candidate, `[EXTEND]` extended-boundary, `[INTERNAL]` extended-internal, `[BREAK]` cassure, `[ROOT]` création racine, `[ENGULFING]` bougie englobante, `[INTERNAL-AFTER-CASCADE]` interne après cassure parent.

---

## Bougie 0 (01:00:00)

- **OHLC** : open=1.14547, high=1.14564, low=1.14494, close=1.14504 → polarité dérivée du PriceMove : down

**Trace du protocole** :

```
[CANDLE] Ingesting candle: O=1.14547 H=1.14564 L=1.14494 C=1.14504
[ADD] New move: down [1.14-1.15]
[ROOT] New root move created: 8884a8c1
[STATE] After candle: 1 growing moves, 1 total moves
```

**État après ingestion** : 1 moves connus

| Move | Polarité | État | Rang | priceRange | refLevel | subs | parent |
|------|---------|------|------|------------|----------|------|--------|
| `4933af2e` | down | growing | 0 | [1.14494—1.14564] | 1.14564 | 0 | — |

---

## Bougie 1 (01:05:00)

- **OHLC** : open=1.14502, high=1.14504, low=1.14464, close=1.14466 → polarité dérivée du PriceMove : down

**Trace du protocole** :

```
[CANDLE] Ingesting candle: O=1.14502 H=1.14504 L=1.14464 C=1.14466
[ADD] New move: down [1.14-1.15]
[EXTEND] Move 8884a8c1 extended (boundary broken)
[STATE] After candle: 2 growing moves, 2 total moves
```

**État après ingestion** : 2 moves connus

| Move | Polarité | État | Rang | priceRange | refLevel | subs | parent |
|------|---------|------|------|------------|----------|------|--------|
| `4933af2e` | down | growing | 1 | [1.14464—1.14564] | 1.14504 | 1 | — |
| `21b63a1c` | down | growing | 0 | [1.14464—1.14504] | 1.14504 | 0 | 4933af2e |

---

## Bougie 2 (01:10:00)

- **OHLC** : open=1.14466, high=1.14479, low=1.14434, close=1.14448 → polarité dérivée du PriceMove : down

**Trace du protocole** :

```
[CANDLE] Ingesting candle: O=1.14466 H=1.14479 L=1.14434 C=1.14448
[ADD] New move: down [1.14-1.14]
[EXTEND] Move 17617175 extended (boundary broken)
[STATE] After candle: 3 growing moves, 3 total moves
```

**État après ingestion** : 3 moves connus

| Move | Polarité | État | Rang | priceRange | refLevel | subs | parent |
|------|---------|------|------|------------|----------|------|--------|
| `4933af2e` | down | growing | 2 | [1.14464—1.14564] | 1.14504 | 1 | — |
| `21b63a1c` | down | growing | 1 | [1.14434—1.14504] | 1.14479 | 1 | 4933af2e |
| `8863ab57` | down | growing | 0 | [1.14434—1.14479] | 1.14479 | 0 | 21b63a1c |

---

## Bougie 3 (01:15:00)

- **OHLC** : open=1.14449, high=1.14467, low=1.14423, close=1.1446 → polarité dérivée du PriceMove : up

**Trace du protocole** :

```
[CANDLE] Ingesting candle: O=1.14449 H=1.14467 L=1.14423 C=1.1446
[ADD] New move: up [1.14-1.14]
[EXTEND] Move b830976b extended (boundary broken)
[STATE] After candle: 4 growing moves, 4 total moves
```

**État après ingestion** : 4 moves connus

| Move | Polarité | État | Rang | priceRange | refLevel | subs | parent |
|------|---------|------|------|------------|----------|------|--------|
| `4933af2e` | down | growing | 3 | [1.14464—1.14564] | 1.14504 | 1 | — |
| `21b63a1c` | down | growing | 2 | [1.14434—1.14504] | 1.14479 | 1 | 4933af2e |
| `8863ab57` | down | growing | 1 | [1.14423—1.14479] | 1.14467 | 1 | 21b63a1c |
| `be745748` | up | growing | 0 | [1.14423—1.14467] | 1.14423 | 0 | 8863ab57 |

---

## Bougie 4 (01:20:00)

- **OHLC** : open=1.14461, high=1.14461, low=1.14419, close=1.14426 → polarité dérivée du PriceMove : down

**Trace du protocole** :

```
[CANDLE] Ingesting candle: O=1.14461 H=1.14461 L=1.14419 C=1.14426
[ADD] New move: down [1.14-1.14]
[BREAK] Move 93d5a5a8 broken by new move
[SURVIVING] Parent b830976b survived cascade
[INTERNAL-AFTER-CASCADE] Move added as sub-structure to surviving parent b830976b
[STATE] After candle: 4 growing moves, 5 total moves
```

**État après ingestion** : 5 moves connus

| Move | Polarité | État | Rang | priceRange | refLevel | subs | parent |
|------|---------|------|------|------------|----------|------|--------|
| `4933af2e` | down | growing | 3 | [1.14464—1.14564] | 1.14504 | 1 | — |
| `21b63a1c` | down | growing | 2 | [1.14434—1.14504] | 1.14479 | 1 | 4933af2e |
| `8863ab57` | down | growing | 1 | [1.14419—1.14479] | 1.14461 | 2 | 21b63a1c |
| `be745748` | up | reference | 0 | [1.14423—1.14467] | 1.14423 | 0 | 8863ab57 |
| `97758d6a` | down | growing | 0 | [1.14419—1.14461] | 1.14461 | 0 | 8863ab57 |

---

## Bougie 5 (01:25:00)

- **OHLC** : open=1.14428, high=1.14445, low=1.14422, close=1.14423 → polarité dérivée du PriceMove : down

**Trace du protocole** :

```
[CANDLE] Ingesting candle: O=1.14428 H=1.14445 L=1.14422 C=1.14423
[ADD] New move: down [1.14-1.14]
[INTERNAL] Move added as sub-structure to b68f86a9
[STATE] After candle: 5 growing moves, 6 total moves
```

**État après ingestion** : 6 moves connus

| Move | Polarité | État | Rang | priceRange | refLevel | subs | parent |
|------|---------|------|------|------------|----------|------|--------|
| `4933af2e` | down | growing | 4 | [1.14464—1.14564] | 1.14504 | 1 | — |
| `21b63a1c` | down | growing | 3 | [1.14434—1.14504] | 1.14479 | 1 | 4933af2e |
| `8863ab57` | down | growing | 2 | [1.14419—1.14479] | 1.14461 | 2 | 21b63a1c |
| `be745748` | up | reference | 0 | [1.14423—1.14467] | 1.14423 | 0 | 8863ab57 |
| `97758d6a` | down | growing | 1 | [1.14419—1.14461] | 1.14461 | 1 | 8863ab57 |
| `dd788c2e` | down | growing | 0 | [1.14422—1.14445] | 1.14445 | 0 | 97758d6a |

---

## Bougie 6 (01:30:00)

- **OHLC** : open=1.14424, high=1.14433, low=1.14396, close=1.14413 → polarité dérivée du PriceMove : down

**Trace du protocole** :

```
[CANDLE] Ingesting candle: O=1.14424 H=1.14433 L=1.14396 C=1.14413
[ADD] New move: down [1.14-1.14]
[EXTEND] Move 7c66e8a4 extended (boundary broken)
[STATE] After candle: 6 growing moves, 7 total moves
```

**État après ingestion** : 7 moves connus

| Move | Polarité | État | Rang | priceRange | refLevel | subs | parent |
|------|---------|------|------|------------|----------|------|--------|
| `4933af2e` | down | growing | 5 | [1.14464—1.14564] | 1.14504 | 1 | — |
| `21b63a1c` | down | growing | 4 | [1.14434—1.14504] | 1.14479 | 1 | 4933af2e |
| `8863ab57` | down | growing | 3 | [1.14419—1.14479] | 1.14461 | 2 | 21b63a1c |
| `be745748` | up | reference | 0 | [1.14423—1.14467] | 1.14423 | 0 | 8863ab57 |
| `97758d6a` | down | growing | 2 | [1.14419—1.14461] | 1.14461 | 1 | 8863ab57 |
| `dd788c2e` | down | growing | 1 | [1.14396—1.14445] | 1.14433 | 1 | 97758d6a |
| `7d11b2c3` | down | growing | 0 | [1.14396—1.14433] | 1.14433 | 0 | dd788c2e |

---

## Bougie 7 (01:35:00)

- **OHLC** : open=1.14414, high=1.1445, low=1.14412, close=1.1444 → polarité dérivée du PriceMove : up

**Trace du protocole** :

```
[CANDLE] Ingesting candle: O=1.14414 H=1.1445 L=1.14412 C=1.1444
[ADD] New move: up [1.14-1.14]
[BREAK] Move 612756b7 broken by new move
[CASCADE] Parent 7c66e8a4 also broken
[SURVIVING] Parent b68f86a9 survived cascade
[INTERNAL-AFTER-CASCADE] Move added as sub-structure to surviving parent b68f86a9
[STATE] After candle: 5 growing moves, 8 total moves
```

**État après ingestion** : 8 moves connus

| Move | Polarité | État | Rang | priceRange | refLevel | subs | parent |
|------|---------|------|------|------------|----------|------|--------|
| `4933af2e` | down | growing | 5 | [1.14464—1.14564] | 1.14504 | 1 | — |
| `21b63a1c` | down | growing | 4 | [1.14434—1.14504] | 1.14479 | 1 | 4933af2e |
| `8863ab57` | down | growing | 3 | [1.14419—1.14479] | 1.14461 | 2 | 21b63a1c |
| `be745748` | up | reference | 0 | [1.14423—1.14467] | 1.14423 | 0 | 8863ab57 |
| `97758d6a` | down | growing | 2 | [1.14412—1.14461] | 1.1445 | 2 | 8863ab57 |
| `dd788c2e` | down | reference | 1 | [1.14396—1.14445] | 1.14433 | 1 | 97758d6a |
| `7d11b2c3` | down | reference | 0 | [1.14396—1.14433] | 1.14433 | 0 | dd788c2e |
| `7f921a61` | up | growing | 0 | [1.14412—1.1445] | 1.14412 | 0 | 97758d6a |

---

## Hiérarchie finale (descente depuis le move de rang max)

Move racine de rang max : `4933af2e`, rang 5, down

```
4933af2e down G rang=5 [1.14464-1.14564] ref=1.14504 sub=1 root
  21b63a1c down G rang=4 [1.14434-1.14504] ref=1.14479 sub=1 parent=4933af2e
    8863ab57 down G rang=3 [1.14419-1.14479] ref=1.14461 sub=2 parent=21b63a1c
      be745748 up R rang=0 [1.14423-1.14467] ref=1.14423 sub=0 parent=8863ab57
      97758d6a down G rang=2 [1.14412-1.14461] ref=1.1445 sub=2 parent=8863ab57
        dd788c2e down R rang=1 [1.14396-1.14445] ref=1.14433 sub=1 parent=97758d6a
          7d11b2c3 down R rang=0 [1.14396-1.14433] ref=1.14433 sub=0 parent=dd788c2e
        7f921a61 up G rang=0 [1.14412-1.1445] ref=1.14412 sub=0 parent=97758d6a
```
