import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowPower = (navigator.hardwareConcurrency || 8) <= 4 || window.matchMedia('(max-width: 760px)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const SVG = 'http://www.w3.org/2000/svg';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ---------- marcas de mostrador em SVG ----------
function ticks(svg, { n, cx, cy, r1, r2, major = 0, r1Major = r1, color, colorMajor = color, w = 1, wMajor = w, lit = [] }) {
  const g = document.createElementNS(SVG, 'g');
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const isMaj = major && i % major === 0;
    const isLit = lit.includes(i);
    const l = document.createElementNS(SVG, 'line');
    const ra = isMaj || isLit ? r1Major : r1;
    l.setAttribute('x1', (cx + Math.sin(a) * ra).toFixed(2));
    l.setAttribute('y1', (cy - Math.cos(a) * ra).toFixed(2));
    l.setAttribute('x2', (cx + Math.sin(a) * r2).toFixed(2));
    l.setAttribute('y2', (cy - Math.cos(a) * r2).toFixed(2));
    l.setAttribute('stroke', isLit ? '#f3dfa6' : isMaj ? colorMajor : color);
    l.setAttribute('stroke-width', isMaj || isLit ? wMajor : w);
    l.setAttribute('stroke-linecap', 'round');
    if (isLit) l.classList.add('lit');
    g.appendChild(l);
  }
  svg.appendChild(g);
  return g;
}

// relógios do manifesto: Chronos com o ponteiro correndo, Kairos com uma marca acesa
$$('[data-dial]').forEach((box) => {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 60 60');
  box.appendChild(svg);
  const kairos = box.dataset.dial === 'kairos';
  ticks(svg, { n: 60, cx: 30, cy: 30, r1: 25, r2: 28, major: 5, r1Major: 22.5, color: 'rgba(200,200,215,.35)', colorMajor: 'rgba(230,230,240,.7)', w: 0.8, wMajor: 1.3, lit: kairos ? [10] : [] });
  const hand = document.createElementNS(SVG, 'line');
  hand.setAttribute('x1', '30');
  hand.setAttribute('y1', '30');
  hand.setAttribute('x2', '30');
  hand.setAttribute('y2', '9');
  hand.setAttribute('stroke', kairos ? '#d8b46a' : '#e9e9f0');
  hand.setAttribute('stroke-width', kairos ? '2.2' : '1.4');
  hand.setAttribute('stroke-linecap', 'round');
  svg.appendChild(hand);
  const dot = document.createElementNS(SVG, 'circle');
  dot.setAttribute('cx', '30');
  dot.setAttribute('cy', '30');
  dot.setAttribute('r', '2.4');
  dot.setAttribute('fill', kairos ? '#f3dfa6' : '#e9e9f0');
  svg.appendChild(dot);
  if (kairos) {
    hand.style.transformOrigin = '30px 30px';
    hand.style.transform = 'rotate(60deg)';
    if (!reduceMotion) gsap.to(svg.querySelector('.lit'), { opacity: 0.35, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  } else if (!reduceMotion) {
    gsap.to(hand, { rotation: 360, svgOrigin: '30 30', duration: 6, repeat: -1, ease: 'none' });
  }
});

// anéis das fotos dos CEOs
$$('[data-ticks]').forEach((svg) => {
  const kind = svg.dataset.ticks;
  if (kind === 'metal') {
    ticks(svg, { n: 120, cx: 100, cy: 100, r1: 95, r2: 98, color: 'rgba(210,210,225,.35)', w: 0.6 });
  } else {
    const c = kind === 'gold' ? '#d8b46a' : '#a78bfa';
    ticks(svg, { n: 72, cx: 100, cy: 100, r1: 90, r2: 99, major: 6, r1Major: 84, color: c, colorMajor: '#f2f1f6', w: 1.1, wMajor: 1.8 });
  }
});

// mostrador grande do contato
const big = $('[data-bigdial]');
if (big) {
  ticks(big, { n: 120, cx: 300, cy: 300, r1: 282, r2: 296, major: 10, r1Major: 262, color: 'rgba(200,200,215,.22)', colorMajor: 'rgba(240,240,248,.55)', w: 1.2, wMajor: 2.2, lit: [10, 70] });
  ticks(big, { n: 60, cx: 300, cy: 300, r1: 226, r2: 232, color: 'rgba(216,180,106,.25)', w: 1 });
}

// ---------- a mente em 3D ----------
// o three.js chega num arquivo separado, em paralelo; até lá os pedidos ficam guardados
const mindEl = $('#mind');
const mindState = { started: false, morph: 0, fade: 1, active: true };
let mindApi = null;
const mind = {
  start() {
    mindState.started = true;
    mindApi?.start();
  },
  setMorph(v) {
    mindState.morph = v;
    mindApi?.setMorph(v);
  },
  setFade(v) {
    mindState.fade = v;
    mindApi?.setFade(v);
  },
  setActive(v) {
    mindState.active = v;
    mindApi?.setActive(v);
  },
};
import('./mind.js')
  .then(({ initMind }) => {
    mindApi = initMind({ canvas: $('#mind-canvas'), chips: $$('#mind-chips .chip'), reduceMotion, lowPower });
    if (!mindApi) return;
    mindApi.setMorph(mindState.morph);
    mindApi.setFade(mindState.fade);
    mindApi.setActive(mindState.active);
    if (mindState.started) mindApi.start();
  })
  .catch(() => {});

// ---------- abertura ----------
const intro = $('#intro');
function heroIn() {
  if (reduceMotion) return;
  gsap.from('.hero .rise', { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.12 });
  gsap.from('[data-hero]', { y: 26, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, delay: 0.25 });
  gsap.from('.nav__in', { y: -30, opacity: 0, duration: 1, ease: 'expo.out', delay: 0.1 });
}
if (reduceMotion || !intro) {
  intro?.remove();
  mind.start();
} else {
  const mark = $('.intro__mark', intro);
  const tl = gsap.timeline({
    onComplete: () => intro.remove(),
  });
  tl.from(mark, { scale: 0.6, rotate: -40, opacity: 0, duration: 1.1, ease: 'expo.out' })
    .from('.intro__word', { opacity: 0, letterSpacing: '0.9em', duration: 1, ease: 'expo.out' }, '-=0.7')
    .add(() => mind.start(), '-=0.2')
    .to(intro, { opacity: 0, duration: 0.7, ease: 'power2.inOut' }, '+=0.15')
    .add(heroIn, '-=0.55');
}

// ---------- manifesto: palavras acendem e a mente vira a marca ----------
const words = $('[data-words]');
let wordEls = [];
if (words) {
  const wrap = (node) => {
    [...node.childNodes].forEach((ch) => {
      if (ch.nodeType === 3) {
        const parts = ch.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p));
          else {
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = p;
            frag.appendChild(s);
          }
        });
        ch.replaceWith(frag);
      } else if (ch.nodeType === 1) wrap(ch);
    });
  };
  wrap(words);
  wordEls = $$('.w', words);
}

const narrow = window.matchMedia('(max-width: 900px)');
const mindLook = { morph: 0, fade: 1 };
function paintMind() {
  const dim = narrow.matches ? 1 - mindLook.morph * 0.6 : 1;
  mindEl.style.opacity = String(Math.max(0, mindLook.fade * dim));
}
ScrollTrigger.create({
  trigger: '.manifesto',
  start: 'top bottom',
  end: 'bottom bottom',
  onUpdate: (self) => {
    const p = self.progress;
    const wp = gsap.utils.clamp(0, 1, (p - 0.3) / 0.42);
    const on = Math.round(wp * wordEls.length);
    wordEls.forEach((w, i) => w.classList.toggle('is-on', reduceMotion || i < on));
    const m = reduceMotion ? 0 : gsap.utils.clamp(0, 1, (p - 0.36) / 0.44);
    mind.setMorph(m);
    // no celular a marca fica atrás do texto, então vira uma marca-d'água
    mindLook.morph = m;
    paintMind();
  },
});
// a mente só desenha enquanto o topo ou o manifesto estão na tela
ScrollTrigger.create({
  trigger: '.manifesto',
  start: 'top bottom',
  end: 'bottom top',
  onLeave: () => mind.setActive(false),
  onEnterBack: () => mind.setActive(true),
});
ScrollTrigger.create({
  trigger: '.band',
  start: 'top bottom',
  end: 'top 20%',
  onUpdate: (self) => {
    const f = 1 - self.progress;
    mind.setFade(f);
    mindLook.fade = f;
    paintMind();
  },
});
if (!reduceMotion) {
  gsap.to('.hero__in', {
    yPercent: -18,
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

// ---------- entradas ----------
if (!reduceMotion) {
  $$('[data-rise]').forEach((el) => {
    gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  gsap.from('.co', { y: 80, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.14, scrollTrigger: { trigger: '.co-grid', start: 'top 85%', once: true } });
  gsap.from('.fr', { y: 50, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: '.fr-grid', start: 'top 85%', once: true } });
  gsap.from('.ceo', { y: 70, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.15, scrollTrigger: { trigger: '.ceo-grid', start: 'top 85%', once: true } });
  gsap.from('.ceo__photo img', { scale: 1.25, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: '.ceo-grid', start: 'top 85%', once: true } });
  gsap.from('.go', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.final__actions', start: 'top 92%', once: true } });
  gsap.fromTo('.final__mark', { rotate: -25, scale: 0.85 }, { rotate: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.final', start: 'top bottom', end: 'bottom top', scrub: true } });
}

// ---------- menu: some ao descer, volta ao subir; marca a seção atual ----------
const nav = $('#nav');
let lastY = window.scrollY;
window.addEventListener(
  'scroll',
  () => {
    const y = window.scrollY;
    nav.classList.toggle('is-hidden', y > lastY && y > 400);
    lastY = y;
  },
  { passive: true },
);
$$('.nav__links a').forEach((a) => {
  const sec = $(a.getAttribute('href'));
  if (!sec) return;
  ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => a.classList.toggle('is-on', s.isActive) });
});

// ---------- cartões das empresas: inclinação 3D, brilho e o site rolando na tela ----------
function setViewHeights() {
  $$('.co').forEach((co) => co.style.setProperty('--vh', $('.co__view', co).clientHeight));
}
setViewHeights();
window.addEventListener('resize', setViewHeights);
$$('.co__view img').forEach((img) => img.addEventListener('load', setViewHeights));

$$('[data-tilt]').forEach((card) => {
  if (!canHover || reduceMotion) return;
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    card.style.transform = `rotateX(${((0.5 - y) * 6).toFixed(2)}deg) rotateY(${((x - 0.5) * 8).toFixed(2)}deg)`;
  });
  card.addEventListener('pointerleave', () => {
    card.style.transform = '';
  });
});
if (!canHover && !reduceMotion) {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('is-auto', e.isIntersecting && e.intersectionRatio > 0.55)),
    { threshold: [0, 0.55, 1] },
  );
  $$('.co').forEach((co) => io.observe(co));
}

// luz que segue o mouse nas frentes
$$('.fr').forEach((el) => {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// fotos dos CEOs inclinam com o mouse
$$('[data-orb]').forEach((orb) => {
  if (!canHover || reduceMotion) return;
  const card = orb.closest('.ceo');
  card.addEventListener('pointermove', (e) => {
    const r = orb.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) / r.width;
    const y = (e.clientY - (r.top + r.height / 2)) / r.height;
    orb.style.transform = `perspective(900px) rotateX(${(-y * 14).toFixed(2)}deg) rotateY(${(x * 14).toFixed(2)}deg)`;
  });
  card.addEventListener('pointerleave', () => {
    orb.style.transform = '';
  });
});

// botões com um leve ímã
if (canHover && !reduceMotion) {
  $$('.hero .btn, .nav__cta, .co__actions .btn').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      gsap.to(b, { x: x * 0.15, y: y * 0.25, duration: 0.5, ease: 'power3.out' });
    });
    b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' }));
  });
}

const year = $('#year');
if (year) year.textContent = String(new Date().getFullYear());

window.addEventListener('load', () => ScrollTrigger.refresh());
