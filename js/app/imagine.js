// ============================================================
// SPIRALSIDE — IMAGINE v1.0
// AI image generation via HF Inference API (FLUX.1-schnell)
// Uses user's own HF token — zero cost to Spiralside
// Nimbis anchor: js/app/imagine.js
// ============================================================

const HF_MODEL = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell';
const TOKEN_KEY = 'ss_hf_token';

// ── PUBLIC: INIT ──────────────────────────────────────────────
export function initImagine() {
  const el = document.getElementById('view-imagine');
  if (!el) return;
  const token = localStorage.getItem(TOKEN_KEY);
  el.innerHTML = token ? buildGeneratorHTML() : buildTokenHTML();
  token ? wireGenerator() : wireTokenForm();
}

// ── TOKEN SETUP VIEW ──────────────────────────────────────────
function buildTokenHTML() {
  return `
  <div id="imagine-inner">
    <div class="imagine-header">✦ IMAGE GENERATION</div>
    <div class="imagine-section">
      <div class="imagine-label">your huggingface token</div>
      <p class="imagine-hint">
        Free to get. Go to <strong>huggingface.co</strong> → Settings → Access Tokens → New Token (read).
        Stored only on this device, never sent to Spiralside servers.
      </p>
      <input class="imagine-input" type="password" id="hf-token-input" placeholder="hf_xxxxxxxxxxxxxxxx" />
      <button class="imagine-btn" id="hf-token-save">unlock image gen ✦</button>
      <div class="imagine-error" id="imagine-error"></div>
    </div>
  </div>`;
}

function wireTokenForm() {
  document.getElementById('hf-token-save')?.addEventListener('click', () => {
    const val = document.getElementById('hf-token-input')?.value.trim();
    if (!val || !val.startsWith('hf_')) {
      document.getElementById('imagine-error').textContent = 'Token must start with hf_';
      return;
    }
    localStorage.setItem(TOKEN_KEY, val);
    initImagine(); // re-render as generator
  });
}

// ── GENERATOR VIEW ────────────────────────────────────────────
function buildGeneratorHTML() {
  return `
  <div id="imagine-inner">
    <div class="imagine-header">✦ IMAGINE</div>

    <div class="imagine-section">
      <div class="imagine-label">✏ your prompt</div>
      <textarea class="imagine-input" id="imagine-prompt" rows="4"
        placeholder="e.g. Sky floating above a neon city at night, bloomcore art style..."></textarea>
    </div>

    <div class="imagine-section">
      <div class="imagine-label">🚫 negative prompt</div>
      <textarea class="imagine-input" id="imagine-neg" rows="2"
        placeholder="blurry, low quality, realistic photo, ugly, deformed"></textarea>
    </div>

    <div class="imagine-section">
      <div class="imagine-label">size</div>
      <div class="size-chips">
        <div class="size-chip" data-w="512"  data-h="512">512 × 512</div>
        <div class="size-chip active" data-w="768"  data-h="768">768 × 768</div>
        <div class="size-chip" data-w="1024" data-h="768">1024 × 768</div>
        <div class="size-chip" data-w="768"  data-h="1024">768 × 1024</div>
      </div>
    </div>

    <button class="imagine-btn" id="imagine-go">🎨 generate</button>
    <div class="imagine-error" id="imagine-error"></div>

    <div id="imagine-result"></div>

    <button class="imagine-reset" id="hf-token-reset">change HF token</button>
  </div>`;
}

function wireGenerator() {
  // Size chip selection
  let selW = 768, selH = 768;
  document.querySelectorAll('.size-chip').forEach(c => {
    c.addEventListener('click', () => {
      document.querySelectorAll('.size-chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      selW = parseInt(c.dataset.w);
      selH = parseInt(c.dataset.h);
    });
  });

  // Generate
  document.getElementById('imagine-go')?.addEventListener('click', async () => {
    const prompt  = document.getElementById('imagine-prompt')?.value.trim();
    const neg     = document.getElementById('imagine-neg')?.value.trim();
    const errEl   = document.getElementById('imagine-error');
    const resultEl= document.getElementById('imagine-result');
    const btn     = document.getElementById('imagine-go');

    if (!prompt) { errEl.textContent = 'Write a prompt first.'; return; }
    errEl.textContent = '';
    btn.textContent   = '🌀 generating...';
    btn.disabled      = true;
    resultEl.innerHTML= '<div class="imagine-spinner"></div>';

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const body  = { inputs: prompt };
      if (neg) body.negative_prompt = neg;
      body.width  = selW;
      body.height = selH;

      const r = await fetch(HF_MODEL, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      if (!r.ok) {
        const txt = await r.text();
        throw new Error(txt.includes('loading') ? 'Model loading, try again in 20s' : `Error ${r.status}`);
      }

      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      resultEl.innerHTML = `
        <img class="imagine-result-img" src="${url}" alt="generated image" />
        <button class="imagine-btn" id="imagine-save">save to library</button>`;

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

  // Reset token
  document.getElementById('hf-token-reset')?.addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    initImagine();
  });
}

// ── INJECT STYLES ─────────────────────────────────────────────
export function injectImagineStyles() {
  if (document.getElementById('imagine-styles')) return;
  const s = document.createElement('style');
  s.id = 'imagine-styles';
  s.textContent = `
    #view-imagine { overflow-y: auto; padding: 16px 16px calc(80px + var(--safe-bot, 0px)); }
    #imagine-inner { display: flex; flex-direction: column; gap: 20px; max-width: 600px; margin: 0 auto; }
    .imagine-header {
      font-family: var(--font-display); font-weight: 800; font-size: 1rem;
      letter-spacing: 0.12em; color: var(--teal); padding-top: 8px;
    }
    .imagine-section { display: flex; flex-direction: column; gap: 8px; }
    .imagine-label { font-size: 0.65rem; letter-spacing: 0.1em; color: var(--subtext); text-transform: uppercase; }
    .imagine-hint { font-size: 0.72rem; color: var(--subtext); line-height: 1.6; }
    .imagine-hint strong { color: var(--text); }
    .imagine-input {
      width: 100%; background: var(--surface); border: 1px solid var(--border);
      border-radius: 10px; padding: 12px 14px; color: var(--text);
      font-family: var(--font-ui); font-size: 0.82rem; outline: none; resize: none;
      transition: border-color 0.2s;
    }
    .imagine-input:focus { border-color: var(--teal); }
    .imagine-input::placeholder { color: var(--subtext); }
    .imagine-btn {
      width: 100%; padding: 14px;
      background: linear-gradient(135deg, var(--teal), var(--purple));
      border: none; border-radius: 12px; color: #fff;
      font-family: var(--font-display); font-weight: 700; font-size: 0.9rem;
      cursor: pointer; letter-spacing: 0.04em; transition: opacity 0.2s;
    }
    .imagine-btn:hover  { opacity: 0.88; }
    .imagine-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .imagine-error { font-size: 0.72rem; color: var(--pink); min-height: 18px; text-align: center; }
    .size-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .size-chip {
      padding: 8px 12px; background: var(--surface); border: 1px solid var(--border);
      border-radius: 8px; font-size: 0.7rem; color: var(--subtext); cursor: pointer;
      transition: all 0.15s;
    }
    .size-chip.active { border-color: var(--teal); color: var(--teal); background: rgba(0,246,214,0.08); }
    .imagine-spinner {
      width: 40px; height: 40px; margin: 30px auto;
      border: 3px solid rgba(0,246,214,0.15); border-top-color: var(--teal);
      border-radius: 50%; animation: spin 0.85s linear infinite;
    }
    .imagine-result-img {
      width: 100%; border-radius: 12px; border: 1px solid var(--border);
      display: block; margin-bottom: 12px;
    }
    .imagine-reset {
      background: none; border: none; color: var(--subtext);
      font-family: var(--font-ui); font-size: 0.65rem; cursor: pointer;
      text-align: center; width: 100%; letter-spacing: 0.06em;
      padding: 4px; transition: color 0.2s;
    }
    .imagine-reset:hover { color: var(--pink); }
  `;
  document.head.appendChild(s);
}
