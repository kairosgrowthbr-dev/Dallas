// Monta o index.html da versão local a partir do painel.html (o mesmo arquivo publicado no claude.ai).
// O claude.ai embrulha a página num documento completo; aqui fazemos o mesmo para abrir no navegador.
// Uso: node radar/montar.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));
const painel = readFileSync(join(aqui, 'painel.html'), 'utf8');
const topo = '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n<!-- Gerado por montar.mjs a partir de painel.html. Edite o painel.html e rode: node radar/montar.mjs -->\n';
writeFileSync(join(aqui, 'index.html'), topo + painel + '\n</body>\n</html>\n');
console.log('radar/index.html atualizado');
