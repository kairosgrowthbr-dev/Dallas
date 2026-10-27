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
    key: 'dor',
    type: 'choice',
    q: 'Qual é a maior dor do seu negócio hoje?',
    sub: 'O que mais tira o seu sono quando o assunto é vender.',
    options: [
      'Chegam poucos clientes',
      'Chegam clientes, mas poucos fecham',
      'Demoro para responder e perco venda',
      'Gasto com anúncio e não vejo retorno',
      'Meu site não gera contato',
      'Não sei de onde vêm os meus clientes',
    ],
  },
  {
    key: 'quer',
    type: 'choice',
    q: 'O que você mais quer nos próximos 3 meses?',
    options: [
      'Mais clientes chamando no WhatsApp',
      'Vender mais para quem já chega',
      'Um site que passe confiança',
      'Organizar o atendimento num CRM',
      'Parar de perder venda à noite e no fim de semana',
      'Tirar a empresa do boca a boca',
    ],
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
    key: 'detalhe',
    type: 'input',
    q: 'Quer contar algo mais sobre a sua empresa?',
    sub: 'Cidade, produto principal, meta do ano, o que já tentou. Quanto mais a gente souber, melhor o diagnóstico.',
    prefix: '',
    placeholder: 'Ex.: clínica em Canela, quero lotar a agenda de quinta e sexta',
    skip: 'Pular esta',
    optional: true,
  },
  {
    key: 'nome',
    type: 'final',
    q: 'Para quem a gente manda o diagnóstico?',
    sub: 'Confira o resumo e envie pelo WhatsApp. A resposta vem por lá.',
    placeholder: 'Seu nome',
  },
];

const LABELS = {
  perfil: 'Instagram ou site',
  ramo: 'Ramo',
  dor: 'Maior dor hoje',
  quer: 'Quer nos próximos meses',
  precisa: 'Precisa agora de',
  anuncia: 'Já anuncia',
  origem: 'Clientes chegam por',
  resposta: 'Tempo de resposta',
  detalhe: 'Mais detalhes',
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Diagnóstico grátis: 9 perguntas num modal; no fim, a mensagem pronta para o WhatsApp. */
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

  // mensagem que vai pro WhatsApp: em blocos, com negrito do próprio WhatsApp (sem emoji, que o link corrompe)
  function message() {
    const a = answers;
    const perfil = a.perfil && a.perfil !== 'não tem' ? (/\./.test(a.perfil) ? a.perfil : `@${a.perfil}`) : '';
    const block = (title, rows) => {
      const r = rows.filter(([, v]) => v).map(([l, v]) => `${l}: ${v}`);
      return r.length ? [`*${title}*`, ...r, ''] : [];
    };
    const lines = [
      '*Diagnóstico grátis · Dalas Marketing*',
      '',
      'Olá, Ryan! Acabei de responder o diagnóstico no site e quero a análise da Dalas para o meu negócio.',
      '',
      ...block('Quem sou', [
        ['Nome', a.nome],
        ['Instagram ou site', perfil],
        ['Ramo', a.ramo],
      ]),
      ...block('Meu momento', [
        ['Maior dor hoje', a.dor],
        ['O que mais quero', a.quer],
        ['Preciso agora de', a.precisa],
      ]),
      ...block('Como está hoje', [
        ['Já anuncia', a.anuncia],
        ['Clientes chegam por', a.origem],
        ['Tempo de resposta', a.resposta],
      ]),
      ...(a.detalhe && a.detalhe !== 'não tem' ? ['*Mais detalhes*', a.detalhe, ''] : []),
      'Pode me responder por aqui com o diagnóstico e por onde começar?',
    ];
    return lines.join('\n');
  }

  function render(dir = 1) {
    const step = STEPS[index];
    label.textContent = `Passo ${index + 1} de ${STEPS.length}`;
    barEls.forEach((b, i) => b.classList.toggle('is-on', i <= index));
    let html = `<h3 id="diag-q">${esc(step.q)}</h3>`;
    if (step.sub) html += `<p>${esc(step.sub)}</p>`;
    if (step.type === 'input') {
      html += `<label class="diag__field${step.prefix ? '' : ' diag__field--plain'}">${step.prefix ? `<span>${step.prefix}</span>` : ''}<input id="diag-input" type="text" autocomplete="off" placeholder="${esc(step.placeholder)}" value="${esc(answers[step.key] === 'não tem' ? '' : answers[step.key] || '')}" /></label>`;
      html += `<button class="diag__next" type="button" id="diag-next"${step.optional ? '' : ' disabled'}>Continuar <svg><use href="#i-r" /></svg></button>`;
      html += `<div class="diag__links"><button type="button" id="diag-skip">${esc(step.skip)}</button></div>`;
    } else if (step.type === 'choice') {
      html += `<div class="diag__opts">${step.options
        .map((o) => `<button type="button" class="diag__opt${answers[step.key] === o ? ' is-on' : ''}" data-opt="${esc(o)}">${esc(o)}</button>`)
        .join('')}</div>`;
    } else {
      html += `<label class="diag__field"><span><svg width="16" height="16"><use href="#i-crm" /></svg></span><input id="diag-input" type="text" autocomplete="name" placeholder="${esc(step.placeholder)}" value="${esc(answers.nome || '')}" /></label>`;
      html += `<div class="diag__sum">${Object.entries(LABELS)
        .filter(([k]) => answers[k] && answers[k] !== 'não tem')
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
        nextBtn.disabled = !step.optional && !answers[step.key];
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
      const ready = () => answers.nome.length >= 2;
      const sync = () => {
        answers.nome = input.value.trim();
        const link = waLink(config, message());
        if (link && ready()) send.href = link;
        else send.removeAttribute('href');
        send.classList.toggle('is-off', !ready());
      };
      input.addEventListener('input', sync);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && ready()) send.click();
      });
      sync();
      // sem nome não envia: o campo treme e ganha foco
      send.addEventListener('click', (e) => {
        if (!ready()) {
          e.preventDefault();
          input.focus();
          if (!reduceMotion) gsap.fromTo(input.parentElement, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
          return;
        }
        // o WhatsApp abre em outra aba; aqui fica a confirmação
        setTimeout(() => done(send.href), 250);
      });
      setTimeout(() => input.focus(), 60);
    }
  }

  function done(link) {
    const first = (answers.nome || '').split(' ')[0];
    label.textContent = 'Diagnóstico enviado';
    barEls.forEach((b) => b.classList.add('is-on'));
    body.innerHTML = `<div class="diag__done">
      <span class="diag__ok"><svg><use href="#i-check" /></svg></span>
      <h3 id="diag-q">Pronto${first ? `, ${esc(first)}` : ''}!</h3>
      <p>O WhatsApp abriu com a sua mensagem e todas as respostas. É só tocar em <b>enviar</b> por lá. A Dalas responde com o diagnóstico e por onde começar.</p>
      <a class="diag__next diag__next--wa" href="${esc(link)}" target="_blank" rel="noopener"><svg><use href="#i-wa" /></svg>Abrir o WhatsApp de novo</a>
      <div class="diag__links"><button type="button" data-diag-close>Voltar ao site</button></div>
    </div>`;
    body.querySelector('[data-diag-close]').addEventListener('click', close);
    if (!reduceMotion) {
      gsap.fromTo(body, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
      gsap.fromTo(body.querySelector('.diag__ok'), { scale: 0.4, rotate: -30 }, { scale: 1, rotate: 0, duration: 0.8, ease: 'back.out(2.2)' });
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
