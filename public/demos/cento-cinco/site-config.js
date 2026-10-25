// Configuração do site quando ele está publicado numa hospedagem só de arquivos (sem o servidor).
//
// apiBase: endereço do servidor do painel. Com ele preenchido, os pedidos feitos no site
// caem na hora no painel da casa. Exemplo: apiBase: 'https://pedidos.centoecinco.com.br'
// No servidor, defina também SITE_ORIGINS com o endereço deste site.
//
// Vazio: o site está sendo servido pelo próprio servidor (nada a fazer) ou funciona só
// com pedidos pelo WhatsApp.
window.CC_SITE = { apiBase: '' };

// ----- Não precisa mexer daqui para baixo -----
// Busca o cardápio e as regras do painel antes de montar a página. Se o servidor não
// responder em alguns segundos, o site segue com o cardápio local e pedidos pelo WhatsApp.
(() => {
  const base = String(window.CC_SITE.apiBase || '').trim().replace(/\/+$/, '');
  if (!base || (window.SHOP && window.SHOP.api) || base === location.origin) return;
  const ctrl = 'AbortController' in window ? new AbortController() : null;
  const timer = setTimeout(() => ctrl && ctrl.abort(), 3500);
  window.CC_READY = fetch(`${base}/api/catalog`, { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
    .then(res => (res.ok ? res.json() : null))
    .then(data => { if (data && data.api) window.SHOP = Object.assign(data, { apiBase: base }); })
    .catch(() => { /* servidor fora do ar: pedidos pelo WhatsApp */ })
    .finally(() => clearTimeout(timer));
})();
