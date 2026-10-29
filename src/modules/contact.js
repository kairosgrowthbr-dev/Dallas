import { t } from '../i18n.js';

/** Monta o link do WhatsApp com uma mensagem (vazio se o número não foi configurado). */
export function waLink(config, text) {
  const digits = (config.whatsapp || '').replace(/\D/g, '');
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent(text || t(config.whatsappMessage || ''))}`;
}

/** Liga os botões de contato aos dados de src/config.js. */
export function initContact(config) {
  const whatsapp = waLink(config);
  const email = config.email ? `mailto:${config.email}` : '';
  const handle = (config.instagram || '').replace('@', '');
  const instagram = handle ? `https://instagram.com/${handle}` : '';

  document.querySelectorAll('[data-whatsapp]').forEach((el) => {
    const href = whatsapp || email;
    if (!href) return;
    el.href = href;
    if (whatsapp) {
      el.target = '_blank';
      el.rel = 'noopener';
    }
  });

  const ig = document.getElementById('footer-instagram');
  if (ig) {
    if (instagram) {
      ig.href = instagram;
      ig.target = '_blank';
      ig.rel = 'noopener';
      const label = document.getElementById('footer-handle');
      if (label) label.textContent = `@${handle}`;
    } else {
      ig.hidden = true;
    }
  }
}
