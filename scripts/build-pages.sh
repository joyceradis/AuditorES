#!/usr/bin/env bash
set -euo pipefail

destination=${1:?Informe o diretório de saída.}
mkdir -p -- "$destination"

for page in \
  index.html \
  assets/public.css \
  assets/atlas.css \
  municipios/index.html \
  municipios/vitoria/index.html \
  municipios/serra/index.html \
  municipios/colatina/index.html \
  municipios/marechal-floriano/index.html
do
  mkdir -p -- "$destination/$(dirname -- "$page")"
  install -m 644 -- "$page" "$destination/$page"
done
