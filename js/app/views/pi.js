// ============================================================
// SPIRALSIDE — PI VIEW v1.2
// Bloomslice Studio — maker/STEM tab + GPIO Patchbay (inline fields)
// Nimbis anchor: js/app/views/pi.js
// ============================================================

import { state }               from '../state.js';
import { selectedModel, toggleInputMenu, MODELS } from '../models.js';
import { renderBuildCard,
         generateCardId }      from '../card.js';
import { dbSet, dbGetAll }     from '../db.js';

const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

const STARTERS = [
  { icon: '🔴', label: 'Blink LED',    prompt: 'Write a beginner Raspberry Pi Python script that blinks an LED on GPIO 17 every second. Include full educational format with wiring diagram.' },
  { icon: '📡', label: 'Read Sensor',  prompt: 'Write a beginner Raspberry Pi Python script that reads temperature from a DHT11 sensor on GPIO 4. Include full educational format.' },
  { icon: '🌐', label: 'Web Server',   prompt: 'Write a beginner Raspberry Pi Python script that creates a simple Flask web server on port 5000. Include full educational format.' },
  { icon: '📷', label: 'Camera Snap', prompt: 'Write a beginner Raspberry Pi Python script that takes a photo with picamera2 and saves it. Include full educational format.' },
  { icon: '🎛️', label: 'Servo',        prompt: 'Write a beginner Raspberry Pi Python script that sweeps a servo on GPIO 18 using PWM. Include full educational format.' },
  { icon: '📊', label: 'Data Logger', prompt: 'Write a beginner Raspberry Pi Python script that logs CPU temperature to a CSV every 5 seconds. Include full educational format.' },
];

let initialized = false;
let isRunning   = false;
let lastCode    = '';
let lastBuild   = null;

// ── GPIO PATCHBAY DATA ────────────────────────────────────
const PB_PINS = [
  {num:1,  name:'3.3V',   type:'pwr33'},
  {num:2,  name:'5V',     type:'pwr5'},
  {num:3,  name:'GPIO 2', type:'i2c',  alt:'SDA1'},
  {num:4,  name:'5V',     type:'pwr5'},
  {num:5,  name:'GPIO 3', type:'i2c',  alt:'SCL1'},
  {num:6,  name:'GND',    type:'gnd'},
  {num:7,  name:'GPIO 4', type:'gpio', alt:'GPCLK0'},
  {num:8,  name:'GPIO14', type:'uart', alt:'TXD0'},
  {num:9,  name:'GND',    type:'gnd'},
  {num:10, name:'GPIO15', type:'uart', alt:'RXD0'},
  {num:11, name:'GPIO17', type:'gpio'},
  {num:12, name:'GPIO18', type:'gpio', alt:'PCM_CLK'},
  {num:13, name:'GPIO27', type:'gpio'},
  {num:14, name:'GND',    type:'gnd'},
  {num:15, name:'GPIO22', type:'gpio'},
  {num:16, name:'GPIO23', type:'gpio'},
  {num:17, name:'3.3V',   type:'pwr33'},
  {num:18, name:'GPIO24', type:'gpio'},
  {num:19, name:'GPIO10', type:'spi',  alt:'MOSI'},
  {num:20, name:'GND',    type:'gnd'},
  {num:21, name:'GPIO 9', type:'spi',  alt:'MISO'},
  {num:22, name:'GPIO25', type:'gpio'},
  {num:23, name:'GPIO11', type:'spi',  alt:'SCLK'},
  {num:24, name:'GPIO 8', type:'spi',  alt:'CE0'},
  {num:25, name:'GND',    type:'gnd'},
  {num:26, name:'GPIO 7', type:'spi',  alt:'CE1'},
  {num:27, name:'ID_SD',  type:'i2c',  alt:'EEPROM'},
  {num:28, name:'ID_SC',  type:'i2c',  alt:'EEPROM'},
  {num:29, name:'GPIO 5', type:'gpio'},
  {num:30, name:'GND',    type:'gnd'},
  {num:31, name:'GPIO 6', type:'gpio'},
  {num:32, name:'GPIO12', type:'gpio', alt:'PWM0'},
  {num:33, name:'GPIO13', type:'gpio', alt:'PWM1'},
  {num:34, name:'GND',    type:'gnd'},
  {num:35, name:'GPIO19', type:'spi',  alt:'MISO1'},
  {num:36, name:'GPIO16', type:'gpio'},
  {num:37, name:'GPIO26', type:'gpio'},
  {num:38, name:'GPIO20', type:'spi',  alt:'MOSI1'},
  {num:39, name:'GND',    type:'gnd'},
  {num:40, name:'GPIO21', type:'spi',  alt:'SCLK1'},
];
const PB_COLORS = {pwr33:'#e04444',pwr5:'#c44444',gnd:'#555',gpio:'#2b7fd4',i2c:'#7b4fc9',spi:'#7b4fc9',uart:'#1a9e6a'};
// Common wire colors for quick selection
const PB_WIRE_PRESETS = [
  {name:'red',    hex:'#e03030'},
  {name:'black',  hex:'#222222'},
  {name:'white',  hex:'#eeeeee'},
  {name:'yellow', hex:'#f0c020'},
  {name:'orange', hex:'#f07820'},
  {name:'green',  hex:'#28a040'},
  {name:'blue',   hex:'#2060d0'},
  {name:'purple', hex:'#8040c0'},
  {name:'brown',  hex:'#7a4010'},
  {name:'gray',   hex:'#888888'},
];
let pbOpen = false;

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
  // ── LEFT COLUMN ──
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

  const saveJsonBtn = document.createElement('button');
  saveJsonBtn.id = 'pi-save-json-btn';
  saveJsonBtn.textContent = 'save project JSON';
  actions.appendChild(saveJsonBtn);

  const loadJsonBtn = document.createElement('button');
  loadJsonBtn.id = 'pi-load-json-btn';
  loadJsonBtn.textContent = 'load project JSON';
  actions.appendChild(loadJsonBtn);

  const loadJsonInput = document.createElement('input');
  loadJsonInput.id = 'pi-load-json-input';
  loadJsonInput.type = 'file';
  loadJsonInput.accept = '.json';
  loadJsonInput.style.display = 'none';
  actions.appendChild(loadJsonInput);

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

  // ── RIGHT COLUMN ──
  const colRight = document.createElement('div');
  colRight.id = 'pi-col-right';

  // Output area
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

  // ── PATCHBAY PANEL ── collapsible, inline fields, no modal
  const pbPanel = document.createElement('div');
  pbPanel.id = 'pi-pb-panel';

  // header with toggle
  const pbHeader = document.createElement('div');
  pbHeader.id = 'pi-pb-header';

  const pbTitleEl = document.createElement('span');
  pbTitleEl.id = 'pi-pb-title';
  pbTitleEl.innerHTML = '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:5px;"><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>gpio patchbay';
  pbHeader.appendChild(pbTitleEl);

  const pbToggle = document.createElement('button');
  pbToggle.id = 'pi-pb-toggle';
  pbToggle.textContent = 'show';
  pbHeader.appendChild(pbToggle);

  pbPanel.appendChild(pbHeader);

  // body — fixed height, scrollable
  const pbBody = document.createElement('div');
  pbBody.id = 'pi-pb-body';
  pbBody.style.display = 'none';

  // column header row
  const pbColHdr = document.createElement('div');
  pbColHdr.id = 'pi-pb-col-hdr';
  pbColHdr.innerHTML = '<span></span><span>pin</span><span>connected to</span><span>to pin #</span><span>note</span><span>wire</span>';
  pbBody.appendChild(pbColHdr);

  // scrollable pin list
  const pbScroll = document.createElement('div');
  pbScroll.id = 'pi-pb-scroll';

  // one row per pin (all 40)
  PB_PINS.forEach(function(pin) {
    const row = document.createElement('div');
    row.className = 'pb-row';
    row.dataset.pin = pin.num;

    // colored dot with pin number
    const dot = document.createElement('div');
    dot.className = 'pb-dot';
    dot.style.background = PB_COLORS[pin.type] || '#2b7fd4';
    dot.title = pin.name + (pin.alt ? ' / ' + pin.alt : '');
    dot.textContent = pin.num;
    row.appendChild(dot);

    // pin name label (fixed, not editable)
    const pinName = document.createElement('div');
    pinName.className = 'pb-pin-name';
    pinName.textContent = pin.alt || pin.name;
    pinName.title = pin.name;
    row.appendChild(pinName);

    // "connected to" — what component/wire is on this pin
    const inLabel = document.createElement('input');
    inLabel.className = 'pb-in pb-in-label';
    inLabel.placeholder = 'component...';
    inLabel.dataset.field = 'label';
    inLabel.dataset.pin   = pin.num;
    row.appendChild(inLabel);

    // "to pin #" on the other device
    const inToPin = document.createElement('input');
    inToPin.className = 'pb-in pb-in-topin';
    inToPin.placeholder = 'e.g. D4';
    inToPin.dataset.field = 'topin';
    inToPin.dataset.pin   = pin.num;
    row.appendChild(inToPin);

    // wire color — one swatch box, click opens body-level popover (avoids clip)
    const colorWrap = document.createElement('div');
    colorWrap.className = 'pb-color-wrap';

    // hidden value store
    const inColorHidden = document.createElement('input');
    inColorHidden.type = 'hidden';
    inColorHidden.className = 'pb-color-native';
    inColorHidden.dataset.pin = pin.num;
    inColorHidden.value = '';
    colorWrap.appendChild(inColorHidden);

    // the single visible swatch box
    const colorBox = document.createElement('div');
    colorBox.className = 'pb-color-box';
    colorBox.title = 'pick wire color';
    colorWrap.appendChild(colorBox);

    // popover lives on body so it's never clipped by scroll containers
    const popover = document.createElement('div');
    popover.className = 'pb-color-pop';
    PB_WIRE_PRESETS.forEach(function(p) {
      const chip = document.createElement('div');
      chip.className = 'pb-color-chip';
      chip.style.background = p.hex;
      chip.title = p.name;
      chip.addEventListener('mousedown', function(e) {
        e.preventDefault(); e.stopPropagation();
        if (inColorHidden.value === p.name) {
          inColorHidden.value = '';
          colorBox.style.background = '';
          colorBox.classList.remove('pb-color-box-set');
        } else {
          inColorHidden.value = p.name;
          colorBox.style.background = p.hex;
          colorBox.classList.add('pb-color-box-set');
        }
        pbCloseColorPop();
      });
      popover.appendChild(chip);
    });
    document.body.appendChild(popover);

    // open: position popover centered on screen, high z-index
    colorBox.addEventListener('click', function(e) {
      e.stopPropagation();
      pbCloseColorPop();
      const r = colorBox.getBoundingClientRect();
      const pw   = 244; // approx popover width
      const right = window.innerWidth - r.right; // distance from viewport right
      const top   = r.top - 38;
      popover.style.right = Math.max(4, right) + 'px';
      popover.style.left  = 'auto';
      popover.style.top   = top + 'px';
      popover._owner = colorBox;
      popover.classList.add('pb-color-pop-open');
    });

    // note (before color so it renders in correct column order)
    const inNote = document.createElement('input');
    inNote.className = 'pb-in pb-in-note';
    inNote.placeholder = 'note...';
    inNote.dataset.field = 'note';
    inNote.dataset.pin   = pin.num;
    row.appendChild(inNote);

    row.appendChild(colorWrap);

    pbScroll.appendChild(row);
  });

  pbBody.appendChild(pbScroll);
  pbPanel.appendChild(pbBody);
  colRight.appendChild(pbPanel);

  // ── CHAT CONSOLE ──
  const consoleEl = document.createElement('div');
  consoleEl.id = 'pi-console';

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

  const inputRow = document.createElement('div');
  inputRow.id = 'pi-input-row';

  const plusBtn = document.createElement('button');
  plusBtn.id = 'pi-plus-btn';
  plusBtn.title = 'models + options';
  plusBtn.innerHTML = '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  plusBtn.onclick = function(e) { e.stopPropagation(); toggleInputMenu(e.currentTarget); };
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

  // patchbay toggle — show/hide body
  // Save project as JSON file
  document.getElementById('pi-save-json-btn').addEventListener('click', saveProjectJSON);

  // Load project from JSON file
  document.getElementById('pi-load-json-btn').addEventListener('click', function() {
    document.getElementById('pi-load-json-input').click();
  });
  document.getElementById('pi-load-json-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      try {
        const proj = JSON.parse(ev.target.result);
        loadProjectJSON(proj);
      } catch(err) {
        setRunMsg('Invalid JSON file', '#FF4BCB');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('pi-pb-toggle').addEventListener('click', function() {
    pbOpen = !pbOpen;
    document.getElementById('pi-pb-body').style.display = pbOpen ? 'block' : 'none';
    this.textContent = pbOpen ? 'hide' : 'show';
  });

  // close any open color popovers when clicking elsewhere
  document.addEventListener('click', function() { pbCloseColorPop(); });
}

// closes the open color popover (body-level, shared across all rows)
function pbCloseColorPop() {
  document.querySelectorAll('.pb-color-pop-open').forEach(function(el) {
    el.classList.remove('pb-color-pop-open');
  });
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
  genBtn.innerHTML = '<span class="pi-spin"></span>';

  const thinking = document.createElement('div');
  thinking.id = 'pi-thinking';
  thinking.innerHTML = '<div class="pi-spin-lg"></div><div class="pi-think-txt">Sky is writing your project...</div>';
  outEl.innerHTML = '';
  outEl.appendChild(thinking);

  try {
    const token = state.session && state.session.access_token;
    if (!token) { showErr('Please sign in.'); return; }

    const ctx = pbContextString();
    const fullPrompt = ctx ? prompt + '\n\n[WIRING CONTEXT]\n' + ctx : prompt;

    // Read selected model and update indicator
    const model = selectedModel || 'sky-4o';
    const mInfo = MODELS[model];
    const labelEl = document.getElementById('pi-model-label');
    if (labelEl && mInfo) labelEl.textContent = mInfo.label.toLowerCase();

    const resp = await fetch('https://web-production-4e6f3.up.railway.app/pi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ prompt: fullPrompt, model: model }),
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
    genBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 5 C50 5 55 40 70 50 C55 60 50 95 50 95 C50 95 45 60 30 50 C45 40 50 5 50 5Z" fill="currentColor"/></svg>';
  }
}

// ── RENDER OUTPUT ─────────────────────────────────────────
function renderOutput(el, text) {
  el.innerHTML = '';
  const lines  = text.split('\n');
  let inCode = false, lang = '', codeBuf = [], textBuf = [];

  function _md(t) {
    return t.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code style="background:var(--surface);padding:1px 4px;border-radius:3px;font-size:0.85em">$1</code>');
  }
  function flushText() {
    if (!textBuf.length) return;
    textBuf.forEach(line => {
      if (!line.trim()) return;
      const d = document.createElement('div');
      if      (line.startsWith('### ')) { d.className='pi-h3'; d.innerHTML=_md(line.slice(4)); }
      else if (line.startsWith('## '))  { d.className='pi-h2'; d.innerHTML=_md(line.slice(3)); }
      else if (line.startsWith('# '))   { d.className='pi-h1'; d.innerHTML=_md(line.slice(2)); }
      else if (line.match(/^[-*] /))    { d.className='pi-li'; d.innerHTML=_md(line.slice(2)); }
      else                               { d.className='pi-prose'; d.innerHTML=_md(line); }
      el.appendChild(d);
    });
    textBuf = [];
  }
  function flushCode() {
    if (!codeBuf.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'pi-code-wrap';
    if (lang) { const badge = document.createElement('span'); badge.className='pi-lang-badge'; badge.textContent=lang; wrap.appendChild(badge); }
    const pre = document.createElement('pre'); pre.className='pi-code-block';
    const code = document.createElement('code'); code.textContent=codeBuf.join('\n'); pre.appendChild(code);
    wrap.appendChild(pre); el.appendChild(wrap);
    codeBuf = []; lang = '';
  }
  lines.forEach(line => {
    if (line.startsWith('```')) {
      if (!inCode) { flushText(); inCode=true; lang=line.slice(3).trim(); }
      else         { flushCode(); inCode=false; }
    } else if (inCode) { codeBuf.push(line); }
    else               { textBuf.push(line); }
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

function extractCode(text) {
  const lines = text.split('\n');
  let inCode = false, buf = [];
  for (const line of lines) {
    if (line.startsWith('```') && !inCode) { inCode=true; continue; }
    if (line.startsWith('```') && inCode)  { break; }
    if (inCode) buf.push(line);
  }
  return buf.length ? buf.join('\n') : text;
}

// ── PISTON RUN ────────────────────────────────────────────
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
      body: JSON.stringify({ language:'python', version:'3.10', files:[{ content:lastCode }] }),
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
      runOut.textContent = out.slice(0,300);
    } else {
      runOut.style.color = '#9090c0';
      runOut.textContent = '(no output)';
    }
  } catch(e) {
    runOut.style.color = '#FF4BCB';
    runOut.textContent = 'Piston error: ' + e.message;
  } finally {
    runBtn.disabled = false;
    runBtn.innerHTML = '<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> run python';
  }
}

function copyOutput() {
  const el  = document.getElementById('pi-output');
  const btn = document.getElementById('pi-copy-btn');
  if (!el) return;
  navigator.clipboard.writeText(el.innerText || '').then(() => {
    btn.textContent = 'copied!';
    setTimeout(() => btn.textContent = 'copy output', 1400);
  });
}

// ── CARD PARSING & SAVING ─────────────────────────────────
function parseCard(prompt, text) {
  const title = prompt.replace(/write a.*?that/i,'').replace(/beginner|python|script|raspberry pi/gi,'').trim().slice(0,40) || prompt.slice(0,40);
  let difficulty = 'Beginner';
  if (text.indexOf('Intermediate') !== -1) difficulty = 'Intermediate';
  if (text.indexOf('Advanced')     !== -1) difficulty = 'Advanced';
  let time_minutes = 15;
  const tMatch = text.match(/(\d+)\s*min/);
  if (tMatch) time_minutes = parseInt(tMatch[1]);
  const lines = text.split('\n');
  const components = []; let inComp = false;
  for (const line of lines) {
    if (line.indexOf('COMPONENTS NEEDED') !== -1) { inComp=true; continue; }
    if (inComp && line.trim() === '') { inComp=false; continue; }
    if (inComp) { const c=line.replace(/^[-*#\d.\s\u2022]+/,'').trim(); if (c) components.push(c); if (components.length>=6) inComp=false; }
  }
  const what_you_learn = []; let inLearn = false;
  for (const line of lines) {
    if (line.indexOf('WHAT YOU') !== -1 && line.indexOf('LEARN') !== -1) { inLearn=true; continue; }
    if (inLearn && line.trim() === '') { inLearn=false; continue; }
    if (inLearn) { const c=line.replace(/^[-*#\d.\s\u2022]+/,'').trim(); if (c) what_you_learn.push(c); if (what_you_learn.length>=4) inLearn=false; }
  }
  const desc = lines.find(l => l.trim() && !l.startsWith('#') && !l.startsWith('=') && l.length>10) || prompt;
  return {
    id: generateCardId('build'), type: 'build', title,
    author: (state.user && state.user.email && state.user.email.split('@')[0]) || 'maker',
    description: desc.slice(0,80), platform: 'Raspberry Pi', language: 'Python',
    difficulty, time_minutes,
    components: components.length ? components : ['Raspberry Pi','jumper wires'],
    what_you_learn: what_you_learn.length ? what_you_learn : ['Python basics','GPIO control'],
    next_steps: [], code: lastCode, image: null,
    tags: ['raspberry-pi','python','bloomslice'], created_at: new Date().toISOString(),
  };
}

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

async function saveCard() {
  if (!lastBuild) { setRunMsg('Generate a project first!','#FFD93D'); return; }
  try {
    await dbSet('builds', { key: lastBuild.id, data: lastBuild });
    setRunMsg('Saved ' + lastBuild.id,'#00F6D6');
    refreshBckList();
  } catch(e) {
    _addBckCard(lastBuild);
    setRunMsg('Shown in panel (save needs IDB v7)','#FFD93D');
  }
}

function _addBckCard(build) {
  const list = document.getElementById('pi-bck-list');
  if (!list) return;
  const ph = list.querySelector('.pi-bck-ph');
  if (ph) ph.remove();
  const card = document.createElement('div');
  card.className = 'pi-bck-card';
  const idEl   = document.createElement('div'); idEl.className='pi-bck-id'; idEl.textContent=build.id;
  const nameEl = document.createElement('div'); nameEl.className='pi-bck-name'; nameEl.textContent=build.title||build.id;
  card.appendChild(idEl); card.appendChild(nameEl);
  card.onclick = function() { renderCardPreview(build); };
  list.insertBefore(card, list.firstChild);
}

async function refreshBckList() {
  try {
    const all  = await dbGetAll('builds');
    const list = document.getElementById('pi-bck-list');
    if (!list) return;
    list.innerHTML = '';
    if (!all || !all.length) {
      const ph = document.createElement('div'); ph.className='pi-bck-ph'; ph.textContent='no cards yet'; list.appendChild(ph); return;
    }
    all.slice().reverse().forEach(item => { _addBckCard(item.data||item); });
  } catch(e) {}
}

async function downloadCard() {
  if (!lastBuild) { setRunMsg('Generate a project first!','#FFD93D'); return; }
  const canvas = await renderBuildCard(lastBuild);
  const link = document.createElement('a');
  link.download = lastBuild.id + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function setRunMsg(msg, color) {
  const el = document.getElementById('pi-run-out');
  if (!el) return;
  el.style.color = color || '#9090c0';
  el.textContent = msg;
}

// ── PATCHBAY — reads live input values, no stored state ──
// Collects all filled-in rows and returns a prompt context string
// ── SAVE PROJECT AS JSON ──────────────────────────────────
function saveProjectJSON() {
  if (!lastBuild && !lastCode) {
    setRunMsg('Generate a project first!', '#FFD93D');
    return;
  }

  // Collect patchbay state
  const pbRows = [];
  document.querySelectorAll('.pb-row').forEach(function(row) {
    const pinNum  = row.dataset.pin;
    const pin     = PB_PINS.find(function(p) { return p.num === parseInt(pinNum); });
    const label   = (row.querySelector('.pb-in-label')  || {}).value || '';
    const topin   = (row.querySelector('.pb-in-topin')  || {}).value || '';
    const colorEl = row.querySelector('.pb-color-native');
    const color   = colorEl ? colorEl.value : '';
    const note    = (row.querySelector('.pb-in-note')   || {}).value || '';
    if (label || topin || note || color) {
      pbRows.push({ pin: pinNum, name: pin ? pin.name : '', label, topin, color, note });
    }
  });

  const proj = {
    version:     '1.0',
    created:     new Date().toISOString(),
    id:          lastBuild ? lastBuild.id : ('BCK-' + Date.now()),
    title:       lastBuild ? (lastBuild.title || 'Untitled Project') : 'Untitled Project',
    description: lastBuild ? (lastBuild.description || '') : '',
    difficulty:  lastBuild ? (lastBuild.difficulty || 'Beginner') : 'Beginner',
    components:  lastBuild ? (lastBuild.components || []) : [],
    wiring:      lastBuild ? (lastBuild.wiring || []) : [],
    code:        lastCode || '',
    gpio:        pbRows,
    notes:       '',
  };

  const blob = new Blob([JSON.stringify(proj, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = (proj.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'pi_project') + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  setRunMsg('Project saved as JSON', '#00F6D6');
}

// ── LOAD PROJECT FROM JSON ─────────────────────────────────
function loadProjectJSON(proj) {
  // Restore output
  const outEl = document.getElementById('pi-output');
  if (outEl && proj.code) {
    outEl.innerHTML = '';
    // Show code block
    const pre = document.createElement('pre');
    pre.className = 'pi-code';
    const code = document.createElement('code');
    code.textContent = proj.code;
    pre.appendChild(code);

    // Show title
    const titleDiv = document.createElement('div');
    titleDiv.className = 'pi-section-title';
    titleDiv.textContent = 'PROJECT: ' + (proj.title || 'Loaded Project');
    outEl.appendChild(titleDiv);

    if (proj.components && proj.components.length) {
      const compDiv = document.createElement('div');
      compDiv.className = 'pi-section-title';
      compDiv.textContent = 'WHAT YOU NEED';
      outEl.appendChild(compDiv);
      proj.components.forEach(function(c) {
        const d = document.createElement('div');
        d.className = 'pi-p';
        d.textContent = '· ' + c;
        outEl.appendChild(d);
      });
    }

    outEl.appendChild(pre);
    lastCode = proj.code;
  }

  // Restore GPIO patchbay
  if (proj.gpio && proj.gpio.length) {
    // Open the patchbay if closed
    if (!pbOpen) {
      pbOpen = true;
      const body = document.getElementById('pi-pb-body');
      const tog  = document.getElementById('pi-pb-toggle');
      if (body) body.style.display = 'block';
      if (tog)  tog.textContent = 'hide';
    }
    proj.gpio.forEach(function(row) {
      const rowEl = document.querySelector('.pb-row[data-pin="' + row.pin + '"]');
      if (!rowEl) return;
      const labelIn  = rowEl.querySelector('.pb-in-label');
      const topinIn  = rowEl.querySelector('.pb-in-topin');
      const noteIn   = rowEl.querySelector('.pb-in-note');
      const colorEl  = rowEl.querySelector('.pb-color-native');
      const colorBox = rowEl.querySelector('.pb-color-box');
      if (labelIn  && row.label) labelIn.value  = row.label;
      if (topinIn  && row.topin) topinIn.value  = row.topin;
      if (noteIn   && row.note)  noteIn.value   = row.note;
      if (colorEl  && row.color) {
        colorEl.value = row.color;
        if (colorBox) {
          colorBox.style.background = row.color;
          colorBox.classList.add('pb-color-box-set');
        }
      }
    });
  }

  // Restore build card
  if (proj.title || proj.id) {
    lastBuild = proj;
    renderCardPreview(proj);
  }

  setRunMsg('Project loaded: ' + (proj.title || proj.id), '#00F6D6');
}

function pbContextString() {
  const rows = document.querySelectorAll('.pb-row');
  const lines = [];
  rows.forEach(function(row) {
    const pinNum  = row.dataset.pin;
    const pin     = PB_PINS.find(function(p) { return p.num === parseInt(pinNum); });
    const label   = (row.querySelector('.pb-in-label')  || {}).value || '';
    const topin   = (row.querySelector('.pb-in-topin')  || {}).value || '';
    const colorEl = row.querySelector('.pb-color-native');
    const color   = colorEl ? colorEl.value : '';
    const note    = (row.querySelector('.pb-in-note')   || {}).value || '';
    if (label.trim() || topin.trim()) {
      let s = 'Pin ' + pinNum + ' (' + (pin ? pin.name : '?') + ')';
      if (label.trim()) s += ' -> ' + label.trim();
      if (topin.trim()) s += ' [to: ' + topin.trim() + ']';
      if (color.trim()) s += ' [wire: ' + color.trim() + ']';
      if (note.trim())  s += ' -- ' + note.trim();
      lines.push(s);
    }
  });
  return lines.length ? 'GPIO wiring:\n' + lines.join('\n') : '';
}

// ── STYLES ────────────────────────────────────────────────
function injectPiStyles() {
  if (document.getElementById('pi-styles')) return;
  const s = document.createElement('style');
  s.id = 'pi-styles';
  s.textContent = [
    '#pi-wrap{display:flex;flex-direction:row;height:100%;overflow:hidden;background:var(--bg);font-family:var(--font-ui);}',
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
    '#pi-console{flex-shrink:0;border-top:1px solid var(--border);background:var(--surface);overflow:visible;}',
    '#pi-model-indicator{display:flex;align-items:center;gap:6px;padding:6px 14px 0;font-size:0.6rem;color:var(--subtext);font-family:var(--font-ui);}',
    '#pi-model-dot{width:6px;height:6px;border-radius:50%;background:var(--teal);flex-shrink:0;}',
    '#pi-input-row{position:relative;display:flex;align-items:flex-end;gap:8px;padding:8px 10px 10px;width:100%;}',
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
    '.pi-li::before{content:"\u00b7";position:absolute;left:2px;color:var(--teal);}',
    '.pi-prose{font-size:0.71rem;color:var(--text);margin:1px 0;line-height:1.55;}',
    '.pi-prose:empty{display:none;}',
    /* ── patchbay ── */
    '#pi-pb-panel{flex-shrink:0;border-top:1px solid var(--border);background:var(--surface);}',
    '#pi-pb-header{display:flex;align-items:center;justify-content:space-between;padding:5px 12px;}',
    '#pi-pb-title{font-size:0.62rem;letter-spacing:0.1em;color:var(--subtext);text-transform:uppercase;font-family:var(--font-ui);}',
    '#pi-pb-toggle{font-size:0.6rem;letter-spacing:0.08em;color:var(--teal);background:transparent;border:1px solid rgba(0,246,214,0.3);border-radius:12px;padding:2px 9px;cursor:pointer;font-family:var(--font-ui);transition:background 0.15s;}',
    '#pi-pb-toggle:hover{background:rgba(0,246,214,0.08);}',
    '#pi-pb-body{border-top:1px solid var(--border);}',
    /* column header */
    '#pi-pb-col-hdr{display:grid;grid-template-columns:22px 54px 1fr 58px 1fr 28px;gap:4px;align-items:center;padding:4px 8px 3px;border-bottom:1px solid var(--border);}',
    '#pi-pb-col-hdr span{font-size:0.55rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--subtext);font-family:var(--font-ui);}',
    /* scrollable list */
    '#pi-pb-scroll{height:180px;overflow-y:auto;overflow-x:hidden;padding:3px 8px 6px;}',
    '#pi-pb-scroll::-webkit-scrollbar{width:3px;}',
    '#pi-pb-scroll::-webkit-scrollbar-thumb{background:var(--muted);border-radius:2px;}',
    /* each pin row */
    '.pb-row{display:grid;grid-template-columns:22px 54px 1fr 58px 1fr 28px;gap:4px;align-items:center;padding:2px 0;}',
    '.pb-dot{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:600;color:#fff;flex-shrink:0;}',
    '.pb-pin-name{font-size:0.62rem;color:var(--subtext);font-family:var(--font-ui);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    /* inline inputs */
    '.pb-in{background:var(--bg);border:1px solid transparent;border-radius:4px;padding:2px 5px;color:var(--text);font-family:var(--font-ui);font-size:0.65rem;outline:none;width:100%;min-width:0;}',
    '.pb-in:focus{border-color:var(--teal);}',
    '.pb-in:hover{border-color:var(--border);}',
    '.pb-in::placeholder{color:var(--subtext);opacity:0.5;}',
    '.pb-in-label{flex:1;}',
    '.pb-in-topin{width:100%;}',
    '.pb-in-note{width:100%;}',
    /* color box + popover */
    '.pb-color-wrap{position:relative;display:flex;align-items:center;}',
    '.pb-color-box{width:22px;height:20px;border-radius:4px;border:1px solid var(--border);cursor:pointer;background:var(--muted);transition:border-color 0.15s;}',
    '.pb-color-box:hover{border-color:var(--teal);}',
    '.pb-color-box-set{border-color:rgba(255,255,255,0.3);}',
    '.pb-color-pop{display:none;position:fixed;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:6px;z-index:99999;flex-direction:row;gap:5px;flex-wrap:nowrap;box-shadow:0 8px 32px rgba(0,0,0,0.7);}',
    '.pb-color-pop-open{display:flex;}',
    '.pb-color-chip{width:18px;height:18px;border-radius:4px;cursor:pointer;border:2px solid transparent;transition:border-color 0.1s,transform 0.1s;box-sizing:border-box;flex-shrink:0;}',
    '.pb-color-chip:hover{transform:scale(1.15);border-color:rgba(255,255,255,0.4);}',
    '@media(max-width:640px){#pi-panes{flex-direction:column;}}'
  ].join('');
  document.head.appendChild(s);
}
// cache bust Tue Apr 14 09:34:08 CDT 2026
