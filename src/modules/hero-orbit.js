import { gsap } from 'gsap';

/**
 * Hero: a asa da Dalas no centro de dois mostradores que giram devagar, com os
 * sete serviços em volta como um mapa mental (cada um acende na sua vez, junto
 * com a palavra do título). A asa tem raios, faíscas em órbita, um reflexo
 * metálico e inclina com o mouse. Ao fundo, a mesma fumaça sedosa da chamada
 * final e um céu com estrelas piscando e estrelas cadentes. Tudo pausa fora da tela.
 */
const NS = 'http://www.w3.org/2000/svg';
const KEYS = ['sites', 'funis', 'crm', 'automacoes', 'ia', 'anuncios', 'whatsapp'];

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.05;
  vec2 q = vec2(fbm(p * 1.3 + vec2(0.0, t)), fbm(p * 1.3 + vec2(5.2, -t)));
  vec2 r = vec2(fbm(p * 1.5 + 2.6 * q + vec2(1.7, 9.2) + t * 1.4), fbm(p * 1.5 + 2.6 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p * 1.1 + 2.2 * r);
  float folds = 0.5 + 0.5 * sin((f * 5.0 + r.x * 2.4 - q.y) * 3.14159);
  float silk = pow(smoothstep(0.35, 1.0, folds), 2.2) * smoothstep(0.25, 0.75, f);
  float sheen = pow(smoothstep(0.85, 1.0, folds), 6.0) * 0.6;
  float vig = smoothstep(1.3, 0.2, length(p * vec2(0.8, 1.05)));
  // a seda fica mais forte na direita, atrás da marca
  float side = 0.35 + 0.65 * smoothstep(-0.5, 0.5, p.x);
  vec3 base = vec3(0.022, 0.022, 0.026);
  vec3 col = base + vec3(0.46, 0.47, 0.51) * (silk + sheen) * vig * side;
  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return null;
  return sh;
}

export function initSilk(canvas, scale) {
  let gl = null;
  try {
    gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  } catch (error) {
    gl = null;
  }
  if (!gl) return null;
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, 'aPos');
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  let w = 1;
  let h = 1;
  function size() {
    w = Math.max(1, Math.round(canvas.clientWidth * scale));
    h = Math.max(1, Math.round(canvas.clientHeight * scale));
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }
  size();
  window.addEventListener('resize', size);
  return (time) => {
    gl.uniform2f(uRes, w, h);
    gl.uniform1f(uTime, time);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
}

function ring(svg, { r, count, long, every, inner }) {
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    const big = i % every === 0;
    const r2 = r - (big ? long : long * 0.4);
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', 500 + Math.sin(a) * r);
    line.setAttribute('y1', 500 - Math.cos(a) * r);
    line.setAttribute('x2', 500 + Math.sin(a) * r2);
    line.setAttribute('y2', 500 - Math.cos(a) * r2);
    line.setAttribute('stroke', 'currentColor');
    line.setAttribute('stroke-width', big ? 2.2 : 1);
    line.setAttribute('stroke-linecap', 'round');
    svg.appendChild(line);
  }
  if (inner) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', 500);
    c.setAttribute('cy', 500);
    c.setAttribute('r', inner);
    c.setAttribute('fill', 'none');
    c.setAttribute('stroke', 'currentColor');
    c.setAttribute('stroke-width', 0.8);
    svg.appendChild(c);
  }
}

/* céu: estrelas piscando e estrelas cadentes */
function initStars(canvas, { lowPower }) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { setRunning() {} };
  let W = 0;
  let H = 0;
  const stars = [];
  const streaks = [];
  let running = false;
  let time = 0;
  let acc = 0;
  let nextStreak = 1.5;
  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.5);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars.length = 0;
    const n = lowPower ? 70 : 140;
    for (let i = 0; i < n; i += 1) {
      stars.push({ x: Math.random() * W, y: Math.random() * H, r: 0.5 + Math.random() * 1.3, a: 0.2 + Math.random() * 0.6, ph: Math.random() * 6.28, sp: 0.4 + Math.random() * 1.6 });
    }
  }
  size();
  window.addEventListener('resize', size);
  function spawn() {
    const fromLeft = Math.random() < 0.65;
    streaks.push({
      x: fromLeft ? Math.random() * W * 0.5 : W * 0.4 + Math.random() * W * 0.6,
      y: Math.random() * H * 0.45,
      vx: (fromLeft ? 1 : -1) * (520 + Math.random() * 420),
      vy: 180 + Math.random() * 160,
      len: 90 + Math.random() * 150,
      life: 0.7 + Math.random() * 0.5,
      age: 0,
    });
  }
  function draw(dt) {
    time += dt;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = s.a * (0.55 + 0.45 * Math.sin(time * s.sp + s.ph));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    nextStreak -= dt;
    if (nextStreak <= 0) {
      spawn();
      if (Math.random() < 0.3) spawn();
      nextStreak = 2.2 + Math.random() * 4.5;
    }
    for (let i = streaks.length - 1; i >= 0; i -= 1) {
      const s = streaks[i];
      s.age += dt;
      if (s.age >= s.life) {
        streaks.splice(i, 1);
        continue;
      }
      const t = s.age / s.life;
      const x = s.x + s.vx * s.age;
      const y = s.y + s.vy * s.age;
      const mag = Math.hypot(s.vx, s.vy);
      const a = Math.sin(Math.PI * t);
      const tx = x - (s.vx / mag) * s.len * a;
      const ty = y - (s.vy / mag) * s.len * a;
      const g = ctx.createLinearGradient(tx, ty, x, y);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, `rgba(255,255,255,${0.9 * a})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  gsap.ticker.add((_t, deltaTime) => {
    if (!running) return;
    acc += Math.min(deltaTime || 16, 60) / 1000;
    if (acc < 1 / 30) return;
    draw(acc);
    acc = 0;
  });
  return {
    setRunning(v) {
      running = v;
    },
  };
}

/* faíscas em volta da asa: umas em órbita, outras subindo, e uma explosão na entrada */
const SPARK_COLORS = ['241,220,166', '255,255,255', '142,230,168', '214,180,106'];

function glowSprite(rgb) {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.25, `rgba(${rgb},0.55)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return c;
}

export function createSparks(canvas, { lowPower = false, dpr: maxDpr = 1.5 } = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const sprites = SPARK_COLORS.map(glowSprite);
  let W = 0;
  let H = 0;
  let k = 1;
  const orbiters = [];
  const embers = [];
  const bursts = [];
  let emberAcc = 0;
  const pick = () => Math.floor(Math.random() * (Math.random() < 0.55 ? 1 : SPARK_COLORS.length));
  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : maxDpr);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    k = W / 420;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener('resize', size);
  const n = lowPower ? 14 : 28;
  for (let i = 0; i < n; i += 1) {
    orbiters.push({
      a: Math.random() * Math.PI * 2,
      w: (0.18 + Math.random() * 0.4) * (Math.random() < 0.85 ? 1 : -1),
      r: 0.2 + Math.random() * 0.17,
      sq: 0.26 + Math.random() * 0.14,
      tilt: -0.32 + Math.random() * 0.12,
      s: 0.7 + Math.random() * 1.5,
      c: pick(),
      ph: Math.random() * 6.28,
    });
  }
  function emit(dt) {
    emberAcc += dt * (lowPower ? 3 : 6);
    while (emberAcc >= 1) {
      emberAcc -= 1;
      embers.push({
        x: (Math.random() - 0.5) * 0.3,
        y: 0.08 + Math.random() * 0.1,
        vy: 0.05 + Math.random() * 0.07,
        sw: Math.random() * 6.28,
        s: 0.6 + Math.random() * 1.3,
        c: pick(),
        life: 2.4 + Math.random() * 2.2,
        age: 0,
      });
    }
  }
  function draw(dt) {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const cx = W / 2;
    const cy = H / 2;
    for (const p of orbiters) {
      p.a += p.w * dt;
      p.ph += dt * 2.2;
      const ex = Math.cos(p.a) * p.r * W;
      const ey = Math.sin(p.a) * p.r * W * p.sq;
      const x = cx + ex * Math.cos(p.tilt) - ey * Math.sin(p.tilt);
      const y = cy + ex * Math.sin(p.tilt) + ey * Math.cos(p.tilt);
      const depth = 0.55 + 0.45 * Math.sin(p.a);
      const sz = p.s * k * 7 * (0.7 + 0.3 * depth);
      ctx.globalAlpha = (0.35 + 0.45 * depth) * (0.7 + 0.3 * Math.sin(p.ph));
      ctx.drawImage(sprites[p.c], x - sz / 2, y - sz / 2, sz, sz);
    }
    emit(dt);
    for (let i = embers.length - 1; i >= 0; i -= 1) {
      const e = embers[i];
      e.age += dt;
      if (e.age >= e.life) {
        embers.splice(i, 1);
        continue;
      }
      const t = e.age / e.life;
      e.y -= e.vy * dt;
      e.sw += dt * 1.6;
      const x = cx + (e.x + Math.sin(e.sw) * 0.015) * W;
      const y = cy + e.y * H;
      const sz = e.s * k * 6;
      ctx.globalAlpha = Math.sin(Math.PI * t) * 0.85;
      ctx.drawImage(sprites[e.c], x - sz / 2, y - sz / 2, sz, sz);
    }
    for (let i = bursts.length - 1; i >= 0; i -= 1) {
      const b = bursts[i];
      b.age += dt;
      if (b.age >= b.life) {
        bursts.splice(i, 1);
        continue;
      }
      const f = Math.exp(-2.6 * b.age);
      b.x += b.vx * f * dt;
      b.y += b.vy * f * dt;
      const sz = b.s * k * 7;
      ctx.globalAlpha = 1 - b.age / b.life;
      ctx.drawImage(sprites[b.c], cx + b.x * W - sz / 2, cy + b.y * W - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  return {
    draw,
    size,
    burst(count = lowPower ? 26 : 48) {
      for (let i = 0; i < count; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const v = 0.14 + Math.random() * 0.32;
        bursts.push({ x: 0, y: 0, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.8, s: 0.6 + Math.random() * 1.4, c: pick(), life: 1 + Math.random() * 0.9, age: 0 });
      }
    },
  };
}

export function initHeroOrbit({ reduceMotion = false, lowPower = false } = {}) {
  const hero = document.querySelector('.hero');
  const orbit = document.getElementById('orbit');
  if (!hero || !orbit) return;

  ring(document.getElementById('orbit-a'), { r: 480, count: 120, long: 34, every: 5 });
  ring(document.getElementById('orbit-b'), { r: 480, count: 60, long: 22, every: 5, inner: 448 });

  // nós do mapa: em círculo, cada um com uma linha até a asa
  const nodes = [...orbit.querySelectorAll('.onode')];
  const links = document.getElementById('orbit-links');
  const lines = nodes.map((node, i) => {
    const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
    const R = 0.41;
    node.style.left = `${50 + Math.cos(a) * R * 100}%`;
    node.style.top = `${50 + Math.sin(a) * R * 100}%`;
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', 500);
    line.setAttribute('y1', 500);
    line.setAttribute('x2', 500 + Math.cos(a) * R * 1000);
    line.setAttribute('y2', 500 + Math.sin(a) * R * 1000);
    links.appendChild(line);
    return line;
  });

  // fundo: seda e estrelas
  const silkCanvas = document.getElementById('hero-silk');
  const draw = silkCanvas ? initSilk(silkCanvas, lowPower ? 0.3 : 0.42) : null;
  let time = 11;
  let acc = 0;
  let visible = true;
  if (draw) {
    draw(time);
    silkCanvas.classList.add('is-on');
    gsap.ticker.add((_t, dt) => {
      if (!visible || reduceMotion || document.hidden) return;
      acc += Math.min(dt || 16, 60) / 1000;
      if (acc < 1 / 30) return;
      time += acc;
      acc = 0;
      draw(time);
    });
  }
  const stars = initStars(document.getElementById('hero-stars'), { lowPower });
  stars.setRunning(!reduceMotion);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    stars.setRunning(visible && !reduceMotion);
    orbit.classList.toggle('is-paused', !visible);
  }).observe(hero);

  // a logo: reflexo recortado no formato da asa, faíscas e inclinação com o mouse
  const fx = document.getElementById('logo-fx');
  const shine = document.getElementById('logo-shine');
  const wing = fx && fx.querySelector('img');
  if (shine && wing) {
    const mask = `url("${wing.src}")`;
    shine.style.webkitMaskImage = mask;
    shine.style.maskImage = mask;
  }
  const sparkCanvas = document.getElementById('orbit-sparks');
  const sparks = sparkCanvas && !reduceMotion ? createSparks(sparkCanvas, { lowPower }) : null;
  if (sparks) {
    let sAcc = 0;
    gsap.ticker.add((_t, dt) => {
      if (!visible || document.hidden) return;
      sAcc += Math.min(dt || 16, 60) / 1000;
      if (sAcc < 1 / 30) return;
      sparks.draw(sAcc);
      sAcc = 0;
    });
  }
  if (fx && !reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    gsap.set(fx, { transformPerspective: 700 });
    const rx = gsap.quickTo(fx, 'rotationX', { duration: 0.9, ease: 'power3.out' });
    const ry = gsap.quickTo(fx, 'rotationY', { duration: 0.9, ease: 'power3.out' });
    hero.addEventListener('pointermove', (e) => {
      const r = fx.getBoundingClientRect();
      const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.4)));
      const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight * 0.5)));
      ry(dx * 16);
      rx(-dy * 12);
    });
    hero.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
    });
  }

  // entrada: a roda cresce, as linhas se desenham, os chips aparecem
  const core = document.getElementById('orbit-core');
  const rings = [...orbit.querySelectorAll('.orbit__ring')];
  function enter() {
    gsap.fromTo(orbit, { opacity: 0, scale: 0.88 }, { opacity: 1, scale: 1, duration: 1.6, ease: 'power3.out' });
    gsap.fromTo(rings, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out', stagger: 0.15 });
    gsap.fromTo(core, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out', delay: 0.3 });
    if (sparks) setTimeout(() => sparks.burst(), 650);
    lines.forEach((l, i) => setTimeout(() => l.classList.add('is-on'), 500 + i * 90));
    gsap.fromTo(nodes, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out', stagger: 0.09, delay: 0.7 });
  }
  if (reduceMotion) {
    gsap.set([rings, core, nodes], { opacity: 1 });
    lines.forEach((l) => l.classList.add('is-on'));
  } else if (document.documentElement.classList.contains('is-ready')) {
    enter();
  } else {
    const mo = new MutationObserver(() => {
      if (document.documentElement.classList.contains('is-ready')) {
        mo.disconnect();
        enter();
      }
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  // a palavra do título e o chip do mapa acendem juntos
  const rot = document.getElementById('hero-rot');
  const words = rot ? [...rot.children] : [];
  let i = 0;
  const light = (k) => {
    nodes.forEach((n, j) => n.classList.toggle('is-lit', j === k));
    lines.forEach((l, j) => l.classList.toggle('is-lit', j === k));
  };
  light(0);
  if (reduceMotion) return;
  setInterval(() => {
    if (document.hidden || !visible) return;
    const cur = words[i];
    if (cur) {
      cur.classList.remove('is-on');
      cur.classList.add('is-out');
      setTimeout(() => cur.classList.remove('is-out'), 650);
    }
    i = (i + 1) % KEYS.length;
    if (words[i]) words[i].classList.add('is-on');
    light(i);
  }, 2400);
}
