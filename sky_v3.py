SKY_JS = r"""// ============================================================
// SPIRALSIDE — LIVING SKY v3.0
// Gradient sweep + floating particles, all from CSS vars
// Nimbis anchor: js/app/sky.js
// ============================================================

const SKY_CONFIG = {
  speed:      0.006,   // gradient cycle speed
  opacity:    0.65,    // canvas opacity
  numDots:    28,      // particles in header
  dotSpeed:   0.3,     // px per frame drift speed
};

let _t      = 0;
let _raf    = null;
let _cvs    = null;
let _ctx    = null;
let _dots   = [];     // particle array

// ── CSS VAR READER ────────────────────────────────────────────
function cssVar(name) {
  return (getComputedStyle(document.documentElement)
    .getPropertyValue(name) || '').replace(/\s+/g, '') || '#101014';
}

// ── COLOR PARSER ──────────────────────────────────────────────
function toRgb(color) {
  color = (color || '').trim();
  const m = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) return [+m[1], +m[2], +m[3]];
  const h = color.replace('#', '');
  if (h.length === 6) return [parseInt(h.slice(0,2),16)||0, parseInt(h.slice(2,4),16)||0, parseInt(h.slice(4,6),16)||0];
  if (h.length === 3) return [parseInt(h[0]+h[0],16)||0, parseInt(h[1]+h[1],16)||0, parseInt(h[2]+h[2],16)||0];
  return [16,16,20];
}

function lerp(a, b, f) { return a + (b - a) * f; }

function lerpRgb(c1, c2, f) {
  const a = toRgb(c1), b = toRgb(c2);
  const r=Math.round(lerp(a[0],b[0],f)), g=Math.round(lerp(a[1],b[1],f)), bl=Math.round(lerp(a[2],b[2],f));
  if (isNaN(r)||isNaN(g)||isNaN(bl)) return 'rgb(16,16,20)';
  return `rgb(${r},${g},${bl})`;
}

function smoothstep(f) {
  const c = Math.max(0, Math.min(1, f));
  return c < 0.5 ? 4*c*c*c : 1 - Math.pow(-2*c+2,3)/2;
}

// ── GET LIVE THEME COLORS ─────────────────────────────────────
function getColors() {
  return {
    bg:   cssVar('--bg'),
    teal: cssVar('--teal'),
    purp: cssVar('--purple') !== '#101014' ? cssVar('--purple') : cssVar('--user-bubble'),
    pink: cssVar('--pink'),
    blue: cssVar('--blue') !== '#101014' ? cssVar('--blue') : cssVar('--teal'),
  };
}

// ── GRADIENT STATES ───────────────────────────────────────────
function getStates(c) {
  return [
    [c.bg,   c.teal, c.bg  ],
    [c.purp, c.bg,   c.purp],
    [c.bg,   c.pink, c.bg  ],
    [c.teal, c.bg,   c.blue],
    [c.bg,   c.purp, c.teal],
    [c.pink, c.bg,   c.purp],
  ];
}

// ── PARTICLES ─────────────────────────────────────────────────
function makeDot(w, h, colors) {
  const colorList = [colors.teal, colors.pink, colors.purp];
  return {
    x:     Math.random() * w,
    y:     Math.random() * h,
    r:     Math.random() * 1.8 + 0.4,
    vx:    (Math.random() - 0.5) * SKY_CONFIG.dotSpeed,
    vy:    (Math.random() - 0.5) * SKY_CONFIG.dotSpeed * 0.4,
    alpha: Math.random() * 0.5 + 0.15,
    color: colorList[Math.floor(Math.random() * colorList.length)],
  };
}

function initDots(w, h) {
  const colors = getColors();
  _dots = Array.from({ length: SKY_CONFIG.numDots }, () => makeDot(w, h, colors));
}

function updateDots(w, h) {
  const colors = getColors();
  _dots.forEach(d => {
    d.x += d.vx;
    d.y += d.vy;
    // Wrap around edges
    if (d.x < -4) d.x = w + 4;
    if (d.x > w + 4) d.x = -4;
    if (d.y < -4) d.y = h + 4;
    if (d.y > h + 4) d.y = -4;
    // Occasionally re-color to current theme
    if (Math.random() < 0.001) {
      const colorList = [colors.teal, colors.pink, colors.purp];
      d.color = colorList[Math.floor(Math.random() * colorList.length)];
    }
  });
}

// ── RESIZE ────────────────────────────────────────────────────
function resize() {
  if (!_cvs || !_cvs.parentElement) return;
  const rect = _cvs.parentElement.getBoundingClientRect();
  const w = Math.round(rect.width) || 480;
  const h = Math.round(rect.height) || 52;
  if (w > 0) { _cvs.width = w; }
  if (h > 0) { _cvs.height = h; }
  if (_dots.length === 0) initDots(w, h);
}

// ── DRAW FRAME ────────────────────────────────────────────────
function frame() {
  if (!_cvs || !_ctx) return;
  const w = _cvs.width, h = _cvs.height;
  if (!w || !h || w < 2) { _raf = requestAnimationFrame(frame); return; }

  const colors = getColors();
  const states = getStates(colors);
  const n      = states.length;
  const pos    = _t % n;
  const idx    = Math.floor(pos);
  const sm     = smoothstep(pos - idx);
  const sA     = states[idx % n];
  const sB     = states[(idx+1) % n];

  // ── Draw gradient ──
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
  } catch(e) { _ctx.clearRect(0, 0, w, h); }

  // ── Draw particles ──
  updateDots(w, h);
  _dots.forEach(d => {
    _ctx.beginPath();
    _ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    _ctx.fillStyle = d.color;
    _ctx.globalAlpha = d.alpha;
    _ctx.fill();
  });
  _ctx.globalAlpha = 1;

  _t  += SKY_CONFIG.speed;
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
    initDots(_cvs.width, _cvs.height);
    frame();
  }));
}

export function stopSky() {
  if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
}
"""

with open('js/app/sky.js', 'w', encoding='utf-8') as f:
    f.write(SKY_JS)
print('OK — sky v3.0 written with gradient + particles')
print()
print('git add js/app/sky.js && git commit -m "feat: sky v3 — gradient + theme-colored particles" && git push --force origin main')
