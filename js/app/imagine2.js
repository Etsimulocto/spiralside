// ============================================================
// SPIRALSIDE — IMAGINE v2.0
// Multi-model image gen — free to expensive
// Models: flux-schnell | flux-dev | sdxl | dalle3
// Nimbis anchor: js/app/imagine2.js
// ============================================================

import { RAIL } from './state.js';
import { sb } from './auth.js';

let _initialized = false;

const MODELS = [
  { id:'schnell', label:'flux schnell', sub:'fastest · draft quality · HuggingFace', cost:500,  color:'var(--teal)',   icon:'⚡' },
  { id:'lightning', label:'sdxl lightning', sub:'fast · crisp · HuggingFace', cost:1000, color:'var(--purple)', icon:'⚡⚡' },
  { id:'sdxl',   label:'stable diffusion xl', sub:'cinematic · versatile · HuggingFace', cost:1500, color:'var(--pink)', icon:'🎨' },
  { id:'dalle3', label:'dall·e 3',     sub:'highest quality · OpenAI',               cost:3000, color:'#FFD93D',      icon:'🌟' },
];

let _model = 'schnell';
let _selW  = 512;
let _selH  = 512;

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

function _buildHTML() {
  const cards = MODELS.map(m =>
    `<div class="im-model-card ${m.id==='schnell'?'active':''}" data-model="${m.id}" onclick="window._imPick('${m.id}')">
      <div class="im-model-icon">${m.icon}</div>
      <div class="im-model-info"><div class="im-model-name">${m.label}</div><div class="im-model-sub">${m.sub}</div></div>
      <div class="im-model-cost" style="color:${m.color}">${m.cost.toLocaleString()} cr</div>
    </div>`
  ).join('');
  return `
  <div class="im-scroll">
    <div class="im-section-title">❆ IMAGINE</div>
    <div class="im-card">
      <div class="im-label">prompt</div>
      <textarea class="im-input" id="im-prompt" rows="3" placeholder="Sky floating above a neon city at night, bloomcore art style..."></textarea>
    </div>
    <button class="im-generate-btn" id="im-go">❆ generate</button>
    <div class="im-error" id="im-error"></div>
    <div id="im-result"></div>
    <div class="im-card">
      <div class="im-label">negative prompt <span class="im-sublabel">optional</span></div>
      <textarea class="im-input" id="im-neg" rows="2" placeholder="blurry, low quality, ugly, deformed"></textarea>
    </div>
    <div class="im-card"><div class="im-label">model</div><div id="im-model-list">${cards}</div></div>
    <div class="im-card">
      <div class="im-label">size</div>
      <div class="im-size-grid">
        <button class="im-size-chip active" data-w="512"  data-h="512">512×512</button>
        <button class="im-size-chip"        data-w="768"  data-h="768">768×768</button>
        <button class="im-size-chip"        data-w="1024" data-h="768">1024×768</button>
        <button class="im-size-chip"        data-w="768"  data-h="1024">768×1024</button>
      </div>
    </div>
    <div class="im-cost-bar" id="im-cost-bar">
      <span id="im-cost-label">this will use 500 cr</span>
      <span id="im-balance-label" class="im-balance"></span>
    </div>
    <div style="height:60px"></div>
  </div>`;
}

function _wireUI() {
  window._imPick = (id) => {
    _model = id;
    document.querySelectorAll('.im-model-card').forEach(c => c.classList.toggle('active', c.dataset.model === id));
    _syncCostBar();
  };
  document.querySelectorAll('.im-size-chip').forEach(c => {
    c.addEventListener('click', () => {
      document.querySelectorAll('.im-size-chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      _selW = parseInt(c.dataset.w);
      _selH = parseInt(c.dataset.h);
    });
  });
  document.getElementById('im-go')?.addEventListener('click', _generate);
}

function _syncCostBar() {
  const m   = MODELS.find(x => x.id === _model) || MODELS[0];
  const lbl = document.getElementById('im-cost-label');
  const bal = document.getElementById('im-balance-label');
  const btn = document.getElementById('im-go');
  if (lbl) { lbl.textContent = `this will use ${m.cost.toLocaleString()} cr`; lbl.style.color = m.color; }
  if (btn)  btn.style.background = `linear-gradient(135deg,${m.color},var(--purple))`;
  const cr = window._currentCredits ?? null;
  if (bal && cr !== null) {
    const after = cr - m.cost;
    bal.textContent = after >= 0 ? `${Math.round(cr).toLocaleString()} cr remaining` : '⚠ not enough credits';
    bal.style.color = after >= 0 ? 'var(--subtext)' : 'var(--pink)';
  }
}

async function _generate() {
  const prompt = document.getElementById('im-prompt')?.value.trim();
  const neg    = document.getElementById('im-neg')?.value.trim();
  const errEl  = document.getElementById('im-error');
  const resEl  = document.getElementById('im-result');
  const btn    = document.getElementById('im-go');
  if (!prompt) { errEl.textContent = 'Write a prompt first.'; return; }
  errEl.textContent = '';
  btn.textContent   = '🌀 generating...';
  btn.disabled      = true;
  resEl.innerHTML   = '<div class="im-spinner"></div>';
  try {
    const { data: { session } } = await sb.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not signed in.');
    const r = await fetch(`${RAIL}/generate-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, negative_prompt: neg || '', width: _selW, height: _selH, model: _model }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || `Error ${r.status}`);
    if (data.credits_remaining !== undefined) {
      window._currentCredits = data.credits_remaining;
      if (window.updateCreditDisplay) window.updateCreditDisplay();
      _syncCostBar();
    }
    const m   = MODELS.find(x => x.id === _model) || MODELS[0];
    const url = `data:image/png;base64,${data.image}`;
    const meta = data.is_paid
      ? `${m.label} · ${data.width}×${data.height} · ${m.cost.toLocaleString()} cr used`
      : `free · ${data.free_images_used}/${data.free_images_limit} today`;
    resEl.innerHTML = `
      <div class="im-result-meta">${meta}</div>
      <img class="im-result-img" src="${url}" alt="generated" />
      <button class="im-save-btn" id="im-save">💾 save image</button>`;
    document.getElementById('im-save')?.addEventListener('click', () => {
      const a = document.createElement('a'); a.href = url; a.download = 'spiralside-gen.png'; a.click();
    });
  } catch(e) {
    errEl.textContent = e.message;
    resEl.innerHTML   = '';
  } finally {
    btn.textContent = '❆ generate';
    btn.disabled    = false;
  }
}

export function injectImagineStyles() {
  if (document.getElementById('imagine-styles')) return;
  const s = document.createElement('style');
  s.id = 'imagine-styles';
  s.textContent = `
    #view-imagine { flex-direction:column; overflow-y:auto; -webkit-overflow-scrolling:touch; }
    .im-scroll { padding:20px 16px calc(80px + var(--safe-bot,0px)); display:flex; flex-direction:column; gap:12px; }
    .im-section-title { font-size:0.6rem; letter-spacing:0.14em; text-transform:uppercase; color:var(--teal); font-family:var(--font-ui); font-weight:600; }
    .im-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:14px 16px; display:flex; flex-direction:column; gap:8px; }
    .im-label { font-size:0.6rem; letter-spacing:0.12em; text-transform:uppercase; color:var(--subtext); font-family:var(--font-ui); }
    .im-sublabel { color:var(--teal); font-size:0.6rem; margin-left:6px; }
    #im-model-list { display:flex; flex-direction:column; gap:6px; }
    .im-model-card { display:flex; align-items:center; gap:12px; padding:10px 12px; background:var(--bg); border:1px solid var(--border); border-radius:10px; cursor:pointer; transition:all 0.15s; }
    .im-model-card.active { border-color:var(--teal); background:rgba(0,246,214,0.06); }
    .im-model-icon { font-size:1.1rem; width:24px; text-align:center; flex-shrink:0; }
    .im-model-info { flex:1; min-width:0; }
    .im-model-name { font-size:0.78rem; color:var(--text); font-family:var(--font-ui); }
    .im-model-sub  { font-size:0.62rem; color:var(--subtext); margin-top:2px; }
    .im-model-cost { font-size:0.72rem; font-weight:700; font-family:var(--font-display); flex-shrink:0; }
    .im-input { width:100%; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px 12px; color:var(--text); font-family:var(--font-ui); font-size:0.82rem; outline:none; resize:none; transition:border-color 0.2s; line-height:1.5; }
    .im-input:focus { border-color:var(--teal); }
    .im-input::placeholder { color:var(--subtext); }
    .im-size-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .im-size-chip { padding:10px 8px; background:var(--bg); border:1px solid var(--border); border-radius:8px; color:var(--subtext); cursor:pointer; transition:all 0.15s; text-align:center; font-family:var(--font-ui); font-size:0.75rem; }
    .im-size-chip.active { border-color:var(--teal); color:var(--teal); background:rgba(0,246,214,0.08); }
    .im-cost-bar { display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--surface); border:1px solid var(--border); border-radius:10px; font-family:var(--font-ui); }
    #im-cost-label { font-size:0.72rem; font-weight:600; }
    .im-balance { font-size:0.65rem; }
    .im-generate-btn { width:100%; padding:14px; background:linear-gradient(135deg,var(--teal),var(--purple)); border:none; border-radius:12px; color:#fff; font-family:var(--font-display); font-weight:700; font-size:0.88rem; cursor:pointer; letter-spacing:0.06em; transition:opacity 0.2s; }
    .im-generate-btn:hover { opacity:0.88; }
    .im-generate-btn:disabled { opacity:0.45; cursor:not-allowed; }
    .im-error { font-size:0.68rem; color:var(--pink); min-height:16px; text-align:center; font-family:var(--font-ui); }
    .im-spinner { width:36px; height:36px; margin:28px auto; border:3px solid rgba(0,246,214,0.15); border-top-color:var(--teal); border-radius:50%; animation:spin 0.85s linear infinite; }
    .im-result-meta { font-size:0.6rem; letter-spacing:0.1em; color:var(--subtext); text-align:center; text-transform:uppercase; font-family:var(--font-ui); }
    .im-result-img  { width:100%; border-radius:12px; border:1px solid var(--border); display:block; margin:8px 0; }
    .im-save-btn { width:100%; padding:11px; background:var(--surface); border:1px solid var(--border); border-radius:10px; color:var(--text); font-family:var(--font-ui); font-size:0.78rem; cursor:pointer; transition:border-color 0.2s; letter-spacing:0.04em; }
    .im-save-btn:hover { border-color:var(--teal); }
  `;
  document.head.appendChild(s);
}
