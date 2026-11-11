#!/bin/sh
# Objectif: Donne à la CSP l'origine du backend de l'environnement, lue dans le env.json injecté au démarrage.
# Périmètre: Extrait l'origine (schéma, hôte, port) de backend.url et l'écrit dans la variable nginx $backend_origin.
# Limites: Sans URL lisible, la CSP retombe sur toute origine https: (comportement précédent) plutôt que de bloquer l'API.
set -eu

ENV_FILE=/usr/share/nginx/html/settings/env.json
OUTPUT=/etc/nginx/conf.d/backend-origin.conf

url=$(sed -n 's/.*"url"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$ENV_FILE" 2>/dev/null | head -n 1)
origin=$(printf '%s' "$url" | sed -n 's#^\(https\{0,1\}://[A-Za-z0-9.:-]*\).*#\1#p')
[ -n "$origin" ] || origin="https:"

printf 'map $host $backend_origin {\n  default "%s";\n}\n' "$origin" > "$OUTPUT"
echo "$0: connect-src backend origin set to $origin"
