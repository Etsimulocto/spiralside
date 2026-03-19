
// ============================================================
// SPIRALSIDE — PI VIEW v1.0
// Bloomslice Studio — maker/STEM tab
// Sky-voiced Pi educator: starter cards, prompt, educational
// script output, Piston execution, Save as Build Card
// Nimbis anchor: js/app/views/pi.js
// ============================================================

import { state }                    from '../state.js';
import { renderBuildCard,
         generateCardId }           from '../card.js';
import { dbSet, dbGet, dbGetAll }   from '../db.js';

// ── CONFIG ────────────────────────────────────────────────
const RAIL         = state.RAIL || 'https://web-production-4e6f3.up.railway.app';
const PISTON_URL   = 'https://emkc.org/api/v2/piston/execute';
const CARD_COLOR   = '#FF4BCB';  // Bloomslice pink

// ── STARTER PROJECTS ─────────────────────────────────────
// Each card pre-fills the prompt when clicked
const STARTERS = [
  { icon: '🔴', label: 'Blink LED',      prompt: 'Write a beginner Python script for Raspberry Pi that blinks an LED on GPIO 17 every second.' },
  { icon: '📡', label: 'Read Sensor',    prompt: 'Write a beginner Python script for Raspberry Pi that reads temperature and humidity from a DHT11 sensor on GPIO 4.' },
  { icon: '🌐', label: 'Web Server',      prompt: 'Write a beginner Python script for Raspberry Pi that creates a simple Flask web server showing a Hello World page on port 5000.' },
  { icon: '📷', label: 'Camera Snap',    prompt: 'Write a beginner Python script for Raspberry Pi that takes a photo with the Pi Camera and saves it as photo.jpg.' },
  { icon: '🎛', label: 'Servo Control',  prompt: 'Write a beginner Python script for Raspberry Pi that sweeps a servo motor back and forth using GPIO 18 and PWM.' },
  { icon: '📊', label: 'Data Logger',    prompt: 'Write a beginner Python script for Raspberry Pi that logs CPU temperature to a CSV file every 5 seconds.' },
];

// ── MODULE STATE ─────────────────────────────────────────
let initialized  = false;   // prevent double-init
let isRunning    = false;   // debounce AI call
let lastCode     = '';      // last generated code block — for Piston + card
let lastScript   = '';      // full raw script output — for card description
let savedCards   = [];      // in-memory build cards this session

// ── INIT ──────────────────────────────────────────────────
export function initPiView() {
  const el = document.getElementById('view-pi');
  if (!el || initialized) return;
  initialized = true;

  injectPiStyles();

  const wrap = document.createElement('div');
  wrap.id = 'pi-wrap';
  el.appendChild(wrap);

  wrap.innerHTML = buildDOM();
  wireEvents(wrap);
  loadSavedCards();
}

// ── DOM BUILDER ───────────────────────────────────────────
function buildDOM() {
  return `
    <!-- HEADER -->
    <div id="pi-header">
      <div id="pi-title">\u{1F353} Bloomslice Studio</div>
      <div id="pi-sky-msg">Hey. Tell me what you want to build and I'll write the code, explain every line, and show you how to wire it up.</div>
    </div>

    <!-- STARTER CARDS -->
    <div id="pi-starters">
      ${STARTERS.map(s => `
        <button class="pi-starter" data-prompt="${escHtml(s.prompt)}">
          <span class="pi-starter-icon">${s.icon}</span>
          <span class="pi-starter-label">${s.label}</span>
        </button>
      `).join('')}
    </div>

    <!-- MAIN PANES -->
    <div id="pi-panes">

      <!-- LEFT: prompt + output -->
      <div id="pi-left">
        <div class="pi-pane-label">output
          <button class="pi-pane-action" id="pi-copy-btn">copy</button>
        </div>
        <div id="pi-output">
          <div id="pi-output-placeholder">
            <div class="pi-placeholder-icon">\u{1F353}</div>
            <div>pick a starter or describe your project below</div>
          </div>
        </div>
      </div>

      <!-- RIGHT: card preview -->
      <div id="pi-right">
        <div class="pi-pane-label">build card
          <button class="pi-pane-action" id="pi-download-btn">save PNG</button>
        </div>
        <div id="pi-card-preview">
          <div id="pi-card-placeholder">
            <div class="pi-placeholder-icon" style="font-size:1rem;opacity:0.3">BCK-????</div>
            <div style="font-size:0.65rem;opacity:0.3;margin-top:6px">card appears after generation</div>
          </div>
        </div>
      </div>

    </div>

    <!-- RUN + SAVE BAR -->
    <div id="pi-action-bar">
      <button id="pi-run-btn" title="Run code in sandbox (Python only, no GPIO hardware)">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        run python
      </button>
      <div id="pi-run-output"></div>
      <button id="pi-save-card-btn">\u{1F3A0} save build card</button>
    </div>

    <!-- FOOTER PROMPT -->
    <div id="pi-footer">
      <textarea id="pi-prompt" rows="1"
        placeholder="What do you want to build? (e.g. blink an LED, read a temperature sensor...)"
        spellcheck="false"></textarea>
      <button id="pi-generate-btn">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        generate
      </button>
    </div>
  `;
}

// ── EVENTS ────────────────────────────────────────────────
function wireEvents(wrap) {

  // Starter card clicks — pre-fill prompt and auto-generate
  wrap.querySelectorAll('.pi-starter').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.dataset.prompt;
      document.getElementById('pi-prompt').value = prompt;
      generate();
    });
  });

  // Prompt textarea auto-resize
  const promptEl = document.getElementById('pi-prompt');
  promptEl.addEventListener('input', () => {
    promptEl.style.height = 'auto';
    promptEl.style.height = Math.min(promptEl.scrollHeight, 100) + 'px';
  });
  promptEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); }
  });

  // Generate button
  document.getElementById('pi-generate-btn').addEventListener('click', generate);

  // Copy output
  document.getElementById('pi-copy-btn').addEventListener('click', () => {
    const out = document.getElementById('pi-output');
    navigator.clipboard.writeText(out?.innerText || '').then(() => {
      const btn = document.getElementById('pi-copy-btn');
      btn.textContent = 'copied!';
      setTimeout(() => btn.textContent = 'copy', 1400);
    });
  });

  // Run via Piston
  document.getElementById('pi-run-btn').addEventListener('click', runCode);

  // Save as Build Card
  document.getElementById('pi-save-card-btn').addEventListener('click', saveCard);

  // Download card PNG
  document.getElementById('pi-download-btn').addEventListener('click', downloadCard);
}

// ── GENERATE ──────────────────────────────────────────────
async function generate() {
  if (isRunning) return;

  const promptEl  = document.getElementById('pi-prompt');
  const outputEl  = document.getElementById('pi-output');
  const genBtn    = document.getElementById('pi-generate-btn');
  const userPrompt = promptEl.value.trim();

  if (!userPrompt) {
    promptEl.placeholder = 'describe your project first...';
    setTimeout(() => promptEl.placeholder = 'What do you want to build?', 2000);
    return;
  }

  isRunning = true;
  genBtn.disabled = true;
  genBtn.innerHTML = '<span class="pi-spinner"></span> thinking...';

  // Thinking state
  outputEl.innerHTML = `<div id="pi-thinking">
    <div class="pi-spinner-lg"></div>
    <div class="pi-thinking-text">Sky is writing your project...</div>
  </div>`;

  try {
    const token = state.session?.access_token;
    if (!token) { showOutputError('Please sign in to use Bloomslice Studio.'); return; }

    const resp = await fetch(RAIL + '/pi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ prompt: userPrompt }),
    });

    const data = await resp.json();
    if (!resp.ok) { showOutputError(data.detail || 'Something went wrong.'); return; }

    lastScript = data.result;
    lastCode   = extractCodeBlock(data.result);  // pull first fenced code block
    renderOutput(data.result);
    renderCardPreview(userPrompt, data.result);   // auto-render card preview

    // Update credits if returned
    if (data.usage && window.updateCreditDisplay) window.updateCreditDisplay(data.usage);

  } catch(err) {
    showOutputError('Connection error. Try again.');
  } finally {
    isRunning = false;
    genBtn.disabled = false;
    genBtn.innerHTML = '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> generate';
  }
}

// ── RENDER OUTPUT ─────────────────────────────────────────
// Same pattern as code.js renderOutput — splits on fenced code blocks
function renderOutput(text) {
  const out = document.getElementById('pi-output');
  if (!out) return;

  const parts = text.split(/(```[\w]*\n[\s\S]*?```)/g);
  out.innerHTML = parts.map(part => {
    const fenceMatch = part.match(/^```([\w]*)\n([\s\S]*?)```$/);
    if (fenceMatch) {
      const lang = fenceMatch[1] || '';
      const code = escHtml(fenceMatch[2]);
      const badge = lang ? `<span class="pi-lang-badge">${lang}</span>` : '';
      return `<div class="pi-code-wrap">${badge}<pre class="pi-code-block"><code>${code}</code></pre></div>`;
    }
    return `<p class="pi-prose">${escHtml(part).replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

function showOutputError(msg) {
  const out = document.getElementById('pi-output');
  if (out) out.innerHTML = `<div class="pi-error">⚠ ${escHtml(msg)}</div>`;
}

// ── EXTRACT CODE BLOCK ────────────────────────────────────
// Pulls the first fenced code block from AI output for Piston
function extractCodeBlock(text) {
  const m = text.match(/```[\w]*\n([\s\S]*?)```/);
  return m ? m[1].trim() : text.trim();
}

// ── RUN VIA PISTON ────────────────────────────────────────
async function runCode() {
  if (!lastCode) return;

  const runBtn   = document.getElementById('pi-run-btn');
  const runOut   = document.getElementById('pi-run-output');

  runBtn.disabled = true;
  runBtn.innerHTML = '<span class="pi-spinner"></span> running...';
  runOut.textContent = '';
  runOut.style.color = 'var(--subtext)';

  try {
    const resp = await fetch(PISTON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'python',
        version:  '3.10',
        files:    [{ content: lastCode }],
      }),
    });
    const data = await resp.json();
    const stdout = data?.run?.stdout || '';
    const stderr = data?.run?.stderr || '';
    const output = (stdout + stderr).trim();

    if (stderr && stderr.includes('ModuleNotFoundError')) {
      // GPIO/hardware module — expected in sandbox
      runOut.style.color = '#FFD93D';
      runOut.textContent = '⚠ GPIO/hardware modules need a real Pi to run. Pure Python logic works here.';
    } else if (output) {
      runOut.style.color = stderr ? '#FF4BCB' : '#00F6D6';
      runOut.textContent = output.slice(0, 400);  // cap display length
    } else {
      runOut.style.color = '#9090c0';
      runOut.textContent = '(no output)';
    }
  } catch(err) {
    runOut.style.color = '#FF4BCB';
    runOut.textContent = 'Piston error: ' + err.message;
  } finally {
    runBtn.disabled = false;
    runBtn.innerHTML = '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> run python';
  }
}

// ── CARD PREVIEW ──────────────────────────────────────────
// Auto-renders a Build Card preview after generation
async function renderCardPreview(prompt, scriptText) {
  const preview = document.getElementById('pi-card-preview');
  if (!preview) return;

  // Extract fields from the AI output
  const build = parseScriptToBuildCard(prompt, scriptText);

  try {
    const canvas = await renderBuildCard(build);
    canvas.style.cssText = 'width:100%;max-width:280px;border-radius:8px;display:block;margin:0 auto;cursor:pointer;';
    canvas.title = 'Click to save as PNG';
    preview.innerHTML = '';
    preview.appendChild(canvas);
    // Store for download
    preview.dataset.buildJson = JSON.stringify(build);
  } catch(e) {
    preview.innerHTML = '<div style="color:#9090c0;font-size:0.7rem;padding:20px;text-align:center">card preview failed</div>';
  }
}

// ── PARSE SCRIPT TO BUILD CARD ────────────────────────────
// Extracts structured fields from AI educational script output
function parseScriptToBuildCard(prompt, text) {
  // Extract title from prompt (first 5 words)
  const title = prompt.split(' ').slice(0, 5).join(' ').replace(/write a.*?script.*?that/i, '').trim() ||
                prompt.slice(0, 40);

  // Extract difficulty
  const diffMatch = text.match(/difficultys*[:-]s*(Beginner|Intermediate|Advanced)/i);
  const difficulty = diffMatch ? diffMatch[1] : 'Beginner';

  // Extract time
  const timeMatch = text.match(/(d+)s*min/i);
  const time_minutes = timeMatch ? parseInt(timeMatch[1]) : 15;

  // Extract components — lines after COMPONENTS NEEDED section
  const compMatch = text.match(/COMPONENTS NEEDED[sS]*?
([sS]*?)

/);
  const components = compMatch
    ? compMatch[1].split('
').map(l => l.replace(/^[-*•#d.s]+/, '').trim()).filter(Boolean).slice(0, 6)
    : ['Raspberry Pi', 'jumper wires'];

  // Extract what you'll learn
  const learnMatch = text.match(/WHAT YOU.{0,10}LEARN[sS]*?
([sS]*?)

/);
  const what_you_learn = learnMatch
    ? learnMatch[1].split('
').map(l => l.replace(/^[-*•#d.s]+/, '').trim()).filter(Boolean).slice(0, 4)
    : ['Python basics', 'GPIO pin control'];

  // Description — first non-empty line after the header
  const lines = text.split('
').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('='));
  const description = lines[0]?.slice(0, 80) || prompt.slice(0, 80);

  return {
    id:            generateCardId('build'),
    type:          'build',
    title,
    author:        state.user?.email?.split('@')[0] || 'maker',
    description,
    platform:      'Raspberry Pi',
    language:      'Python',
    difficulty,
    time_minutes,
    components,
    what_you_learn,
    next_steps:    [],
    code:          lastCode,
    image:         null,
    tags:          ['raspberry-pi', 'python', 'bloomslice'],
    created_at:    new Date().toISOString(),
  };
}

// ── SAVE CARD TO IDB ──────────────────────────────────────
async function saveCard() {
  const preview = document.getElementById('pi-card-preview');
  if (!preview?.dataset.buildJson) {
    showRunMsg('Generate a project first!', '#FFD93D'); return;
  }
  const build = JSON.parse(preview.dataset.buildJson);
  try {
    await dbSet('builds', { key: build.id, data: build });
    savedCards.push(build);
    showRunMsg('✓ Build Card saved! — ' + build.id, '#00F6D6');
  } catch(e) {
    // builds store may not exist yet (IDB v6 — needs v7)
    showRunMsg('⚠ Save failed — IDB needs upgrade to v7', '#FF4BCB');
    console.warn('[pi] saveCard IDB error:', e);
  }
}

// ── DOWNLOAD CARD PNG ────────────────────────────────────
async function downloadCard() {
  const preview = document.getElementById('pi-card-preview');
  if (!preview?.dataset.buildJson) {
    showRunMsg('Generate a project first!', '#FFD93D'); return;
  }
  const build   = JSON.parse(preview.dataset.buildJson);
  const canvas  = await renderBuildCard(build);
  const link    = document.createElement('a');
  link.download = build.id + '.png';
  link.href     = canvas.toDataURL('image/png');
  link.click();
}

// ── LOAD SAVED CARDS ─────────────────────────────────────
async function loadSavedCards() {
  try {
    const all = await dbGetAll('builds');
    savedCards = all.map(r => r.data).filter(Boolean);
  } catch(e) {
    // builds store not yet created — will be added in IDB v7
    savedCards = [];
  }
}

// ── HELPERS ───────────────────────────────────────────────
function showRunMsg(msg, color) {
  const el = document.getElementById('pi-run-output');
  if (!el) return;
  el.style.color   = color || '#9090c0';
  el.textContent   = msg;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── STYLES ────────────────────────────────────────────────
function injectPiStyles() {
  if (document.getElementById('pi-styles')) return;
  const s = document.createElement('style');
  s.id = 'pi-styles';
  s.textContent = `

    /* ── WRAP ── */
    #pi-wrap {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      background: var(--bg);
      font-family: var(--font-ui);
    }

    /* ── HEADER ── */
    #pi-header {
      padding: 12px 16px 8px;
      flex-shrink: 0;
      border-bottom: 1px solid var(--border);
    }
    #pi-title {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 1rem;
      background: linear-gradient(135deg, #FF4BCB, #00F6D6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 4px;
    }
    #pi-sky-msg {
      font-size: 0.7rem;
      color: var(--subtext);
      line-height: 1.5;
    }

    /* ── STARTER CARDS ── */
    #pi-starters {
      display: flex;
      gap: 6px;
      padding: 10px 14px;
      overflow-x: auto;
      flex-shrink: 0;
      scrollbar-width: none;
      border-bottom: 1px solid var(--border);
    }
    #pi-starters::-webkit-scrollbar { display: none; }
    .pi-starter {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: all 0.15s;
    }
    .pi-starter:hover { border-color: #FF4BCB; transform: translateY(-1px); }
    .pi-starter-icon  { font-size: 1.1rem; }
    .pi-starter-label { font-size: 0.62rem; color: var(--subtext); letter-spacing: 0.06em; }

    /* ── PANES ── */
    #pi-panes {
      display: flex;
      flex: 1;
      overflow: hidden;
      min-height: 0;
    }
    #pi-left {
      flex: 1.4;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-right: 1px solid var(--border);
      min-width: 0;
    }
    #pi-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }
    .pi-pane-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px 12px;
      font-size: 0.6rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--subtext);
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      flex-shrink: 0;
    }
    .pi-pane-action {
      background: none;
      border: none;
      color: var(--subtext);
      font-family: var(--font-ui);
      font-size: 0.65rem;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      transition: all 0.15s;
    }
    .pi-pane-action:hover { color: var(--text); background: var(--muted); }

    /* ── OUTPUT ── */
    #pi-output {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      font-size: 0.76rem;
      line-height: 1.65;
      scrollbar-width: thin;
      scrollbar-color: var(--muted) transparent;
    }
    #pi-output-placeholder {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      color: var(--subtext);
      opacity: 0.4;
      font-size: 0.7rem;
      letter-spacing: 0.06em;
      text-align: center;
      padding: 20px;
    }
    .pi-placeholder-icon { font-size: 2rem; }

    /* ── CODE BLOCKS ── */
    .pi-code-wrap {
      position: relative;
      margin: 8px 0;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    .pi-lang-badge {
      position: absolute;
      top: 0; right: 0;
      background: var(--muted);
      color: var(--subtext);
      font-size: 0.56rem;
      letter-spacing: 0.1em;
      padding: 2px 7px;
      border-bottom-left-radius: 5px;
    }
    .pi-code-block {
      margin: 0;
      padding: 12px 10px;
      background: var(--surface);
      overflow-x: auto;
      font-family: 'JetBrains Mono', 'DM Mono', monospace;
      font-size: 0.72rem;
      line-height: 1.6;
      color: var(--text);
      scrollbar-width: thin;
    }
    .pi-prose {
      color: var(--text);
      margin: 4px 0;
      line-height: 1.65;
    }
    .pi-prose:empty { display: none; }
    .pi-error {
      color: #FF4BCB;
      font-size: 0.76rem;
      padding: 10px;
      background: rgba(255,75,203,0.08);
      border: 1px solid rgba(255,75,203,0.2);
      border-radius: 6px;
    }

    /* ── CARD PREVIEW ── */
    #pi-card-preview {
      flex: 1;
      overflow-y: auto;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      scrollbar-width: thin;
    }
    #pi-card-placeholder {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--subtext);
      text-align: center;
    }

    /* ── ACTION BAR ── */
    #pi-action-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-top: 1px solid var(--border);
      background: var(--bg);
      flex-shrink: 0;
      flex-wrap: wrap;
    }
    #pi-run-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 7px 12px;
      background: var(--surface);
      border: 1px solid #00F6D6;
      border-radius: 8px;
      color: #00F6D6;
      font-family: var(--font-ui);
      font-size: 0.68rem;
      letter-spacing: 0.06em;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }
    #pi-run-btn:hover    { background: rgba(0,246,214,0.08); }
    #pi-run-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    #pi-run-output {
      flex: 1;
      font-size: 0.68rem;
      color: var(--subtext);
      font-family: 'DM Mono', monospace;
      letter-spacing: 0.04em;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    #pi-save-card-btn {
      padding: 7px 12px;
      background: linear-gradient(135deg, #FF4BCB, #7c6af7);
      border: none;
      border-radius: 8px;
      color: #fff;
      font-family: var(--font-ui);
      font-size: 0.68rem;
      letter-spacing: 0.06em;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.15s;
    }
    #pi-save-card-btn:hover { opacity: 0.85; }

    /* ── FOOTER PROMPT ── */
    #pi-footer {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      padding: 8px 14px calc(8px + var(--safe-bot, 0px));
      border-top: 1px solid var(--border);
      background: var(--bg);
      flex-shrink: 0;
    }
    #pi-prompt {
      flex: 1;
      resize: none;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      color: var(--text);
      font-family: var(--font-ui);
      font-size: 0.8rem;
      line-height: 1.5;
      padding: 9px 13px;
      outline: none;
      transition: border-color 0.2s;
      max-height: 100px;
      overflow-y: auto;
    }
    #pi-prompt:focus { border-color: #FF4BCB; }
    #pi-prompt::placeholder { color: var(--subtext); }
    #pi-generate-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 9px 14px;
      background: #FF4BCB;
      border: none;
      border-radius: 12px;
      color: #fff;
      font-family: var(--font-ui);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }
    #pi-generate-btn:hover    { opacity: 0.85; }
    #pi-generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── THINKING / SPINNER ── */
    #pi-thinking {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 12px;
    }
    .pi-spinner-lg {
      width: 26px; height: 26px;
      border: 2px solid rgba(255,75,203,0.2);
      border-top-color: #FF4BCB;
      border-radius: 50%;
      animation: piSpin 0.7s linear infinite;
    }
    .pi-thinking-text {
      font-size: 0.65rem;
      letter-spacing: 0.1em;
      color: var(--subtext);
      animation: piPulse 1.5s ease-in-out infinite;
    }
    .pi-spinner {
      display: inline-block;
      width: 10px; height: 10px;
      border: 1.5px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: piSpin 0.7s linear infinite;
    }
    @keyframes piSpin  { to { transform: rotate(360deg); } }
    @keyframes piPulse { 0%,100%{opacity:0.4;} 50%{opacity:1;} }

    /* ── MOBILE STACK ── */
    @media (max-width: 640px) {
      #pi-panes { flex-direction: column; }
      #pi-left  { flex: none; height: 55%; border-right: none; border-bottom: 1px solid var(--border); }
      #pi-right { flex: none; height: 45%; }
    }
  `;
  document.head.appendChild(s);
}
