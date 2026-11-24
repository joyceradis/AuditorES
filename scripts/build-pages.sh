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
  assets/inter-latin.woff2 \
  assets/inter-OFL.txt \
  assets/municipios.css \
  assets/contratos.css \
  assets/municipio-nav.mjs \
  assets/municipios-catalogo.mjs \
  assets/marca.svg \
  assets/series-locales.mjs \
  assets/home.css \
  assets/home.mjs \
  assets/atlas.css \
  assets/atlas-data.mjs \
  assets/atlas-query.mjs \
  assets/atlas-series.mjs \
  assets/atlas.mjs
do
  mkdir -p -- "$destination/$(dirname -- "$page")"
  install -m 644 -- "$page" "$destination/$page"
done

python3 -m scripts.build_municipios "$destination"
