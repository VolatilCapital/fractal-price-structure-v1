# Protocole de Construction de la Structure Fractale

> Document technique définissant les règles précises de prise de décision pour la construction de la structure fractale des prix.

---

## 1. Axiomes de Base

Il n'existe que deux types de mouvements de prix :

1. **Mouvement Haussier** (Up) — Le prix monte
2. **Mouvement Baissier** (Down) — Le prix descend

## 2. Les Trois Cas de Figure

Pendant la suite de mouvements de prix, il n'existe que trois cas de figure :

1. **Dépassement dans le même sens** — Le mouvement est dépassé dans sa direction
2. **Dépassement dans le sens opposé** — Le mouvement est dépassé dans la direction inverse
3. **Pas de dépassement** — Le mouvement n'est pas dépassé

## 3. Les Deux Niveaux de Référence

### 3.1 Mouvement élémentaire (niveau 0)

Un mouvement élémentaire (issu d'une bougie) n'a que ses propres bornes :
- **High** : borne haute
- **Low** : borne basse

Il n'a pas de niveau de référence interne car il n'a pas de composantes.

### 3.2 Structure composée (niveau n+1)

Dès qu'une structure possède des composantes internes (ex: Impulsion + Correction + Impulsion), elle a **deux niveaux de référence** :

**Pour une structure HAUSSIÈRE :**
- **Borne haute (H)** : le plus haut atteint → cassure = extension
- **Niveau de référence (L_ref)** : le low de la dernière impulsion → cassure = structure terminée

**Pour une structure BAISSIÈRE :**
- **Borne basse (L)** : le plus bas atteint → cassure = extension
- **Niveau de référence (H_ref)** : le high de la dernière impulsion → cassure = structure terminée

### 3.3 Règle fondamentale

> Une structure en cours a toujours deux niveaux à surveiller :
> 1. Sa **borne directionnelle** (extension si cassée dans le sens)
> 2. Son **niveau de référence** (terminaison si cassé dans le sens opposé)

---

## 4. Conséquences des Trois Cas

### 4.1 Dépassement dans le même sens → Impulsion

Si deux mouvements se suivent et que le deuxième dépasse dans le sens du premier :
- Création d'une **impulsion de niveau n+1**
- Les deux mouvements deviennent les **composantes** de cette impulsion
- Le deuxième mouvement devient une **référence** (utile pour détecter un retournement)

### 4.2 Dépassement dans le sens opposé → Retournement

Si deux mouvements se suivent et que le deuxième dépasse dans le sens opposé :
- C'est un **retournement**
- L'impulsion n+1 est **terminée** (devient référence)

### 4.3 Pas de dépassement → Sous-structure en attente

Si le deuxième mouvement ne dépasse ni le high ni le low :
- Le mouvement **n'est pas ignoré**
- Il peut former sa propre **sous-structure interne** (avec ses propres niveaux relatifs)
- Il reste **en attente** de rejoindre la structure parente

---

## 5. Structures Imbriquées et Coexistence

### 5.1 Principe fondamental

Les structures **coexistent** à différents niveaux hiérarchiques. Elles ne disparaissent pas quand elles rejoignent une structure parente.

```
Niveau A :  [Correction de A]  →  [Impulsion de A]
                                        │
                                  composée de...
                                        │
                                        ▼
Niveau B :                        [i1] [c1] [i2] [c2] [i3]
```

- Le mouvement au niveau A est **composé** des mouvements au niveau B
- Les deux niveaux **coexistent** — B ne disparaît pas
- B peut lui-même contenir une sous-structure C, etc.

### 5.2 Niveaux relatifs

Chaque structure a son propre "niveau 0 relatif", indépendant des autres structures :

- Structure A a ses niveaux internes
- Structure B (sous-structure de A) a ses propres niveaux internes
- Structure C (sous-structure de B) a ses propres niveaux internes

### 5.3 Quand une sous-structure rencontre sa structure parente

Quand une sous-structure B (interne) grandit et casse une borne de la structure A (parente) :

**Cassure de la borne haute de A (même sens pour une hausse) :**
- B complète devient la **correction de A** (de H_A jusqu'au plus bas de B)
- A s'étend avec une nouvelle impulsion
- Cette nouvelle impulsion de A est **composée** de la structure interne de B
- Les deux niveaux coexistent

**Cassure du niveau de référence de A (sens opposé) :**
- A est **terminée** (devient référence)
- Une nouvelle structure commence au niveau de A
- Cette nouvelle structure va de la borne haute de A jusqu'au nouveau point bas

### 5.4 Propriétés à tracker pour chaque structure

| Propriété | Description |
|-----------|-------------|
| `id` | Identifiant unique |
| `polarité` | Up ou Down |
| `borne_haute` | High de la structure |
| `borne_basse` | Low de la structure |
| `niveau_reference` | Le niveau qui, si cassé, termine la structure |
| `parent` | Structure parente (si existe) |
| `sous_structure` | Structure enfant active (si existe) |
| `état` | Growing / Reference / Archived |

---

## 6. Règle d'Invalidation en Cascade

### 6.1 Principe

L'invalidation se vérifie **niveau par niveau**, du plus bas vers le plus haut.

- Pour savoir si **A** est invalidée → on regarde **L_ref_A**
- Pour savoir si **B** est invalidée → on regarde **L_ref_B**
- Pour savoir si **C** est invalidée → on regarde **L_ref_C**

**Chaque niveau a son propre niveau de référence. On ne saute pas de niveaux.**

### 6.2 Algorithme de cascade

Quand un nouveau mouvement arrive :

```
1. Vérifier au niveau de C : L_ref_C est cassé ?
   → Si oui : C est terminée
   → Cela peut créer un nouveau mouvement au niveau B

2. Vérifier au niveau de B : L_ref_B est cassé ?
   → Si oui : B est terminée
   → Cela peut créer un nouveau mouvement au niveau A

3. Vérifier au niveau de A : L_ref_A est cassé ?
   → Si oui : A est terminée
```

### 6.3 La sous-structure détermine la terminaison du parent

> La **fin d'un mouvement au niveau N** est déterminée par la **cassure du niveau de référence au niveau N-1** (la sous-structure).

Exemple :
- L'impulsion de A est composée de [i1, c1, i2, c2, i3] au niveau B
- Pour savoir quand l'impulsion de A se termine, on surveille L_ref_B (le low de i3)
- Quand L_ref_B est cassé → l'impulsion de A est terminée

---

## 7. Invalidations Multiples Simultanées

### 7.1 C'est possible

Plusieurs niveaux peuvent être invalidés en même temps :

**Cas 1 : Un mouvement fort traverse plusieurs niveaux**

```
Prix
  │
  │      L_ref_A ┄┄┄┄┄┄┄┄┄┄┄┄┄┄
  │
  │         L_ref_B ┄┄┄┄┄┄┄┄┄┄┄
  │
  │            L_ref_C ┄┄┄┄┄┄┄┄
  │
  │                        ╲
  │                         ╲  ← Un mouvement fort casse
  │                          ╲    C, B et A d'un coup
  │                           ╲
```

**Cas 2 : Les niveaux de référence coïncident**

Par coïncidence, L_ref_B peut être exactement égal à L_ref_A. Une seule cassure invalide alors les deux structures.

### 7.2 La règle reste la même

Dans tous les cas, on vérifie niveau par niveau en remontant. Chaque niveau dont le niveau de référence est cassé est invalidé.

---

## 8. Schéma Récapitulatif

### Structure A avec sous-structure B en formation

```
Prix
  │
  │                                        H_A ┄┄┄┄┄┄ Borne haute de A
  │                                       ╱╲
  │                                      ╱  ╲
  │                                     ╱    ╲      h_b
  │                                    ╱      ╲     ╱╲
  │                H1                 ╱        ╲   ╱  ╲
  │               ╱╲                 ╱          ╲ ╱    ╲
  │              ╱  ╲               ╱            ╳      ╲
  │             ╱    ╲             ╱            l_b      ╲
  │            ╱      ╲           ╱       ┌──────────────────┐
  │           ╱        ╲         ╱        │   B en formation │
  │          ╱          ╲       ╱         └──────────────────┘
  │         ╱            ╲     ╱
  │        ╱              ╲   ╱
  │       ╱                ╲ ╱
  │      ╱                  L1 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ NIVEAU DE RÉFÉRENCE de A
  │     ╱
  │    ╱
  │   ╱
  L0 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ Borne basse de A
  │
  └──────────────────────────────────────────────────→ Temps

        I1         C1              I2           B

  Structure A : Haussière [L0 → H_A]
  Composantes de A : I1, C1, I2
  Niveau de référence de A : L1

  Structure B : Sous-structure baissière [h_b → l_b]
  B est contenue entre H_A et L1
  B a son propre niveau de référence interne
```

---

