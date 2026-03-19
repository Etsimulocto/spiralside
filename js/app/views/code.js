// ============================================================
// SPIRALSIDE — CODE VIEW v1.0
// Coding assistant tab — mode presets, model picker, 10-pair
// circular history buffer, side-by-side desktop layout
// Nimbis anchor: js/app/views/code.js
// ============================================================

import { state } from '../state.js';

// ── CONFIG ────────────────────────────────────────────────
const RAIL = 'https://web-production-4e6f3.up.railway.app';

// Max history entries (10 user + 10 assistant = 20 total)
const MAX_HISTORY = 20;

// ── MODULE STATE ──────────────────────────────────────────
let history       = [];   // [{ role, content }, ...]
let carryContext  = false; // whether to send history with next run
let selectedMode  = 'general';
let selectedModel = 'haiku';
let isRunning     = false;

// ── MODE PRESETS ──────────────────────────────────────────
// Each mode injects a system prompt prefix into the request
const MODES = {
  general: {
    label: 'general',
    system: `You are a senior software engineer and coding assistant. 
Be concise and precise. Return clean, working code. 
When explaining, be brief — code speaks louder than prose.
Always wrap code in triple backtick fences with the language name.`,
  },
  bloomcore: {
    label: 'bloomcore',
    system: `You are a Bloomcore code formatter and Spiralside codebase assistant.
Apply these formatting rules strictly to any code you write or reformat:

FILE HEADER (every file):
// ============================================================
// SPIRALSIDE — MODULE NAME vX.X
// One-line description of what this file does
// Nimbis anchor: path/to/file.js
// ============================================================

SECTION DIVIDERS:
// ── SECTION NAME ─────────────────────────────────────────

RULES:
- Module-level state declared at top, grouped under // ── STATE ──
- Constants grouped under // ── CONFIG ──
- All exports at bottom or clearly marked
- Inline comments on non-obvious lines only — no noise
- No trailing whitespace, consistent 2-space indent
- Group related functions under a section divider
- Keep lines under 80 chars where practical

When asked to format code, apply all rules above and return the reformatted file.
When asked to write new code, follow these conventions from the start.`,
  },
  debug: {
    label: 'debug',
    system: `You are a expert debugger. When given code:
1. Identify all bugs, silent failures, and edge cases
2. Explain each issue in one sentence
3. Return the fixed code with inline comments marking each fix
4. Flag any performance or security concerns at the end

Be surgical — don't refactor what isn't broken.
Always wrap code in triple backtick fences with the language name.`,
  },
  refactor: {
    label: 'refactor',
    system: `You are a refactoring specialist. When given code:
1. Preserve all existing behavior exactly
2. Improve readability, reduce duplication, simplify logic
3. Add a brief comment above each changed section explaining why
4. Do NOT add new features or change APIs

Return the refactored code and a short bulleted summary of changes.
Always wrap code in triple backtick fences with the language name.`,
  },
  explain: {
    label: 'explain',
    system: `You are a patient code teacher. When given code:
1. Give a 1-sentence TL;DR of what it does
2. Walk through it section by section — not line by line unless critical
3. Highlight any clever, tricky, or dangerous parts
4. End with "gotchas" — things someone maintaining this should know

Use plain language. Assume the reader can code but doesn't know this codebase.`,
  },
};

// ── MODEL OPTIONS ─────────────────────────────────────────
// label, value, cost in credits, paid-only flag
const MODELS = [
  { label: 'haiku  — 1 cr',   value: 'haiku',  cost: 1,  paidOnly: false },
  { label: 'sonnet — 6 cr',   value: 'sonnet', cost: 6,  paidOnly: true  },
  { label: 'opus   — 15 cr',  value: 'opus',   cost: 15, paidOnly: true  },
];

// ── HISTORY HELPERS ───────────────────────────────────────

// Push a completed exchange into the circular buffer
function pushHistory(userMsg, assistantMsg) {
  history.push({ role: 'user',      content: userMsg      });
  history.push({ role: 'assistant', content: assistantMsg });
  // Trim to last MAX_HISTORY entries
  if (history.length > MAX_HISTORY) {
    history = history.slice(-MAX_HISTORY);
  }
  updateHistoryBadge();
}

// Clear entire session history
function clearHistory() {
  history = [];
  updateHistoryBadge();
}

// Returns the pair count (not message count)
function historyPairs() {
  return Math.floor(history.length / 2);
}

// Update the small badge showing [N/10]
function updateHistoryBadge() {
  const badge = document.getElementById('code-history-badge');
  if (badge) badge.textContent = `${historyPairs()}/10`;
}

// ── RENDER ────────────────────────────────────────────────

// Main render — called once when view is activated
export function renderCode(container) {

  container.innerHTML = `
    <div id="code-wrap">

      <!-- ── TOOLBAR ── -->
      <div id="code-toolbar">

        <!-- Mode chips -->
        <div id="code-modes">
          ${Object.entries(MODES).map(([key, m]) => `
            <button class="code-mode-chip ${key === selectedMode ? 'active' : ''}"
                    data-mode="${key}">${m.label}</button>
          `).join('')}
        </div>

        <!-- Right side controls -->
        <div id="code-controls">
          <!-- Context toggle -->
          <button id="code-ctx-toggle" class="${carryContext ? 'active' : ''}" title="Send session history with each run">
            <span id="code-history-badge">0/10</span>
            ctx
          </button>
          <button id="code-clear-btn" title="Clear session history">↺</button>

          <!-- Model selector -->
          <select id="code-model-select">
            ${MODELS.map(m => `
              <option value="${m.value}" ${m.value === selectedModel ? 'selected' : ''}>
                ${m.label}
              </option>
            `).join('')}
          </select>
        </div>
      </div>

      <!-- ── PANES ── -->
      <div id="code-panes">

        <!-- Input pane -->
        <div class="code-pane" id="code-input-pane">
          <div class="code-pane-label">
            input
            <button class="code-pane-action" id="code-clear-input" title="Clear input">✕</button>
          </div>
          <textarea
            id="code-input"
            spellcheck="false"
            placeholder="Paste your code here, or just describe what you need..."></textarea>
        </div>

        <!-- Output pane -->
        <div class="code-pane" id="code-output-pane">
          <div class="code-pane-label">
            output
            <button class="code-pane-action" id="code-copy-btn" title="Copy output">copy</button>
          </div>
          <div id="code-output">
            <div id="code-output-placeholder">
              <div class="code-placeholder-icon">⌥</div>
              <div>output appears here</div>
            </div>
          </div>
        </div>

      </div>

      <!-- ── PROMPT FOOTER ── -->
      <div id="code-footer">
        <textarea
          id="code-prompt"
          rows="1"
          spellcheck="false"
          placeholder="What do you want to do with this code? (or just ask a coding question)"></textarea>
        <button id="code-run-btn">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          run
        </button>
      </div>

    </div>
  `;

  // Wire up events after render
  wireEvents(container);
  updateHistoryBadge();
}

// ── EVENTS ────────────────────────────────────────────────

function wireEvents(container) {

  // Mode chip selection
  container.querySelectorAll('.code-mode-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      selectedMode = chip.dataset.mode;
      container.querySelectorAll('.code-mode-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  // Model select
  container.querySelector('#code-model-select').addEventListener('change', e => {
    selectedModel = e.target.value;
  });

  // Context toggle
  container.querySelector('#code-ctx-toggle').addEventListener('click', e => {
    carryContext = !carryContext;
    e.currentTarget.classList.toggle('active', carryContext);
  });

  // Clear history button
  container.querySelector('#code-clear-btn').addEventListener('click', () => {
    clearHistory();
    // Visual flash on badge
    const badge = document.getElementById('code-history-badge');
    if (badge) { badge.style.color = 'var(--accent2)'; setTimeout(() => badge.style.color = '', 500); }
  });

  // Clear input button
  container.querySelector('#code-clear-input').addEventListener('click', () => {
    container.querySelector('#code-input').value = '';
    container.querySelector('#code-input').focus();
  });

  // Copy output
  container.querySelector('#code-copy-btn').addEventListener('click', () => {
    const out = document.getElementById('code-output');
    const text = out?.innerText || '';
    if (!text || text === 'output appears here') return;
    navigator.clipboard.writeText(text).then(() => {
      const btn = container.querySelector('#code-copy-btn');
      btn.textContent = 'copied!';
      setTimeout(() => btn.textContent = 'copy', 1400);
    });
  });

  // Prompt textarea auto-resize + Enter to run
  const prompt = container.querySelector('#code-prompt');
  prompt.addEventListener('input', () => {
    prompt.style.height = 'auto';
    prompt.style.height = Math.min(prompt.scrollHeight, 120) + 'px';
  });
  prompt.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runCode(); }
  });

  // Run button
  container.querySelector('#code-run-btn').addEventListener('click', runCode);
}

// ── RUN ───────────────────────────────────────────────────

async function runCode() {
  if (isRunning) return;

  const promptEl = document.getElementById('code-prompt');
  const inputEl  = document.getElementById('code-input');
  const outputEl = document.getElementById('code-output');
  const runBtn   = document.getElementById('code-run-btn');

  const userPrompt = promptEl.value.trim();
  const codeInput  = inputEl.value.trim();

  // Need at least a prompt or some code
  if (!userPrompt && !codeInput) {
    promptEl.placeholder = 'type a prompt first...';
    setTimeout(() => promptEl.placeholder = 'What do you want to do with this code? (or just ask a coding question)', 2000);
    return;
  }

  isRunning = true;
  runBtn.disabled = true;
  runBtn.innerHTML = `<span class="code-spinner"></span> running`;

  // Build the user message — code block + prompt
  let userMessage = '';
  if (codeInput) userMessage += `\`\`\`\n${codeInput}\n\`\`\`\n\n`;
  if (userPrompt) userMessage += userPrompt;

  // Show thinking state in output
  outputEl.innerHTML = `<div id="code-thinking">
    <div class="code-spinner-lg"></div>
    <div class="code-thinking-text">thinking...</div>
  </div>`;

  try {
    // Get auth token
    const token = state.session?.access_token;
    if (!token) {
      showOutputError('Not signed in.');
      return;
    }

    // Build messages array — history + current message
    const messages = carryContext && history.length > 0
      ? [...history, { role: 'user', content: userMessage }]
      : [{ role: 'user', content: userMessage }];

    const resp = await fetch(`${RAIL}/code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages,
        mode:  selectedMode,
        model: selectedModel,
        system: MODES[selectedMode].system,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      showOutputError(data.detail || 'Something went wrong.');
      return;
    }

    // Render the result
    renderOutput(data.result);

    // Push to circular history buffer
    pushHistory(userMessage, data.result);

    // Clear prompt (keep code input — user may want to iterate)
    promptEl.value = '';
    promptEl.style.height = 'auto';

    // Update credits badge if usage returned
    if (data.usage && window.updateCreditDisplay) {
      window.updateCreditDisplay(data.usage);
    }

  } catch (err) {
    showOutputError('Connection error. Try again.');
  } finally {
    isRunning = false;
    runBtn.disabled = false;
    runBtn.innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> run`;
  }
}

// ── OUTPUT RENDERING ──────────────────────────────────────

// Renders markdown-ish output — highlights fenced code blocks
function renderOutput(text) {
  const out = document.getElementById('code-output');
  if (!out) return;

  // Split on fenced code blocks
  const parts = text.split(/(```[\w]*\n[\s\S]*?```)/g);

  out.innerHTML = parts.map(part => {
    const fenceMatch = part.match(/^```([\w]*)\n([\s\S]*?)```$/);
    if (fenceMatch) {
      const lang    = fenceMatch[1] || '';
      const code    = escapeHtml(fenceMatch[2]);
      const langBadge = lang ? `<span class="code-lang-badge">${lang}</span>` : '';
      return `<div class="code-block-wrap">${langBadge}<pre class="code-block"><code>${code}</code></pre></div>`;
    }
    // Plain text — preserve newlines
    const escaped = escapeHtml(part).replace(/\n/g, '<br>');
    return `<p class="code-prose">${escaped}</p>`;
  }).join('');
}

function showOutputError(msg) {
  const out = document.getElementById('code-output');
  if (out) out.innerHTML = `<div class="code-error">⚠ ${escapeHtml(msg)}</div>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── STYLES ────────────────────────────────────────────────

// Inject code tab styles — called once on first render
export function injectCodeStyles() {
  if (document.getElementById('code-styles')) return;
  const s = document.createElement('style');
  s.id = 'code-styles';
  s.textContent = `

    /* ── WRAPPER ── */
    #code-wrap {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      background: var(--bg);
    }

    /* ── TOOLBAR ── */
    #code-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
      flex-wrap: wrap;
    }
    #code-modes {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .code-mode-chip {
      padding: 5px 11px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      color: var(--subtext);
      font-family: var(--font-ui);
      font-size: 0.65rem;
      letter-spacing: 0.08em;
      cursor: pointer;
      transition: all 0.15s;
    }
    .code-mode-chip:hover  { color: var(--text); border-color: var(--accent); }
    .code-mode-chip.active { color: var(--accent); border-color: var(--accent); background: rgba(124,106,247,0.1); }

    /* ── RIGHT CONTROLS ── */
    #code-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    #code-ctx-toggle {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      color: var(--subtext);
      font-family: var(--font-ui);
      font-size: 0.65rem;
      letter-spacing: 0.06em;
      cursor: pointer;
      transition: all 0.15s;
    }
    #code-ctx-toggle.active { color: var(--accent3); border-color: var(--accent3); background: rgba(106,247,200,0.08); }
    #code-history-badge {
      font-size: 0.58rem;
      color: var(--subtext);
      background: var(--muted);
      border-radius: 10px;
      padding: 1px 6px;
      transition: color 0.3s;
    }
    #code-ctx-toggle.active #code-history-badge { color: var(--accent3); background: rgba(106,247,200,0.15); }

    #code-clear-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--subtext);
      font-size: 0.85rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    #code-clear-btn:hover { color: var(--accent2); border-color: var(--accent2); }

    #code-model-select {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      font-family: var(--font-ui);
      font-size: 0.65rem;
      padding: 5px 8px;
      cursor: pointer;
      outline: none;
      transition: border-color 0.15s;
    }
    #code-model-select:focus { border-color: var(--accent); }

    /* ── PANES ── */
    #code-panes {
      display: flex;
      flex: 1;
      overflow: hidden;
      gap: 0;
    }
    .code-pane {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }
    .code-pane + .code-pane {
      border-left: 1px solid var(--border);
    }
    .code-pane-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 12px;
      font-size: 0.6rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--subtext);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
      background: var(--surface);
    }
    .code-pane-action {
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
    .code-pane-action:hover { color: var(--text); background: var(--muted); }

    /* Input textarea */
    #code-input {
      flex: 1;
      resize: none;
      background: var(--bg);
      border: none;
      outline: none;
      color: var(--text);
      font-family: 'JetBrains Mono', 'DM Mono', monospace;
      font-size: 0.78rem;
      line-height: 1.6;
      padding: 14px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--muted) transparent;
    }
    #code-input::placeholder { color: var(--subtext); opacity: 0.6; }

    /* Output area */
    #code-output {
      flex: 1;
      overflow-y: auto;
      padding: 14px;
      font-family: var(--font-ui);
      font-size: 0.78rem;
      line-height: 1.6;
      scrollbar-width: thin;
      scrollbar-color: var(--muted) transparent;
    }
    #code-output-placeholder {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      color: var(--subtext);
      opacity: 0.45;
      font-size: 0.72rem;
      letter-spacing: 0.08em;
    }
    .code-placeholder-icon { font-size: 1.6rem; opacity: 0.5; }

    /* Code blocks in output */
    .code-block-wrap {
      position: relative;
      margin: 8px 0;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    .code-lang-badge {
      position: absolute;
      top: 0;
      right: 0;
      background: var(--muted);
      color: var(--subtext);
      font-size: 0.58rem;
      letter-spacing: 0.1em;
      padding: 3px 8px;
      border-bottom-left-radius: 6px;
    }
    .code-block {
      margin: 0;
      padding: 14px 12px;
      background: var(--surface);
      overflow-x: auto;
      font-family: 'JetBrains Mono', 'DM Mono', monospace;
      font-size: 0.75rem;
      line-height: 1.6;
      color: var(--text);
      scrollbar-width: thin;
      scrollbar-color: var(--muted) transparent;
    }
    .code-prose {
      color: var(--text);
      margin: 6px 0;
      line-height: 1.65;
    }
    .code-prose:empty { display: none; }
    .code-error {
      color: var(--accent2);
      font-size: 0.78rem;
      padding: 12px;
      background: rgba(247,106,138,0.08);
      border: 1px solid rgba(247,106,138,0.2);
      border-radius: 8px;
    }

    /* Thinking state */
    #code-thinking {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 14px;
    }
    .code-spinner-lg {
      width: 28px;
      height: 28px;
      border: 2px solid rgba(124,106,247,0.2);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: codeSpin 0.7s linear infinite;
    }
    .code-thinking-text {
      font-size: 0.65rem;
      letter-spacing: 0.12em;
      color: var(--subtext);
      animation: codeThinkPulse 1.5s ease-in-out infinite;
    }
    @keyframes codeSpin { to { transform: rotate(360deg); } }
    @keyframes codeThinkPulse { 0%,100%{opacity:0.4;} 50%{opacity:1;} }

    /* ── FOOTER ── */
    #code-footer {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      padding: 10px 14px calc(10px + var(--safe-bot));
      border-top: 1px solid var(--border);
      background: var(--bg);
      flex-shrink: 0;
    }
    #code-prompt {
      flex: 1;
      resize: none;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      color: var(--text);
      font-family: var(--font-ui);
      font-size: 0.8rem;
      line-height: 1.5;
      padding: 10px 14px;
      outline: none;
      transition: border-color 0.2s;
      max-height: 120px;
      overflow-y: auto;
    }
    #code-prompt:focus { border-color: var(--accent); }
    #code-prompt::placeholder { color: var(--subtext); }
    #code-run-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      background: var(--accent);
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
    #code-run-btn:hover    { opacity: 0.85; }
    #code-run-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .code-spinner {
      display: inline-block;
      width: 10px;
      height: 10px;
      border: 1.5px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: codeSpin 0.7s linear infinite;
    }

    /* ── MOBILE STACK ── */
    @media (max-width: 600px) {
      #code-panes { flex-direction: column; }
      .code-pane + .code-pane { border-left: none; border-top: 1px solid var(--border); }
    }
  `;
  document.head.appendChild(s);
}
