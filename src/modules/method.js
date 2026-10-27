import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createSparks, initSilk } from './hero-orbit.js';

/**
 * Método: a linha central se preenche com o scroll e cada etapa acende quando a
 * ponta chega nela. Quando a ponta chega na asa, no fim, a asa pula, solta um
 * clarão dourado, duas ondas e uma explosão de faíscas.
 */
export function initMethod({ reduceMotion = false, lowPower = false } = {}) {
  const root = document.getElementById('mtl');
  if (!root) return;
  const fill = document.getElementById('mtl-fill');
  const tip = document.getElementById('mtl-tip');
  const line = root.querySelector('.mtl__line');
  const steps = [...root.querySelectorAll('.mstep')];
  const end = document.getElementById('mtl-end');
  const section = root.closest('.method');

  // a cor da etapa ativa passa para a ponta e para o preenchimento da linha
  const paint = (step) => {
    const cs = getComputedStyle(step);
    root.style.setProperty('--live', cs.getPropertyValue('--acc').trim());
    root.style.setProperty('--live-rgb', cs.getPropertyValue('--acc-rgb').trim());
  };

  if (reduceMotion) {
    gsap.set(fill, { scaleY: 1 });
    steps.forEach((s) => s.classList.add('is-on'));
    if (end) end.classList.add('is-hit');
    return;
  }

  // fundo: a seda do hero em resolução baixa (não no modo leve) e os raios, só com a seção na tela
  let visible = false;
  const silkCanvas = document.getElementById('method-silk');
  const silk = silkCanvas && !lowPower ? initSilk(silkCanvas, 0.28) : null;
  if (silk) {
    let time = 40;
    let sAcc = 0;
    silk(time);
    silkCanvas.classList.add('is-on');
    gsap.ticker.add((_t, dt) => {
      if (!visible || document.hidden) return;
      sAcc += Math.min(dt || 16, 60) / 1000;
      if (sAcc < 1 / 30) return;
      time += sAcc;
      sAcc = 0;
      silk(time);
    });
  }
  if (section) {
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      section.classList.toggle('is-off', !visible);
    }).observe(section);
  }

  // faíscas da chegada
  const canvas = document.getElementById('mtl-sparks');
  const sparks = canvas ? createSparks(canvas, { lowPower }) : null;
  let until = 0;
  let acc = 0;
  let drawing = false;
  if (sparks) {
    gsap.ticker.add((_t, dt) => {
      if (!drawing) return;
      if (performance.now() > until) {
        drawing = false;
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      acc += Math.min(dt || 16, 60) / 1000;
      if (acc < 1 / 30) return;
      sparks.draw(acc);
      acc = 0;
    });
  }
  let hit = false;
  function fire() {
    hit = true;
    end.classList.add('is-hit');
    if (sparks) {
      sparks.size();
      sparks.burst(lowPower ? 54 : 100);
      until = performance.now() + 3200;
      drawing = true;
    }
  }
  function reset() {
    hit = false;
    end.classList.remove('is-hit');
  }

  ScrollTrigger.create({
    trigger: root,
    start: 'top 60%',
    end: 'bottom 75%',
    scrub: 0.4,
    onUpdate: (self) => {
      const p = self.progress;
      fill.style.transform = `scaleY(${p})`;
      tip.style.transform = `translateY(${p * line.offsetHeight}px)`;
      if (end) {
        if (p > 0.985 && !hit) fire();
        else if (p < 0.9 && hit) reset();
      }
    },
  });
  steps.forEach((step) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 62%',
      onEnter: () => {
        step.classList.add('is-on');
        paint(step);
      },
      onLeaveBack: () => {
        step.classList.remove('is-on');
        const prev = step.previousElementSibling;
        if (prev && prev.classList.contains('mstep')) paint(prev);
      },
    });
  });
}
