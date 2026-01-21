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

## 3. Le Niveau de Référence

### 3.1 Règle fondamentale

> **Tout mouvement a un niveau de référence dès qu'il existe.**

- **Mouvement haussier** → niveau de référence = son **low**
- **Mouvement baissier** → niveau de référence = son **high**

Le niveau de référence est la borne **opposée** à la direction du mouvement.

### 3.2 Les deux niveaux à surveiller

Tout mouvement/structure a **deux niveaux** à surveiller :

| Niveau | Description | Si cassé |
|--------|-------------|----------|
| **Borne directionnelle** | High (haussier) ou Low (baissier) | Extension |
| **Niveau de référence** | Low (haussier) ou High (baissier) | Terminaison |

### 3.3 Évolution du niveau de référence

Quand une structure grandit (Impulsion → Correction → Impulsion), le niveau de référence **évolue** :

```
Étape 1 : Impulsion I1 seule
          Niveau de référence = low de I1

Étape 2 : I1 + Correction C1 + Impulsion I2
          Niveau de référence = low de I2 (le dernier brin)

Étape 3 : I1 + C1 + I2 + C2 + I3
          Niveau de référence = low de I3 (le dernier brin)
```

> **Le niveau de référence est toujours le dernier brin de la structure.**

### 3.4 Le brin de référence

Le **brin de référence** est le dernier mouvement dans le sens de la structure :

```
Structure n+1 :     [═══════════════════════]
                           │
Sous-structure :    [I1] [C1] [I2]
                               ↑
                          BRIN DE RÉFÉRENCE
                     (son low = niveau de référence de n+1)
```

Le brin de référence appartient à la sous-structure, mais il **détermine l'invalidation de la structure parente**.

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

## 9. Algorithme de Traitement

### 9.1 Entrée

- **M** : Nouveau mouvement (bougie ou structure) avec `high`, `low`, `polarité`
- **S** : Structure active courante (si existe)

### 9.2 Étape 1 : Déterminer le type de dépassement

```
Comparer M avec S :

1. M dépasse S dans le MÊME SENS ?
   → Haussier : M.high > S.high
   → Baissier : M.low < S.low

2. M dépasse S dans le SENS OPPOSÉ ?
   → Haussier : M.low < S.niveau_reference
   → Baissier : M.high > S.niveau_reference

3. M dépasse des DEUX CÔTÉS ? (cas englobant)
   → M.high > S.high ET M.low < S.niveau_reference

4. M ne dépasse PAS ?
   → Aucune des conditions ci-dessus
```

### 9.3 Étape 2 : Appliquer la règle correspondante

**CAS "même sens" → Extension**
```
- S s'étend (nouveau high/low)
- M devient le nouveau brin de référence
- Le niveau de référence de S est mis à jour
```

**CAS "sens opposé" → Terminaison**
```
- S est terminée (état = Archived)
- M devient le début d'une nouvelle structure
- Cette nouvelle structure a pour niveau de référence la borne opposée de M
```

**CAS "englobant" → Traitement séquentiel**
```
- Utiliser l'heuristique de couleur (voir section 10)
- Traiter le premier sens
- Puis traiter le second sens
```

**CAS "pas de dépassement" → Sous-structure interne**
```
- M forme une sous-structure interne à S
- Récursion : traiter M dans le contexte de cette sous-structure
- La sous-structure reste "en attente" de rejoindre S
```

### 9.4 Étape 3 : Vérifier la cascade d'invalidation

Après chaque traitement, vérifier si l'invalidation remonte aux niveaux supérieurs :

```
POUR chaque niveau de la pile (du plus bas au plus haut) :
    SI niveau_reference est cassé :
        → Marquer la structure comme terminée
        → Propager au niveau supérieur
```

---

## 10. Cas Particulier : Bougie Englobante

### 10.1 Définition

Une bougie englobante dépasse **à la fois** le high ET le low de la structure précédente.

C'est équivalent à **deux actions** :
1. Terminer la structure dans un sens
2. Créer une nouvelle impulsion dans l'autre sens

### 10.2 Problème

Sans données tick-by-tick, on ne peut pas connaître la séquence réelle intra-bougie.

### 10.3 Heuristique de la couleur

On utilise la **couleur de la bougie** pour déterminer l'ordre de traitement :

```
Bougie VERTE (close > open) :
  Séquence supposée : Open → Low → High → Close
  → Traiter d'abord le LOW (terminaison/invalidation)
  → Puis traiter le HIGH (extension/nouvelle impulsion)

Bougie ROUGE (close < open) :
  Séquence supposée : Open → High → Low → Close
  → Traiter d'abord le HIGH (terminaison/invalidation)
  → Puis traiter le LOW (extension/nouvelle impulsion)
```

### 10.4 Limitation

Cette heuristique est correcte dans **~95% des cas**.

Dans certains cas exceptionnels (annonces économiques, flash crashes), la séquence réelle peut différer. C'est une **approximation acceptée** en l'absence de données tick.

---

## 11. Sources de Données

### 11.1 Principe fondamental

L'algorithme est **identique** quelle que soit l'unité de temps. Seule la granularité change.

| Source | Cas englobant |
|--------|---------------|
| Bougies (toute timeframe) | Heuristique couleur (~95%) |
| Ticks | Séquence réelle (100%) |

### 11.2 Indépendance de l'unité de temps

L'unité de temps est **libre** :
- 1 jour, 4 heures, 1 heure, 15 minutes, 1 minute...
- Le choix dépend de l'**objectif** et de la **précision** souhaitée

```
Trading long terme   → Bougies journalières ou 4h
Trading intraday     → Bougies 1 minute ou ticks
Analyse de structure → N'importe quelle timeframe
```

### 11.3 Bougies vs Ticks

- **Bougies** : Chaque bougie = un mouvement de niveau 0
- **Ticks** : Chaque tick = un mouvement élémentaire

Avec des données tick, le cas des bougies englobantes **disparaît** :
- On connaît la séquence réelle des prix
- Pas besoin d'heuristique
- Précision de 100%

### 11.4 Recommandation pour le trading intraday

Pour une définition précise de la structure fractale en intraday :
- **Minimum** : Bougies 1 minute
- **Optimal** : Ticks (élimine les 5% d'erreurs potentielles)

---

## 12. Identifiants et Relations

### 12.1 Identifiant unique

Chaque structure reçoit un **ID unique global** (incrémental) :

```
#1, #2, #3, #4, #5...
```

L'ID est **stable** — il ne change jamais une fois attribué.

### 12.2 Niveau (level)

Le niveau n'est **pas** encodé dans l'ID. Il est **calculé dynamiquement** selon le contexte.

```
#4 (level 2 vu depuis #1, mais level 1 vu depuis #3)
```

Le niveau dépend du point de vue — il n'est pas intrinsèque à la structure.

### 12.3 Relations parent/composantes

| Relation | Cardinalité | Description |
|----------|-------------|-------------|
| `parent_id` | 0 ou 1 | Un seul parent direct (ou null si racine/en attente) |
| `components` | 0 à N | Liste des composantes directes |

**Structure arborescente :**

```
         ┌─────────────────┐
         │   Structure A   │  ← 1 seul parent (ou null)
         │      (#1)       │
         └────────┬────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌───────┐    ┌───────┐    ┌───────┐
│  #2   │    │  #3   │    │  #4   │  ← plusieurs composantes
└───────┘    └───────┘    └───────┘
```

### 12.4 Règle d'assignation du parent

Le `parent_id` est assigné **au moment où la structure devient une composante formelle**, c'est-à-dire quand elle casse une borne et "rejoint" une structure parente.

```
AVANT cassure :
- Structure X en formation dans le contexte de B
- X.parent_id = null (pas encore de parent)
- X est dans un état "interne" / "en attente"

APRÈS cassure (X casse la borne de A) :
- X devient une composante formelle de A
- X.parent_id = A (parent assigné pour la première fois)
```

**Tant qu'une structure est "interne" / "en attente", elle n'a pas de parent.**

### 12.5 Promotion d'une sous-structure

Quand une sous-structure B (interne à A) casse une borne de A :

```
Structure A (#1)
├── I1 (#2)
├── C1 (#3)
├── I2 (#4)
│   └── B se forme en interne (B.parent = null)
│
│   ... B casse la borne de A ...
│
├── B (#5) ← promu, B.parent = #1
│   └── i1 (#6), c1 (#7), i2 (#8) ← restent enfants de B
└── X (#9) ← promu, X.parent = #1
```

- B et X deviennent des composantes directes de A
- Les enfants de B restent enfants de B (inchangés)
- Chaque structure a **un seul parent** à tout moment

---

## 13. Les Trois États d'une Structure

### 13.1 Cycle de vie

Une structure passe par **trois états** dans l'ordre :

```
┌─────────────┐     cassure      ┌─────────────┐     n'est plus     ┌─────────────┐
│   GROWING   │ ───────────────► │  REFERENCE  │ ─────────────────► │  ARCHIVED   │
│ (croissance)│   du niveau de   │ (référence) │    référence       │  (archivée) │
└─────────────┘    référence     └─────────────┘                    └─────────────┘
      🟢                               🟠                                 ⬜
```

### 13.2 Description des états

| État | Description | Utilité |
|------|-------------|---------|
| **Growing** 🟢 | Structure active, peut encore s'étendre | Suivi temps réel |
| **Reference** 🟠 | Terminée, sert de niveau de référence pour le parent | Détection des cassures |
| **Archived** ⬜ | N'est plus référence, aucune utilité active | Historique uniquement |

### 13.3 Transitions

**Growing → Reference**
- Déclenché quand : le niveau de référence de la structure est cassé (sens opposé)
- La structure est "solidifiée" — elle ne peut plus s'étendre
- Elle devient le niveau de référence pour détecter la cassure du niveau supérieur

**Reference → Archived**
- Déclenché quand : la structure parente (qui utilisait cette référence) est elle-même terminée
- La structure n'a plus aucune utilité active
- Peut être libérée de la mémoire (optimisation)

### 13.4 Exemple

```
Structure A (n+1) : Growing 🟢
  └── Sous-structure : [I1] [C1] [I2]
                                  ↑
                             brin de référence

Étape 1 : Le niveau de référence de A (low de I2) est cassé
  → A passe en Reference 🟠
  → A sert maintenant de référence pour le niveau n+2

Étape 2 : Le niveau n+2 est aussi cassé
  → A passe en Archived ⬜
  → A n'a plus d'utilité active
```

---

