// ============================================================
// SPIRALSIDE — PARTICLES ENGINE v1.0
// Global canvas bg system — glitter, snow, sparks + more
// Plugs into existing #particles-canvas + style tab controls
// XP-gated presets: lv1=glitter/snow/sparks, lv6=confetti,
//                   lv8=aurora, lv10=void
// Nimbis anchor: js/app/particles.js
// ============================================================

// ── CONFIG DEFAULTS ───────────────────────────────────────
const DEFAULT_CFG = {
  enabled:  false,
  preset:   'glitter',
  color:    '#00F6D6',
  density:  30,
  speed:    3,
  size:     2,
};

// ── PRESET LEVEL GATES ────────────────────────────────────
// Keys match preset names used in selectBgType / toggleBgLayer
const PRESET_LEVELS = {
  glitter:  1,
  snow:     1,
  sparks:   1,
  confetti: 6,
  aurora:   8,
  void:     10,
};

// ── MODULE STATE ─────────────────────────────────────────
let cv   = null;   // canvas element
let ctx  = null;   // 2d context
let W    = 0;
let H    = 0;
let cfg  = { ...DEFAULT_CFG };
let pool = [];     // particle pool
let raf  = null;   // animation frame handle
let running = false;

// ── IDB HELPERS ───────────────────────────────────────────
// Use existing db.js if available, otherwise localStorage fallback
async function loadCfg() {
  try {
    const { dbGet } = await import('./db.js');
    const saved = await dbGet('config', 'particles_config');
    if (saved) cfg = { ...DEFAULT_CFG, ...saved };
  } catch {
    try {
      const s = localStorage.getItem('ss_particles');
      if (s) cfg = { ...DEFAULT_CFG, ...JSON.parse(s) };
    } catch {}
  }
}

async function saveCfg() {
  try {
    const { dbSet } = await import('./db.js');
    await dbSet('config', { id: 'particles_config', ...cfg });
  } catch {
    try { localStorage.setItem('ss_particles', JSON.stringify(cfg)); } catch {}
  }
}

// ── XP GATE ───────────────────────────────────────────────
// Returns current player level — uses xp.js if loaded, else 1
function getPlayerLevel() {
  if (window._xpState?.level) return window._xpState.level;
  if (window._xpLevel) return window._xpLevel;
  return 1; // unlocked during dev/no-XP mode — cap at 99 so all presets available
}

function presetUnlocked(name) {
  return getPlayerLevel() >= (PRESET_LEVELS[name] || 1);
}

// ── CANVAS RESIZE ─────────────────────────────────────────
function resize() {
  if (!cv) return;
  W = cv.width  = window.innerWidth;
  H = cv.height = window.innerHeight;
}

// ── PARTICLE FACTORY ──────────────────────────────────────
function hex2rgb(h) {
  const r = parseInt(h.slice(1,3),16);
  const g = parseInt(h.slice(3,5),16);
  const b = parseInt(h.slice(5,7),16);
  return [r,g,b];
}

function makeParticle() {
  const [r,g,b] = hex2rgb(cfg.color);
  const spd = cfg.speed * 0.35;
  return {
    x:  Math.random() * W,
    y:  Math.random() * H,
    vx: (Math.random() - 0.5) * spd,
    vy: (Math.random() - 0.5) * spd,
    s:  cfg.size * (0.5 + Math.random()),
    a:  0.35 + Math.random() * 0.55,
    tw: Math.random() * Math.PI * 2,
    r, g, b,
  };
}

function syncPool() {
  while (pool.length < cfg.density) pool.push(makeParticle());
  if (pool.length > cfg.density) pool.length = cfg.density;
}

// ── DRAW SHAPES ───────────────────────────────────────────
function drawStar(x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a  = Math.PI / 2 + i * Math.PI * 2 / 5;
    const a2 = a + Math.PI / 5;
    i === 0
      ? ctx.moveTo(x + r * Math.cos(a),         y + r * Math.sin(a))
      : ctx.lineTo(x + r * Math.cos(a),         y + r * Math.sin(a));
    ctx.lineTo(x + r * 0.4 * Math.cos(a2), y + r * 0.4 * Math.sin(a2));
  }
  ctx.closePath();
}

// ── FRAME LOOP ────────────────────────────────────────────
function frame() {
  if (!running) return;
  ctx.clearRect(0, 0, W, H);
  const preset = cfg.preset;

  for (const p of pool) {
    // move
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < -12) p.x = W + 12;
    if (p.x > W + 12) p.x = -12;
    if (p.y < -12) p.y = H + 12;
    if (p.y > H + 12) p.y = -12;

    p.tw += 0.04;
    const tw  = 0.5 + 0.5 * Math.sin(p.tw);
    const alpha = p.a * tw;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (preset === 'glitter') {
      drawStar(p.x, p.y, p.s * 2);
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      ctx.fill();
    } else if (preset === 'snow') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      ctx.fill();
    } else if (preset === 'sparks') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.tw);
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      ctx.fillRect(-p.s * 0.4, -p.s * 2, p.s * 0.8, p.s * 4);
    } else if (preset === 'confetti') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.tw);
      ctx.fillStyle = `hsl(${(p.tw * 60) % 360},80%,65%)`;
      ctx.fillRect(-p.s, -p.s * 2, p.s * 2, p.s * 4);
    } else if (preset === 'aurora') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s * 3, 0, Math.PI * 2);
      const g2 = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.s*3);
      g2.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${alpha})`);
      g2.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
      ctx.fillStyle = g2;
      ctx.fill();
    } else {
      // void — dark inverse sparks
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,0,0,${alpha * 0.8})`;
      ctx.fill();
    }

    ctx.restore();
  }
  raf = requestAnimationFrame(frame);
}

// ── START / STOP ──────────────────────────────────────────
function startEngine() {
  if (running) return;
  running = true;
  resize();
  syncPool();
  cv.classList.add('active');
  raf = requestAnimationFrame(frame);
}

function stopEngine() {
  running = false;
  if (raf) { cancelAnimationFrame(raf); raf = null; }
  if (ctx) ctx.clearRect(0, 0, W, H);
  cv?.classList.remove('active');
}

// ── PUBLIC API (called from style.js / ui.js globals) ─────

// Called by toggleBgLayer('particles') in style tab
window.toggleBgLayer = (function(orig) {
  return function(layer) {
    if (layer === 'particles') {
      cfg.enabled = !cfg.enabled;
      if (cfg.enabled) startEngine(); else stopEngine();
      saveCfg();
      // update toggle visual
      const tog = document.getElementById('toggle-particles');
      if (tog) {
        tog.style.background = cfg.enabled ? 'var(--teal)' : 'var(--muted)';
        const dot = tog.querySelector('div');
        if (dot) dot.style.transform = cfg.enabled ? 'translateX(18px)' : 'translateX(0)';
      }
    } else if (typeof orig === 'function') {
      orig(layer);
    }
  };
})(window.toggleBgLayer);

// Called by selectBgType(el, 'particles') — old slide panel
window.selectBgType = (function(orig) {
  return function(el, type) {
    if (type === 'particles') {
      if (!presetUnlocked(cfg.preset)) {
        cfg.preset = 'glitter'; // fallback to free preset
      }
      cfg.enabled = true;
      startEngine();
      saveCfg();
    } else {
      stopEngine();
      cfg.enabled = false;
      saveCfg();
    }
    if (typeof orig === 'function') orig(el, type);
  };
})(window.selectBgType);

// Density slider
window.updateParticleDensity = function(v) {
  cfg.density = parseInt(v);
  syncPool();
  saveCfg();
};
// Speed slider
window.updateParticleSpeed = function(v) {
  cfg.speed = parseInt(v);
  pool.forEach(p => {
    const spd = cfg.speed * 0.35;
    p.vx = (Math.random()-0.5)*spd;
    p.vy = (Math.random()-0.5)*spd;
  });
  saveCfg();
};
// Size slider
window.updateParticleSize = function(v) {
  cfg.size = parseInt(v);
  pool.forEach(p => { p.s = cfg.size*(0.5+Math.random()); });
  saveCfg();
};
// Color picker
window.updateParticleColor = function(hex) {
  cfg.color = hex;
  const [r,g,b] = hex2rgb(hex);
  pool.forEach(p => { p.r=r; p.g=g; p.b=b; });
  saveCfg();
};
// Preset switcher (for future UI button)
window.setParticlePreset = function(name) {
  if (!presetUnlocked(name)) {
    console.warn('[particles] preset locked:', name);
    return false;
  }
  cfg.preset = name;
  saveCfg();
  return true;
};

// ── INIT ──────────────────────────────────────────────────
// Called from main.js after login

window._particlesStart = function(d,sp,sz,col) { cfg.density=d; cfg.speed=sp; cfg.size=sz; cfg.color=col; var rgb=hex2rgb(col); pool.forEach(function(p){p.r=rgb[0];p.g=rgb[1];p.b=rgb[2];}); syncPool(); startEngine(); };
window._particlesStop = stopEngine;


// ── AUTO-CYCLE unlocked presets ───────────────────────────────
let cycleTimer = null;
window.startParticleCycle = function(intervalMs) {
  if (cycleTimer) clearInterval(cycleTimer);
  var presets = ['glitter','snow','sparks','confetti','aurora','void'].filter(function(p){ return presetUnlocked(p); });
  var idx = presets.indexOf(cfg.preset);
  if (idx < 0) idx = 0;
  cycleTimer = setInterval(function() {
    idx = (idx + 1) % presets.length;
    cfg.preset = presets[idx];
    saveCfg();
    // highlight active chip
    document.querySelectorAll('[id^=pchip-]').forEach(function(b){ b.style.borderColor='var(--border)'; b.style.color='var(--subtext)'; });
    var chip = document.getElementById('pchip-'+presets[idx]);
    if (chip) { chip.style.borderColor='var(--teal)'; chip.style.color='var(--teal)'; }
  }, intervalMs || 3000);
};
window.stopParticleCycle = function() {
  if (cycleTimer) { clearInterval(cycleTimer); cycleTimer = null; }
};
export async function initParticles() {
  cv  = document.getElementById('particles-canvas');
  if (!cv) { console.warn('[particles] canvas not found'); return; }
  ctx = cv.getContext('2d');

  await loadCfg();
  resize();
  window.addEventListener('resize', resize);

  if (cfg.enabled) startEngine();
  console.log('[particles] init — enabled:', cfg.enabled, 'preset:', cfg.preset);
}
