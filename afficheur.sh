#!/usr/bin/env bash
# Lance l'afficheur du projet fractal-price-structure.
#
# Modes :
#   ./afficheur.sh            → visualiseur principal (Vue 3 + Vuetify + Observable Plot)
#   ./afficheur.sh progressive → diaporama SVG bougie-par-bougie (docs/empirical/progressive/)
#   ./afficheur.sh help        → affiche cette aide

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

MODE="${1:-main}"

case "$MODE" in
  main|"")
    echo "→ Lancement du visualiseur principal (Vue 3) ..."
    echo "  URL par défaut : http://localhost:5173"
    echo "  Ctrl+C pour arrêter."
    exec pnpm visualizer:dev
    ;;

  progressive|progressif|svg)
    PORT="${2:-8765}"
    DIR="$ROOT_DIR/docs/empirical/progressive"
    if [[ ! -d "$DIR" ]]; then
      echo "✗ Dossier introuvable : $DIR" >&2
      echo "  Régénère-le avec : pnpm exec tsx tools/render-progressive.ts" >&2
      exit 1
    fi
    echo "→ Lancement du diaporama SVG bougie-par-bougie ..."
    echo "  URL : http://localhost:$PORT/index.html"
    echo "  Ctrl+C pour arrêter."
    cd "$DIR"
    exec python3 -m http.server "$PORT"
    ;;

  help|-h|--help)
    sed -n '2,7p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    exit 0
    ;;

  *)
    echo "✗ Mode inconnu : $MODE" >&2
    echo "  Utilise : ./afficheur.sh [main|progressive|help]" >&2
    exit 1
    ;;
esac
