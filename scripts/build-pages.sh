#!/usr/bin/env bash
set -euo pipefail

destination=${1:?Informe o diretório de saída.}
mkdir -- "$destination"

for page in \
  index.html \
  municipios/index.html \
  municipios/vitoria/index.html \
  municipios/serra/index.html \
  municipios/colatina/index.html \
  municipios/marechal-floriano/index.html
do
  install -D -m 644 -- "$page" "$destination/$page"
done
