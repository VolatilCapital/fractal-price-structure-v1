# Charte Couleurs — Fractal Visualizer

## Principe fondamental

Deux axes visuels orthogonaux ne partagent JAMAIS la même couleur.
Chaque couleur porte un sens unique et cohérent dans tout le visualiseur.

---

## Axes visuels

### Axe 1 — Direction (Polarité)

La couleur de remplissage (fill) identifie la direction du mouvement.

| Concept        | Hex       | Nom        | Usage                                       |
|----------------|-----------|------------|---------------------------------------------|
| Haussier (Up)  | `#42A5F5` | Blue 400   | Fill des moves Up, corps des bougies bull   |
| Baissier (Down)| `#EF5350` | Red 400    | Fill des moves Down, corps des bougies bear |

### Axe 2 — Dynamique structurelle (Niveaux)

Les couleurs sémantiques des lignes de niveau Reference.

| Concept                      | Hex       | Nom        | Usage                           |
|------------------------------|-----------|------------|---------------------------------|
| Accroissement (extension)    | `#66BB6A` | Green 400  | Ligne du côté extension         |
| Cassure (invalidation)       | `#FFA726` | Orange 400 | Ligne du côté invalidation      |

**Logique directionnelle** :
- Move Up : haut = accroissement (vert), bas = cassure (orange)
- Move Down : haut = cassure (orange), bas = accroissement (vert)

### Axe 3 — Cycle de vie (État)

L'état est exprimé par le **style visuel** (opacité, bordure), pas par la teinte.
La direction (bleu/rouge) reste toujours visible.

| État       | Fill Opacity | Stroke        | Signal visuel                    |
|------------|-------------|---------------|----------------------------------|
| Growing    | 0.25        | solide, épais | Vif, actif, en construction      |
| Reference  | 0.12        | solide, fin   | Stable, figé, sert de niveau     |
| Archived   | 0.06        | solide, fin   | Discret, historique              |

**Indicateurs d'état** (pastilles UI, toggles du panneau filtres) :

| État       | Hex       | Nom        | Logique                          |
|------------|-----------|------------|----------------------------------|
| Growing    | `#66BB6A` | Green 400  | Croissance = vie, construction   |
| Reference  | `#FFA726` | Orange 400 | Figé = niveau de référence       |
| Archived   | `#BDBDBD` | Grey 400   | Historique = inactif             |

### Axe 4 — Événements structurels

Flash au curseur quand un événement se produit.

| Événement  | Hex       | Couleur    | Logique                          |
|------------|-----------|------------|----------------------------------|
| Created    | `#66BB6A` | Vert       | Naissance = début de croissance  |
| Extended   | `#42A5F5` | Bleu       | Continuation = mouvement         |
| Terminated | `#FFA726` | Orange     | Fin = devient référence/cassure  |
| Archived   | `#BDBDBD` | Gris       | Classé = historique              |

---

## Éléments neutres

| Élément             | Hex       | Nom          |
|---------------------|-----------|--------------|
| Mèche bougie        | `#757575` | Grey 600     |
| Curseur temps       | `#FFFFFF` | White        |
| Grille              | `#E0E0E0` | Grey 300     |
| Liens parent-enfant | `#9E9E9E` | Grey 500     |
| Fond                | transparent|              |

---

## Hiérarchie fractale

### Rang (bottom-up, complexité)

Le rang détermine l'**épaisseur** et la **taille** des éléments visuels :
- Rang 0 : trait fin (0.5px), labels masqués, opacité réduite
- Rang 1+ : épaisseur croissante, labels visibles selon densité
- Rang élevé : trait épais, label grande taille, très visible

### Degré (top-down, hiérarchie)

Le degré utilise une palette arc-en-ciel (chips dans le panneau filtres) :
- D0 : Pink `#E91E63`
- D1 : Purple `#9C27B0`
- D2 : Indigo `#3F51B5`
- D3 : Blue `#2196F3`
- D4 : Cyan `#00BCD4`
- D5 : Teal `#009688`

Le degré n'est affiché que dans les labels texte et les tooltips.

---

## Règles de lecture

1. **Bleu = monte, Rouge = descend** — toujours, partout
2. **Vert = croissance/extension** — ligne d'accroissement, état Growing, événement Created
3. **Orange = cassure/fin** — ligne d'invalidation, état Reference, événement Terminated
4. **Gris = passé/inactif** — état Archived, événement Archived
5. **Plus c'est opaque et épais = plus c'est important** — rang élevé, état actif
6. **Plus c'est transparent = moins c'est pertinent** — rang bas, état archivé, futur
