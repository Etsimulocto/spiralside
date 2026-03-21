# ============================================================
# SPIRALSIDE — SKY REWRITE
# Overwrites js/app/sky.js with NaN-safe version
# Run from ~/spiralside
# ============================================================

SKY_JS = r"""// ============================================================
// SPIRALSIDE — LIVING SKY v1.1
// Animated gradient canvas behind the header
// NaN-safe: guards all zero-dimension edge cases
// Nimbis anchor: js/app/sky.js
// ============================================================

// ── CONFIG ────────────────────────────────────────────────────
const SKY_CONFIG = {
  speed:   0.0015,
  opacity: 0.32,
  states: [
    ['#1a0a2e', '#0d1a3d', '#101014'],
    ['#0d2a4a', '#1a3a6e', '#0a1520'],
    ['#2a0a3e', '#7c2a8a', '#1a0a2e'],
    ['#002a2a', '#004a3a', '#101014'],
    ['#1a0a0a', '#3a1a3a', '#0a0a1e'],
    ['#0a1a2a', '#1a2a4a', '#0a0a14'],
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
  if (!hex || hex.length < 7) return [0, 0, 0];
  return [
    parseInt(hex.slice(1, 3), 16) || 0,
    parseInt(hex.slice(3, 5), 16) || 0,
    parseInt(hex.slice(5, 7), 16) || 0,
  ];
}

function lerpColor(c1, c2, f) {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  const r = Math.round(lerp(a[0], b[0], f));
  const g = Math.round(lerp(a[1], b[1], f));
  const bl = Math.round(lerp(a[2], b[2], f));
  // Guard: if any channel is NaN, return a safe fallback
  if (isNaN(r) || isNaN(g) || isNaN(bl)) return '#101014';
  return `rgb(${r},${g},${bl})`;
}

function smoothstep(f) {
  const c = Math.max(0, Math.min(1, f));
  return c < 0.5 ? 4*c*c*c : 1 - Math.pow(-2*c + 2, 3) / 2;
}

// ── RESIZE ────────────────────────────────────────────────────
function resize() {
  if (!_cvs || !_cvs.parentElement) return;
  const rect = _cvs.parentElement.getBoundingClientRect();
  const w = Math.round(rect.width)  || _cvs.parentElement.offsetWidth  || 480;
  const h = Math.round(rect.height) || _cvs.parentElement.offsetHeight || 52;
  if (w > 0) _cvs.width  = w;
  if (h > 0) _cvs.height = h;
}

// ── DRAW FRAME ────────────────────────────────────────────────
function frame() {
  if (!_cvs || !_ctx) return;

  const w = _cvs.width, h = _cvs.height;

  // Skip frame entirely if canvas has no dimensions yet
  if (!w || !h || w < 2) {
    _raf = requestAnimationFrame(frame);
    return;
  }

  const states = SKY_CONFIG.states;
  const n      = states.length;
  const pos    = _t % n;
  const idx    = Math.floor(pos);
  const frac   = pos - idx;
  const sm     = smoothstep(frac);
  const sA     = states[idx % n];
  const sB     = states[(idx + 1) % n];

  try {
    const grad = _ctx.createLinearGradient(0, 0, w, 0);
    for (let i = 0; i <= 4; i++) {
      const p  = i / 4;
      const si = Math.min(Math.floor(p * 2), 1);
      const sf = Math.max(0, Math.min(1, p * 2 - si));
      const cA = lerpColor(sA[si], sA[Math.min(si + 1, 2)], sf);
      const cB = lerpColor(sB[si], sB[Math.min(si + 1, 2)], sf);
      const c  = lerpColor(cA, cB, sm);
      grad.addColorStop(p, c);
    }
    _ctx.clearRect(0, 0, w, h);
    _ctx.fillStyle = grad;
    _ctx.fillRect(0, 0, w, h);
  } catch(e) {
    // Silently skip bad frames rather than throwing
  }

  _t += SKY_CONFIG.speed;
  _raf = requestAnimationFrame(frame);
}

// ── PUBLIC: INIT ──────────────────────────────────────────────
export function initSky() {
  _cvs = document.getElementById('sky-canvas');
  if (!_cvs) return;
  _cvs.style.opacity = SKY_CONFIG.opacity;
  _ctx = _cvs.getContext('2d');
  window.addEventListener('resize', resize);
  if (_raf) cancelAnimationFrame(_raf);
  // Double rAF: first paint completes layout, second has real dimensions
  requestAnimationFrame(() => requestAnimationFrame(() => {
    resize();
    frame();
  }));
}

// ── PUBLIC: STOP ─────────────────────────────────────────────
export function stopSky() {
  if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
}
"""

with open('js/app/sky.js', 'w', encoding='utf-8') as f:
    f.write(SKY_JS)
print('[sky.js] rewritten with NaN guards')
print()
print('=== DONE ===')
print('git add . && git commit -m "fix: sky NaN-safe rewrite v1.1" && git push --force origin main')
