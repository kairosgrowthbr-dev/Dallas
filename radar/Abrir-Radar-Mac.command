#!/bin/bash
# Abre o Radar Dalas no navegador, em http://localhost:8090 (ou a próxima porta livre).
# Para parar, feche esta janela.
cd "$(dirname "$0")" || exit 1
if [ ! -f index.html ]; then
  echo 'Não achei o index.html. Descompacte o zip inteiro.'
  read -r
  exit 1
fi

# 1) o Perl que vem em todo Mac
if command -v perl >/dev/null 2>&1 && perl -MIO::Socket::IP -e 1 >/dev/null 2>&1; then
  exec perl ./servidor-mac.pl .
fi

# 2) se não tiver Perl, tenta Python, Ruby ou Node
PORT=8090
while (echo >"/dev/tcp/127.0.0.1/$PORT") >/dev/null 2>&1; do PORT=$((PORT + 1)); done
URL="http://localhost:$PORT/"
echo ""
echo "  Radar Dalas:  $URL"
echo ""
echo "  Para parar, feche esta janela."
echo ""
( sleep 1.5; open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null ) &
if command -v python3 >/dev/null 2>&1 && { [ "$(command -v python3)" != "/usr/bin/python3" ] || xcode-select -p >/dev/null 2>&1 || [ "$(uname)" != "Darwin" ]; }; then
  exec python3 -m http.server "$PORT" --bind 127.0.0.1
elif command -v ruby >/dev/null 2>&1 && ruby -e 'require "webrick"' >/dev/null 2>&1; then
  exec ruby -run -e httpd . -p "$PORT" --bind-address=127.0.0.1
elif command -v npx >/dev/null 2>&1; then
  exec npx --yes serve -l "$PORT" .
else
  echo "Não achei como abrir um servidor neste Mac."
  echo "Instale o Node.js em https://nodejs.org e abra este arquivo de novo."
  read -r
fi
