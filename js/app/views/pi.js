// ============================================================
// SPIRALSIDE — PI VIEW v1.0
// Bloomslice Studio — maker/STEM tab
// Nimbis anchor: js/app/views/pi.js
// ============================================================

import { state }               from '../state.js';
import { renderBuildCard,
         generateCardId }      from '../card.js';
import { dbSet, dbGetAll }     from '../db.js';

// ── CONFIG ────────────────────────────────────────────────
const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

// ── STARTER PROJECTS ──────────────────────────────────────
const STARTERS = [
  { icon: '🔴', label: 'Blink LED',    prompt: 'Write a beginner Raspberry Pi Python script that blinks an LED on GPIO 17 every second. Include full educational format with wiring diagram.' },
  { icon: '📡', label: 'Read Sensor',  prompt: 'Write a beginner Raspberry Pi Python script that reads temperature from a DHT11 sensor on GPIO 4. Include full educational format.' },
  { icon: '🌐', label: 'Web Server',   prompt: 'Write a beginner Raspberry Pi Python script that creates a simple Flask web server on port 5000. Include full educational format.' },
  { icon: '📷', label: 'Camera Snap', prompt: 'Write a beginner Raspberry Pi Python script that takes a photo with picamera2 and saves it. Include full educational format.' },
  { icon: '🎛️', label: 'Servo',        prompt: 'Write a beginner Raspberry Pi Python script that sweeps a servo on GPIO 18 using PWM. Include full educational format.' },
  { icon: '📊', label: 'Data Logger', prompt: 'Write a beginner Raspberry Pi Python script that logs CPU temperature to a CSV every 5 seconds. Include full educational format.' },
];

// ── MODULE STATE ──────────────────────────────────────────
let initialized = false;  // prevent double-init
let isRunning   = false;  // debounce AI call
let lastCode    = '';     // last extracted code block for Piston
let lastBuild   = null;   // last parsed build card object

// ── INIT ──────────────────────────────────────────────────
export function initPiView() {
  const el = document.getElementById('view-pi');
  if (!el || initialized) return;
  initialized = true;
  injectPiStyles();
  const wrap = document.createElement('div');
  wrap.id = 'pi-wrap';
  el.appendChild(wrap);
  renderDOM(wrap);
  wireEvents(wrap);
}

// ── DOM ───────────────────────────────────────────────────
function renderDOM(wrap) {
  // Header
  const header = document.createElement('div');
  header.id = 'pi-header';
  const title = document.createElement('div');
  title.id = 'pi-title';
  title.textContent = '🍓 Bloomslice Studio';
  const msg = document.createElement('div');
  msg.id = 'pi-sky-msg';
  msg.textContent = 'Tell me what you want to build and I\'ll write the code, explain every line, and show you how to wire it up.';
  header.appendChild(title);
  header.appendChild(msg);
  wrap.appendChild(header);

  // Starter cards
  const starters = document.createElement('div');
  starters.id = 'pi-starters';
  STARTERS.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'pi-starter';
    btn.dataset.prompt = s.prompt;
    const icon = document.createElement('span');
    icon.className = 'pi-starter-icon';
    icon.textContent = s.icon;
    const label = document.createElement('span');
    label.className = 'pi-starter-label';
    label.textContent = s.label;
    btn.appendChild(icon);
    btn.appendChild(label);
    starters.appendChild(btn);
  });
  wrap.appendChild(starters);

  // Panes
  const panes = document.createElement('div');
  panes.id = 'pi-panes';

  // Left — output
  const left = document.createElement('div');
  left.id = 'pi-left';
  const leftLabel = document.createElement('div');
  leftLabel.className = 'pi-pane-label';
  leftLabel.textContent = 'output';
  const copyBtn = document.createElement('button');
  copyBtn.className = 'pi-pane-action';
  copyBtn.id = 'pi-copy-btn';
  copyBtn.textContent = 'copy';
  leftLabel.appendChild(copyBtn);
  const output = document.createElement('div');
  output.id = 'pi-output';
  const outPh = document.createElement('div');
  outPh.id = 'pi-output-ph';
  const phIcon = document.createElement('div');
  phIcon.style.fontSize = '2rem';
  phIcon.textContent = '🍓';
  const phTxt = document.createElement('div');
  phTxt.textContent = 'pick a starter or describe your project';
  outPh.appendChild(phIcon);
  outPh.appendChild(phTxt);
  output.appendChild(outPh);
  left.appendChild(leftLabel);
  left.appendChild(output);

  // Right — card preview
  const right = document.createElement('div');
  right.id = 'pi-right';
  const rightLabel = document.createElement('div');
  rightLabel.className = 'pi-pane-label';
  rightLabel.textContent = 'build card';
  const dlBtn = document.createElement('button');
  dlBtn.className = 'pi-pane-action';
  dlBtn.id = 'pi-dl-btn';
  dlBtn.textContent = 'save PNG';
  rightLabel.appendChild(dlBtn);
  const cardPrev = document.createElement('div');
  cardPrev.id = 'pi-card-preview';
  const cardPh = document.createElement('div');
  cardPh.id = 'pi-card-ph';
  cardPh.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;opacity:0.3;font-size:0.65rem;color:var(--subtext);text-align:center;gap:6px;';
  cardPh.innerHTML = '<div>BCK-????</div><div>card appears after generation</div>';
  cardPrev.appendChild(cardPh);
  right.appendChild(rightLabel);
  right.appendChild(cardPrev);

  panes.appendChild(left);
  panes.appendChild(right);
  wrap.appendChild(panes);

  // Action bar
  const bar = document.createElement('div');
  bar.id = 'pi-action-bar';
  const runBtn = document.createElement('button');
  runBtn.id = 'pi-run-btn';
  runBtn.innerHTML = '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> run python';
  const runOut = document.createElement('div');
  runOut.id = 'pi-run-out';
  const saveBtn = document.createElement('button');
  saveBtn.id = 'pi-save-btn';
  saveBtn.textContent = '🎴 save build card';
  bar.appendChild(runBtn);
  bar.appendChild(runOut);
  bar.appendChild(saveBtn);
  wrap.appendChild(bar);

  // Footer
  const footer = document.createElement('div');
  footer.id = 'pi-footer';
  const ta = document.createElement('textarea');
  ta.id = 'pi-prompt';
  ta.rows = 1;
  ta.placeholder = 'What do you want to build? (e.g. blink an LED, read a temperature sensor...)';
  ta.spellcheck = false;
  const genBtn = document.createElement('button');
  genBtn.id = 'pi-gen-btn';
  genBtn.innerHTML = '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> generate';
  footer.appendChild(ta);
  footer.appendChild(genBtn);
  wrap.appendChild(footer);
}

// ── EVENTS ────────────────────────────────────────────────
function wireEvents(wrap) {
  wrap.querySelectorAll('.pi-starter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('pi-prompt').value = btn.dataset.prompt;
      generate();
    });
  });

  const ta = document.getElementById('pi-prompt');
  ta.addEventListener('input', () => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
  });
  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); }
  });

  document.getElementById('pi-gen-btn').addEventListener('click', generate);
  document.getElementById('pi-copy-btn').addEventListener('click', copyOutput);
  document.getElementById('pi-run-btn').addEventListener('click', runPiston);
  document.getElementById('pi-save-btn').addEventListener('click', saveCard);
  document.getElementById('pi-dl-btn').addEventListener('click', downloadCard);
}

// ── GENERATE ──────────────────────────────────────────────
async function generate() {
  if (isRunning) return;
  const ta      = document.getElementById('pi-prompt');
  const outEl   = document.getElementById('pi-output');
  const genBtn  = document.getElementById('pi-gen-btn');
  const prompt  = ta.value.trim();
  if (!prompt) { ta.style.borderColor = '#FF4BCB'; setTimeout(() => ta.style.borderColor = '', 1000); return; }

  isRunning = true;
  genBtn.disabled = true;
  genBtn.innerHTML = '<span class="pi-spin"></span> thinking...';

  const thinking = document.createElement('div');
  thinking.id = 'pi-thinking';
  thinking.innerHTML = '<div class="pi-spin-lg"></div><div class="pi-think-txt">Sky is writing your project...</div>';
  outEl.innerHTML = '';
  outEl.appendChild(thinking);

  try {
    const token = state.session && state.session.access_token;
    if (!token) { showErr('Please sign in.'); return; }

    const rail = state.RAIL || 'https://web-production-4e6f3.up.railway.app';
    const resp = await fetch(rail + '/pi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ prompt }),
    });
    const data = await resp.json();
    if (!resp.ok) { showErr(data.detail || 'Something went wrong.'); return; }

    renderOutput(outEl, data.result);
    lastCode  = extractCode(data.result);
    lastBuild = parseCard(prompt, data.result);
    renderCardPreview(lastBuild);
    if (data.usage && window.updateCreditDisplay) window.updateCreditDisplay(data.usage);

  } catch(e) {
    showErr('Connection error. Try again.');
  } finally {
    isRunning = false;
    genBtn.disabled = false;
    genBtn.innerHTML = '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> generate';
  }
}

// ── RENDER OUTPUT ─────────────────────────────────────────
// Line-by-line parser — no regex, safe from transport mangling
function renderOutput(el, text) {
  el.innerHTML = '';
  const lines  = text.split('\n');
  let inCode   = false;
  let lang     = '';
  let codeBuf  = [];
  let textBuf  = [];

  function flushText() {
    if (!textBuf.length) return;
    const joined = textBuf.join('\n').trim();
    if (!joined) { textBuf = []; return; }
    const p = document.createElement('p');
    p.className = 'pi-prose';
    p.textContent = joined;
    el.appendChild(p);
    textBuf = [];
  }

  function flushCode() {
    if (!codeBuf.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'pi-code-wrap';
    if (lang) {
      const badge = document.createElement('span');
      badge.className = 'pi-lang-badge';
      badge.textContent = lang;
      wrap.appendChild(badge);
    }
    const pre = document.createElement('pre');
    pre.className = 'pi-code-block';
    const code = document.createElement('code');
    code.textContent = codeBuf.join('\n');
    pre.appendChild(code);
    wrap.appendChild(pre);
    el.appendChild(wrap);
    codeBuf = []; lang = '';
  }

  lines.forEach(line => {
    if (line.startsWith('```')) {
      if (!inCode) { flushText(); inCode = true; lang = line.slice(3).trim(); }
      else         { flushCode(); inCode = false; }
    } else if (inCode) {
      codeBuf.push(line);
    } else {
      textBuf.push(line);
    }
  });
  flushText();
  if (inCode) flushCode();
}

function showErr(msg) {
  const el = document.getElementById('pi-output');
  if (!el) return;
  el.innerHTML = '';
  const d = document.createElement('div');
  d.className = 'pi-error';
  d.textContent = '\u26a0 ' + msg;
  el.appendChild(d);
}

// ── EXTRACT CODE ──────────────────────────────────────────
function extractCode(text) {
  const lines = text.split('\n');
  let inCode  = false;
  let buf     = [];
  for (const line of lines) {
    if (line.startsWith('```') && !inCode) { inCode = true; continue; }
    if (line.startsWith('```') && inCode)  { break; }
    if (inCode) buf.push(line);
  }
  return buf.length ? buf.join('\n') : text;
}

// ── RUN VIA PISTON ────────────────────────────────────────
async function runPiston() {
  if (!lastCode) return;
  const runBtn = document.getElementById('pi-run-btn');
  const runOut = document.getElementById('pi-run-out');
  runBtn.disabled = true;
  runBtn.innerHTML = '<span class="pi-spin"></span> running...';
  runOut.textContent = '';

  try {
    const resp = await fetch(PISTON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'python', version: '3.10', files: [{ content: lastCode }] }),
    });
    const data   = await resp.json();
    const stdout = (data && data.run && data.run.stdout) || '';
    const stderr = (data && data.run && data.run.stderr) || '';
    const out    = (stdout + stderr).trim();

    if (stderr && stderr.indexOf('ModuleNotFoundError') !== -1) {
      runOut.style.color = '#FFD93D';
      runOut.textContent = '\u26a0 GPIO/hardware modules need a real Pi. Pure Python runs fine here.';
    } else if (out) {
      runOut.style.color = stderr ? '#FF4BCB' : '#00F6D6';
      runOut.textContent = out.slice(0, 300);
    } else {
      runOut.style.color = '#9090c0';
      runOut.textContent = '(no output)';
    }
  } catch(e) {
    runOut.style.color = '#FF4BCB';
    runOut.textContent = 'Piston error: ' + e.message;
  } finally {
    runBtn.disabled = false;
    runBtn.innerHTML = '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> run python';
  }
}

// ── COPY OUTPUT ───────────────────────────────────────────
function copyOutput() {
  const el  = document.getElementById('pi-output');
  const btn = document.getElementById('pi-copy-btn');
  if (!el) return;
  navigator.clipboard.writeText(el.innerText || '').then(() => {
    btn.textContent = 'copied!';
    setTimeout(() => btn.textContent = 'copy', 1400);
  });
}

// ── PARSE CARD FROM SCRIPT ────────────────────────────────
function parseCard(prompt, text) {
  const title = prompt.replace(/write a.*?that/i, '').replace(/beginner|python|script|raspberry pi/gi, '').trim().slice(0, 40) || prompt.slice(0, 40);

  let difficulty = 'Beginner';
  if (text.indexOf('Intermediate') !== -1) difficulty = 'Intermediate';
  if (text.indexOf('Advanced')     !== -1) difficulty = 'Advanced';

  let time_minutes = 15;
  const tMatch = text.match(/(\d+)\s*min/);
  if (tMatch) time_minutes = parseInt(tMatch[1]);

  const lines = text.split('\n');
  const components = [];
  let inComp = false;
  for (const line of lines) {
    if (line.indexOf('COMPONENTS NEEDED') !== -1) { inComp = true; continue; }
    if (inComp && line.trim() === '') { inComp = false; continue; }
    if (inComp) {
      const c = line.replace(/^[-*#\d.\s\u2022]+/, '').trim();
      if (c) components.push(c);
      if (components.length >= 6) inComp = false;
    }
  }

  const what_you_learn = [];
  let inLearn = false;
  for (const line of lines) {
    if (line.indexOf('WHAT YOU') !== -1 && line.indexOf('LEARN') !== -1) { inLearn = true; continue; }
    if (inLearn && line.trim() === '') { inLearn = false; continue; }
    if (inLearn) {
      const c = line.replace(/^[-*#\d.\s\u2022]+/, '').trim();
      if (c) what_you_learn.push(c);
      if (what_you_learn.length >= 4) inLearn = false;
    }
  }

  const desc = lines.find(l => l.trim() && !l.startsWith('#') && !l.startsWith('=') && l.length > 10) || prompt;

  return {
    id:            generateCardId('build'),
    type:          'build',
    title,
    author:        (state.user && state.user.email && state.user.email.split('@')[0]) || 'maker',
    description:   desc.slice(0, 80),
    platform:      'Raspberry Pi',
    language:      'Python',
    difficulty,
    time_minutes,
    components:    components.length ? components : ['Raspberry Pi', 'jumper wires'],
    what_you_learn: what_you_learn.length ? what_you_learn : ['Python basics', 'GPIO control'],
    next_steps:    [],
    code:          lastCode,
    image:         null,
    tags:          ['raspberry-pi', 'python', 'bloomslice'],
    created_at:    new Date().toISOString(),
  };
}

// ── CARD PREVIEW ──────────────────────────────────────────
async function renderCardPreview(build) {
  const preview = document.getElementById('pi-card-preview');
  if (!preview) return;
  try {
    const canvas = await renderBuildCard(build);
    canvas.style.cssText = 'width:100%;max-width:260px;border-radius:8px;display:block;margin:0 auto;';
    preview.innerHTML = '';
    preview.appendChild(canvas);
  } catch(e) {
    preview.innerHTML = '<div style="color:#9090c0;font-size:0.7rem;padding:20px;text-align:center">card preview failed</div>';
  }
}

// ── SAVE CARD ─────────────────────────────────────────────
async function saveCard() {
  if (!lastBuild) { setRunMsg('Generate a project first!', '#FFD93D'); return; }
  try {
    await dbSet('builds', { key: lastBuild.id, data: lastBuild });
    setRunMsg('\u2713 Saved \u2014 ' + lastBuild.id, '#00F6D6');
  } catch(e) {
    setRunMsg('\u26a0 IDB needs v7 upgrade for builds store', '#FF4BCB');
  }
}

// ── DOWNLOAD CARD PNG ─────────────────────────────────────
async function downloadCard() {
  if (!lastBuild) { setRunMsg('Generate a project first!', '#FFD93D'); return; }
  const canvas = await renderBuildCard(lastBuild);
  const link   = document.createElement('a');
  link.download = lastBuild.id + '.png';
  link.href     = canvas.toDataURL('image/png');
  link.click();
}

function setRunMsg(msg, color) {
  const el = document.getElementById('pi-run-out');
  if (!el) return;
  el.style.color  = color || '#9090c0';
  el.textContent  = msg;
}

// ── STYLES ────────────────────────────────────────────────
function injectPiStyles() {
  if (document.getElementById('pi-styles')) return;
  const s = document.createElement('style');
  s.id = 'pi-styles';
  s.textContent = [
    '#pi-wrap{display:flex;flex-direction:column;height:100%;overflow:hidden;background:var(--bg);font-family:var(--font-ui);}',
    '#pi-header{padding:10px 14px 8px;flex-shrink:0;border-bottom:1px solid var(--border);}',
    '#pi-title{font-family:var(--font-display);font-weight:800;font-size:1rem;background:linear-gradient(135deg,#FF4BCB,#00F6D6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:3px;}',
    '#pi-sky-msg{font-size:0.68rem;color:var(--subtext);line-height:1.5;}',
    '#pi-starters{display:flex;gap:6px;padding:8px 14px;overflow-x:auto;flex-shrink:0;border-bottom:1px solid var(--border);scrollbar-width:none;}',
    '#pi-starters::-webkit-scrollbar{display:none;}',
    '.pi-starter{display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 11px;background:var(--surface);border:1px solid var(--border);border-radius:10px;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all 0.15s;}',
    '.pi-starter:hover{border-color:#FF4BCB;transform:translateY(-1px);}',
    '.pi-starter-icon{font-size:1rem;}',
    '.pi-starter-label{font-size:0.6rem;color:var(--subtext);letter-spacing:0.06em;}',
    '#pi-panes{display:flex;flex:1;overflow:hidden;min-height:0;}',
    '#pi-left{flex:1.4;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid var(--border);min-width:0;}',
    '#pi-right{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;}',
    '.pi-pane-label{display:flex;align-items:center;justify-content:space-between;padding:5px 12px;font-size:0.6rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--subtext);border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0;}',
    '.pi-pane-action{background:none;border:none;color:var(--subtext);font-family:var(--font-ui);font-size:0.65rem;cursor:pointer;padding:2px 6px;border-radius:4px;transition:all 0.15s;}',
    '.pi-pane-action:hover{color:var(--text);background:var(--muted);}',
    '#pi-output{flex:1;overflow-y:auto;padding:12px;font-size:0.75rem;line-height:1.65;scrollbar-width:thin;scrollbar-color:var(--muted) transparent;}',
    '#pi-output-ph{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--subtext);opacity:0.4;font-size:0.68rem;text-align:center;padding:20px;}',
    '.pi-code-wrap{position:relative;margin:6px 0;border-radius:6px;overflow:hidden;border:1px solid var(--border);}',
    '.pi-lang-badge{position:absolute;top:0;right:0;background:var(--muted);color:var(--subtext);font-size:0.56rem;letter-spacing:0.1em;padding:2px 7px;border-bottom-left-radius:5px;}',
    '.pi-code-block{margin:0;padding:10px;background:var(--surface);overflow-x:auto;font-family:"JetBrains Mono","DM Mono",monospace;font-size:0.7rem;line-height:1.6;color:var(--text);}',
    '.pi-prose{color:var(--text);margin:3px 0;line-height:1.65;}',
    '.pi-prose:empty{display:none;}',
    '.pi-error{color:#FF4BCB;font-size:0.75rem;padding:10px;background:rgba(255,75,203,0.08);border:1px solid rgba(255,75,203,0.2);border-radius:6px;}',
    '#pi-card-preview{flex:1;overflow-y:auto;padding:10px 6px;display:flex;flex-direction:column;align-items:center;scrollbar-width:thin;}',
    '#pi-action-bar{display:flex;align-items:center;gap:8px;padding:7px 14px;border-top:1px solid var(--border);background:var(--bg);flex-shrink:0;flex-wrap:wrap;}',
    '#pi-run-btn{display:flex;align-items:center;gap:5px;padding:6px 11px;background:var(--surface);border:1px solid #00F6D6;border-radius:8px;color:#00F6D6;font-family:var(--font-ui);font-size:0.67rem;letter-spacing:0.06em;cursor:pointer;transition:all 0.15s;white-space:nowrap;}',
    '#pi-run-btn:hover{background:rgba(0,246,214,0.08);}',
    '#pi-run-btn:disabled{opacity:0.5;cursor:not-allowed;}',
    '#pi-run-out{flex:1;font-size:0.67rem;color:var(--subtext);font-family:"DM Mono",monospace;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '#pi-save-btn{padding:6px 11px;background:linear-gradient(135deg,#FF4BCB,#7c6af7);border:none;border-radius:8px;color:#fff;font-family:var(--font-ui);font-size:0.67rem;cursor:pointer;white-space:nowrap;transition:opacity 0.15s;}',
    '#pi-save-btn:hover{opacity:0.85;}',
    '#pi-footer{display:flex;align-items:flex-end;gap:8px;padding:8px 14px calc(8px + var(--safe-bot,0px));border-top:1px solid var(--border);background:var(--bg);flex-shrink:0;}',
    '#pi-prompt{flex:1;resize:none;background:var(--surface);border:1px solid var(--border);border-radius:12px;color:var(--text);font-family:var(--font-ui);font-size:0.78rem;line-height:1.5;padding:8px 12px;outline:none;transition:border-color 0.2s;max-height:100px;overflow-y:auto;}',
    '#pi-prompt:focus{border-color:#FF4BCB;}',
    '#pi-prompt::placeholder{color:var(--subtext);}',
    '#pi-gen-btn{display:flex;align-items:center;gap:5px;padding:8px 13px;background:#FF4BCB;border:none;border-radius:12px;color:#fff;font-family:var(--font-ui);font-size:0.73rem;font-weight:600;letter-spacing:0.06em;cursor:pointer;white-space:nowrap;transition:opacity 0.2s;flex-shrink:0;}',
    '#pi-gen-btn:hover{opacity:0.85;}',
    '#pi-gen-btn:disabled{opacity:0.5;cursor:not-allowed;}',
    '#pi-thinking{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;}',
    '.pi-spin-lg{width:24px;height:24px;border:2px solid rgba(255,75,203,0.2);border-top-color:#FF4BCB;border-radius:50%;animation:piSpin 0.7s linear infinite;}',
    '.pi-think-txt{font-size:0.63rem;letter-spacing:0.1em;color:var(--subtext);animation:piPulse 1.5s ease-in-out infinite;}',
    '.pi-spin{display:inline-block;width:10px;height:10px;border:1.5px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:piSpin 0.7s linear infinite;}',
    '@keyframes piSpin{to{transform:rotate(360deg);}}',
    '@keyframes piPulse{0%,100%{opacity:0.4;}50%{opacity:1;}}',
    '@media(max-width:640px){#pi-panes{flex-direction:column;}#pi-left{flex:none;height:55%;border-right:none;border-bottom:1px solid var(--border);}#pi-right{flex:none;height:45%;}}'
  ].join('');
  document.head.appendChild(s);
}
