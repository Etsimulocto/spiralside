// ============================================================
// SPIRALSIDE — IMAGINE v1.1
// AI image generation via Railway -> HF FLUX.1-schnell
// Free: 3/day 512x512 | Paid: 5cr, up to 1024x1024
// Nimbis anchor: js/app/imagine.js
// v1.1 — Railway routing, no HF token needed
// ============================================================

import { RAIL } from './state.js';
import { sb } from './auth.js';

export function initImagine() {
  const el = document.getElementById('view-imagine');
  if (!el) return;
  el.innerHTML = buildGeneratorHTML();
  wireGenerator();
}

function buildGeneratorHTML() {
  return `
  <div id="imagine-inner">
    <div class="imagine-header">✦ IMAGINE</div>

    <div class="imagine-card">
      <div class="imagine-label">prompt</div>
      <textarea class="imagine-input" id="imagine-prompt" rows="3"
        placeholder="Sky floating above a neon city at night, bloomcore art style..."></textarea>
    </div>

    <div class="imagine-card">
      <div class="imagine-label">negative prompt <span class="imagine-sublabel">optional</span></div>
      <textarea class="imagine-input" id="imagine-neg" rows="2"
        placeholder="blurry, low quality, realistic photo, ugly, deformed"></textarea>
    </div>

    <div class="imagine-card">
      <div class="imagine-label">size <span class="imagine-sublabel">✦ paid only for larger</span></div>
      <div class="size-chips">
        <button class="size-chip active" data-w="512"  data-h="512">512 × 512<br><span class="size-sub">free</span></button>
        <button class="size-chip" data-w="768"  data-h="768">768 × 768<br><span class="size-sub">5 cr</span></button>
        <button class="size-chip" data-w="1024" data-h="768">1024 × 768<br><span class="size-sub">5 cr</span></button>
        <button class="size-chip" data-w="768"  data-h="1024">768 × 1024<br><span class="size-sub">5 cr</span></button>
      </div>
    </div>

    <button class="imagine-btn" id="imagine-go">✦ generate image</button>
    <div class="imagine-error" id="imagine-error"></div>
    <div id="imagine-result"></div>
  </div>`;
}

function wireGenerator() {
  let selW = 512, selH = 512;
  document.querySelectorAll('.size-chip').forEach(c => {
    c.addEventListener('click', () => {
      document.querySelectorAll('.size-chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      selW = parseInt(c.dataset.w);
      selH = parseInt(c.dataset.h);
    });
  });

  document.getElementById('imagine-go')?.addEventListener('click', async () => {
    const prompt   = document.getElementById('imagine-prompt')?.value.trim();
    const neg      = document.getElementById('imagine-neg')?.value.trim();
    const errEl    = document.getElementById('imagine-error');
    const resultEl = document.getElementById('imagine-result');
    const btn      = document.getElementById('imagine-go');
    if (!prompt) { errEl.textContent = 'Write a prompt first.'; return; }
    errEl.textContent = '';
    btn.textContent   = '🌀 generating...';
    btn.disabled      = true;
    resultEl.innerHTML = '<div class="imagine-spinner"></div>';
    try {
      const { data: { session } } = await sb.auth.getSession();
      const authToken = session?.access_token;
      if (!authToken) throw new Error('Not signed in.');
      const r = await fetch(`${RAIL}/generate-image`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt, negative_prompt: neg, width: selW, height: selH }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || `Error ${r.status}`);
      const url  = `data:image/png;base64,${data.image}`;
      const tier = data.is_paid
        ? `paid · ${data.width}×${data.height}`
        : `free · ${data.free_images_used}/${data.free_images_limit} today · 512×512`;
      resultEl.innerHTML = `
        <div class="imagine-tier">${tier}</div>
        <img class="imagine-result-img" src="${url}" alt="generated" />
        <button class="imagine-btn" id="imagine-save">💾 save image</button>`;
      document.getElementById('imagine-save')?.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = url; a.download = 'spiralside-gen.png'; a.click();
      });
    } catch(e) {
      errEl.textContent = e.message;
      resultEl.innerHTML = '';
    } finally {
      btn.textContent = '🎨 generate';
      btn.disabled    = false;
    }
  });
}

export function injectImagineStyles() {
  if (document.getElementById('imagine-styles')) return;
  const s = document.createElement('style');
  s.id = 'imagine-styles';
  s.textContent = `
    #view-imagine { overflow-y:auto; padding:20px 16px calc(80px + var(--safe-bot,0px)); -webkit-overflow-scrolling:touch; }
    #imagine-inner { display:flex; flex-direction:column; gap:12px; max-width:600px; margin:0 auto; }
    .imagine-header { font-size:0.65rem; letter-spacing:0.14em; text-transform:uppercase; color:var(--teal); font-family:var(--font-ui); font-weight:600; padding-top:4px; }
    .imagine-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:14px 16px; display:flex; flex-direction:column; gap:8px; }
    .imagine-label { font-size:0.62rem; letter-spacing:0.12em; text-transform:uppercase; color:var(--subtext); font-family:var(--font-ui); }
    .imagine-sublabel { color:var(--teal); font-size:0.58rem; margin-left:6px; letter-spacing:0.06em; }
    .imagine-input { width:100%; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px 12px; color:var(--text); font-family:var(--font-ui); font-size:0.82rem; outline:none; resize:none; transition:border-color 0.2s; line-height:1.5; }
    .imagine-input:focus { border-color:var(--teal); }
    .imagine-input::placeholder { color:var(--subtext); }
    .size-chips { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .size-chip { padding:10px 8px; background:var(--bg); border:1px solid var(--border); border-radius:8px; color:var(--subtext); cursor:pointer; transition:all 0.15s; text-align:center; line-height:1.5; font-family:var(--font-ui); font-size:0.75rem; }
    .size-chip.active { border-color:var(--teal); color:var(--teal); background:rgba(0,246,214,0.08); }
    .size-sub { font-size:0.6rem; color:var(--teal); display:block; opacity:0.8; }
    .imagine-btn { width:100%; padding:14px; background:linear-gradient(135deg,var(--teal),var(--purple)); border:none; border-radius:12px; color:#fff; font-family:var(--font-display); font-weight:700; font-size:0.88rem; cursor:pointer; letter-spacing:0.06em; transition:opacity 0.2s; }
    .imagine-btn:hover { opacity:0.88; }
    .imagine-btn:disabled { opacity:0.45; cursor:not-allowed; }
    .imagine-error { font-size:0.72rem; color:var(--pink); min-height:16px; text-align:center; font-family:var(--font-ui); }
    .imagine-spinner { width:36px; height:36px; margin:24px auto; border:3px solid rgba(0,246,214,0.15); border-top-color:var(--teal); border-radius:50%; animation:spin 0.85s linear infinite; }
    .imagine-tier { font-size:0.6rem; letter-spacing:0.1em; color:var(--subtext); text-align:center; text-transform:uppercase; margin-bottom:6px; font-family:var(--font-ui); }
    .imagine-result-img { width:100%; border-radius:12px; border:1px solid var(--border); display:block; margin-bottom:10px; }
    `;
  document.head.appendChild(s);
}
