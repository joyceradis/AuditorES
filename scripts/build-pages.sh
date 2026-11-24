#!/usr/bin/env bash
set -euo pipefail

destination=${1:?Informe o diretório de saída.}
mkdir -p -- "$destination"
if [[ -n "$(find "$destination" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
  echo "Use um diretório de saída vazio." >&2
  exit 1
fi

for page in \
  index.html \
  assets/public.css \
  assets/home.css \
  assets/home.mjs \
  assets/atlas.css \
  assets/atlas-data.mjs \
  assets/atlas.mjs \
  municipios/index.html \
  municipios/vitoria/index.html \
  municipios/serra/index.html \
  municipios/colatina/index.html \
  municipios/marechal-floriano/index.html
do
  mkdir -p -- "$destination/$(dirname -- "$page")"
  install -m 644 -- "$page" "$destination/$page"
done
