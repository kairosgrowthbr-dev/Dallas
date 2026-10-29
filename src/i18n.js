import en from './i18n/en.json';
import es from './i18n/es.json';

/**
 * Idiomas do site: português (padrão, na raiz), inglês (/en/) e espanhol (/es/).
 * O HTML de cada idioma é gerado na build (scripts/i18n-pages.mjs); aqui ficam
 * os textos que o JavaScript monta na hora (diagnóstico, conversa do CRM etc.).
 * A chave é o próprio texto em português; sem tradução, fica o português.
 */
export const lang = (document.documentElement.lang || 'pt').slice(0, 2);
const DICT = lang === 'en' ? en : lang === 'es' ? es : null;

export function t(text, vars) {
  let out = (DICT && DICT[text]) || text;
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
  return out;
}
