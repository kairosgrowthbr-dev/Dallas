#!/bin/bash
# Monta "Radar Dalas.app" e o zip para instalar no Mac.
# Uso: bash radar/app-mac/montar-app.sh <pasta-de-saida>
set -e
AQUI="$(cd "$(dirname "$0")" && pwd)"; RADAR="$(cd "$AQUI/.." && pwd)"; SAIDA="${1:-$RADAR/../dist-mac}"
node "$RADAR/montar.mjs" >/dev/null
APP="$SAIDA/Radar Dalas.app"
rm -rf "$APP"; mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources/radar"
cp "$AQUI/Info.plist" "$APP/Contents/"; printf 'APPL????' > "$APP/Contents/PkgInfo"
cp "$AQUI/RadarDalas" "$APP/Contents/MacOS/"; chmod 755 "$APP/Contents/MacOS/RadarDalas"
cp "$AQUI/icone.icns" "$APP/Contents/Resources/"
cp -R "$RADAR/index.html" "$RADAR/servidor-mac.pl" "$RADAR/vendor" "$APP/Contents/Resources/radar/"
[ -d "$RADAR/dados" ] && cp -R "$RADAR/dados" "$APP/Contents/Resources/radar/"
cp "$AQUI/COMO-INSTALAR.txt" "$SAIDA/"
( cd "$SAIDA" && rm -f Radar-Dalas-Mac.zip && zip -qry Radar-Dalas-Mac.zip "Radar Dalas.app" COMO-INSTALAR.txt )
echo "$SAIDA/Radar-Dalas-Mac.zip"
