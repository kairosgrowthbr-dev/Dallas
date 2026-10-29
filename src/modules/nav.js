import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { t } from '../i18n.js';

/** Barra que ganha fundo ao rolar, link ativo conforme a seção na tela e o menu do celular. */
export function initNav() {
  const nav = document.getElementById('nav');
  if (nav) {
    const solid = () => nav.classList.toggle('is-solid', window.scrollY > 24);
    solid();
    window.addEventListener('scroll', solid, { passive: true });
  }

  document.querySelectorAll('[data-spy]').forEach((link) => {
    const section = document.getElementById(link.dataset.spy);
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => link.classList.toggle('is-active', self.isActive),
    });
  });

  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');
  if (!burger || !menu) return;
  const icon = burger.querySelector('use');
  const set = (open) => {
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? t('Fechar menu') : t('Abrir menu'));
    icon.setAttribute('href', open ? '#i-x' : '#i-menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => set(menu.hidden));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) set(false);
  });
}
