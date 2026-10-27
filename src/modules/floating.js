import { gsap } from 'gsap';

/**
 * Botões flutuantes: o cronômetro volta ao topo e o ponteiro dele marca o
 * quanto da página já foi lido; no celular, uma barra leva ao diagnóstico;
 * o botão do WhatsApp pode ser arrastado e volta para o canto quando solto.
 */
export function initFloating({ reduceMotion = false } = {}) {
  const top = document.getElementById('totop');
  const hand = document.getElementById('totop-hand');
  if (top) {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      top.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.9);
      if (hand) hand.setAttribute('transform', `rotate(${p * 360} 20 26)`);
    };
    window.addEventListener('scroll', () => {
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
    update();
    top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  }

  // barra do diagnóstico no celular: depois do topo, e some quando uma chamada grande ou o rodapé está na tela
  const bar = document.getElementById('cta-bar');
  if (bar) {
    const blockers = new Set();
    let past = false;
    const sync = () => bar.classList.toggle('is-on', past && blockers.size === 0);
    window.addEventListener('scroll', () => {
      const p = window.scrollY > window.innerHeight * 0.8;
      if (p !== past) {
        past = p;
        sync();
      }
    }, { passive: true });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? blockers.add(e.target) : blockers.delete(e.target)));
      sync();
    });
    ['chame', 'contato'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    const footer = document.querySelector('.footer');
    if (footer) io.observe(footer);
  }

  const wa = document.getElementById('wa-float');
  if (!wa || reduceMotion) return;
  let start = null;
  let moved = false;
  wa.addEventListener('pointerdown', (e) => {
    start = { x: e.clientX, y: e.clientY };
    moved = false;
    wa.setPointerCapture(e.pointerId);
    gsap.killTweensOf(wa);
  });
  wa.addEventListener('pointermove', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (!moved && Math.hypot(dx, dy) > 6) {
      moved = true;
      wa.classList.add('is-drag');
    }
    if (moved) gsap.set(wa, { x: dx, y: dy });
  });
  const release = () => {
    if (!start) return;
    start = null;
    wa.classList.remove('is-drag');
    if (moved) gsap.to(wa, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.45)' });
  };
  wa.addEventListener('pointerup', release);
  wa.addEventListener('pointercancel', release);
  wa.addEventListener('click', (e) => {
    if (moved) {
      e.preventDefault();
      moved = false;
    }
  });
}
