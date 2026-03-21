// ============================================================
// SPIRALSIDE — LIVING SKY v2.0
// Reads CSS custom properties live — always matches Style theme
// Rolls through accent colors as visible sweeps over --bg
// Nimbis anchor: js/app/sky.js
// ============================================================

const SKY_CONFIG = {
  speed:   0.0008,   // slow drift
  opacity: 0.55,     // visible but not overpowering
};

let _t   = 0;
let _raf = null;
let _cvs = null;
let _ctx = null;

// ── READ ONE CSS VAR ──────────────────────────────────────────
function cssVar(name) {
  return (getComputedStyle(document.documentElement).getPropertyValue(name)||'').replace(/\s+/g,'') || '#101014';
}

// ── PARSE ANY CSS COLOR TO [r,g,b] ───────────────────────────
// Handles #rgb, #rrggbb, and rgb(...) strings
function toRgb(color) {
  color = color.trim();
  // rgb(r,g,b) or rgb(r, g, b)
  const m = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) return [+m[1], +m[2], +m[3]];
  // #rrggbb
  const h = color.replace('#', '');
  if (h.length === 6) return [
    parseInt(h.slice(0,2),16)||0,
    parseInt(h.slice(2,4),16)||0,
    parseInt(h.slice(4,6),16)||0,
  ];
  // #rgb
  if (h.length === 3) return [
    parseInt(h[0]+h[0],16)||0,
    parseInt(h[1]+h[1],16)||0,
    parseInt(h[2]+h[2],16)||0,
  ];
  return [16, 16, 20];
}

function lerp(a, b, f) { return a + (b - a) * f; }

function lerpRgb(c1, c2, f) {
  const a = toRgb(c1), b = toRgb(c2);
  const r  = Math.round(lerp(a[0],b[0],f));
  const g  = Math.round(lerp(a[1],b[1],f));
  const bl = Math.round(lerp(a[2],b[2],f));
  if (isNaN(r)||isNaN(g)||isNaN(bl)) return 'rgb(16,16,20)';
  return `rgb(${r},${g},${bl})`;
}

function smoothstep(f) {
  const c = Math.max(0, Math.min(1, f));
  return c < 0.5 ? 4*c*c*c : 1 - Math.pow(-2*c+2,3)/2;
}

// ── BUILD STATES FROM LIVE CSS VARS ──────────────────────────
// Called each frame cycle so theme changes apply immediately
// Each state: [left, center, right] — sweeps one accent across bg
function getStates() {
  const bg   = cssVar('--bg');
  const teal = cssVar('--teal');
  const purp = cssVar('--user-bubble');
  const pink = cssVar('--pink');
  const blue = cssVar('--bubble-user-bg');
  const text = cssVar('--text');
  return [
    [bg,   teal, bg  ],   // teal center
    [purp, bg,   purp],   // purple wings
    [bg,   pink, bg  ],   // pink center
    [teal, bg,   blue],   // teal→blue sweep
    [bg,   purp, teal],   // purp→teal
    [pink, bg,   purp],   // pink→purple
  ];
}

// ── RESIZE ────────────────────────────────────────────────────
function resize() {
  if (!_cvs || !_cvs.parentElement) return;
  const r = _cvs.parentElement.getBoundingClientRect();
  const w = Math.round(r.width)  || 480;
  const h = Math.round(r.height) || 52;
  if (w > 0) _cvs.width  = w;
  if (h > 0) _cvs.height = h;
}

// ── DRAW FRAME ────────────────────────────────────────────────
function frame() {
  if (!_cvs || !_ctx) return;
  const w = _cvs.width, h = _cvs.height;
  if (!w || !h || w < 2) { _raf = requestAnimationFrame(frame); return; }

  const states = getStates();
  const n   = states.length;
  const pos = _t % n;
  const idx = Math.floor(pos);
  const sm  = smoothstep(pos - idx);
  const sA  = states[idx % n];
  const sB  = states[(idx+1) % n];

  try {
    const grad = _ctx.createLinearGradient(0, 0, w, 0);
    for (let i = 0; i <= 6; i++) {
      const p  = i / 6;
      const si = Math.min(Math.floor(p * 2), 1);
      const sf = Math.max(0, Math.min(1, p * 2 - si));
      const cA = lerpRgb(sA[si], sA[Math.min(si+1,2)], sf);
      const cB = lerpRgb(sB[si], sB[Math.min(si+1,2)], sf);
      grad.addColorStop(p, lerpRgb(cA, cB, sm));
    }
    _ctx.clearRect(0, 0, w, h);
    _ctx.fillStyle = grad;
    _ctx.fillRect(0, 0, w, h);
  } catch(e) { /* skip bad frame */ }

  _t += SKY_CONFIG.speed;
  _raf = requestAnimationFrame(frame);
}

// ── PUBLIC: INIT ──────────────────────────────────────────────
export function initSky() {
  _cvs = document.getElementById('sky-canvas');
  if (!_cvs) return;
  _cvs.style.opacity    = SKY_CONFIG.opacity;
  _cvs.style.background = 'transparent';
  _ctx = _cvs.getContext('2d');
  window.addEventListener('resize', resize);
  if (_raf) cancelAnimationFrame(_raf);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    resize();
    frame();
  }));
}

export function stopSky() {
  if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
}
