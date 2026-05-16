# ADR-002 — Bougie englobante : nouvelle structure attachée au parent (promotion §12.4) ?

## État
Accepted (2026-05-16) — Option C entérinée : le lien de causalité est porté par `target.breakingMove` (anciennement `correction`, cf. ADR-004), qui est déjà assigné à l'engulfing candidate dans `#handleEngulfingCandle` (PriceMoveStructure.ts:233). La nouvelle structure reste une racine indépendante en termes de `parentStructure`, ce qui simplifie la traversée et respecte l'invariant "parent terminé ne reprend pas Growing".

## Contexte

Le protocole §10.1 décrit qu'une bougie englobante (qui casse à la fois la borne directionnelle et le niveau de référence) équivaut à **deux actions simultanées** :

1. **Terminaison** du target par cassure (Growing → Reference).
2. **Création d'une nouvelle impulsion** dans l'autre sens.

Le protocole §12.4 précise qu'une sous-structure qui casse une borne de son parent **devient une composante directe** de ce parent (`parent_id` assigné). Cela formalise la promotion d'une structure interne en composante.

L'implémentation actuelle (`PriceMoveStructure.#handleEngulfingCandle`) :
- Réalise bien l'action 1 (terminate du target).
- Crée la nouvelle impulsion (`this.#growingMoves.add(candidate)`) **sans lien hiérarchique avec le target terminé**. Elle devient une racine isolée.

**Conséquence** : pour un consommateur qui voudrait détecter "ce mouvement est né d'une cassure de cette structure", l'information est perdue. La nouvelle structure n'a pas `parentStructure = target`, et `target.subStructures` ne la contient pas.

L'audit (`docs/validation-protocole.md` §11-13) confirme cet écart entre spec et code.

## Options

### A. Statu quo — racine orpheline
- ✅ Simple, comportement actuel.
- ✅ Évite des subStructures rétroactives qui pourraient compliquer la traversée.
- ❌ Perd l'information de causalité (cassure → nouvelle impulsion).
- ❌ Écart documenté avec la spec.

### B. Promotion stricte §12.4 — la nouvelle impulsion devient `subStructure` du parent terminé
- ✅ Conforme à la spec.
- ✅ Permet à un consommateur de remonter la chaîne causale.
- ❌ Crée des subStructures sur un move déjà Reference — invariant "Growing parent → Growing children" peut ne plus tenir.
- ❌ Si Archive automatique (cf. ADR-001) est actif, la nouvelle impulsion serait archivée avec son parent — perte d'info.

### C. Lien "correction" sans subStructure
- Utiliser le champ `correction` (déjà existant, `target.correction = candidate`) comme lien sémantique. La nouvelle impulsion **ne devient pas** subStructure mais `target.correction` pointe vers elle.
- ✅ Lien causal préservé.
- ✅ Pas de subStructure rétroactive (l'invariant Growing/Reference reste propre).
- ✅ Champ déjà utilisé pour la cassure simple — extension cohérente.
- ⚠️ Sémantique de `correction` à clarifier (déjà partiellement assignée ligne 214 du orchestrator) : représente "le candidat qui a tué cette structure", pas "la nouvelle structure née de la cassure". À distinguer.

### D. Champ dédié `successor`
- Ajouter `successor?: PriceMove` sur PriceMove, distinct de `correction`.
- `target.successor = newImpulsion` lors d'une bougie englobante.
- ✅ Sémantique claire (succession, pas simple terminaison).
- ❌ Nouveau champ à propager dans serialization, validation, doc.

## Recommandation

**Option C (lien via `correction`)** comme étape transitoire. C'est minimal : le champ existe déjà. Documenter clairement dans `data-models.md` que `correction` est la bougie/structure qui a cassé le target, et que dans le cas englobant cette même structure devient elle-même Growing.

Si l'usage révèle un besoin de distinguer "la bougie qui a cassé" et "la nouvelle impulsion née", passer à l'option D.

L'option B (subStructure) est déconseillée tant que `archiveOrphanedStructures` (ADR-001) n'est pas tranché, car elle créerait des dépendances Growing-sous-Reference qui compliquent le GC.

## Conséquences si tranché

- **Code** : pas de changement si on confirme l'option C — `target.correction = candidate` est déjà fait. Ajouter un commentaire dans `#handleEngulfingCandle` pour expliciter la double sémantique de `correction`.
- **Doc** : `data-models.md` clarifie `correction` (« breaking move that terminated this structure ; may itself transition Growing if it was an engulfing candle »).
- **Test** : ajouter un test qui après bougie englobante vérifie : `target.correction === newImpulsion` ET `newImpulsion.state === 'growing'`.
- **Optionnel** : exposer un helper `engine.getSuccessor(move)` qui retourne `move.correction` si ce dernier est Growing, undefined sinon.
