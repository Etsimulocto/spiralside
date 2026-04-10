// ============================================================
// SPIRALSIDE — IMAGINE v3.0
// Multi-model image gen — free to expensive
// Models: flux-schnell | flux-dev | sdxl | dalle3
// v3: +10 Nimbis field modules (composition, line, emotion,
//     power, FX, intent, style control, detail, char lock, camera)
// Nimbis anchor: js/app/imagine2.js
// ============================================================

import { RAIL } from './state.js';
import { sb } from './auth.js';

let _initialized = false;

// -- MODEL REGISTRY
const MODELS = [
  { id:'schnell', label:'flux schnell', sub:'fastest - draft quality - HuggingFace', cost:500,  color:'var(--teal)',   icon:'[schnell]' },
  { id:'dev',     label:'flux dev',     sub:'better detail - slower - HuggingFace',   cost:1000, color:'var(--purple)', icon:'[dev]' },
  { id:'sdxl',    label:'stable diffusion xl', sub:'cinematic - versatile - HuggingFace', cost:1500, color:'var(--pink)', icon:'[sdxl]' },
  { id:'dalle3',  label:'dall-e 3',     sub:'highest quality - OpenAI',               cost:3000, color:'#FFD93D',      icon:'[dalle3]' },
];

// -- STATE
let _model = 'schnell';
let _selW  = 512;
let _selH  = 512;

const _state = {
  framing:'', shotType:'', focus:'',
  lineStyle:'', lineWeight:'', texture:'',
  emotion:'', intensity:'',
  powerLevel:'', energyBehavior:'',
  fxType: new Set(),
  intent:'',
  styleStrength:'', stylizeMode:'',
  detailLevel:'', noiseChaos:'',
  lockChar: false,
  preserve: new Set(),
  motionFeel:'', perspDistort:'',
};

// -- FIELD DEFINITIONS
const FIELDS = [
  { section:'[CAM] composition and framing', key:'framing', label:'framing / composition',
    values:['centered','dynamic diagonal','asymmetrical','rule of thirds','layered depth','comic panel layout'] },
  { key:'shotType', label:'shot type',
    values:['extreme close-up','close-up','bust','waist-up','full body'] },
  { key:'focus', label:'focus',
    values:['character focus','environment focus','split focus','foreground blur','depth of field'] },

  { section:'[LINE] line and render style', key:'lineStyle', label:'line style',
    values:['clean anime','rough sketch','inked comic','zine / print grain','painterly'] },
  { key:'lineWeight', label:'line weight',
    values:['thin','medium','thick','varied / expressive'] },
  { key:'texture', label:'texture',
    values:['smooth','grainy','halftone','paper / print','glitch noise'] },

  { section:'[EMO] emotion and expression', key:'emotion', label:'emotional state',
    values:['calm','curious','excited','chaotic','focused','overwhelmed','confident','glitched','ascended'] },
  { key:'intensity', label:'intensity',
    values:['subtle','medium','high','extreme'] },

  { section:'[PWR] power and energy', key:'powerLevel', label:'power level',
    values:['idle','active','charged','overload','god mode'] },
  { key:'energyBehavior', label:'energy behavior',
    values:['stable','flowing','pulsing','erupting','fracturing'] },

  { section:'[FX] fx type', key:'fxType', label:'effects type', multi:true,
    values:['spiral energy','glitch distortion','holographic UI','particle dust','fractals',
            'data streams','mirror shards','light trails','aura glow'] },

  { section:'[AIM] intent / output type', key:'intent', label:'intent',
    values:['character portrait','comic panel','splash art','UI concept',
            'lore illustration','animation frame','trading card','poster'] },

  { section:'[STY] style control', key:'styleStrength', label:'style strength',
    values:['subtle','balanced','strong','extreme'] },
  { key:'stylizeMode', label:'stylization mode',
    values:['realistic','anime','bloomcore','comic','experimental'] },

  { section:'[DTL] detail control', key:'detailLevel', label:'detail level',
    values:['minimal','balanced','dense','overloaded'] },
  { key:'noiseChaos', label:'noise / chaos',
    values:['clean','light noise','glitchy','chaotic'] },

  { section:'[CHR] character consistency', key:'preserve', label:'preserve', multi:true,
    values:['hair','color palette','outfit','face structure','signature features'] },

  { section:'[MOV] camera motion / feel', key:'motionFeel', label:'motion feel',
    values:['static','slight motion','dynamic','cinematic action'] },
  { key:'perspDistort', label:'perspective distortion',
    values:['none','subtle','strong','fisheye / stylized'] },
];

// -- INIT
export function initImagine() {
  const el = document.getElementById('view-imagine');
  if (!el) return;
  injectImagineStyles();
  if (!_initialized) {
    el.innerHTML = _buildHTML();
    _wireUI();
    _initialized = true;
  }
  _syncCostBar();
}

// -- BUILD HTML
function _buildHTML() {
  const cards = MODELS.map(m =>
    '<div class="im-model-card ' + (m.id==='schnell'?'active':'') + '" data-model="' + m.id + '" onclick="window._imPick(\'' + m.id + '\')">' +
    '<div class="im-model-icon">' + m.icon + '</div>' +
    '<div class="im-model-info"><div class="im-model-name">' + m.label + '</div><div class="im-model-sub">' + m.sub + '</div></div>' +
    '<div class="im-model-cost" style="color:' + m.color + '">' + m.cost.toLocaleString() + ' cr</div>' +
    '</div>'
  ).join('');

  const fieldHTML = _buildFieldSections();

  return '<div class="im-scroll">' +
    '<div class="im-section-title">IMAGINE</div>' +
    '<div class="im-card"><div class="im-label">model</div><div id="im-model-list">' + cards + '</div></div>' +
    '<div class="im-card"><div class="im-label">prompt</div>' +
    '<textarea class="im-input" id="im-prompt" rows="3" placeholder="Sky floating above a neon city at night, bloomcore art style..."></textarea></div>' +
    fieldHTML +
    '<div class="im-card"><div class="im-label">negative prompt <span class="im-sublabel">optional</span></div>' +
    '<textarea class="im-input" id="im-neg" rows="2" placeholder="blurry, low quality, ugly, deformed"></textarea></div>' +
    '<div class="im-card"><div class="im-label">size</div><div class="im-size-grid">' +
    '<button class="im-size-chip active" data-w="512"  data-h="512">512x512</button>' +
    '<button class="im-size-chip"        data-w="768"  data-h="768">768x768</button>' +
    '<button class="im-size-chip"        data-w="1024" data-h="768">1024x768</button>' +
    '<button class="im-size-chip"        data-w="768"  data-h="1024">768x1024</button>' +
    '</div></div>' +
    '<div class="im-cost-bar" id="im-cost-bar">' +
    '<span id="im-cost-label">this will use 500 cr</span>' +
    '<span id="im-balance-label" class="im-balance"></span></div>' +
    '<button class="im-generate-btn" id="im-go">generate</button>' +
    '<div class="im-error" id="im-error"></div>' +
    '<div id="im-result"></div>' +
    '<div style="height:60px"></div></div>';
}

// -- BUILD FIELD SECTIONS
function _buildFieldSections() {
  let html = '';
  let inCard = false;

  for (const field of FIELDS) {
    if (field.section) {
      if (inCard) html += '</div></div>';
      inCard = true;
      html += '<div class="im-card im-field-card">' +
        '<div class="im-field-section-hdr" onclick="window._imToggleSection(this)">' +
        '<span class="im-field-section-name">' + field.section + '</span>' +
        '<span class="im-field-chevron">v</span></div>' +
        '<div class="im-field-body">';
    }

    const isMulti = !!field.multi;
    const chips = field.values.map(function(v) {
      return '<button class="im-fchip" data-key="' + field.key + '" data-val="' + v.replace(/'/g, '') + '" data-multi="' + isMulti + '" onclick="window._imChip(this)">' + v + '</button>';
    }).join('');

    html += '<div class="im-field-row">' +
      '<div class="im-field-label">' + field.label + (isMulti ? ' <span class="im-multi-badge">multi</span>' : '') + '</div>' +
      '<div class="im-chip-wrap">' + chips + '</div></div>';

    if (field.key === 'preserve') {
      html += '<div class="im-field-row"><div class="im-field-label">lock character identity</div>' +
        '<div class="im-chip-wrap"><button class="im-fchip im-toggle-chip" id="im-lock-char" onclick="window._imToggleLock(this)">off</button></div></div>';
    }
  }

  if (inCard) html += '</div></div>';
  return html;
}

// -- WIRE UI
function _wireUI() {
  window._imPick = function(id) {
    _model = id;
    document.querySelectorAll('.im-model-card').forEach(function(c) { c.classList.toggle('active', c.dataset.model === id); });
    _syncCostBar();
  };

  document.querySelectorAll('.im-size-chip').forEach(function(c) {
    c.addEventListener('click', function() {
      document.querySelectorAll('.im-size-chip').forEach(function(x) { x.classList.remove('active'); });
      c.classList.add('active');
      _selW = parseInt(c.dataset.w);
      _selH = parseInt(c.dataset.h);
    });
  });

  window._imChip = function(el) {
    const key   = el.dataset.key;
    const val   = el.dataset.val;
    const multi = el.dataset.multi === 'true';
    if (multi) {
      const set = _state[key];
      if (set.has(val)) { set.delete(val); el.classList.remove('active'); }
      else              { set.add(val);    el.classList.add('active'); }
    } else {
      document.querySelectorAll('.im-fchip[data-key="' + key + '"]').forEach(function(x) { x.classList.remove('active'); });
      if (_state[key] === val) { _state[key] = ''; }
      else                     { _state[key] = val; el.classList.add('active'); }
    }
  };

  window._imToggleSection = function(hdr) {
    const body    = hdr.nextElementSibling;
    const chevron = hdr.querySelector('.im-field-chevron');
    const open    = body.style.display !== 'none';
    body.style.display      = open ? 'none' : 'flex';
    chevron.textContent     = open ? '>' : 'v';
  };

  window._imToggleLock = function(btn) {
    _state.lockChar = !_state.lockChar;
    btn.textContent = _state.lockChar ? 'on' : 'off';
    btn.classList.toggle('active', _state.lockChar);
  };

  document.getElementById('im-go').addEventListener('click', _generate);
}

// -- SYNC COST BAR
function _syncCostBar() {
  const m   = MODELS.find(function(x) { return x.id === _model; }) || MODELS[0];
  const lbl = document.getElementById('im-cost-label');
  const bal = document.getElementById('im-balance-label');
  const btn = document.getElementById('im-go');
  if (lbl) { lbl.textContent = 'this will use ' + m.cost.toLocaleString() + ' cr'; lbl.style.color = m.color; }
  if (btn)  btn.style.background = 'linear-gradient(135deg,' + m.color + ',var(--purple))';
  const cr = window._currentCredits != null ? window._currentCredits : null;
  if (bal && cr !== null) {
    const after = cr - m.cost;
    bal.textContent = after >= 0 ? Math.round(cr).toLocaleString() + ' cr remaining' : 'not enough credits';
    bal.style.color = after >= 0 ? 'var(--subtext)' : 'var(--pink)';
  }
}

// -- BUILD PROMPT SUFFIX
function _buildFieldSuffix() {
  const parts = [];
  const singles = [
    ['framing','composition'],['shotType','shot type'],['focus','focus'],
    ['lineStyle','line style'],['lineWeight','line weight'],['texture','texture'],
    ['emotion','emotional state'],['intensity','intensity'],
    ['powerLevel','power level'],['energyBehavior','energy behavior'],
    ['intent','intent'],['styleStrength','style strength'],['stylizeMode','stylization'],
    ['detailLevel','detail level'],['noiseChaos','noise'],
    ['motionFeel','motion feel'],['perspDistort','perspective'],
  ];
  for (let i = 0; i < singles.length; i++) {
    const key = singles[i][0]; const label = singles[i][1];
    if (_state[key]) parts.push(label + ': ' + _state[key]);
  }
  if (_state.fxType.size)   parts.push('effects: ' + Array.from(_state.fxType).join(', '));
  if (_state.preserve.size) parts.push('preserve: ' + Array.from(_state.preserve).join(', '));
  if (_state.lockChar)      parts.push('lock character identity');
  return parts.length ? ', ' + parts.join(', ') : '';
}

// -- GENERATE
async function _generate() {
  const basePrompt = document.getElementById('im-prompt').value.trim();
  const neg        = document.getElementById('im-neg').value.trim();
  const errEl      = document.getElementById('im-error');
  const resEl      = document.getElementById('im-result');
  const btn        = document.getElementById('im-go');
  if (!basePrompt) { errEl.textContent = 'Write a prompt first.'; return; }
  errEl.textContent = '';
  btn.textContent   = 'generating...';
  btn.disabled      = true;
  resEl.innerHTML   = '<div class="im-spinner"></div>';
  const prompt = basePrompt + _buildFieldSuffix();
  try {
    const sess = await sb.auth.getSession();
    const token = sess.data.session ? sess.data.session.access_token : null;
    if (!token) throw new Error('Not signed in.');
    const r = await fetch(RAIL + '/generate-image', {
      method:  'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prompt: prompt, negative_prompt: neg || '', width: _selW, height: _selH, model: _model }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || 'Error ' + r.status);
    if (data.credits_remaining !== undefined) {
      window._currentCredits = data.credits_remaining;
      if (window.updateCreditDisplay) window.updateCreditDisplay();
      _syncCostBar();
    }
    const m   = MODELS.find(function(x) { return x.id === _model; }) || MODELS[0];
    const url = 'data:image/png;base64,' + data.image;
    const meta = data.is_paid
      ? m.label + ' - ' + data.width + 'x' + data.height + ' - ' + m.cost.toLocaleString() + ' cr used'
      : 'free - ' + data.free_images_used + '/' + data.free_images_limit + ' today';
    resEl.innerHTML =
      '<div class="im-result-meta">' + meta + '</div>' +
      '<img class="im-result-img" src="' + url + '" alt="generated" />' +
      '<button class="im-save-btn" id="im-save">save image</button>';
    document.getElementById('im-save').addEventListener('click', function() {
      const a = document.createElement('a'); a.href = url; a.download = 'spiralside-gen.png'; a.click();
    });
  } catch(e) {
    errEl.textContent = e.message;
    resEl.innerHTML   = '';
  } finally {
    btn.textContent = 'generate';
    btn.disabled    = false;
  }
}

// -- STYLES
export function injectImagineStyles() {
  if (document.getElementById('imagine-styles')) return;
  const s = document.createElement('style');
  s.id = 'imagine-styles';
  s.textContent = [
    '#view-imagine { flex-direction:column; overflow-y:auto; -webkit-overflow-scrolling:touch; }',
    '.im-scroll { padding:20px 16px calc(80px + var(--safe-bot,0px)); display:flex; flex-direction:column; gap:12px; max-width:600px; margin:0 auto; }',
    '.im-section-title { font-size:0.6rem; letter-spacing:0.14em; text-transform:uppercase; color:var(--teal); font-family:var(--font-ui); font-weight:600; }',
    '.im-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:14px 16px; display:flex; flex-direction:column; gap:8px; }',
    '.im-label { font-size:0.6rem; letter-spacing:0.12em; text-transform:uppercase; color:var(--subtext); font-family:var(--font-ui); }',
    '.im-sublabel { color:var(--teal); font-size:0.6rem; margin-left:6px; }',
    '#im-model-list { display:flex; flex-direction:column; gap:6px; }',
    '.im-model-card { display:flex; align-items:center; gap:12px; padding:10px 12px; background:var(--bg); border:1px solid var(--border); border-radius:10px; cursor:pointer; transition:all 0.15s; }',
    '.im-model-card.active { border-color:var(--teal); background:rgba(0,246,214,0.06); }',
    '.im-model-icon { font-size:1.1rem; width:24px; text-align:center; flex-shrink:0; }',
    '.im-model-info { flex:1; min-width:0; }',
    '.im-model-name { font-size:0.78rem; color:var(--text); font-family:var(--font-ui); }',
    '.im-model-sub  { font-size:0.62rem; color:var(--subtext); margin-top:2px; }',
    '.im-model-cost { font-size:0.72rem; font-weight:700; font-family:var(--font-display); flex-shrink:0; }',
    '.im-input { width:100%; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px 12px; color:var(--text); font-family:var(--font-ui); font-size:0.82rem; outline:none; resize:none; transition:border-color 0.2s; line-height:1.5; }',
    '.im-input:focus { border-color:var(--teal); }',
    '.im-input::placeholder { color:var(--subtext); }',
    '.im-size-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }',
    '.im-size-chip { padding:10px 8px; background:var(--bg); border:1px solid var(--border); border-radius:8px; color:var(--subtext); cursor:pointer; transition:all 0.15s; text-align:center; font-family:var(--font-ui); font-size:0.75rem; }',
    '.im-size-chip.active { border-color:var(--teal); color:var(--teal); background:rgba(0,246,214,0.08); }',
    '.im-cost-bar { display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--surface); border:1px solid var(--border); border-radius:10px; font-family:var(--font-ui); }',
    '#im-cost-label { font-size:0.72rem; font-weight:600; }',
    '.im-balance { font-size:0.65rem; }',
    '.im-generate-btn { width:100%; padding:14px; background:linear-gradient(135deg,var(--teal),var(--purple)); border:none; border-radius:12px; color:#fff; font-family:var(--font-display); font-weight:700; font-size:0.88rem; cursor:pointer; letter-spacing:0.06em; transition:opacity 0.2s; }',
    '.im-generate-btn:hover { opacity:0.88; }',
    '.im-generate-btn:disabled { opacity:0.45; cursor:not-allowed; }',
    '.im-error { font-size:0.68rem; color:var(--pink); min-height:16px; text-align:center; font-family:var(--font-ui); }',
    '.im-spinner { width:36px; height:36px; margin:28px auto; border:3px solid rgba(0,246,214,0.15); border-top-color:var(--teal); border-radius:50%; animation:spin 0.85s linear infinite; }',
    '.im-result-meta { font-size:0.6rem; letter-spacing:0.1em; color:var(--subtext); text-align:center; text-transform:uppercase; font-family:var(--font-ui); }',
    '.im-result-img  { width:100%; border-radius:12px; border:1px solid var(--border); display:block; margin:8px 0; }',
    '.im-save-btn { width:100%; padding:11px; background:var(--surface); border:1px solid var(--border); border-radius:10px; color:var(--text); font-family:var(--font-ui); font-size:0.78rem; cursor:pointer; transition:border-color 0.2s; letter-spacing:0.04em; }',
    '.im-save-btn:hover { border-color:var(--teal); }',
    '.im-field-card { padding:0; overflow:hidden; }',
    '.im-field-section-hdr { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; cursor:pointer; font-size:0.62rem; letter-spacing:0.12em; text-transform:uppercase; color:var(--teal); font-family:var(--font-ui); font-weight:600; user-select:none; }',
    '.im-field-section-hdr:hover { background:rgba(0,246,214,0.04); }',
    '.im-field-chevron { font-size:0.7rem; transition:transform 0.2s; color:var(--subtext); }',
    '.im-field-body { display:flex; flex-direction:column; gap:10px; padding:4px 16px 14px; border-top:1px solid var(--border); }',
    '.im-field-row { display:flex; flex-direction:column; gap:6px; }',
    '.im-field-label { font-size:0.58rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--subtext); font-family:var(--font-ui); }',
    '.im-multi-badge { font-size:0.52rem; letter-spacing:0.08em; color:var(--purple); background:rgba(124,106,247,0.15); border-radius:4px; padding:1px 5px; margin-left:4px; vertical-align:middle; }',
    '.im-chip-wrap { display:flex; flex-wrap:wrap; gap:6px; }',
    '.im-fchip { padding:5px 11px; background:var(--bg); border:1px solid var(--border); border-radius:20px; color:var(--subtext); font-family:var(--font-ui); font-size:0.68rem; cursor:pointer; transition:all 0.15s; letter-spacing:0.04em; white-space:nowrap; }',
    '.im-fchip:hover { border-color:var(--teal); color:var(--text); }',
    '.im-fchip.active { border-color:var(--teal); color:var(--teal); background:rgba(0,246,214,0.1); }',
    '.im-toggle-chip { min-width:44px; text-align:center; }',
    '.im-toggle-chip.active { border-color:var(--purple); color:var(--purple); background:rgba(124,106,247,0.12); }',
  ].join(' ');
  document.head.appendChild(s);
}
