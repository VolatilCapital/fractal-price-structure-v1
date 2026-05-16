# ADR-006 — Sort du dossier `/src/` racine pré-monorepo

## État
Accepted (2026-05-16) — Option D appliquée.

## Contexte

L'audit du sous-agent de régénération doc a observé :

> `/src/` racine existe encore (~25 fichiers, version pré-monorepo). Référence l'ancien chemin `domain/structure/PriceMoveStructure`. Non importé par `packages/*`, pas dans `pnpm-workspace.yaml`.

Le projet a migré vers un monorepo `packages/core/` + `packages/visualizer/`. Mais l'ancien `/src/` racine est resté en place comme **artefact historique**. Il n'est référencé par :

- Aucun `package.json` ou `tsconfig.json` actif (à vérifier).
- Aucun import depuis `packages/*` (à vérifier par `grep -r "from ['\"]\\.\\./\\.\\./src" packages/`).
- Le `pnpm-workspace.yaml` ne le mentionne pas.

**Symptômes** :
- Confusion pour les nouveaux contributeurs (« quel `/src` est le vrai ? »).
- Risque de divergence : un fix appliqué dans `packages/core/src/` mais pas dans `/src/` peut donner l'illusion d'un bug si quelqu'un lit l'ancien fichier par erreur.
- Pollution du `git grep` et de la navigation IDE.

## Options

### A. Statu quo — garder `/src/` comme archive vivante
- ✅ Pas de risque de perdre quelque chose.
- ❌ Confusion permanente.
- ❌ Dead code détecté par l'audit.

### B. Suppression complète de `/src/`
- ✅ Élimine la confusion.
- ✅ Réduit la surface de code morte.
- ⚠️ Action irréversible (sauf via git history).
- ⚠️ Doit être précédée d'une vérification stricte qu'aucun outil (script, CI, build legacy) ne le référence.

### C. Déplacement vers `archive/legacy-src/` + README expliquant
- ✅ Préserve l'historique sans confondre.
- ✅ Action réversible.
- ❌ Maintient du code mort dans le repo.

### D. Suppression mais avec un commit dédié "archive: remove pre-monorepo /src/"
- ✅ Disponible dans `git log` et `git revert` si jamais on en a besoin.
- ✅ Élimine la confusion à terme.

## Recommandation

**Option D** — suppression dans un commit isolé, après vérification :

1. `grep -rn "from ['\"]\\.\\./\\.\\./\\.\\./src" packages/` retourne vide.
2. `grep -rn "'\\./src/" *.json *.yaml *.yml *.cjs *.mjs` (racine) retourne vide.
3. Pas de CI ou de script qui pointe sur `./src/`.

Si toutes les vérifs sont vertes, supprimer en un commit séparé bien décrit. Le contenu reste accessible via `git show HEAD~N:src/...` si besoin.

## Conséquences si tranché

- **Suppression** : `rm -rf src/` ; mise à jour de `tsconfig.json` racine si nécessaire (vérifier qu'il ne référence pas `src/`).
- **Doc** : `source-tree-analysis.md` déjà mis à jour pour ne plus mentionner `/src/` comme actif.
- **CI** : aucune action attendue (le `/src/` legacy n'est pas dans les workflows).
- **Risque** : nul si les vérifs passent. Si on découvre tardivement un consommateur, `git revert` est trivial.
