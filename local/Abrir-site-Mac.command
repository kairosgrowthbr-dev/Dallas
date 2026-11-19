#!/bin/bash
# Abre o site da Dalas Marketing no navegador, em http://localhost:8080
# (ou a próxima porta livre). Para parar, feche esta janela.
cd "$(dirname "$0")/site" || { echo 'Não achei a pasta "site". Descompacte o zip inteiro.'; read -r; exit 1; }

PORT=8080
while (echo >"/dev/tcp/127.0.0.1/$PORT") >/dev/null 2>&1; do PORT=$((PORT + 1)); done
URL="http://localhost:$PORT/"

echo ""
echo "  Site da Dalas Marketing rodando em $URL"
echo "  Inglês: ${URL}en/   Espanhol: ${URL}es/"
echo ""
echo "  Para parar, feche esta janela."
echo ""
( sleep 1.5; open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null ) &

# python3 só se for de verdade (no Mac sem as ferramentas de desenvolvedor, /usr/bin/python3 é um atalho que pede instalação)
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
