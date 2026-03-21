// ============================================================
// SPIRALSIDE — LIVING SKY v1.0
// Animated gradient canvas behind the header
// Slow drift through Bloomcore night sky color states
// Nimbis anchor: js/app/sky.js
// ============================================================

// ── CONFIG — tweak these freely ──────────────────────────────
const SKY_CONFIG = {
  speed:   0.0015,   // cycle speed — lower = slower drift
  opacity: 0.30,     // canvas opacity over header bg
  // Each state is [left-color, mid-color, right-color]
  states: [
    ['#1a0a2e', '#0d1a3d', '#101014'],   // deep night purple-blue
    ['#0d2a4a', '#1a3a6e', '#0a1520'],   // pre-dawn deep blue
    ['#2a0a3e', '#7c2a8a', '#1a0a2e'],   // dusk violet
    ['#002a2a', '#004a3a', '#101014'],   // teal drift
    ['#1a0a0a', '#3a1a3a', '#0a0a1e'],   // warm magenta night
    ['#0a1a2a', '#1a2a4a', '#0a0a14'],   // cool midnight
  ],
};

// ── STATE ─────────────────────────────────────────────────────
let _t   = 0;
let _raf = null;
let _cvs = null;
let _ctx = null;

// ── HELPERS ───────────────────────────────────────────────────
function lerp(a, b, f) { return a + (b - a) * f; }

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function lerpColor(c1, c2, f) {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  return `rgb(${Math.round(lerp(a[0],b[0],f))},${Math.round(lerp(a[1],b[1],f))},${Math.round(lerp(a[2],b[2],f))})`;
}

// Smooth cubic ease in-out so state transitions feel organic
function smoothstep(f) {
  return f < 0.5 ? 4*f*f*f : 1 - Math.pow(-2*f + 2, 3) / 2;
}

// ── RESIZE ────────────────────────────────────────────────────
function resize() {
  if (!_cvs) return;
  const rect = _cvs.parentElement.getBoundingClientRect();
  _cvs.width  = Math.round(rect.width);
  _cvs.height = Math.round(rect.height);
}

// ── DRAW FRAME ────────────────────────────────────────────────
function frame() {
  if (!_cvs || !_ctx) return;

  const states = SKY_CONFIG.states;
  const n      = states.length;
  const pos    = _t % n;
  const idx    = Math.floor(pos);
  const frac   = pos - idx;
  const sm     = smoothstep(frac);

  const sA = states[idx % n];
  const sB = states[(idx + 1) % n];

  const w = _cvs.width, h = _cvs.height;

  const grad = _ctx.createLinearGradient(0, 0, w, 0);
  for (let i = 0; i <= 4; i++) {
    const p  = i / 4;
    const si = Math.min(Math.floor(p * 2), 1);
    const sf = p * 2 - si;
    const cA = lerpColor(sA[si], sA[Math.min(si + 1, 2)], sf);
    const cB = lerpColor(sB[si], sB[Math.min(si + 1, 2)], sf);
    grad.addColorStop(p, lerpColor(cA, cB, sm));
  }

  _ctx.clearRect(0, 0, w, h);
  _ctx.fillStyle = grad;
  _ctx.fillRect(0, 0, w, h);

  _t += SKY_CONFIG.speed;
  _raf = requestAnimationFrame(frame);
}

// ── PUBLIC: INIT ──────────────────────────────────────────────
export function initSky() {
  _cvs = document.getElementById('sky-canvas');
  if (!_cvs) {
    console.warn('[sky] #sky-canvas not found in DOM');
    return;
  }
  _cvs.style.opacity = SKY_CONFIG.opacity;
  _ctx = _cvs.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  if (_raf) cancelAnimationFrame(_raf);
  frame();
}

// ── PUBLIC: STOP ─────────────────────────────────────────────
export function stopSky() {
  if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
}
