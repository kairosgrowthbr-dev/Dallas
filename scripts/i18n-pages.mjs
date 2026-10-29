import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Depois da build, gera dist/en/index.html e dist/es/index.html a partir do
 * dist/index.html em português: troca cada texto e atributo pelo dicionário de
 * src/i18n/<idioma>.json (a chave é o texto em português), ajusta os caminhos
 * relativos para a subpasta, o idioma da página, o link canônico e o seletor.
 */
const SITE = 'https://ryandalatea1.github.io/Dallas/';
const LANGS = {
  en: { html: 'en', locale: 'en_US' },
  es: { html: 'es', locale: 'es_ES' },
};

function translate(html, dict) {
  const swap = (raw) => {
    const key = raw.replace(/\s+/g, ' ').trim();
    if (!key || !(key in dict)) return raw;
    const lead = raw.match(/^\s*/)[0];
    const trail = raw.match(/\s*$/)[0];
    return lead + dict[key] + trail;
  };
  // separa scripts e estilos para não mexer no conteúdo deles
  const parts = html.split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>)/);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part;
      return part
        .replace(/>([^<]+)</g, (m, text) => `>${swap(text)}<`)
        .replace(/\b(alt|aria-label|placeholder|title|content)="([^"]*)"/g, (m, attr, val) => `${attr}="${swap(val)}"`);
    })
    .join('');
}

export function buildLanguagePages(outDir) {
  const base = readFileSync(resolve(outDir, 'index.html'), 'utf8');
  for (const [code, meta] of Object.entries(LANGS)) {
    const dict = JSON.parse(readFileSync(resolve('src/i18n', `${code}.json`), 'utf8'));
    let html = translate(base, dict);
    // caminhos relativos: a página fica uma pasta abaixo
    html = html.replace(/\b(href|src|poster|content|srcset)="\.\//g, '$1="../');
    html = html.replace(/<html lang="[^"]*"/, `<html lang="${meta.html}"`);
    html = html.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${SITE}${code}/"`);
    html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${SITE}${code}/"`);
    html = html.replace(/<meta property="og:locale" content="[^"]*"/, `<meta property="og:locale" content="${meta.locale}"`);
    // seletor: o idioma atual fica marcado
    html = html.replace(/(<a[^>]*data-lang=")(pt|en|es)("[^>]*?)( aria-current="true")?>/g, (m, a, l, b) => `${a}${l}${b}${l === code ? ' aria-current="true"' : ''}>`);
    mkdirSync(resolve(outDir, code), { recursive: true });
    writeFileSync(resolve(outDir, code, 'index.html'), html);
  }
}

/** Plugin do Vite: roda no fim da build. */
export function languagePages() {
  let outDir = 'dist';
  return {
    name: 'dalas-language-pages',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      buildLanguagePages(outDir);
    },
  };
}
