import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  Object3D,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
  Vector3,
  WebGLRenderer,
} from 'three';

/**
 * A "mente" do Grupo Kairos: milhares de partículas formando uma esfera com duas
 * metades (a esquerda puxa para o roxo da Kairos, a direita para o dourado da
 * Dalas), uma rede de conexões como a constelação do site da Kairos e duas
 * órbitas, uma para cada empresa. Com o scroll, as partículas se reorganizam e
 * desenham a marca do grupo. Tudo pausa fora da tela.
 */

// a marca do grupo (logo 01), nas mesmas coordenadas do SVG (0 a 100)
const MARK = {
  metal: ['M28 22H36V78H28Z', 'M42 56 49 52 76 78H66Z'],
  gold: ['M37 54Q58.52 37.08 76 16Q49.59 27.91 37 54Z', 'M37 54Q60.18 43.58 81 29Q54.36 33.34 37 54Z', 'M37 54Q59 49.81 80 42Q56.11 39.45 37 54Z'],
};

const VERT = /* glsl */ `
uniform float uTime;
uniform float uMorph;
uniform float uIntro;
uniform float uRot;
uniform float uSize;
uniform float uPR;
attribute vec3 aTarget;
attribute vec3 aColor;
attribute vec3 aColor2;
attribute float aRand;
varying vec3 vColor;
varying float vAlpha;
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
void main() {
  vec3 dir = normalize(position + vec3(0.0001));
  vec3 p = position * (1.0 + 0.025 * sin(uTime * 0.9 + aRand * 12.0));
  p.xz = rot(uRot) * p.xz;
  vec3 scatter = dir * (5.0 + aRand * 7.0);
  scatter.xz = rot(uRot * 0.5 + aRand) * scatter.xz;
  p = mix(scatter, p, uIntro);
  float m = smoothstep(0.0, 1.0, clamp((uMorph - aRand * 0.25) / 0.75, 0.0, 1.0));
  vec3 t = aTarget;
  t.z += sin(uTime * 1.3 + aRand * 20.0) * 0.035;
  vec3 pos = mix(p, t, m);
  float sw = sin(m * 3.14159);
  pos.xy = rot(sw * (aRand - 0.5) * 1.3) * pos.xy;
  pos += sw * dir * 0.7 * aRand;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = 0.72 + 0.28 * sin(uTime * 2.2 + aRand * 40.0);
  gl_PointSize = uSize * uPR * (0.55 + aRand * 0.9) * mix(1.0, 1.2, m) / -mv.z;
  vColor = mix(aColor, aColor2, m);
  float depth = smoothstep(-12.0, -6.8, mv.z) * 0.85 + 0.15;
  vAlpha = tw * mix(depth, 1.0, m);
}`;

const FRAG = /* glsl */ `
uniform float uFade;
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  gl_FragColor = vec4(vColor * (0.55 + a * 0.9), a * vAlpha * uFade);
}`;

const GLOW_VERT = /* glsl */ `
uniform float uSize;
uniform float uPR;
attribute vec3 aColor;
varying vec3 vColor;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPR / -mv.z;
  vColor = aColor;
}`;

const GLOW_FRAG = /* glsl */ `
uniform float uFade;
varying vec3 vColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float core = smoothstep(0.12, 0.0, d);
  float halo = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vColor * (core * 1.6 + halo * 0.6), (core + halo * halo * 0.8) * uFade);
}`;

function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

// sorteia pontos dentro da marca desenhada num canvas
function sampleMark(count, rand) {
  const S = 400;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.scale(S / 100, S / 100);
  ctx.fillStyle = '#ffffff';
  MARK.metal.forEach((d) => ctx.fill(new Path2D(d)));
  ctx.fillStyle = '#ff0000';
  MARK.gold.forEach((d) => ctx.fill(new Path2D(d)));
  // as marcas do mostrador
  ctx.lineCap = 'round';
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const major = i % 5 === 0;
    const r1 = major ? 42 : 44.5;
    ctx.strokeStyle = '#0000ff';
    ctx.lineWidth = major ? 1.6 : 1.1;
    ctx.beginPath();
    ctx.moveTo(50 + Math.sin(a) * r1, 50 - Math.cos(a) * r1);
    ctx.lineTo(50 + Math.sin(a) * 48.5, 50 - Math.cos(a) * 48.5);
    ctx.stroke();
  }
  const data = ctx.getImageData(0, 0, S, S).data;
  const pix = { w: [], g: [], t: [] };
  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) {
      const i = (y * S + x) * 4;
      if (data[i + 3] < 140) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (b > 150 && r < 100) pix.t.push(x, y);
      else if (r > 150 && g < 100) pix.g.push(x, y);
      else pix.w.push(x, y);
    }
  }
  // parte fixa para o mostrador, o resto proporcional à área
  const nTicks = Math.round(count * 0.16);
  const rest = count - nTicks;
  const areaW = pix.w.length, areaG = pix.g.length;
  const nGold = Math.round((rest * areaG) / (areaW + areaG));
  const out = [];
  const pick = (arr, n, kind) => {
    const len = arr.length / 2;
    for (let k = 0; k < n; k++) {
      const j = Math.floor(rand() * len);
      out.push([arr[j * 2] + rand() - 0.5, arr[j * 2 + 1] + rand() - 0.5, kind]);
    }
  };
  pick(pix.w, rest - nGold, 'w');
  pick(pix.g, nGold, 'g');
  pick(pix.t, nTicks, 't');
  // embaralha para o morph sair de todos os lados da esfera
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return { points: out, size: S };
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,247,226,1)');
  grd.addColorStop(0.18, 'rgba(240,214,150,0.55)');
  grd.addColorStop(0.5, 'rgba(160,130,220,0.12)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
}

export function initMind({ canvas, chips = [], reduceMotion = false, lowPower = false }) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.remove();
    return null;
  }
  const PR = Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.75);
  renderer.setPixelRatio(PR);
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 9);
  const root = new Group();
  scene.add(root);

  const rand = rng(20261123);
  const N = lowPower ? 2800 : 5600;
  const R = 1.8;

  // ---------- partículas ----------
  const pos = new Float32Array(N * 3);
  const tgt = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const col2 = new Float32Array(N * 3);
  const rnd = new Float32Array(N);
  const surface = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const nSurf = Math.floor(N * 0.74);
  const CHROME = [0.86, 0.87, 0.93];
  const GOLD = [0.95, 0.76, 0.42];
  const VIOLET = [0.68, 0.58, 1.0];
  for (let i = 0; i < N; i++) {
    let x, y, z;
    if (i < nSurf) {
      const yy = 1 - (i / (nSurf - 1)) * 2;
      const rr = Math.sqrt(1 - yy * yy);
      const th = golden * i;
      const j = 1 + (rand() - 0.5) * 0.05;
      x = Math.cos(th) * rr * j;
      y = yy * j;
      z = Math.sin(th) * rr * j;
    } else {
      const u = rand() * 2 - 1;
      const th = rand() * Math.PI * 2;
      const rr = Math.sqrt(1 - u * u);
      const d = Math.pow(rand(), 0.6) * 0.82;
      x = Math.cos(th) * rr * d;
      y = u * d;
      z = Math.sin(th) * rr * d;
    }
    // duas metades com uma fenda no meio, um pouco mais larga que alta
    x += Math.sign(x || 1) * 0.07;
    pos[i * 3] = x * R * 1.1;
    pos[i * 3 + 1] = y * R * 0.94;
    pos[i * 3 + 2] = z * R;
    if (i < nSurf && i % 3 === 0) surface.push(i);
    // cor: cromado com um toque de roxo à esquerda e de dourado à direita
    const side = x < 0 ? VIOLET : GOLD;
    const spark = rand() < 0.07;
    const k = spark ? 0.9 : 0.18 + Math.abs(x) * 0.22;
    for (let c = 0; c < 3; c++) col[i * 3 + c] = CHROME[c] * (1 - k) + side[c] * k;
    rnd[i] = rand();
  }

  const mark = sampleMark(N, rand);
  const MS = 4.4;
  mark.points.forEach(([px, py, kind], i) => {
    tgt[i * 3] = (px / mark.size - 0.5) * MS;
    tgt[i * 3 + 1] = -(py / mark.size - 0.5) * MS;
    tgt[i * 3 + 2] = (rand() - 0.5) * 0.18;
    const c = kind === 'g' ? GOLD : kind === 't' ? [0.62, 0.63, 0.7] : CHROME;
    const lift = kind === 'g' ? 1.05 : 1;
    for (let k = 0; k < 3; k++) col2[i * 3 + k] = Math.min(1, c[k] * lift);
  });

  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('aTarget', new Float32BufferAttribute(tgt, 3));
  geo.setAttribute('aColor', new Float32BufferAttribute(col, 3));
  geo.setAttribute('aColor2', new Float32BufferAttribute(col2, 3));
  geo.setAttribute('aRand', new Float32BufferAttribute(rnd, 1));
  const uniforms = {
    uTime: { value: 0 },
    uMorph: { value: 0 },
    uIntro: { value: reduceMotion ? 1 : 0 },
    uRot: { value: 0 },
    uSize: { value: lowPower ? 34 : 30 },
    uPR: { value: PR },
    uFade: { value: 1 },
  };
  const mat = new ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const cloud = new Points(geo, mat);
  cloud.frustumCulled = false;
  root.add(cloud);

  // ---------- rede (constelação) ----------
  const net = new Group();
  root.add(net);
  const seg = [];
  const pick = surface.filter((_, i) => i % (lowPower ? 3 : 2) === 0);
  const P = (i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
  for (let a = 0; a < pick.length; a++) {
    const pa = P(pick[a]);
    const near = [];
    for (let b = 0; b < pick.length; b++) {
      if (a === b) continue;
      const pb = P(pick[b]);
      const d = Math.hypot(pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2]);
      if (d < R * 0.26) near.push([d, pb]);
    }
    near.sort((u, v) => u[0] - v[0]);
    near.slice(0, 2).forEach(([, pb]) => seg.push(...pa, ...pb));
  }
  const netGeo = new BufferGeometry();
  netGeo.setAttribute('position', new Float32BufferAttribute(seg, 3));
  const netMat = new LineBasicMaterial({ color: 0xc8c8d8, transparent: true, opacity: 0.13, blending: AdditiveBlending, depthWrite: false });
  net.add(new LineSegments(netGeo, netMat));

  // ---------- brilho do centro ----------
  const core = new Sprite(new SpriteMaterial({ map: glowTexture(), blending: AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.55 }));
  core.scale.set(3.4, 3.4, 1);
  root.add(core);

  // ---------- órbitas: roxo (Kairos) e dourado (Dalas) ----------
  const glowUniforms = { uSize: { value: 340 }, uPR: { value: PR }, uFade: { value: 1 } };
  const glowMat = new ShaderMaterial({
    uniforms: glowUniforms,
    vertexShader: GLOW_VERT,
    fragmentShader: GLOW_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const orbits = [
    { color: 0xa78bfa, rgb: [0.72, 0.6, 1], r: 2.45, tilt: [1.15, 0.35, 0.2], speed: 0.32, phase: 0 },
    { color: 0xd8b46a, rgb: [1, 0.82, 0.5], r: 2.7, tilt: [1.3, -0.5, -0.25], speed: -0.24, phase: 2.4 },
  ].map((o) => {
    const g = new Group();
    g.rotation.set(...o.tilt);
    const pts = [];
    for (let i = 0; i <= 160; i++) {
      const a = (i / 160) * Math.PI * 2;
      pts.push(Math.cos(a) * o.r, Math.sin(a) * o.r, 0);
    }
    const lg = new BufferGeometry();
    lg.setAttribute('position', new Float32BufferAttribute(pts, 3));
    const lm = new LineBasicMaterial({ color: o.color, transparent: true, opacity: 0.32, blending: AdditiveBlending, depthWrite: false });
    g.add(new Line(lg, lm));
    const sg = new BufferGeometry();
    sg.setAttribute('position', new Float32BufferAttribute([o.r, 0, 0], 3));
    sg.setAttribute('aColor', new Float32BufferAttribute(o.rgb, 3));
    const sat = new Points(sg, glowMat);
    sat.frustumCulled = false;
    g.add(sat);
    root.add(g);
    return { ...o, group: g, line: lm, sat };
  });

  // ---------- etiquetas presas na esfera ----------
  const labels = new Object3D();
  root.add(labels);
  const anchors = chips.map((el, i) => {
    const lat = [0.55, -0.35, 0.15, -0.6, 0.75, -0.1][i % 6];
    const lon = (i / chips.length) * Math.PI * 2 + 0.4;
    const rr = R * 1.32;
    const v = new Vector3(Math.cos(lat) * Math.cos(lon) * rr * 1.1, Math.sin(lat) * rr, Math.cos(lat) * Math.sin(lon) * rr);
    return { el, v, tmp: new Vector3() };
  });

  // ---------- layout e interação ----------
  let W = 1, H = 1;
  let mobile = false;
  function layout() {
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    renderer.setSize(W, H, false);
    anchors.forEach((a) => (a.w = 0));
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    const visH = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
    const visW = visH * camera.aspect;
    mobile = camera.aspect < 0.95;
    if (mobile) {
      const s = Math.min(1, visW / 8.6);
      root.scale.setScalar(s);
      root.position.set(0, visH * 0.33, 0);
    } else {
      const s = Math.min(1.05, visH / 6.6);
      root.scale.setScalar(s);
      root.position.set(Math.min(visW * 0.24, 3.2), 0, 0);
    }
  }
  layout();
  window.addEventListener('resize', layout);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reduceMotion) {
    window.addEventListener(
      'pointermove',
      (e) => {
        mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
      },
      { passive: true },
    );
  }

  // ---------- estado vindo da página ----------
  let morph = 0;
  let fade = 1;
  let active = true;
  let raf = 0;
  let last = performance.now();
  let t = 0;
  let rotY = 0;
  let introStart = -1;

  function frame(now) {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!reduceMotion) {
      t += dt;
      rotY += dt * 0.12 * (1 - morph);
    }
    if (introStart >= 0 && uniforms.uIntro.value < 1) {
      const k = Math.min(1, (now - introStart) / 2600);
      uniforms.uIntro.value = 1 - Math.pow(1 - k, 3);
    }
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    root.rotation.y = mouse.x * 0.28;
    root.rotation.x = mouse.y * 0.16;

    uniforms.uTime.value = t;
    uniforms.uRot.value = rotY;
    uniforms.uMorph.value = morph;
    uniforms.uFade.value = fade;
    net.rotation.y = -rotY;
    labels.rotation.y = -rotY;
    const intro = uniforms.uIntro.value;
    netMat.opacity = 0.13 * fade * intro * Math.max(0, 1 - morph * 2.2);
    core.material.opacity = (0.5 + Math.sin(t * 1.4) * 0.08) * fade * intro * (1 - morph * 0.55);
    glowUniforms.uFade.value = fade * intro;
    orbits.forEach((o) => {
      const a = o.phase + t * o.speed;
      o.sat.position.set(Math.cos(a) * o.r - o.r, Math.sin(a) * o.r, 0);
      o.line.opacity = 0.3 * fade * intro;
      o.group.rotation.z = o.tilt[2] + t * 0.03;
    });

    // etiquetas: projeta cada âncora na tela e apaga as que ficam atrás
    root.updateMatrixWorld();
    const chipFade = fade * Math.max(0, 1 - morph * 3) * Math.max(0, (intro - 0.6) / 0.4);
    anchors.forEach((a) => {
      a.tmp.copy(a.v);
      labels.localToWorld(a.tmp);
      const depth = a.tmp.z - root.position.z;
      a.tmp.project(camera);
      const half = (a.w || (a.w = a.el.offsetWidth)) / 2 + 12;
      const x = Math.min(W - half, Math.max(half, (a.tmp.x * 0.5 + 0.5) * W));
      const y = (-a.tmp.y * 0.5 + 0.5) * H;
      const front = Math.min(1, Math.max(0, 0.25 + depth / (R * 1.6)));
      const o = chipFade * front;
      a.el.style.opacity = o.toFixed(3);
      a.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${(0.85 + front * 0.15).toFixed(3)})`;
      a.el.style.visibility = o < 0.02 ? 'hidden' : 'visible';
    });

    renderer.render(scene, camera);
    if (active && !document.hidden && !reduceMotion) raf = requestAnimationFrame(frame);
  }

  const kick = () => {
    if (!raf && active && !document.hidden) raf = requestAnimationFrame(frame);
  };
  document.addEventListener('visibilitychange', () => {
    last = performance.now();
    kick();
  });

  return {
    start() {
      introStart = performance.now();
      last = performance.now();
      kick();
      if (reduceMotion) frame(performance.now());
    },
    setMorph(v) {
      morph = v;
      if (reduceMotion) frame(performance.now());
    },
    setFade(v) {
      fade = v;
    },
    setActive(v) {
      active = v;
      if (v) {
        last = performance.now();
        kick();
      }
    },
  };
}
