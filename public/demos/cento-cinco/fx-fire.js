// Fogo, brasas e fumaça procedurais em WebGL (um único shader de tela cheia).
// Uso: const fire = createFire(canvas); fire.set({intensity, embers, smoke, base}); fire.start();
(function () {
  'use strict';

  const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
uniform float uIntensity;   // chamas na base (0..1)
uniform float uEmbers;      // densidade de brasas (0..1)
uniform float uSmoke;       // fumaça (0..1)
uniform vec2 uBase;         // centro da base do fogo (uv)
uniform float uWidth;       // largura relativa do fogo
uniform float uHeight;      // altura das labaredas (fração da tela)

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2((uv.x - uBase.x) * aspect, uv.y - uBase.y);

  // ---- Chamas: ruído subindo menos um gradiente de altura = línguas de fogo que se partem
  float t = uTime;
  float h = p.y / uHeight;
  vec2 w = vec2(fbm(vec2(p.x * 2.0, p.y * 1.5 - t * 0.9)), 0.0);
  float n1 = fbm(vec2(p.x * 3.4 + w.x * 0.8, p.y * 2.6 - t * 1.9));
  float n2 = fbm(vec2(p.x * 8.0, p.y * 6.0 - t * 3.6));
  float n3 = noise(vec2(p.x * 18.0, p.y * 14.0 - t * 7.0));
  float n = n1 * 0.74 + n2 * 0.3 + n3 * 0.1;
  float side = smoothstep(uWidth, uWidth * 0.25, abs(p.x));
  float f = n * 1.35 - h * 1.05 - (1.0 - side) * 0.75 + 0.12;
  float flame = smoothstep(0.3, 0.5, f) * smoothstep(-0.16, 0.05, p.y + (n - 0.5) * 0.12) * uIntensity;
  float heat = smoothstep(0.62, 1.05, f) * uIntensity;
  vec3 col = mix(vec3(0.55, 0.05, 0.02), vec3(1.0, 0.38, 0.04), smoothstep(0.3, 0.75, f));
  col = mix(col, vec3(1.0, 0.72, 0.28), heat);
  float alpha = flame;

  // ---- Brilho quente difuso perto da base
  float glow = exp(-length(p * vec2(0.75, 2.2)) * 2.6) * 0.5 * uIntensity;
  col = mix(col, vec3(0.85, 0.22, 0.03), glow * (1.0 - alpha));
  alpha = max(alpha, glow * 0.8);

  // ---- Fumaça: névoa lenta e escura-esverdeada no alto
  float s = fbm(vec2(uv.x * aspect * 1.4, uv.y * 1.6 - t * 0.08) + fbm(uv * 3.0 + t * 0.03));
  float smoke = smoothstep(0.45, 0.95, s) * smoothstep(uBase.y + 0.15, 0.95, uv.y) * 0.2 * uSmoke;
  col = mix(col, vec3(0.42, 0.4, 0.36), smoke * (1.0 - alpha));
  alpha = max(alpha, smoke);

  // ---- Brasas: 3 camadas de células, cada uma com uma faísca subindo e oscilando
  float sparks = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float scale = 7.0 + fi * 5.0;
    float speed = 0.10 + fi * 0.05;
    vec2 g = vec2(uv.x * aspect, uv.y) * scale;
    g.y -= t * speed * scale;
    g.x += sin(g.y * 0.35 + t * (0.6 + fi * 0.2)) * 0.35;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float h = hash(id + fi * 17.0);
    if (h < 0.75 * uEmbers) {
      vec2 off = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
      float d = length(f - off * 0.6);
      float flick = 0.55 + 0.45 * sin(t * (6.0 + h * 9.0) + h * 40.0);
      float size = 0.035 + h * 0.035 - fi * 0.008;
      sparks += smoothstep(size, 0.0, d) * flick * (1.0 - fi * 0.25);
    }
  }
  sparks *= smoothstep(1.05, 0.15, uv.y) * smoothstep(0.0, 0.18, uv.y + 0.1);
  col += vec3(1.0, 0.6, 0.2) * sparks * 1.4;
  alpha = max(alpha, clamp(sparks, 0.0, 1.0));

  gl_FragColor = vec4(col * alpha, alpha);   // pré-multiplicado
}`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); gl.deleteShader(s); return null; }
    return s;
  }

  window.createFire = function createFire(canvas, opts) {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) return null;
    const vs = compile(gl, gl.VERTEX_SHADER, VERT), fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = name => gl.getUniformLocation(prog, name);
    const U = { res: u('uRes'), time: u('uTime'), intensity: u('uIntensity'), embers: u('uEmbers'), smoke: u('uSmoke'), base: u('uBase'), width: u('uWidth'), height: u('uHeight') };

    // Estado alvo (set) e atual (suavizado a cada quadro).
    const o = opts || {};
    const target = { intensity: 1, embers: 1, smoke: 0.6, baseX: 0.5, baseY: 0.0, width: 0.55, height: 0.85 };
    for (const k of Object.keys(target)) if (typeof o[k] === 'number') target[k] = o[k];
    const cur = Object.assign({}, target);
    let scale = o.resolution || (window.matchMedia('(max-width: 760px)').matches ? 0.45 : 0.6);
    let raf = 0, running = false, wanted = false, t0 = performance.now(), visible = !document.hidden;

    function resize() {
      const w = Math.max(1, Math.round(canvas.clientWidth * scale)), h = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    }
    function frame(now) {
      raf = 0;
      if (!running) return;
      resize();
      for (const k of Object.keys(target)) cur[k] += (target[k] - cur[k]) * 0.08;
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.time, (now - t0) / 1000);
      gl.uniform1f(U.intensity, cur.intensity);
      gl.uniform1f(U.embers, cur.embers);
      gl.uniform1f(U.smoke, cur.smoke);
      gl.uniform2f(U.base, cur.baseX, cur.baseY);
      gl.uniform1f(U.width, cur.width);
      gl.uniform1f(U.height, cur.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    }
    const api = {
      set(values) { for (const k in values) if (k in target && Number.isFinite(values[k])) target[k] = values[k]; return api; },
      setScale(v) { scale = v; return api; },
      start() { wanted = true; if (!running && visible) { running = true; raf = raf || requestAnimationFrame(frame); } return api; },
      stop() { wanted = false; halt(); return api; },
      // Desenha um único quadro parado (movimento reduzido).
      still() { Object.assign(cur, target); running = true; frame(performance.now()); halt(); return api; },
    };
    // Perda do contexto WebGL (comum em celular com pouca memória): para e avisa quem usa.
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); wanted = false; halt(); if (typeof o.onLost === 'function') o.onLost(); });
    function halt() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    // Pausa com a aba escondida e retoma sozinho se estava rodando.
    document.addEventListener('visibilitychange', () => {
      visible = !document.hidden;
      if (!visible) halt(); else if (wanted) api.start();
    });
    return api;
  };
})();
