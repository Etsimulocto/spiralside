// ============================================================
// SPIRALSIDE — PI VIEW v1.0
// Bloomslice Studio — maker/STEM tab
// Nimbis anchor: js/app/views/pi.js
// ============================================================

import { state }               from '../state.js';
import { selectedModel, toggleInputMenu, MODELS } from '../models.js';
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
  // LEFT COLUMN
  const colLeft = document.createElement('div');
  colLeft.id = 'pi-col-left';

  const title = document.createElement('div');
  title.id = 'pi-title';
  title.textContent = 'Bloomslice Studio';
  colLeft.appendChild(title);

  const startersLabel = document.createElement('div');
  startersLabel.className = 'pi-col-label';
  startersLabel.textContent = 'starters';
  colLeft.appendChild(startersLabel);

  const starters = document.createElement('div');
  starters.id = 'pi-starters';
  STARTERS.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'pi-starter';
    btn.dataset.prompt = s.prompt;
    const icon = document.createElement('span');
    icon.className = 'pi-starter-icon';
    icon.textContent = s.icon;
    const lbl = document.createElement('span');
    lbl.className = 'pi-starter-label';
    lbl.textContent = s.label;
    btn.appendChild(icon);
    btn.appendChild(lbl);
    starters.appendChild(btn);
  });
  colLeft.appendChild(starters);

  const actLabel = document.createElement('div');
  actLabel.className = 'pi-col-label';
  actLabel.textContent = 'actions';
  colLeft.appendChild(actLabel);

  const actions = document.createElement('div');
  actions.id = 'pi-actions';

  const runBtn = document.createElement('button');
  runBtn.id = 'pi-run-btn';
  runBtn.innerHTML = '<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> run python';
  actions.appendChild(runBtn);

  const saveBtn = document.createElement('button');
  saveBtn.id = 'pi-save-btn';
  saveBtn.textContent = 'save build card';
  actions.appendChild(saveBtn);

  const copyBtn = document.createElement('button');
  copyBtn.id = 'pi-copy-btn';
  copyBtn.textContent = 'copy output';
  actions.appendChild(copyBtn);

  const dlBtn = document.createElement('button');
  dlBtn.id = 'pi-dl-btn';
  dlBtn.textContent = 'save PNG';
  actions.appendChild(dlBtn);

  colLeft.appendChild(actions);

  const bckLabel = document.createElement('div');
  bckLabel.className = 'pi-col-label';
  bckLabel.textContent = 'saved cards';
  colLeft.appendChild(bckLabel);

  const bckList = document.createElement('div');
  bckList.id = 'pi-bck-list';
  const bckPh = document.createElement('div');
  bckPh.className = 'pi-bck-ph';
  bckPh.textContent = 'no cards yet';
  bckList.appendChild(bckPh);
  colLeft.appendChild(bckList);

  const cardColLabel = document.createElement('div');
  cardColLabel.className = 'pi-col-label';
  cardColLabel.textContent = 'build card';
  colLeft.appendChild(cardColLabel);

  const cardPrev = document.createElement('div');
  cardPrev.id = 'pi-card-preview';
  const cardPh = document.createElement('div');
  cardPh.id = 'pi-card-ph';
  cardPh.style.cssText = 'opacity:0.3;font-size:0.65rem;color:var(--subtext);text-align:center;padding:12px 4px;';
  cardPh.textContent = 'BCK-???? — card appears after generation';
  cardPrev.appendChild(cardPh);
  colLeft.appendChild(cardPrev);

  wrap.appendChild(colLeft);

  // RIGHT COLUMN
  const colRight = document.createElement('div');
  colRight.id = 'pi-col-right';

  const outWrap = document.createElement('div');
  outWrap.id = 'pi-out-wrap';

  const outLabel = document.createElement('div');
  outLabel.className = 'pi-pane-label';
  outLabel.textContent = 'output';
  outWrap.appendChild(outLabel);

  const output = document.createElement('div');
  output.id = 'pi-output';
  const outPh = document.createElement('div');
  outPh.id = 'pi-output-ph';
  const phTxt = document.createElement('div');
  phTxt.textContent = 'pick a starter or describe your project';
  outPh.appendChild(phTxt);
  output.appendChild(outPh);
  outWrap.appendChild(output);

  const runOut = document.createElement('div');
  runOut.id = 'pi-run-out';
  outWrap.appendChild(runOut);

  colRight.appendChild(outWrap);

  const consoleEl = document.createElement('div');
  consoleEl.id = 'pi-console';

  // model indicator bar — matches chat
  const indicator = document.createElement('div');
  indicator.id = 'pi-model-indicator';
  const indLabel = document.createElement('span');
  indLabel.id = 'pi-model-label';
  const m = MODELS[selectedModel];
  indLabel.textContent = m ? m.label.toLowerCase() : 'sky / 4o';
  const indDot = document.createElement('span');
  indDot.id = 'pi-model-dot';
  indicator.appendChild(indLabel);
  indicator.appendChild(indDot);
  consoleEl.appendChild(indicator);

  // input row — matches chat layout
  const inputRow = document.createElement('div');
  inputRow.id = 'pi-input-row';

  // plus button — opens shared options panel
  const plusBtn = document.createElement('button');
  plusBtn.id = 'pi-plus-btn';
  plusBtn.title = 'models + options';
  plusBtn.innerHTML = '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  plusBtn.onclick = function(e) { e.stopPropagation(); toggleInputMenu(); };
  inputRow.appendChild(plusBtn);

  const ta = document.createElement('textarea');
  ta.id = 'pi-prompt';
  ta.rows = 1;
  ta.placeholder = 'what do you want to build?';
  ta.spellcheck = false;
  inputRow.appendChild(ta);

  const genBtn = document.createElement('button');
  genBtn.id = 'pi-gen-btn';
  genBtn.title = 'generate';
  genBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 5 C50 5 55 40 70 50 C55 60 50 95 50 95 C50 95 45 60 30 50 C45 40 50 5 50 5Z" fill="currentColor"/></svg>';
  inputRow.appendChild(genBtn);

  consoleEl.appendChild(inputRow);
  colRight.appendChild(consoleEl);

  wrap.appendChild(colRight);
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
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
  });
  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); }
  });

  document.getElementById('pi-gen-btn').addEventListener('click', generate);
  refreshBckList();
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

    const resp = await fetch('https://web-production-4e6f3.up.railway.app/pi', {
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

  function _md(t) {
    return t.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code style="background:var(--surface);padding:1px 4px;border-radius:3px;font-size:0.85em">$1</code>');
  }
  function flushText() {
    if (!textBuf.length) return;
    textBuf.forEach(line => {
      if (!line.trim()) return;
      const d = document.createElement('div');
      if (line.startsWith('### ')) { d.className='pi-h3'; d.innerHTML=_md(line.slice(4)); }
      else if (line.startsWith('## ')) { d.className='pi-h2'; d.innerHTML=_md(line.slice(3)); }
      else if (line.startsWith('# ')) { d.className='pi-h1'; d.innerHTML=_md(line.slice(2)); }
      else if (line.match(/^[-*] /)) { d.className='pi-li'; d.innerHTML=_md(line.slice(2)); }
      else { d.className='pi-prose'; d.innerHTML=_md(line); }
      el.appendChild(d);
    });
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
    setRunMsg('Saved ' + lastBuild.id, '#00F6D6');
    refreshBckList();
  } catch(e) {
    // IDB v6 lacks builds store -- show card inline in left panel anyway
    _addBckCard(lastBuild);
    setRunMsg('Shown in panel (save needs IDB v7)', '#FFD93D');
  }
}

function _addBckCard(build) {
  const list = document.getElementById('pi-bck-list');
  if (!list) return;
  const ph = list.querySelector('.pi-bck-ph');
  if (ph) ph.remove();
  const card = document.createElement('div');
  card.className = 'pi-bck-card';
  const idEl = document.createElement('div');
  idEl.className = 'pi-bck-id';
  idEl.textContent = build.id;
  const nameEl = document.createElement('div');
  nameEl.className = 'pi-bck-name';
  nameEl.textContent = build.title || build.id;
  card.appendChild(idEl);
  card.appendChild(nameEl);
  card.onclick = function() { renderCardPreview(build); };
  list.insertBefore(card, list.firstChild);
}

async function refreshBckList() {
  try {
    const all = await dbGetAll('builds');
    const list = document.getElementById('pi-bck-list');
    if (!list) return;
    list.innerHTML = '';
    if (!all || !all.length) {
      const ph = document.createElement('div');
      ph.className = 'pi-bck-ph';
      ph.textContent = 'no cards yet';
      list.appendChild(ph);
      return;
    }
    all.slice().reverse().forEach(item => {
      const b = item.data || item;
      _addBckCard(b);
    });
  } catch(e) { /* builds store not yet in IDB */ }
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
    '#pi-wrap{display:flex;flex-direction:row;height:100%;overflow:hidden;background:var(--bg);font-family:var(--font-ui);}',
    '#pi-output{flex:1;overflow-y:auto;padding:12px;font-size:0.75rem;line-height:1.65;scrollbar-width:thin;scrollbar-color:var(--muted) transparent;}',
    '#pi-output-ph{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--subtext);opacity:0.4;font-size:0.68rem;text-align:center;padding:20px;}',
    '.pi-code-wrap{position:relative;margin:6px 0;border-radius:6px;overflow:hidden;border:1px solid var(--border);}',
    '.pi-lang-badge{position:absolute;top:0;right:0;background:var(--muted);color:var(--subtext);font-size:0.56rem;letter-spacing:0.1em;padding:2px 7px;border-bottom-left-radius:5px;}',
    '.pi-code-block{margin:0;padding:10px;background:var(--surface);overflow-x:auto;font-family:"JetBrains Mono","DM Mono",monospace;font-size:0.7rem;line-height:1.6;color:var(--text);}',
    '.pi-error{color:#FF4BCB;font-size:0.75rem;padding:10px;background:rgba(255,75,203,0.08);border:1px solid rgba(255,75,203,0.2);border-radius:6px;}',
                '.pi-spin-lg{width:24px;height:24px;border:2px solid rgba(255,75,203,0.2);border-top-color:#FF4BCB;border-radius:50%;animation:piSpin 0.7s linear infinite;}',
    '.pi-think-txt{font-size:0.63rem;letter-spacing:0.1em;color:var(--subtext);animation:piPulse 1.5s ease-in-out infinite;}',
    '.pi-spin{display:inline-block;width:10px;height:10px;border:1.5px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:piSpin 0.7s linear infinite;}',
    '@keyframes piSpin{to{transform:rotate(360deg);}}',
    '@keyframes piPulse{0%,100%{opacity:0.4;}50%{opacity:1;}}',
    '#pi-col-left{width:220px;flex-shrink:0;display:flex;flex-direction:column;border-right:1px solid var(--border);overflow-y:auto;padding:12px 10px;}',
    '#pi-col-right{flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;}',
    '#pi-out-wrap{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:8px;min-height:0;}',
    '#pi-starters{display:flex;flex-direction:column;gap:4px;margin-bottom:6px;}',
    '.pi-starter{display:flex;align-items:center;gap:7px;padding:7px 9px;background:var(--bg);border:1px solid var(--border);border-radius:7px;cursor:pointer;text-align:left;width:100%;transition:border-color 0.15s;}',
    '.pi-starter:hover{border-color:var(--teal);}',
    '.pi-starter-icon{font-size:0.9rem;flex-shrink:0;}',
    '.pi-starter-label{font-size:0.72rem;color:var(--text);font-family:var(--font-ui);}',
    '#pi-actions{display:flex;flex-direction:column;gap:4px;margin-bottom:6px;}',
    '#pi-actions button{padding:7px 9px;background:var(--bg);border:1px solid var(--border);border-radius:7px;color:var(--subtext);font-family:var(--font-ui);font-size:0.72rem;cursor:pointer;text-align:left;width:100%;transition:all 0.15s;}',
    '#pi-actions button:hover{border-color:var(--teal);color:var(--teal);}',
    '#pi-run-btn{color:var(--teal) !important;border-color:rgba(0,246,214,0.4) !important;}',
    '#pi-save-btn{color:var(--pink) !important;border-color:rgba(255,75,203,0.4) !important;}',
    '.pi-col-label{font-size:0.58rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--subtext);padding:8px 2px 4px;font-family:var(--font-ui);}',
    '#pi-title{font-family:var(--font-display);font-size:0.75rem;font-weight:700;color:var(--teal);letter-spacing:0.06em;padding-bottom:10px;border-bottom:1px solid var(--border);margin-bottom:8px;}',
    '#pi-bck-list{display:flex;flex-direction:column;gap:4px;}',
    '.pi-bck-card{background:var(--bg);border:1px solid var(--border);border-radius:7px;padding:7px 9px;cursor:pointer;transition:border-color 0.15s;}',
    '.pi-bck-card:hover{border-color:var(--teal);}',
    '.pi-bck-id{font-size:0.6rem;color:var(--teal);letter-spacing:0.05em;}',
    '.pi-bck-name{font-size:0.72rem;color:var(--text);font-family:var(--font-ui);}',
    '.pi-bck-ph{font-size:0.65rem;color:var(--subtext);opacity:0.5;padding:4px 2px;}',
    '#pi-run-out{font-size:0.72rem;color:var(--teal);font-family:var(--font-mono);padding:4px 0;min-height:0;}',
    '#pi-output{flex:1;font-size:0.82rem;line-height:1.7;color:var(--text);font-family:var(--font-ui);}',
    '.pi-pane-label{font-size:0.58rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--subtext);padding:4px 0 6px;font-family:var(--font-ui);}',
    '#pi-card-preview{padding:4px 0;overflow:hidden;}',
    '#pi-card-preview canvas{width:100% !important;max-width:200px;border-radius:8px;display:block;margin:0 auto;}',
    '#pi-console{flex-shrink:0;border-top:1px solid var(--border);background:var(--surface);}',
    '#pi-model-indicator{display:flex;align-items:center;gap:6px;padding:6px 14px 0;font-size:0.6rem;color:var(--subtext);font-family:var(--font-ui);}',
    '#pi-model-dot{width:6px;height:6px;border-radius:50%;background:var(--teal);flex-shrink:0;}',
    '#pi-input-row{display:flex;align-items:flex-end;gap:8px;padding:8px 10px 10px;width:100%;}',
    '#pi-plus-btn{width:34px;height:34px;border-radius:50%;border:1px solid var(--border);background:transparent;color:var(--subtext);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all 0.15s;}',
    '#pi-plus-btn:hover{border-color:var(--teal);color:var(--teal);}',
    '#pi-plus-btn.active{border-color:var(--teal);color:var(--teal);background:rgba(0,246,214,0.08);}',
    '#pi-prompt{flex:1;min-height:38px;max-height:120px;resize:none;background:var(--bg);border:1px solid var(--border);border-radius:20px;padding:9px 14px;color:var(--text);font-family:var(--font-ui);font-size:0.85rem;outline:none;line-height:1.5;overflow-y:auto;}',
    '#pi-prompt:focus{border-color:var(--teal);}',
    '#pi-gen-btn{width:34px;height:34px;border-radius:50%;border:none;background:linear-gradient(135deg,var(--teal),var(--purple));color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:opacity 0.15s;}',
    '#pi-gen-btn:hover{opacity:0.85;}',
    '.pi-h1{font-size:0.82rem;font-weight:700;color:var(--teal);margin:8px 0 2px;font-family:var(--font-display);}',
    '.pi-h2{font-size:0.76rem;font-weight:700;color:var(--text);margin:6px 0 2px;padding-bottom:2px;border-bottom:1px solid var(--border);}',
    '.pi-h3{font-size:0.7rem;font-weight:600;color:var(--subtext);margin:4px 0 1px;letter-spacing:0.03em;}',
    '.pi-li{font-size:0.71rem;color:var(--text);padding:1px 0 1px 10px;position:relative;line-height:1.5;}',
    '.pi-li::before{content:chr(34)chr(183)chr(34);position:absolute;left:2px;color:var(--teal);}',
    '.pi-prose{font-size:0.71rem;color:var(--text);margin:1px 0;line-height:1.55;}',
    '.pi-prose:empty{display:none;}',
    '@media(max-width:640px){#pi-panes{flex-direction:column;}#pi-left{flex:none;height:55%;border-right:none;border-bottom:1px solid var(--border);}#pi-right{flex:none;height:45%;}}'
  ].join('');
  document.head.appendChild(s);
}
