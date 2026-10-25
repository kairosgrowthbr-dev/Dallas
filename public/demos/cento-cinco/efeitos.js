// Efeitos da página inicial: fogo atrás do reel do topo e no fechamento, a foto da casa que se abre
// ao rolar, entradas suaves e o botão flutuante de pedido. Sem GSAP (ou com movimento reduzido)
// tudo continua visível e parado.
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Botão flutuante "Fazer meu pedido": aparece depois do topo (some quando há itens no carrinho).
  const floating = document.querySelector('.floating-order');
  if (floating) {
    const sync = () => floating.classList.toggle('show', window.scrollY > window.innerHeight * 0.75);
    window.addEventListener('scroll', sync, {passive: true}); sync();
  }

  // Como funciona: os passos se alternam sozinhos (a barra dourada marca o tempo) e o celular
  // mostra a tela de cada passo. Tocar num passo troca na hora; pausa fora da tela e com o mouse em cima.
  const how = document.querySelector('.how');
  if (how) {
    const steps = [...how.querySelectorAll('.how-step')], screens = [...how.querySelectorAll('.ph-screen')];
    const caption = how.querySelector('.how-caption');
    let inView = false, hovering = false;
    const setStep = index => {
      steps.forEach((step, i) => { step.classList.toggle('is-active', i === index); if (i === index) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current'); });
      screens.forEach((screen, i) => screen.classList.toggle('is-active', i === index));
      if (caption) caption.textContent = steps[index].querySelector('.how-copy span').textContent;
    };
    const syncPause = () => how.classList.toggle('is-paused', !inView || hovering || document.hidden);
    steps.forEach((step, i) => {
      step.addEventListener('click', () => setStep(i));
      step.querySelector('.how-bar i').addEventListener('animationend', () => setStep((i + 1) % steps.length));
    });
    how.querySelectorAll('.how-steps, .how-stage').forEach(area => {
      area.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovering = true; syncPause(); } });
      area.addEventListener('pointerleave', () => { hovering = false; syncPause(); });
    });
    new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncPause(); }, {threshold: 0.3}).observe(how);
    document.addEventListener('visibilitychange', syncPause);
    setStep(0); syncPause();
  }

  // Fogo: só roda com o canvas visível na tela.
  function fireOn(canvas, opts, when = () => true) {
    const fire = canvas && window.createFire ? window.createFire(canvas, opts) : null;
    if (!fire) return null;
    if (reduce) { if (when()) fire.still(); return fire; }
    new IntersectionObserver(([entry]) => (entry.isIntersecting && when() ? fire.start() : fire.stop())).observe(canvas);
    return fire;
  }
  const desktop = window.matchMedia('(min-width: 961px)');
  const heroFire = fireOn(document.getElementById('hero-fire'), { intensity: 0.5, embers: 0.9, smoke: 0.25, baseX: 0.55, baseY: -0.08, width: 0.75, height: 0.7 }, () => desktop.matches);
  desktop.addEventListener('change', event => { if (!event.matches) heroFire?.stop(); });
  const closingFire = fireOn(document.getElementById('closing-fire'), { intensity: 0.75, embers: 1, smoke: 0.4, baseY: -0.06, width: 1.3, height: 0.95 });
  window.CC = Object.assign(window.CC || {}, { heroFire, closingFire });

  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger || reduce) return;
  gsap.registerPlugin(ScrollTrigger);

  // Topo: o texto sobe e o cartão do reel entra girando de leve.
  gsap.from('.hero-content > *', { autoAlpha: 0, y: 34, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.1 });
  if (desktop.matches) gsap.from('.hero-stage', { autoAlpha: 0, y: 60, rotate: 6, duration: 1.2, ease: 'power3.out', delay: 0.25 });

  // A casa: a foto se abre conforme a rolagem, com leve profundidade.
  gsap.fromTo('.casa-photo', { clipPath: 'inset(14% 18% 14% 0% round 0px 28px 28px 0px)' }, {
    clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)', ease: 'none',
    scrollTrigger: { trigger: '.casa', start: 'top 85%', end: 'top 20%', scrub: 0.6 },
  });
  gsap.fromTo('.casa-photo img', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.casa', start: 'top bottom', end: 'bottom top', scrub: true } });

  // Blocos entram suaves uma vez, em sequência dentro de cada grupo.
  const groups = ['.how-head > *', '.how-steps', '.how-stage', '.how-cta', '.casa-card > *', '.serve-head > *', '.serve-tile', '.favs-head', '.closing-fire .closing-content > *', '.footer-top > *'];
  groups.forEach(selector => {
    const items = gsap.utils.toArray(selector);
    if (!items.length) return;
    ScrollTrigger.batch(items, {
      start: 'top 90%', once: true,
      onEnter: batch => gsap.from(batch, { autoAlpha: 0, y: 40, duration: 0.85, ease: 'power3.out', stagger: 0.09 }),
    });
  });
  // Os favoritos são montados pelo app.js: anima quando aparecerem.
  const favs = document.getElementById('home-favorites');
  if (favs) ScrollTrigger.create({ trigger: favs, start: 'top 90%', once: true, onEnter: () => gsap.from(favs.children, { autoAlpha: 0, y: 40, duration: 0.85, ease: 'power3.out', stagger: 0.08 }) });

  // Recalcula depois que imagens e fontes carregam.
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
