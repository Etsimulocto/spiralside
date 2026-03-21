// ============================================================
// SPIRALSIDE — LIVING SKY v4.0
// Gradient sweep + shaped particles (stars, crosses, streaks, puffs)
// All colors from CSS theme vars
// Nimbis anchor: js/app/sky.js
// ============================================================

const SKY_CONFIG = {
  speed:    0.006,   // gradient cycle speed
  opacity:  0.65,    // canvas opacity
  numDots:  32,      // total particles
  dotSpeed: 0.25,    // drift speed px/frame
};

let _t    = 0;
let _raf  = null;
let _cvs  = null;
let _ctx  = null;
let _dots = [];

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

// ── THEME COLORS ──────────────────────────────────────────────
function getColors() {
  const purp = cssVar('--purple');
  const blue = cssVar('--blue');
  return {
    bg:   cssVar('--bg'),
    teal: cssVar('--teal'),
    purp: purp !== '#101014' ? purp : cssVar('--user-bubble'),
    pink: cssVar('--pink'),
    blue: blue !== '#101014' ? blue : cssVar('--teal'),
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

// ── PARTICLE SHAPES ───────────────────────────────────────────
// Types: 'dot', 'cross', 'star', 'streak', 'ring', 'diamond'
const SHAPES = ['dot', 'dot', 'dot', 'cross', 'star', 'streak', 'ring', 'diamond'];

function drawShape(ctx, type, x, y, r, color, alpha) {
  ctx.strokeStyle = color;
  ctx.fillStyle   = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth   = 0.8;

  if (type === 'dot') {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === 'cross') {
    const s = r * 2.5;
    ctx.beginPath(); ctx.moveTo(x-s, y); ctx.lineTo(x+s, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y-s); ctx.lineTo(x, y+s); ctx.stroke();

  } else if (type === 'star') {
    // 4-point star
    const s = r * 3;
    ctx.beginPath(); ctx.moveTo(x-s, y); ctx.lineTo(x+s, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y-s); ctx.lineTo(x, y+s); ctx.stroke();
    const d = s * 0.6;
    ctx.globalAlpha = alpha * 0.5;
    ctx.beginPath(); ctx.moveTo(x-d, y-d); ctx.lineTo(x+d, y+d); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+d, y-d); ctx.lineTo(x-d, y+d); ctx.stroke();
    // center dot
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, Math.PI * 2); ctx.fill();

  } else if (type === 'streak') {
    // short diagonal line
    const len = r * 5;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(x - len * 0.7, y - len * 0.3);
    ctx.lineTo(x + len * 0.7, y + len * 0.3);
    ctx.stroke();

  } else if (type === 'ring') {
    ctx.beginPath();
    ctx.arc(x, y, r * 2, 0, Math.PI * 2);
    ctx.lineWidth = 0.6;
    ctx.stroke();

  } else if (type === 'diamond') {
    const s = r * 2.2;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.6, y);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x - s * 0.6, y);
    ctx.closePath();
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

// ── PARTICLE INIT ─────────────────────────────────────────────
function makeDot(w, h, colors) {
  const colorList = [colors.teal, colors.pink, colors.purp, colors.blue];
  return {
    x:     Math.random() * w,
    y:     Math.random() * h,
    r:     Math.random() * 1.6 + 0.5,
    vx:    (Math.random() - 0.5) * SKY_CONFIG.dotSpeed,
    vy:    (Math.random() - 0.5) * SKY_CONFIG.dotSpeed * 0.5,
    alpha: Math.random() * 0.45 + 0.15,
    color: colorList[Math.floor(Math.random() * colorList.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
  };
}

function initDots(w, h) {
  const colors = getColors();
  _dots = Array.from({ length: SKY_CONFIG.numDots }, () => makeDot(w, h, colors));
}

function updateDots(w, h) {
  const colors = getColors();
  const colorList = [colors.teal, colors.pink, colors.purp, colors.blue];
  _dots.forEach(d => {
    d.x += d.vx;
    d.y += d.vy;
    if (d.x < -8) d.x = w + 8;
    if (d.x > w + 8) d.x = -8;
    if (d.y < -8) d.y = h + 8;
    if (d.y > h + 8) d.y = -8;
    // slowly re-color to current theme
    if (Math.random() < 0.002) {
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
  if (w > 0) _cvs.width  = w;
  if (h > 0) _cvs.height = h;
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

  // gradient
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

  // particles
  updateDots(w, h);
  _dots.forEach(d => drawShape(_ctx, d.shape, d.x, d.y, d.r, d.color, d.alpha));

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
