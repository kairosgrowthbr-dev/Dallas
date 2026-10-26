import { gsap } from 'gsap';

/**
 * "Chame a Dalas agora mesmo": um baralho de perguntas do diagnóstico que
 * se responde sozinho (a opção acende, o cartão sai, o próximo entra) e
 * brasas douradas subindo pelo cartão. Tudo pausa fora da tela.
 */
const QS = [
  ['Qual é a maior dor do seu negócio hoje?', ['Chegam poucos clientes', 'Chegam clientes, mas poucos fecham', 'Demoro para responder e perco venda'], 2],
  ['O que você mais quer nos próximos 3 meses?', ['Mais clientes chamando no WhatsApp', 'Vender mais para quem já chega', 'Organizar o atendimento num CRM'], 0],
  ['Como a maioria dos clientes chega até você?', ['Indicação', 'Instagram', 'Google'], 1],
  ['Quanto tempo vocês levam para responder?', ['Na hora', 'Algumas horas', 'Só no outro dia'], 2],
  ['Você já anuncia hoje?', ['Sim, todo mês', 'Já anunciei e parei', 'Nunca anunciei'], 1],
  ['O que você mais precisa agora?', ['Site ou landing page', 'Anúncios no Instagram e no Google', 'CRM e automações no WhatsApp'], 2],
];
const TOTAL = 9;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* brasas subindo pelo cartão, do pé até sumir */
function createEmbers(canvas, { lowPower = false } = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const colors = ['241,220,166', '255,255,255', '142,230,168', '214,180,106'];
  const sprites = colors.map((rgb) => {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, `rgba(${rgb},1)`);
    grad.addColorStop(0.3, `rgba(${rgb},0.5)`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
    return c;
  });
  let W = 0;
  let H = 0;
  const list = [];
  let acc = 0;
  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.5);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener('resize', size);
  return {
    draw(dt) {
      acc += dt * (lowPower ? 7 : 13);
      while (acc >= 1 && list.length < (lowPower ? 40 : 80)) {
        acc -= 1;
        list.push({
          x: Math.random() * W,
          y: H + 10,
          vy: 28 + Math.random() * 50,
          sw: Math.random() * 6.28,
          s: 4 + Math.random() * 8,
          c: Math.floor(Math.random() * (Math.random() < 0.6 ? 1 : colors.length)),
          life: 3.5 + Math.random() * 3,
          age: 0,
        });
      }
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const e = list[i];
        e.age += dt;
        if (e.age >= e.life || e.y < -20) {
          list.splice(i, 1);
          continue;
        }
        e.y -= e.vy * dt;
        e.sw += dt * 1.4;
        const t = e.age / e.life;
        ctx.globalAlpha = Math.sin(Math.PI * t) * 0.8;
        ctx.drawImage(sprites[e.c], e.x + Math.sin(e.sw) * 10 - e.s / 2, e.y - e.s / 2, e.s, e.s);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },
  };
}

export function initCallme({ reduceMotion = false, lowPower = false } = {}) {
  const card = document.getElementById('callme');
  if (!card) return;
  const front = document.getElementById('qcard');
  const ring = document.getElementById('qring-fg');
  const RING = 2 * Math.PI * 14;
  let idx = 0;
  let timers = [];
  let visible = false;

  function paint(i) {
    const [q, opts, tap] = QS[i % QS.length];
    const n = (i % TOTAL) + 1;
    front.innerHTML = `<div class="qcard__top"><span>Pergunta ${n} de ${TOTAL}</span><svg class="qring" viewBox="0 0 34 34"><circle class="bg" cx="17" cy="17" r="14" /><circle class="fg" id="qring-fg" cx="17" cy="17" r="14" stroke-dasharray="${RING}" stroke-dashoffset="${RING * (1 - n / TOTAL)}" /></svg></div><p class="qcard__q">${esc(q)}</p><div class="qcard__opts">${opts.map((o, k) => `<span data-k="${k}">${esc(o)}</span>`).join('')}</div>`;
    front.dataset.tap = tap;
  }

  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  function cycle() {
    timers.forEach(clearTimeout);
    timers = [];
    if (!visible) return;
    later(() => {
      const opt = front.querySelector(`[data-k="${front.dataset.tap}"]`);
      if (opt) opt.classList.add('is-tap');
    }, 1500);
    later(() => front.classList.add('is-out'), 2500);
    later(() => {
      idx += 1;
      front.classList.remove('is-out');
      front.classList.add('is-in');
      paint(idx);
      requestAnimationFrame(() => requestAnimationFrame(() => front.classList.remove('is-in')));
      cycle();
    }, 3000);
  }

  paint(0);
  if (reduceMotion) {
    const opt = front.querySelector(`[data-k="${front.dataset.tap}"]`);
    if (opt) opt.classList.add('is-tap');
    return;
  }

  const canvas = document.getElementById('callme-sparks');
  const embers = canvas ? createEmbers(canvas, { lowPower }) : null;
  let acc = 0;
  if (embers) {
    gsap.ticker.add((_t, dt) => {
      if (!visible || document.hidden) return;
      acc += Math.min(dt || 16, 60) / 1000;
      if (acc < 1 / 30) return;
      embers.draw(acc);
      acc = 0;
    });
  }

  new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      card.classList.toggle('is-off', !visible);
      if (visible) cycle();
      else {
        timers.forEach(clearTimeout);
        timers = [];
      }
    },
    { threshold: 0.15 }
  ).observe(card);
}
