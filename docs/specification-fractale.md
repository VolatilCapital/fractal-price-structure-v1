# Spécification de la Structure Fractale des Prix

## 1. Philosophie Fondamentale

### 1.1 Principe de Composition

Les structures fractales **se composent entre elles** : une structure parente est **construite par** ses enfants.

- **Les petits mouvements créent les gros mouvements** (bottom-up)
- La croissance commence toujours par le plus petit niveau
- Un "gros mouvement" a sa propre identité/stabilité, indépendamment de la complexité de son intérieur

### 1.2 Deux Issues Seulement

Pour tout mouvement en cours, il n'y a que **deux possibilités** :

1. **Ça continue** → Extension (le mouvement grandit)
2. **Ça s'arrête** → Invalidation (un mouvement inverse commence)

**Seul le dépassement de prix compte.** Soit ça dépasse à la hausse, soit ça dépasse à la baisse.

### 1.3 Profondeur Variable

La structure n'est **pas un arbre régulier** (niveau 1, 2, 3...).
- Parfois l'intérieur d'un mouvement est complexe (beaucoup de sous-structures)
- Parfois l'intérieur est simple
- C'est ce qui fait la difficulté : **profondeur variable**

### 1.4 Émergence des Formes

Un "gros mouvement" se définit à un **niveau observable**, indépendamment de tous les petits mouvements qu'il contient. Il y a une sorte de **stabilité émergente** des formes.

---

## 2. Concepts de Base

### 2.1 PriceMove (Mouvement de Prix)

Un **PriceMove** représente un mouvement directionnel du prix.

**Propriétés :**
- **Polarité** : `Up` (haussier) ou `Down` (baissier)
- **Plage de prix** : [low, high] - les bornes du mouvement
- **Plage de temps** : [start, end] - début et fin
- **État** : Voir section 2.3

### 2.2 Les Trois États d'une Structure

Une structure passe par **trois états** au cours de son cycle de vie :

```
┌─────────────────┐      cassure       ┌─────────────────┐      cassure       ┌─────────────────┐
│   EN CROISSANCE │  ──────────────►   │   RÉFÉRENCE     │  ──────────────►   │   ARCHIVÉE      │
│     (Growing)   │   de son niveau    │   (Reference)   │   de son niveau    │   (Archived)    │
└─────────────────┘                    └─────────────────┘                    └─────────────────┘
       🟢                                    🟠                                     ⬜
      Vert                                 Orange                                  Gris
```

| État | Description | Utilité | Mémoire |
|------|-------------|---------|---------|
| **En croissance** 🟢 | Structure en construction, peut encore s'étendre | Suivi temps réel | En RAM |
| **Référence** 🟠 | Terminée, sert de niveau de cassure | Détection des cassures | En RAM |
| **Archivée** ⬜ | Son niveau a été cassé, plus d'incidence | Historique uniquement | Peut être persistée/libérée |

### 2.3 Cycle de vie détaillé

```
1. CRÉATION
   → Nouveau mouvement détecté
   → État = EN CROISSANCE 🟢
   → Peut s'étendre (nouveaux highs/lows dans le sens)

2. TERMINAISON (cassure de son niveau)
   → Son niveau de référence est cassé
   → État = RÉFÉRENCE 🟠
   → Ne peut plus s'étendre
   → Sert maintenant de référence pour les structures au-dessus

3. ARCHIVAGE (cassure du niveau supérieur)
   → Le niveau supérieur qui l'utilisait comme référence est cassé
   → État = ARCHIVÉE ⬜
   → Plus aucune incidence sur la structure actuelle
   → Peut être retirée de la mémoire (optimisation)
```

### 2.4 Exemple visuel avec états

```
Prix
  │                                H2 ← HAUSSE 🟠 (référence, terminée)
  │                               /\
  │                              /  \
  │                   H1       /    \
  │                  /\       /      \
  │                 /  \     /        \
  │                /    \   /          \
  │               /      \ /            \
  │              / I1⬜   L1             \ ← BAISSE 🟢 (en croissance)
  │             /  (archivé)              \
  │            /                           \
  └───────────/─────────────────────────────\──────→ Temps
             L0                              X

  I1 est archivé car : la HAUSSE qui l'utilisait est terminée
  HAUSSE est référence car : elle sert de niveau pour la BAISSE
  BAISSE est en croissance car : elle peut encore s'étendre
```

### 2.5 Avantages des trois états

1. **Optimisation mémoire** : Les structures archivées peuvent être persistées sur disque
2. **Performance** : Seules les structures "référence" sont vérifiées pour les cassures
3. **Affichage clair** :
   - 🟢 Vert = en construction (indéterminé)
   - 🟠 Orange = terminé mais actif (niveau de référence)
   - ⬜ Gris = historique (plus d'incidence)

### 2.6 Origine des PriceMoves

Chaque **candle** génère un PriceMove élémentaire :
- Bougie verte (close >= open) → PriceMove `Up`
- Bougie rouge (close < open) → PriceMove `Down`

Ces PriceMoves élémentaires sont les "atomes" qui composent les structures plus grandes.

---

## 3. Logique d'Interaction

Quand un nouveau mouvement arrive, il interagit avec les structures existantes.

### 3.1 Extension

**Condition** : Le nouveau mouvement casse la borne directionnelle.
- Move `Up` : nouveau high dépassé
- Move `Down` : nouveau low dépassé

**Résultat** : La structure **s'étend**, elle grandit.

### 3.2 Invalidation

**Condition** : Le nouveau mouvement casse la borne opposée.
- Move `Up` : le low est cassé → la hausse est terminée
- Move `Down` : le high est cassé → la baisse est terminée

**Résultat** :
- La structure est **fermée** (invalidée)
- Un nouveau mouvement **inverse** commence

### 3.3 Pas de Cas "Neutre"

~~Mouvement interne qui ne fait rien~~ → **Ce cas n'existe pas vraiment.**

Chaque mouvement soit étend, soit invalide une structure de référence.

---

## 4. Terminologie Trading

### 4.1 Impulsion et Correction

- **Impulsion** : Mouvement dans le sens de la tendance principale
- **Correction** : Mouvement contre la tendance (pullback/retracement)

Dans une tendance haussière :
- Impulsion = mouvement UP
- Correction = mouvement DOWN (qui ne casse pas le dernier low)

### 4.2 Structure en Escalier (ASCII)

```
Prix
  │                                            H3
  │                                           /
  │                                          /
  │                                H2       /
  │                               /\       /
  │                              /  \     /
  │                             /    \   /
  │                   H1       /      \ /
  │                  /\       /        L2
  │                 /  \     /
  │                /    \   /
  │               /      \ /
  │              /        L1
  │             /
  │            /
  │           /
  └──────────/─────────────────────────────────────────→ Temps
            L0

            │ I1 │ C1 │ I2 │ C2 │ I3 │

  I = Impulsion    C = Correction
```

**Règles d'une hausse valide :**
- Chaque **impulsion** dépasse le high précédent : H1 < H2 < H3
- Chaque **correction** ne casse PAS le low précédent : L0 < L1 < L2
- Si une correction casse un low → **INVALIDATION**

### 4.3 Cas de Cassure de L1 (ASCII)

```
Prix
  │                                H2
  │                               /\
  │                              /  \
  │                             /    \
  │                   H1       /      \
  │                  /\       /        \
  │                 /  \     /          \
  │                /    \   /            \
  │               /      \ /              \
  │              /        L1               \
  │             /          ┊                \
  │            /           ┊ CASSURE L1      \
  │           /            ┊                  X
  └──────────/─────────────┊───────────────────────────→ Temps
            L0

  → Le mouvement HAUSSE [L0 → H2] est TERMINÉ (il est maintenant défini)
  → [H2 → X] est la CORRECTION de cette hausse
```

### 4.4 Conséquence d'une cassure

**Principe clé :** Quand L1 est cassé, le mouvement **entier** [L0 → H2] est **terminé**.

- Ce n'est pas juste I2 qui est invalidé, c'est toute la hausse qui se clôture
- La hausse est maintenant **définie** : elle va de L0 à H2
- Le mouvement [H2 → X] est la **correction** de cette hausse

```
Structure résultante :

  HAUSSE [L0 → H2] ✓ TERMINÉE
    └── sous-structure interne (I1, C1, I2...)

  CORRECTION [H2 → X] ← en cours
    └── correction de la hausse précédente
```

---

## 5. Questions de Clarification

### Q1 : Et si X casse aussi L0 ?

```
Prix
  │                                H2
  │                               /\
  │                              /  \
  │                   H1       /    \
  │                  /\       /      \
  │                 /  \     /        \
  │                /    \   /          \
  │               /      \ /            \
  │              /        L1             \
  │             /                         \
  │            /                           \
  │           /                             \
  └──────────/───────────────────────────────\─────────→ Temps
            L0                                X (< L0)
```

**Réponse :** Le mouvement supérieur (s'il existe) est également terminé.

C'est un **retournement de la sous-structure**. Le principe est le même à chaque étage :
- Cassure de L1 → termine le niveau actuel
- Cassure de L0 → termine aussi le niveau supérieur
- Et ainsi de suite (récursif)

### Q2 : Sous-structures internes

**Réponse :** Ce sont la **structure interne** (ou **sous-vagues**) du mouvement supérieur.

Terminologie Elliott Wave :
- Les sous-mouvements sont de **degré inférieur**
- Le mouvement englobant est de **degré supérieur**
- La structure interne = la **subdivision** du mouvement

```
HAUSSE [L0 → H3] (degré supérieur)
  └── Structure interne (degré inférieur) :
        I1 → C1 → I2 → C2 → I3
```

---

## 5bis. La Difficulté Centrale : Complexité Variable

### Le problème

La structure interne n'est **pas uniforme** :
- Parfois simple : quelques sous-vagues
- Parfois très complexe : beaucoup de niveaux imbriqués

```
Cas SIMPLE :                      Cas COMPLEXE :

HAUSSE                            HAUSSE
  └── I1 → C1 → I2                  └── I1 (qui contient i1→c1→i2→c2→i3)
                                        → C1 (qui contient a→b→c)
                                        → I2 (qui contient i1→c1→i2→c2→i3→c3→i4)
                                        → C2 (simple)
                                        → I3 (qui contient...)
```

### Le défi

1. **On part toujours du plus petit** (les candles)
2. **Les structures émergent** par accumulation
3. **Le niveau de référence** doit exister malgré la complexité variable
4. **Le "degré"** n'est pas une profondeur fixe

### La question fondamentale

Comment établir un **bon rangement** (organisation) quand :
- La profondeur varie d'une branche à l'autre
- On construit bottom-up (du petit vers le grand)
- Certaines structures sont simples, d'autres très complexes
- Mais on a besoin de **niveaux de référence** cohérents

**C'est LA difficulté à résoudre.**

### Le paradoxe du degré

```
PARADOXE :

Construction : bottom-up        Numérotation logique : top-down
(on commence par les petits)    (degré 0 = le plus gros)
            ↑                               ↓
         candles                    HAUSSE MAJEURE (degré 0)
            ↑                               ↓
      petites vagues                sous-vagues (degré 1)
            ↑                               ↓
      grosses vagues                    candles (degré N)
```

**Le problème** : On ne connaît le "plus gros" qu'une fois qu'il est terminé !

### Proposition : Deux dimensions

Le degré n'est pas un simple compteur, il faut **deux notions** :

1. **Rang** (vertical) : Position dans la chaîne de construction
   - Rang 0 = candle (atome)
   - Rang 1 = première structure formée
   - Rang N = structure qui englobe des rangs inférieurs
   - **Croît vers le haut** au fur et à mesure

2. **Degré** (rétroactif) : Position par rapport au plus gros
   - Degré 0 = la structure la plus grande (connue a posteriori)
   - Degré N = les plus petites subdivisions
   - **Calculé après coup** quand une structure se termine

```
Pendant la construction :      Après terminaison :

[rang 3] HAUSSE ???            [degré 0] HAUSSE TERMINÉE
    ↑                              ↓
[rang 2] sous-vague            [degré 1] sous-vague
    ↑                              ↓
[rang 1] micro-vague           [degré 2] micro-vague
    ↑                              ↓
[rang 0] candles               [degré 3] candles
```

### L'effet de réunion/alignement

Quand une cassure se produit, elle peut **simplifier** la complexité :

```
AVANT cassure (complexe) :          APRÈS cassure (aligné) :

HAUSSE [rang 4]                     HAUSSE [rang 4] → TERMINÉE
  └── I1 [rang 3]                     → Toute cette complexité
       └── i1,c1,i2 [rang 2]             se "réunit" en une seule
            └── micro [rang 1]            structure de [degré 0]
  └── C1 [rang 2]
  └── I2 [rang 3]                   CORRECTION [rang 1] → commence
       └── i1,c1,i2,c3,i4 [rang 2]    → Elle est de [degré 1]
            └── micro [rang 1]            par rapport à la HAUSSE
  └── C2 simple [rang 1]
```

**Principe** : La cassure "annule" la complexité interne et produit une structure alignée.

### Règle critique : Cohérence du degré

**IMPORTANT** : Une structure d'un certain degré doit TOUJOURS être de ce degré.

- Pas de fluctuation : "un coup degré 1, un coup degré 2"
- Le degré est **déterministe** : il se calcule par rapport à la structure parente terminée
- La complexité interne (rang) n'affecte PAS le degré final

```
Règle de calcul du degré :

SI une structure S est la correction directe de P (parent terminé) :
  → S.degré = P.degré + 1

SI une structure S casse le niveau de référence de P :
  → P est terminé
  → P.degré se fige
  → S devient correction de P avec degré = P.degré + 1
```

### De la complexité aux niveaux précis

**LE DÉFI CENTRAL** : Unifier des complexités différentes en un même degré.

```
Pour former une structure de DEGRÉ 5 :

                    DEGRÉ 5 (HAUSSE)
                    niveau de ref: L0
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    I1 (rang 4)       C1 (rang 1)       I2 (rang 3)
    très complexe     simple            moyen


Pourtant, I1, C1, I2 sont TOUS de degré 6 (sous-structures directes)
→ Leur complexité interne (rang) diffère
→ Mais leur DEGRÉ est le même
```

### La clé : Le degré vient de la CASSURE, pas de la complexité

**Principe fondamental** :

Le **rang** = combien de niveaux internes (complexité variable)
Le **degré** = position dans la hiérarchie des CASSURES

```
Ce qui détermine le degré :

                    HAUSSE [L0 → H5]
                    Pour la casser : il faut casser L0
                    → C'est une structure de DEGRÉ N
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
        I1                C1                I2
   [L0 → H1]          [H1 → L1]         [L1 → H2]
   cassable par L0    cassable par H1   cassable par L1

   → I1, C1, I2 sont TOUS de degré N+1
   → Car ils sont tous des sous-structures DIRECTES de la HAUSSE
   → Peu importe leur complexité interne
```

### Règle d'alignement du degré

```
RÈGLE :

Le degré d'une structure = degré du parent + 1

Où "parent" = la structure dont elle est une sous-vague directe
             (pas la complexité interne qui compte)


EXEMPLE :

HAUSSE degré 0
  ├── I1 degré 1 (même si rang 4 en interne)
  ├── C1 degré 1 (même si rang 1 en interne)
  ├── I2 degré 1 (même si rang 3 en interne)
  └── C2 degré 1

       I1 degré 1
         ├── i1 degré 2
         ├── c1 degré 2
         ├── i2 degré 2
         └── ...
```

### Ce qui "réunit" les complexités

C'est le **niveau de cassure partagé** qui aligne :

- I1, C1, I2 partagent le même "parent" (la HAUSSE)
- Ils sont tous cassables par le même niveau de référence supérieur
- Donc ils sont tous du même degré, quelle que soit leur complexité

```
L'alignement se fait par le HAUT (le parent commun)
et non par le BAS (la complexité interne)
```

### Q3 : Pourquoi L1 suffit à invalider ?

**Réponse :** Dans une structure Impulsion → Correction → Impulsion → Correction :

Il suffit que la **correction fasse un plus bas que l'impulsion précédente** pour considérer que c'est un **retournement**.

```
  Impulsion I2 : monte jusqu'à H2
  Correction C2 : descend...
    - Si C2 reste au-dessus de L1 → la hausse continue
    - Si C2 casse L1 → RETOURNEMENT, la hausse est terminée
```

### Q4 : Et si on avait L0 < L1 < L2 < L3 ?

**Réponse :** Le niveau **le plus proche suffit**. C'est la définition.

```
Prix
  │                                                 H4
  │                                       H3       /
  │                             H2       /\       /
  │                   H1       /\       /  \     /
  │                  /\       /  \     /    \   /
  │                 /  \     /    \   /      \ /
  │                /    \   /      \ /        L3
  │               /      \ /        L2
  │              /        L1
  │             /
  └────────────/───────────────────────────────────────→ Temps
              L0

  Pour terminer la hausse en cours :
  → Il suffit de casser L3 (le plus proche)
  → Si on casse L2, on termine un niveau supérieur
  → Si on casse L1, encore un niveau au-dessus
  → Si on casse L0, toute la structure depuis L0 est terminée
```

---

## 6. Résumé : Rang vs Degré

### 6.1 Deux échelles distinctes

| Échelle | Direction | Signification | Connu quand ? |
|---------|-----------|---------------|---------------|
| **Rang** | Bottom-up ↑ | Complexité interne (niveaux construits) | En temps réel |
| **Degré** | Top-down ↓ | Position hiérarchique (par rapport au parent) | À la terminaison |

### 6.2 Règle de calcul

```
RANG : croît pendant la construction
  rang(structure) = max(rang(sous-structures)) + 1

DEGRÉ : se fige à la terminaison
  degré(structure) = degré(parent) + 1
```

### 6.3 L'alignement par le parent

Des structures de complexités différentes (rangs variés) peuvent avoir le **même degré** si elles partagent le même parent.

---

## 7. Invariants (Règles Toujours Vraies)

1. **Composition** : Un parent est construit par ses enfants (structure interne)
2. **Deux issues** : Extension ou Cassure, pas d'entre-deux
3. **Cassure cascade** : La cassure propage récursivement vers les niveaux supérieurs
4. **Stabilité émergente** : Une structure a une identité propre au-delà de son contenu
5. **Trois états** : En croissance 🟢 → Référence 🟠 → Archivée ⬜
6. **Alignement par le haut** : Le degré vient du parent, pas de la complexité interne

---

## 8. Glossaire

| Terme | Définition |
|-------|------------|
| **Impulsion** | Mouvement dans le sens de la tendance |
| **Correction** | Mouvement contre la tendance |
| **Cassure** | Franchissement du niveau de référence → termine la structure |
| **Extension** | La structure grandit (nouveau high/low dans le sens) |
| **Structure interne** | Les sous-vagues qui composent une structure |
| **Rang** | Mesure de complexité interne (bottom-up) |
| **Degré** | Position hiérarchique par rapport au parent (top-down) |
| **En croissance** 🟢 | Structure en construction |
| **Référence** 🟠 | Structure terminée servant de niveau |
| **Archivée** ⬜ | Structure dont le niveau n'est plus pertinent |
