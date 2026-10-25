import { gsap } from 'gsap';
import { waLink } from './contact.js';

const STEPS = [
  {
    key: 'perfil',
    type: 'input',
    q: 'Qual é o Instagram ou o site da sua empresa?',
    sub: 'Com o seu perfil a gente já entende o seu negócio antes da conversa.',
    prefix: '@',
    placeholder: 'suaempresa',
    skip: 'Não tenho Instagram nem site',
  },
  {
    key: 'ramo',
    type: 'choice',
    q: 'Qual é o ramo da sua empresa?',
    sub: 'Assim o diagnóstico já vem com exemplos do seu mercado.',
    options: ['Saúde e estética', 'Serviços e consultoria', 'Loja ou comércio', 'Alimentação', 'Educação e cursos', 'Imóveis e construção', 'Outro'],
  },
  {
    key: 'precisa',
    type: 'choice',
    q: 'O que você mais precisa agora?',
    options: ['Site ou landing page', 'Anúncios no Instagram e no Google', 'CRM e automações no WhatsApp', 'Funil completo, do anúncio à venda', 'Ainda não sei, quero uma orientação'],
  },
  { key: 'anuncia', type: 'choice', q: 'Você já anuncia hoje?', options: ['Sim, todo mês', 'Já anunciei e parei', 'Nunca anunciei'] },
  {
    key: 'origem',
    type: 'choice',
    q: 'Como a maioria dos clientes chega até você?',
    options: ['Indicação', 'Instagram', 'Google', 'WhatsApp e boca a boca', 'Ainda chegam poucos'],
  },
  {
    key: 'resposta',
    type: 'choice',
    q: 'Quanto tempo vocês levam para responder um cliente novo?',
    options: ['Na hora', 'Algumas horas', 'Só no outro dia', 'Depende do dia'],
  },
  {
    key: 'nome',
    type: 'final',
    q: 'Para quem a gente manda o diagnóstico?',
    sub: 'Confira o resumo e envie pelo WhatsApp. A resposta vem por lá.',
    placeholder: 'Seu nome',
  },
];

const LABELS = { perfil: 'Perfil', ramo: 'Ramo', precisa: 'Precisa', anuncia: 'Já anuncia', origem: 'Clientes chegam por', resposta: 'Tempo de resposta' };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Diagnóstico grátis: 7 perguntas num modal; no fim, a mensagem pronta para o WhatsApp. */
export function initDiag(config, { reduceMotion = false } = {}) {
  const modal = document.getElementById('diag');
  if (!modal) return;
  const body = document.getElementById('diag-body');
  const label = document.getElementById('diag-step');
  const bars = document.getElementById('diag-bars');
  bars.innerHTML = STEPS.map(() => '<i></i>').join('');
  const barEls = [...bars.children];
  const answers = {};
  let index = 0;
  let lastFocus = null;

  function message() {
    const lines = ['Olá! Quero o diagnóstico grátis da Dalas Marketing.', ''];
    if (answers.nome) lines.push(`Nome: ${answers.nome}`);
    Object.entries(LABELS).forEach(([k, l]) => {
      if (answers[k]) lines.push(`${l}: ${answers[k]}`);
    });
    return lines.join('\n');
  }

  function render(dir = 1) {
    const step = STEPS[index];
    label.textContent = `Passo ${index + 1} de ${STEPS.length}`;
    barEls.forEach((b, i) => b.classList.toggle('is-on', i <= index));
    let html = `<h3 id="diag-q">${esc(step.q)}</h3>`;
    if (step.sub) html += `<p>${esc(step.sub)}</p>`;
    if (step.type === 'input') {
      html += `<label class="diag__field"><span>${step.prefix}</span><input id="diag-input" type="text" autocomplete="off" placeholder="${esc(step.placeholder)}" value="${esc(answers[step.key] || '')}" /></label>`;
      html += `<button class="diag__next" type="button" id="diag-next" disabled>Continuar <svg><use href="#i-r" /></svg></button>`;
      html += `<div class="diag__links"><button type="button" id="diag-skip">${esc(step.skip)}</button><a class="wa" href="#contato" data-diag-wa><svg><use href="#i-wa" /></svg>Prefiro falar direto no WhatsApp</a></div>`;
    } else if (step.type === 'choice') {
      html += `<div class="diag__opts">${step.options
        .map((o) => `<button type="button" class="diag__opt${answers[step.key] === o ? ' is-on' : ''}" data-opt="${esc(o)}">${esc(o)}</button>`)
        .join('')}</div>`;
    } else {
      html += `<label class="diag__field"><span><svg width="16" height="16"><use href="#i-crm" /></svg></span><input id="diag-input" type="text" autocomplete="name" placeholder="${esc(step.placeholder)}" value="${esc(answers.nome || '')}" /></label>`;
      html += `<div class="diag__sum">${Object.entries(LABELS)
        .filter(([k]) => answers[k])
        .map(([k, l]) => `<span>${esc(l)}: <b>${esc(answers[k])}</b></span>`)
        .join('')}</div>`;
      html += `<a class="diag__next diag__next--wa" id="diag-send" href="#" target="_blank" rel="noopener"><svg><use href="#i-wa" /></svg>Enviar no WhatsApp</a>`;
      if (!waLink(config)) html += `<p class="diag__note">O número do WhatsApp ainda não foi configurado no site.</p>`;
    }
    if (index > 0) html += `<div class="diag__links"><button type="button" id="diag-back">Voltar</button></div>`;
    body.innerHTML = html;
    if (!reduceMotion) gsap.fromTo(body, { opacity: 0, x: 18 * dir }, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' });
    wire(step);
  }

  function next() {
    if (index < STEPS.length - 1) {
      index += 1;
      render(1);
    }
  }

  function wire(step) {
    const input = document.getElementById('diag-input');
    const nextBtn = document.getElementById('diag-next');
    const back = document.getElementById('diag-back');
    if (back)
      back.addEventListener('click', () => {
        index -= 1;
        render(-1);
      });
    if (step.type === 'input') {
      const sync = () => {
        answers[step.key] = input.value.trim().replace(/^@/, '');
        nextBtn.disabled = !answers[step.key];
      };
      input.addEventListener('input', sync);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !nextBtn.disabled) next();
      });
      sync();
      nextBtn.addEventListener('click', next);
      document.getElementById('diag-skip').addEventListener('click', () => {
        answers[step.key] = 'não tem';
        next();
      });
      const wa = body.querySelector('[data-diag-wa]');
      const link = waLink(config);
      if (link) {
        wa.href = link;
        wa.target = '_blank';
        wa.rel = 'noopener';
      } else {
        wa.addEventListener('click', close);
      }
      setTimeout(() => input.focus(), 60);
    } else if (step.type === 'choice') {
      body.querySelectorAll('[data-opt]').forEach((b) =>
        b.addEventListener('click', () => {
          answers[step.key] = b.dataset.opt;
          body.querySelectorAll('[data-opt]').forEach((o) => o.classList.toggle('is-on', o === b));
          setTimeout(next, 260);
        })
      );
      setTimeout(() => body.querySelector('[data-opt]').focus(), 60);
    } else {
      const send = document.getElementById('diag-send');
      const sync = () => {
        answers.nome = input.value.trim();
        const link = waLink(config, message());
        if (link) send.href = link;
        else send.removeAttribute('href');
      };
      input.addEventListener('input', sync);
      sync();
      setTimeout(() => input.focus(), 60);
    }
  }

  function open() {
    lastFocus = document.activeElement;
    index = 0;
    modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    render(1);
    if (!reduceMotion) {
      gsap.fromTo(modal.querySelector('.diag__backdrop'), { opacity: 0 }, { opacity: 1, duration: 0.4 });
      gsap.fromTo(modal.querySelector('.diag__box'), { opacity: 0, y: 24, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out' });
    }
  }

  function close() {
    if (modal.hidden) return;
    const done = () => {
      modal.hidden = true;
      document.documentElement.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    if (reduceMotion) return done();
    gsap.to(modal.querySelector('.diag__box'), { opacity: 0, y: 16, duration: 0.3 });
    gsap.to(modal.querySelector('.diag__backdrop'), { opacity: 0, duration: 0.3, onComplete: done });
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-diag]');
    if (trigger) {
      e.preventDefault();
      open();
    }
  });
  modal.querySelectorAll('[data-diag-close]').forEach((b) => b.addEventListener('click', close));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  if (location.hash === '#diagnostico') open();
}
