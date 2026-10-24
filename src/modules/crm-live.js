// CRM ao vivo: a conversa no WhatsApp ou no Instagram, a automação respondendo
// e o card andando no pipeline. Tudo ilustrativo, com nomes fictícios.

const SCENES = {
  wa: {
    ini: 'CL',
    name: 'Camila Lopes',
    status: 'online',
    icon: '#i-wa',
    steps: [
      ['typing', 'in', 1100],
      ['in', 'Oi! Vi o anúncio de vocês. Ainda tem horário essa semana?', '23:14'],
      ['typing', 'out', 900],
      ['auto', 'Oi, Camila! Tem sim. Me conta, o que você procura?', '23:14', ['Agendar uma avaliação', 'Ver valores', 'Falar com alguém']],
      ['tap', 0],
      ['in', 'Agendar uma avaliação', '23:15'],
      ['sys', 'kanban', 'Camila entrou no pipeline', 'pipe'],
      ['card', 0, 'Respondida pela automação'],
      ['typing', 'out', 900],
      ['auto', 'Perfeito! Tenho quinta às 15h ou sexta às 10h. Qual fica melhor?', '23:15', ['Quinta, 15h', 'Sexta, 10h']],
      ['tap', 0],
      ['in', 'Quinta, 15h', '23:15'],
      ['typing', 'out', 800],
      ['auto', 'Agendado! Quinta, 15h. A equipe já recebeu seus dados.', '23:16'],
      ['sys', 'check', 'Movida para Em atendimento', 'pipe'],
      ['card', 1, 'Agendou · quinta, 15h'],
    ],
  },
  ig: {
    ini: 'RN',
    name: 'rafa.nunes',
    status: 'Respondeu ao seu story',
    icon: '#i-ig',
    steps: [
      ['typing', 'in', 1100],
      ['in', 'Quanto fica esse pacote do story?', '19:02'],
      ['typing', 'out', 900],
      ['auto', 'Oi, Rafa! Te mando os valores agora. Pra qual dia seria?', '19:02', ['Esse sábado', 'Outro dia']],
      ['tap', 0],
      ['in', 'Esse sábado', '19:03'],
      ['sys', 'kanban', 'Rafa entrou no pipeline', 'pipe'],
      ['card', 0, 'Veio do story'],
      ['typing', 'out', 800],
      ['auto', 'Separei sábado às 9h pra você. Posso confirmar?', '19:03'],
      ['sys', 'clock', '24h sem resposta', 'follow', 1700],
      ['typing', 'out', 800],
      ['auto', 'Oi, Rafa! Seu horário de sábado ainda está guardado. Confirmo pra você?', '19:03'],
      ['typing', 'in', 1000],
      ['in', 'Confirma sim! Valeu', '19:20'],
      ['sys', 'check', 'Movida para Em atendimento', 'pipe'],
      ['card', 1, 'Confirmou · sábado, 9h'],
    ],
  },
};

const ORDER = ['wa', 'ig'];

export function initCrmLive({ reduceMotion }) {
  const root = document.getElementById('live');
  if (!root) return;
  const phone = document.getElementById('live-phone');
  const body = document.getElementById('chat-body');
  const tabs = [...root.querySelectorAll('.live__tabs [data-ch]')];
  const pipe = document.getElementById('pipe');
  const card = document.getElementById('pipe-live');
  const slots = [...pipe.querySelectorAll('.pipe__slot')];
  const rules = Object.fromEntries([...root.querySelectorAll('.rule')].map((r) => [r.dataset.rule, r]));
  const $ = (id) => document.getElementById(id);

  // relógio que só anda com a seção na tela
  let clock = 0;
  let timer = 0;
  let waiters = [];
  let run = 0;
  let ch = 'wa';
  let stage = -1;

  const tick = () => {
    clock += 100;
    waiters = waiters.filter((w) => (clock >= w.t ? (w.res(), false) : true));
  };
  const wait = (ms) => new Promise((res) => waiters.push({ t: clock + ms, res }));
  const start = () => {
    if (!timer) timer = setInterval(tick, 100);
  };
  const stop = () => {
    clearInterval(timer);
    timer = 0;
  };

  const el = (cls, html) => {
    const d = document.createElement('div');
    d.className = cls;
    d.innerHTML = html;
    return d;
  };
  const push = (node) => {
    body.appendChild(node);
    while (body.children.length > 9) body.firstElementChild.remove();
    return node;
  };

  const fire = (name) => {
    const r = rules[name];
    if (!r) return;
    r.classList.add('is-fire');
    setTimeout(() => r.classList.remove('is-fire'), 2400);
  };

  const place = (animate = true) => {
    if (stage < 0) return;
    const s = slots[stage];
    if (!animate) card.style.transition = 'none';
    card.style.width = `${s.offsetWidth}px`;
    card.style.transform = `translate(${s.offsetLeft}px, ${s.offsetTop}px)`;
  };

  const setCard = (n, src) => {
    $('pipe-src').textContent = src;
    if (stage < 0) {
      stage = n;
      place(false);
      card.getBoundingClientRect();
      card.style.transition = 'opacity 0.5s, transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)';
      card.style.opacity = '1';
      card.animate([{ scale: 0.85 }, { scale: 1.06 }, { scale: 1 }], { duration: 600, easing: 'ease-out' });
      return;
    }
    stage = n;
    card.style.transition = 'opacity 0.5s, transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)';
    place();
  };

  const setup = (key) => {
    const sc = SCENES[key];
    ch = key;
    phone.dataset.ch = key;
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.ch === key)));
    $('chat-av').textContent = sc.ini;
    $('chat-name').textContent = sc.name;
    $('chat-status').textContent = sc.status;
    $('chat-ch').setAttribute('href', sc.icon);
    $('pipe-ini').textContent = sc.ini;
    $('pipe-name').textContent = key === 'ig' ? 'Rafa Nunes' : sc.name;
    $('pipe-ch').className = `chb chb--${key}`;
    $('pipe-ch-icon').setAttribute('href', sc.icon);
    body.innerHTML = '';
    stage = -1;
    card.style.transition = 'none';
    card.style.opacity = '0';
    Object.values(rules).forEach((r) => r.classList.remove('is-fire'));
  };

  const bubble = (step) => {
    const [kind, text, time, opts] = step;
    const out = kind === 'auto';
    const tag = out ? '<span class="auto"><svg><use href="#i-bolt" /></svg>resposta automática</span>' : '';
    const list = opts ? `<div class="cmsg__opts">${opts.map((o) => `<span>${o}</span>`).join('')}</div>` : '';
    return el(`cmsg${out ? ' cmsg--out' : ''}`, `${text}${list}<em>${tag}${time}</em>`);
  };

  async function play(key) {
    const id = ++run;
    waiters = [];
    setup(key);
    const sc = SCENES[key];
    let last = null;
    await wait(700);
    if (id !== run) return;
    for (const step of sc.steps) {
      const [kind] = step;
      if (kind === 'typing') {
        const typing = push(el(`ctyping${step[1] === 'out' ? ' is-out' : ''}`, '<i></i><i></i><i></i>'));
        if (step[1] === 'in') $('chat-status').textContent = 'digitando...';
        await wait(step[2]);
        if (id !== run) return;
        typing.remove();
        $('chat-status').textContent = sc.status;
        continue;
      }
      if (kind === 'in' || kind === 'auto') {
        last = push(bubble(step));
        if (kind === 'auto') fire('reply');
        await wait(kind === 'auto' && step[3] ? 1500 : 1100);
      } else if (kind === 'tap') {
        const opt = last && last.querySelectorAll('.cmsg__opts span')[step[1]];
        if (opt) opt.classList.add('is-tap');
        await wait(500);
      } else if (kind === 'sys') {
        const [, icon, text, rule, ms = 1000] = step;
        push(el('csys', `<svg><use href="#i-${icon}" /></svg>${text}`));
        fire(rule);
        await wait(ms);
      } else if (kind === 'card') {
        setCard(step[1], step[2]);
        await wait(1300);
      }
      if (id !== run) return;
    }
    await wait(3800);
    if (id !== run) return;
    play(ORDER[(ORDER.indexOf(key) + 1) % ORDER.length]);
  }

  // movimento reduzido: a conversa já aparece pronta
  function still(key) {
    setup(key);
    const sc = SCENES[key];
    sc.steps.forEach((step) => {
      if (step[0] === 'in' || step[0] === 'auto') push(bubble(step));
      if (step[0] === 'sys') push(el('csys', `<svg><use href="#i-${step[1]}" /></svg>${step[2]}`));
      if (step[0] === 'card') {
        $('pipe-src').textContent = step[2];
        stage = step[1];
      }
    });
    place(false);
    card.style.opacity = '1';
  }

  tabs.forEach((t) =>
    t.addEventListener('click', () => {
      if (t.dataset.ch === ch && !reduceMotion) return;
      if (reduceMotion) still(t.dataset.ch);
      else play(t.dataset.ch);
    }),
  );

  let w = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === w) return;
    w = window.innerWidth;
    place(false);
  });

  if (reduceMotion) {
    still('wa');
    return;
  }

  setup('wa');
  let started = false;
  new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting) {
        start();
        if (!started) {
          started = true;
          play('wa');
        }
      } else stop();
    },
    { rootMargin: '0px 0px -15% 0px' },
  ).observe(root);
}
