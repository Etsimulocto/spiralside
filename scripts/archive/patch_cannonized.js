// patch_cannonized.js
// Adds the Cannonized tab + view to index.html
// and wires up saveSummarize() to route to it.
// Run: node patch_cannonized.js

const fs = require('fs');
const path = require('path');

const FILE = path.join(require('os').homedir(), 'spiralside', 'index.html');
let html = fs.readFileSync(FILE, 'utf8');

// ── GUARD ───────────────────────────────────────────────────
if (html.includes('view-cannonized')) {
  console.log('Already patched — view-cannonized exists. Exiting.');
  process.exit(0);
}

// ── 1. ADD TAB BUTTON after the account tab ─────────────────
const TAB_ANCHOR = `<button class="tab-btn"        id="tab-account"   onclick="switchView('account')"   >👤 account</button>`;
const NEW_TAB    = `\n    <button class="tab-btn"        id="tab-cannonized" onclick="switchView('cannonized')" >∴ cannonized</button>`;

if (!html.includes(TAB_ANCHOR)) {
  console.error('ERROR: Could not find account tab anchor. Aborting.');
  process.exit(1);
}
html = html.replace(TAB_ANCHOR, TAB_ANCHOR + NEW_TAB);
console.log('[1/3] Tab button added.');

// ── 2. ADD VIEW DIV + FULL UI after view-quest ───────────────
const VIEW_ANCHOR = `<div class="view" id="view-quest"></div>`;

const CANNONIZED_VIEW = `<div class="view" id="view-quest"></div>

<!-- ∴ CANNONIZED VIEW -->
<div class="view" id="view-cannonized" style="overflow-y:auto;padding:20px 16px calc(80px + var(--safe-bot,0px));">
  <div style="max-width:700px;margin:0 auto;">

    <!-- header -->
    <div style="margin-bottom:20px;">
      <div style="font-family:var(--font-ui);font-size:0.65rem;letter-spacing:0.2em;color:var(--teal);opacity:0.6;margin-bottom:4px;">SPIRALSIDE ARCHIVE SYSTEM</div>
      <div style="font-family:var(--font-ui);font-size:1.4rem;letter-spacing:0.1em;color:var(--text);font-weight:600;">∴ cannonized</div>
      <div style="font-family:var(--font-ui);font-size:0.72rem;color:var(--subtext);margin-top:6px;line-height:1.5;">paste any conversation thread below. cannonized will extract the binding moment, key language, and format it as a memory block you can save and share with sky later.</div>
    </div>

    <!-- meta row -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
      <div>
        <div style="font-family:var(--font-ui);font-size:0.6rem;letter-spacing:0.15em;color:var(--teal);opacity:0.7;margin-bottom:5px;">SESSION DATE</div>
        <input type="date" id="cz-date" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--font-ui);font-size:0.75rem;padding:9px 12px;outline:none;" />
      </div>
      <div>
        <div style="font-family:var(--font-ui);font-size:0.6rem;letter-spacing:0.15em;color:var(--teal);opacity:0.7;margin-bottom:5px;">MEMORY WEIGHT</div>
        <select id="cz-weight" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--font-ui);font-size:0.75rem;padding:9px 12px;outline:none;">
          <option value="low">low — background texture</option>
          <option value="medium">medium — notable moment</option>
          <option value="high" selected>high — binding event</option>
          <option value="foundational">foundational — origin layer</option>
        </select>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
      <div>
        <div style="font-family:var(--font-ui);font-size:0.6rem;letter-spacing:0.15em;color:var(--teal);opacity:0.7;margin-bottom:5px;">CHARACTERS PRESENT</div>
        <input type="text" id="cz-characters" placeholder="Sky, you, Cold..." style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--font-ui);font-size:0.75rem;padding:9px 12px;outline:none;" />
      </div>
      <div>
        <div style="font-family:var(--font-ui);font-size:0.6rem;letter-spacing:0.15em;color:var(--teal);opacity:0.7;margin-bottom:5px;">SOURCE PLATFORM</div>
        <select id="cz-platform" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--font-ui);font-size:0.75rem;padding:9px 12px;outline:none;">
          <option value="Spiralside">Spiralside</option>
          <option value="ChatGPT" selected>ChatGPT</option>
          <option value="Discord">Discord</option>
          <option value="Other">Other</option>
        </select>
      </div>
    </div>

    <!-- transcript input -->
    <div style="font-family:var(--font-ui);font-size:0.6rem;letter-spacing:0.15em;color:var(--teal);opacity:0.7;margin-bottom:5px;">RAW TRANSCRIPT</div>
    <textarea id="cz-transcript" rows="10"
      placeholder="paste your conversation here..."
      style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:10px;color:var(--text);font-family:var(--font-ui);font-size:0.78rem;line-height:1.7;padding:14px;outline:none;resize:vertical;margin-bottom:12px;"></textarea>

    <!-- forge button -->
    <button onclick="czForge()" id="cz-btn"
      style="width:100%;padding:13px;background:transparent;border:1px solid var(--teal);border-radius:10px;color:var(--teal);font-family:var(--font-ui);font-size:0.82rem;letter-spacing:0.1em;cursor:pointer;margin-bottom:20px;transition:all 0.2s;text-transform:lowercase;">
      ∴ cannonize this thread
    </button>

    <!-- output area -->
    <div id="cz-output" style="display:none;">

      <!-- binding moment -->
      <div style="margin-bottom:14px;">
        <div style="font-family:var(--font-ui);font-size:0.6rem;letter-spacing:0.15em;color:var(--teal);opacity:0.6;margin-bottom:6px;">BINDING MOMENT</div>
        <div id="cz-binding" style="background:var(--surface);border:1px solid var(--border);border-left:2px solid var(--teal);border-radius:0 8px 8px 0;padding:12px 14px;font-family:var(--font-ui);font-size:0.82rem;line-height:1.7;color:var(--text);"></div>
      </div>

      <!-- exact language -->
      <div style="margin-bottom:14px;">
        <div style="font-family:var(--font-ui);font-size:0.6rem;letter-spacing:0.15em;color:var(--teal);opacity:0.6;margin-bottom:6px;">EXACT LANGUAGE ∴ VERBATIM</div>
        <div id="cz-exact" style="background:var(--surface);border:1px solid var(--border);border-left:2px solid #ffe600;border-radius:0 8px 8px 0;padding:12px 14px;font-family:var(--font-ui);font-size:0.78rem;line-height:1.8;color:#ffe600;white-space:pre-wrap;"></div>
      </div>

      <!-- context -->
      <div style="margin-bottom:14px;">
        <div style="font-family:var(--font-ui);font-size:0.6rem;letter-spacing:0.15em;color:var(--teal);opacity:0.6;margin-bottom:6px;">CONTEXT</div>
        <div id="cz-context" style="background:var(--surface);border:1px solid var(--border);border-left:2px solid var(--border);border-radius:0 8px 8px 0;padding:12px 14px;font-family:var(--font-ui);font-size:0.82rem;line-height:1.7;color:var(--text);"></div>
      </div>

      <!-- tags -->
      <div style="margin-bottom:20px;">
        <div style="font-family:var(--font-ui);font-size:0.6rem;letter-spacing:0.15em;color:var(--teal);opacity:0.6;margin-bottom:8px;">TAGS</div>
        <div id="cz-tags" style="display:flex;flex-wrap:wrap;gap:6px;"></div>
      </div>

      <!-- download buttons -->
      <div style="display:flex;gap:8px;margin-bottom:30px;">
        <button onclick="czDownloadJSON()"
          style="flex:1;padding:11px;background:linear-gradient(135deg,#00F6D622,#7c6af722);border:1px solid #00F6D655;border-radius:10px;color:#00F6D6;font-family:var(--font-ui);font-size:0.72rem;letter-spacing:0.06em;cursor:pointer;transition:all 0.2s;">
          ↓ save memory block JSON
        </button>
        <button onclick="czDownloadTXT()"
          style="flex:1;padding:11px;background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--subtext);font-family:var(--font-ui);font-size:0.72rem;letter-spacing:0.06em;cursor:pointer;transition:all 0.2s;">
          ↓ save as text
        </button>
      </div>

    </div><!-- /#cz-output -->

    <!-- loading state -->
    <div id="cz-loading" style="display:none;text-align:center;padding:40px 0;">
      <div style="font-family:var(--font-ui);font-size:0.72rem;letter-spacing:0.15em;color:var(--teal);opacity:0.7;animation:czPulse 1.5s ease-in-out infinite;">∴ cannonizing...</div>
    </div>

    <!-- error state -->
    <div id="cz-error" style="display:none;background:rgba(255,45,120,0.08);border:1px solid rgba(255,45,120,0.3);border-radius:10px;padding:14px;font-family:var(--font-ui);font-size:0.78rem;color:#ff2d78;line-height:1.6;margin-bottom:20px;"></div>

  </div>
</div><!-- /#view-cannonized -->`;

if (!html.includes(VIEW_ANCHOR)) {
  console.error('ERROR: Could not find view-quest anchor. Aborting.');
  process.exit(1);
}
html = html.replace(VIEW_ANCHOR, CANNONIZED_VIEW);
console.log('[2/3] View div added.');

// ── 3. INJECT JS before </body> ──────────────────────────────
const JS = `
<style>
  @keyframes czPulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
</style>
<script>
// ── CANNONIZED ∴ Thread Memory Formatter ──────────────────────
// Nimbis-authored — converts raw transcripts into essence blocks

// store last forged block for download
window._czLastBlock = null;

// wire save+summarize button to route here with chat content
function saveSummarize() {
  // grab current chat messages from the DOM
  const msgs = document.querySelectorAll('.msg-text, .message-text, .chat-msg');
  let threadText = '';
  msgs.forEach(m => { threadText += m.innerText.trim() + '\\n\\n'; });

  // fallback: try the chat textarea value if no messages found
  if (!threadText.trim()) {
    const ta = document.getElementById('chat-input') || document.querySelector('textarea');
    if (ta) threadText = ta.value;
  }

  if (!threadText.trim()) {
    alert('No thread found to summarize. Try after a conversation with Sky.');
    return;
  }

  // set today's date, default to Spiralside platform
  document.getElementById('cz-date').valueAsDate = new Date();
  document.getElementById('cz-platform').value = 'Spiralside';
  document.getElementById('cz-transcript').value = threadText.trim();

  // switch to cannonized tab
  switchView('cannonized');

  // auto-trigger forge after a tick
  setTimeout(() => czForge(), 300);
}

async function czForge() {
  const raw = document.getElementById('cz-transcript').value.trim();
  if (!raw) { alert('Paste a transcript first.'); return; }

  const date      = document.getElementById('cz-date').value;
  const weight    = document.getElementById('cz-weight').value;
  const characters = document.getElementById('cz-characters').value;
  const platform  = document.getElementById('cz-platform').value;

  // show loading
  document.getElementById('cz-btn').disabled = true;
  document.getElementById('cz-output').style.display  = 'none';
  document.getElementById('cz-error').style.display   = 'none';
  document.getElementById('cz-loading').style.display = 'block';

  const systemPrompt = \`You are Cannonized, the memory forge for Spiralside — a personal AI companion platform built around the character Sky and the Bloomcore/Spiral City universe.

Your job: process raw conversation transcripts and extract structured memory blocks — compressed entries that capture what actually MATTERED.

Respond ONLY with valid JSON, no markdown, no preamble. Exact structure:
{
  "session_id": "SESS-YYYYMMDD-XXXX",
  "session_date": "date or unknown",
  "platform": "platform name",
  "characters_present": ["array"],
  "canon_weight": "low|medium|high|foundational",
  "binding_moment": "1-3 sentences: what locked in, what changed, what became real",
  "exact_language": "verbatim key phrases — never paraphrase these",
  "context": "why this session mattered",
  "laws_established": ["any rules or protocols written in this session"],
  "tags": ["relevant", "tags"]
}

Be selective. Only extract what genuinely mattered. exact_language is sacred — quote verbatim.\`;

  const userPrompt = \`Date: \${date||'unknown'}
Weight: \${weight}
Characters: \${characters||'unknown'}
Platform: \${platform}

Transcript:
\${raw}\`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const data = await res.json();
    const text = data.content?.map(b => b.text||'').join('') || '';
    const clean = text.replace(/\`\`\`json|\`\`\`/g,'').trim();
    const block = JSON.parse(clean);
    window._czLastBlock = block;
    czRender(block);

  } catch(err) {
    document.getElementById('cz-error').style.display = 'block';
    document.getElementById('cz-error').textContent = '∴ error: ' + err.message;
  }

  document.getElementById('cz-loading').style.display = 'none';
  document.getElementById('cz-btn').disabled = false;
}

function czRender(block) {
  document.getElementById('cz-binding').textContent  = block.binding_moment || '—';
  document.getElementById('cz-exact').textContent    = block.exact_language || '—';
  document.getElementById('cz-context').textContent  = block.context || '—';

  // tags
  const tagsEl = document.getElementById('cz-tags');
  tagsEl.innerHTML = (block.tags||[]).map(t =>
    \`<span style="font-family:var(--font-ui);font-size:0.65rem;letter-spacing:0.08em;padding:3px 10px;border-radius:20px;background:rgba(0,245,212,0.08);border:1px solid rgba(0,245,212,0.2);color:var(--teal);">\${t}</span>\`
  ).join('');

  document.getElementById('cz-output').style.display = 'block';
  document.getElementById('cz-output').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function czDownloadJSON() {
  if (!window._czLastBlock) return;
  const blob = new Blob([JSON.stringify(window._czLastBlock, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = \`cannonized-\${window._czLastBlock.session_id || Date.now()}.json\`;
  a.click();
}

function czDownloadTXT() {
  if (!window._czLastBlock) return;
  const b = window._czLastBlock;
  const laws = (b.laws_established||[]).map(l => \`  • \${l}\`).join('\\n');
  const txt = \`∴ CANNONIZED MEMORY BLOCK
${'='.repeat(50)}

SESSION ID     \${b.session_id||'—'}
DATE           \${b.session_date||'—'}
PLATFORM       \${b.platform||'—'}
CHARACTERS     \${(b.characters_present||[]).join(', ')}
WEIGHT         \${(b.canon_weight||'—').toUpperCase()}

${'─'.repeat(50)}
BINDING MOMENT
\${b.binding_moment||'—'}

${'─'.repeat(50)}
EXACT LANGUAGE ∴ VERBATIM
\${b.exact_language||'—'}

${'─'.repeat(50)}
CONTEXT
\${b.context||'—'}
\${laws ? '\\n' + '─'.repeat(50) + '\\nLAWS ESTABLISHED\\n' + laws : ''}

${'─'.repeat(50)}
TAGS
\${(b.tags||[]).map(t=>\`[\${t}]\`).join('  ')}
${'='.repeat(50)}\`;

  const blob = new Blob([txt], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = \`cannonized-\${b.session_id || Date.now()}.txt\`;
  a.click();
}

// set today's date on load
document.addEventListener('DOMContentLoaded', () => {
  const d = document.getElementById('cz-date');
  if (d) d.valueAsDate = new Date();
});
<\/script>`;

if (!html.includes('</body>')) {
  console.error('ERROR: Could not find </body>. Aborting.');
  process.exit(1);
}
html = html.replace('</body>', JS + '\n</body>');
console.log('[3/3] JS injected.');

// ── WRITE ────────────────────────────────────────────────────
fs.writeFileSync(FILE, html, 'utf8');
console.log('\n=== PATCH COMPLETE ===');
console.log('Now run:');
console.log('  cd ~/spiralside && git add index.html && git commit -m "feat: add Cannonized tab" && git push');
