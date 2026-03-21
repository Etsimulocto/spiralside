// ============================================================
// SPIRALSIDE — LIVING SKY v1.2
// Reads colors from CSS custom properties — matches Style theme
// Nimbis anchor: js/app/sky.js
// ============================================================

// ── CONFIG ────────────────────────────────────────────────────
const SKY_CONFIG = {
  speed:   0.0012,   // drift speed — lower = slower
  opacity: 0.28,     // subtle — never fights the content
};

// ── INTERNAL STATE ────────────────────────────────────────────
let _t      = 0;
let _raf    = null;
let _cvs    = null;
let _ctx    = null;
let _states = null;   // built from CSS vars at init time

// ── READ CSS VARS ─────────────────────────────────────────────
// Pulls the live theme colors and builds 6 sky gradient states
function buildStates() {
  const s = getComputedStyle(document.documentElement);
  const get = (v) => s.getPropertyValue(v).trim() || '#101014';

  const bg     = get('--bg');
  const teal   = get('--teal');
  const purple = get('--purple');
  const pink   = get('--pink');
  const blue   = get('--blue');
  const muted  = get('--muted');

  // Each entry: [left, mid, right] — horizontal gradient across header
  return [
    [bg,     muted,  bg    ],   // base — nearly invisible
    [bg,     purple, muted ],   // purple drift
    [muted,  teal,   bg    ],   // teal drift
    [bg,     blue,   muted ],   // blue drift
    [muted,  pink,   bg    ],   // pink drift
    [bg,     purple, teal  ],   // purple + teal cross
  ];
}

// ── HELPERS ───────────────────────────────────────────────────
function lerp(a, b, f) { return a + (b - a) * f; }

function hexToRgb(hex) {
  // Handle both #rrggbb and #rgb shorthand
  if (!hex) return [16, 16, 20];
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return [
      parseInt(h[0]+h[0], 16),
      parseInt(h[1]+h[1], 16),
      parseInt(h[2]+h[2], 16),
    ];
  }
  return [
    parseInt(h.slice(0,2), 16) || 16,
    parseInt(h.slice(2,4), 16) || 16,
    parseInt(h.slice(4,6), 16) || 20,
  ];
}

function lerpColor(c1, c2, f) {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  const r  = Math.round(lerp(a[0], b[0], f));
  const g  = Math.round(lerp(a[1], b[1], f));
  const bl = Math.round(lerp(a[2], b[2], f));
  if (isNaN(r) || isNaN(g) || isNaN(bl)) return '#101014';
  return `rgb(${r},${g},${bl})`;
}

function smoothstep(f) {
  const c = Math.max(0, Math.min(1, f));
  return c < 0.5 ? 4*c*c*c : 1 - Math.pow(-2*c+2, 3) / 2;
}

// ── RESIZE ────────────────────────────────────────────────────
function resize() {
  if (!_cvs || !_cvs.parentElement) return;
  const rect = _cvs.parentElement.getBoundingClientRect();
  const w = Math.round(rect.width)  || 480;
  const h = Math.round(rect.height) || 52;
  if (w > 0) _cvs.width  = w;
  if (h > 0) _cvs.height = h;
}

// ── DRAW FRAME ────────────────────────────────────────────────
function frame() {
  if (!_cvs || !_ctx || !_states) return;

  const w = _cvs.width, h = _cvs.height;
  if (!w || !h || w < 2) { _raf = requestAnimationFrame(frame); return; }

  const n   = _states.length;
  const pos = _t % n;
  const idx = Math.floor(pos);
  const sm  = smoothstep(pos - idx);
  const sA  = _states[idx % n];
  const sB  = _states[(idx + 1) % n];

  try {
    const grad = _ctx.createLinearGradient(0, 0, w, 0);
    for (let i = 0; i <= 4; i++) {
      const p  = i / 4;
      const si = Math.min(Math.floor(p * 2), 1);
      const sf = Math.max(0, Math.min(1, p * 2 - si));
      const cA = lerpColor(sA[si], sA[Math.min(si+1, 2)], sf);
      const cB = lerpColor(sB[si], sB[Math.min(si+1, 2)], sf);
      grad.addColorStop(p, lerpColor(cA, cB, sm));
    }
    _ctx.clearRect(0, 0, w, h);
    _ctx.fillStyle = grad;
    _ctx.fillRect(0, 0, w, h);
  } catch(e) { /* skip bad frame */ }

  _t  += SKY_CONFIG.speed;
  _raf = requestAnimationFrame(frame);
}

// ── PUBLIC: INIT ──────────────────────────────────────────────
export function initSky() {
  _cvs = document.getElementById('sky-canvas');
  if (!_cvs) return;
  _cvs.style.opacity = SKY_CONFIG.opacity;
  _cvs.style.background = 'transparent';
  _ctx = _cvs.getContext('2d');
  window.addEventListener('resize', resize);
  if (_raf) cancelAnimationFrame(_raf);
  // Double rAF: layout settles, CSS vars are computed
  requestAnimationFrame(() => requestAnimationFrame(() => {
    _states = buildStates();
    resize();
    frame();
  }));
}

// ── PUBLIC: REBUILD (call after theme change in Style tab) ────
export function rebuildSky() {
  if (_cvs) _states = buildStates();
}

// ── PUBLIC: STOP ─────────────────────────────────────────────
export function stopSky() {
  if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
}
