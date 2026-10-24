import { gsap } from 'gsap';

/**
 * Hero: a asa da Dalas no centro de dois mostradores que giram devagar, com os
 * oito serviços em volta como um mapa mental (cada um acende na sua vez, junto
 * com a palavra do título). Ao fundo, a mesma fumaça sedosa da chamada final e
 * um céu com estrelas piscando e estrelas cadentes. Tudo pausa fora da tela.
 */
const NS = 'http://www.w3.org/2000/svg';
const KEYS = ['sites', 'funis', 'crm', 'automacoes', 'sistemas', 'paineis', 'audiovisual', 'design'];

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

function initSilk(canvas, scale) {
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

  const spin = document.getElementById('orbit-spin');

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
    [spin, ...orbit.querySelectorAll('.orbit__ring'), ...nodes].forEach((el) => {
      el.style.animationPlayState = visible ? 'running' : 'paused';
    });
  }).observe(hero);

  // entrada: a roda cresce, as linhas se desenham, os chips aparecem
  const core = document.getElementById('orbit-core');
  const rings = [...orbit.querySelectorAll('.orbit__ring')];
  function enter() {
    gsap.fromTo(orbit, { opacity: 0, scale: 0.88 }, { opacity: 1, scale: 1, duration: 1.6, ease: 'power3.out' });
    gsap.fromTo(rings, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out', stagger: 0.15 });
    gsap.fromTo(core, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out', delay: 0.3 });
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
