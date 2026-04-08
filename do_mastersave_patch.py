import os, sys

BASE = os.path.expanduser('~/spiralside')

# ── 1. WRITE mastersave.js ────────────────────────────────────
MASTER_JS = r"""// ============================================================
// SPIRALSIDE — MASTER SAVE v1.0
// One JSON blob per user. All metadata. No images.
// Like an old-school game save file — one slot, one truth.
//
// Stores: xp_state, quest_events, quest_resolved, quest_deltas,
//         quest_char, you_card, style_prefs, bot_config
// Never stores: base64 images, OPFS blobs, Storage files
//
// Cloud: Supabase user_save_data (one row per user)
// Local: localStorage ss_master_save (fast cache)
//
// Nimbis anchor: js/app/mastersave.js
// ============================================================

import { state } from './state.js';
import { dbGet, dbSet } from './db.js';

const SUPA_URL = 'https://qfawusrelwthxabfbglg.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYXd1c3JlbHd0aHhhYmZiZ2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzc5NzUsImV4cCI6MjA4ODc1Mzk3NX0.XkeFmWq-rOH2whgfkeMylyG7Ct_0u80fMkoJlEQ5K8E';
const LS_KEY   = 'ss_master_save';
const FORMAT_V = 2;

// ── IMAGE STRIP ───────────────────────────────────────────────
const B64_KEYS = ['portrait_base64','dataURL','image','avatar_base64','src','bg_image','imageData','thumbnail'];
function stripImages(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(v => stripImages(v));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && v.startsWith('data:image/')) { out['_has_' + k] = true; }
    else if (B64_KEYS.includes(k) && typeof v === 'string' && v.length > 500) { out['_has_' + k] = true; }
    else if (v && typeof v === 'object') { out[k] = stripImages(v); }
    else { out[k] = v; }
  }
  return out;
}

// ── COLLECT ALL STATE ─────────────────────────────────────────
async function collectState() {
  // XP — from IDB
  let xp_state = null;
  try { const r = await dbGet('config', 'xp_state'); xp_state = r?.value || null; } catch(_) {}

  // Quest — from localStorage
  let quest_events = [], quest_resolved = [], quest_deltas = {}, quest_char = null;
  try { quest_events   = JSON.parse(localStorage.getItem('ss_quest_events')  || '[]'); } catch(_) {}
  try { quest_resolved = JSON.parse(localStorage.getItem('ss_quest_resolved') || '[]'); } catch(_) {}
  try { quest_deltas   = JSON.parse(localStorage.getItem('ss_quest_deltas')  || '{}'); } catch(_) {}
  try { quest_char     = JSON.parse(localStorage.getItem('ss_quest_char')    || 'null'); } catch(_) {}

  // Style + bot — from localStorage keyed by uid
  const uid = state.user?.id;
  let style_prefs = null, bot_config = null;
  try { if (uid) style_prefs = JSON.parse(localStorage.getItem('ss_style_' + uid) || 'null'); } catch(_) {}
  try { if (uid) bot_config  = JSON.parse(localStorage.getItem('ss_bot_'   + uid) || 'null'); } catch(_) {}

  // You card — from IDB sheets store
  let you_card = null;
  try {
    you_card = await new Promise(resolve => {
      const req = indexedDB.open('spiralside');
      req.onerror = () => resolve(null);
      req.onsuccess = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('sheets')) { db.close(); resolve(null); return; }
        const tx = db.transaction('sheets', 'readonly');
        const get = tx.objectStore('sheets').get('you');
        get.onsuccess = () => { db.close(); resolve(get.result || null); };
        get.onerror   = () => { db.close(); resolve(null); };
      };
    });
  } catch(_) {}

  return {
    format_version: FORMAT_V,
    user_id:    state.user?.id    || null,
    user_email: state.user?.email || null,
    saved_at:   new Date().toISOString(),
    xp_state:      stripImages(xp_state),
    quest_events,
    quest_resolved,
    quest_deltas,
    quest_char:    stripImages(quest_char),
    you_card:      stripImages(you_card),
    style_prefs,
    bot_config,
  };
}

// ── CLOUD WRITE ───────────────────────────────────────────────
async function cloudWrite(save) {
  const token = state.session?.access_token;
  if (!token || !state.user?.id) return false;
  let ver = 1;
  try {
    const r = await fetch(SUPA_URL + '/rest/v1/user_save_data?user_id=eq.' + state.user.id + '&select=save_version',
      { headers: { 'Authorization': 'Bearer ' + token, 'apikey': SUPA_KEY } });
    const rows = await r.json();
    if (rows?.[0]?.save_version) ver = rows[0].save_version + 1;
  } catch(_) {}
  try {
    await fetch(SUPA_URL + '/rest/v1/user_save_data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token,
                 'apikey': SUPA_KEY, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ user_id: state.user.id, save_data: save, save_version: ver, updated_at: new Date().toISOString() }),
    });
    console.log('[mastersave] cloud write v' + ver);
    return ver;
  } catch(e) { console.warn('[mastersave] cloud write failed:', e); return false; }
}

// ── CLOUD READ ────────────────────────────────────────────────
async function cloudRead() {
  const token = state.session?.access_token;
  if (!token || !state.user?.id) return null;
  try {
    const r = await fetch(
      SUPA_URL + '/rest/v1/user_save_data?user_id=eq.' + state.user.id + '&select=save_data,save_version,updated_at',
      { headers: { 'Authorization': 'Bearer ' + token, 'apikey': SUPA_KEY } });
    const rows = await r.json();
    if (!rows?.[0]) return null;
    return { ...rows[0].save_data, _save_version: rows[0].save_version, _saved_at: rows[0].updated_at };
  } catch(e) { console.warn('[mastersave] cloud read failed:', e); return null; }
}

// ── HYDRATE ───────────────────────────────────────────────────
async function hydrate(save) {
  if (!save) return;
  // XP state -> IDB
  if (save.xp_state) {
    try {
      await dbSet('config', { key: 'xp_state', value: save.xp_state });
      // Reload in-memory XP if module is loaded
      if (window._reloadXPState) await window._reloadXPState();
    } catch(_) {}
  }
  // Quest -> localStorage
  if (Array.isArray(save.quest_events))   localStorage.setItem('ss_quest_events',  JSON.stringify(save.quest_events));
  if (Array.isArray(save.quest_resolved)) localStorage.setItem('ss_quest_resolved', JSON.stringify(save.quest_resolved));
  if (save.quest_deltas) localStorage.setItem('ss_quest_deltas', JSON.stringify(save.quest_deltas));
  if (save.quest_char)   localStorage.setItem('ss_quest_char',   JSON.stringify(save.quest_char));
  // Style + bot -> localStorage
  const uid = state.user?.id;
  if (uid && save.style_prefs) localStorage.setItem('ss_style_' + uid, JSON.stringify(save.style_prefs));
  if (uid && save.bot_config)  localStorage.setItem('ss_bot_'   + uid, JSON.stringify(save.bot_config));
  // You card -> IDB
  if (save.you_card) {
    try {
      await new Promise((resolve, reject) => {
        const req = indexedDB.open('spiralside');
        req.onerror = reject;
        req.onsuccess = e => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('sheets')) { db.close(); resolve(); return; }
          const tx = db.transaction('sheets', 'readwrite');
          tx.objectStore('sheets').put(save.you_card);
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror    = () => { db.close(); reject(); };
        };
      });
    } catch(_) {}
  }
  console.log('[mastersave] hydrated from save v' + (save._save_version || '?'));
}

// ── PUBLIC: SAVE ──────────────────────────────────────────────
export async function masterSave() {
  const save = await collectState();
  // Cache locally
  try {
    const local = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    save._save_version = (local._save_version || 0) + 1;
    localStorage.setItem(LS_KEY, JSON.stringify(save));
  } catch(_) {}
  // Write cloud async
  cloudWrite(save).catch(e => console.warn('[mastersave] bg write failed:', e));
  return save;
}

// ── PUBLIC: LOAD ──────────────────────────────────────────────
export async function masterLoad() {
  const cloud = await cloudRead();
  let local = null;
  try { local = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch(_) {}

  let best = null;
  if (cloud && local) {
    const cv = cloud._save_version || 0, lv = local._save_version || 0;
    best = cv >= lv ? cloud : local;
    console.log('[mastersave] cloud v' + cv + ' vs local v' + lv + ' -> using ' + (cv >= lv ? 'cloud' : 'local'));
  } else {
    best = cloud || local;
  }
  if (!best) { console.log('[mastersave] no save found'); return null; }
  await hydrate(best);
  try { localStorage.setItem(LS_KEY, JSON.stringify(best)); } catch(_) {}
  return best;
}

// ── PUBLIC: DOWNLOAD ──────────────────────────────────────────
export async function downloadSave() {
  const save = await collectState();
  try {
    const local = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    save._save_version = (local._save_version || 0) + 1;
  } catch(_) { save._save_version = 1; }
  const date = new Date().toISOString().slice(0, 10);
  const fname = 'spiralside_' + date + '_v' + save._save_version + '.json';
  const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = fname; a.click();
  URL.revokeObjectURL(url);
  console.log('[mastersave] downloaded:', fname);
  return fname;
}

// ── PUBLIC: UPLOAD / RESTORE ──────────────────────────────────
export async function uploadSave(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('file read failed'));
    reader.onload = async e => {
      try {
        const save = JSON.parse(e.target.result);
        if (!save.format_version) throw new Error('not a spiralside save file');
        if (save.format_version > FORMAT_V) throw new Error('save from newer version — update app first');
        await hydrate(save);
        save._save_version = (save._save_version || 0) + 1;
        save.restored_at = new Date().toISOString();
        try { localStorage.setItem(LS_KEY, JSON.stringify(save)); } catch(_) {}
        await cloudWrite(save);
        console.log('[mastersave] restored from file');
        resolve(save);
      } catch(err) { reject(err); }
    };
    reader.readAsText(file);
  });
}

// ── PUBLIC: GET SAVE INFO ─────────────────────────────────────
// Used by UI to show save slot metadata.
export function getSaveInfo() {
  try {
    const local = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (!local) return null;
    const xp = local.xp_state || {};
    const savedAt = local._saved_at || local.saved_at || null;
    return {
      version:     local._save_version || 1,
      savedAt:     savedAt ? _rel(new Date(savedAt)) : 'never',
      savedAtFull: savedAt ? new Date(savedAt).toLocaleString() : '--',
      level:       xp.level      || 1,
      streak:      xp.streakDays || 0,
      totalXP:     xp.totalXP   || 0,
      gold:        xp.gold       || 0,
      questCount:  (local.quest_resolved || []).length,
      botName:     local.bot_config?.name || 'Sky',
      userEmail:   local.user_email || state.user?.email || '--',
    };
  } catch(_) { return null; }
}

function _rel(date) {
  const d = Math.floor((Date.now() - date.getTime()) / 1000);
  if (d < 60)    return 'just now';
  if (d < 3600)  return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  return Math.floor(d / 86400) + 'd ago';
}
"""

with open(os.path.join(BASE, 'js', 'app', 'mastersave.js'), 'w', encoding='utf-8') as f:
    f.write(MASTER_JS)
print('[OK] mastersave.js written')

# ── 2. PATCH xp.js ───────────────────────────────────────────
XP_PATH = os.path.join(BASE, 'js', 'app', 'xp.js')
with open(XP_PATH, 'r', encoding='utf-8') as f:
    xp = f.read().replace('\r\n', '\n')

# Add import
OLD_IMPORT = "import { dbGet, dbSet } from './db.js';"
NEW_IMPORT  = "import { dbGet, dbSet } from './db.js';\nimport { masterSave as _masterSave } from './mastersave.js';"
if '_masterSave' not in xp:
    xp = xp.replace(OLD_IMPORT, NEW_IMPORT, 1)
    print('[OK] xp.js: import added')
else:
    print('[--] xp.js: import already present')

# Wire masterSave after saveXPState in awardXP
OLD_PERSIST = "  // Persist after every award\n  await saveXPState(_state);"
NEW_PERSIST  = "  // Persist after every award\n  await saveXPState(_state);\n  _masterSave().catch(() => {}); // sync to master save"
if 'sync to master save' not in xp:
    if OLD_PERSIST in xp:
        xp = xp.replace(OLD_PERSIST, NEW_PERSIST, 1)
        print('[OK] xp.js: masterSave wired')
    else:
        print('[!!] xp.js: persist anchor not found')
else:
    print('[--] xp.js: masterSave already wired')

# Add reloadXPState export
RELOAD_ANCHOR = "// ── PUBLIC: GET STATE ─────────────────────────────────────────────────────────"
RELOAD_FN = """// ── PUBLIC: RELOAD XP STATE ──────────────────────────────────
// Called by mastersave hydrate() after restoring a save file.
export async function reloadXPState() {
  _state = await loadXPState();
  _initialized = true;
  return _state;
}

"""
if 'reloadXPState' not in xp:
    if RELOAD_ANCHOR in xp:
        xp = xp.replace(RELOAD_ANCHOR, RELOAD_FN + RELOAD_ANCHOR, 1)
        print('[OK] xp.js: reloadXPState added')
    else:
        print('[!!] xp.js: GET STATE anchor not found')
else:
    print('[--] xp.js: reloadXPState already present')

with open(XP_PATH, 'w', encoding='utf-8') as f:
    f.write(xp)
print('[OK] xp.js written')

# ── 3. PATCH main.js ─────────────────────────────────────────
MAIN_PATH = os.path.join(BASE, 'js', 'app', 'main.js')
with open(MAIN_PATH, 'r', encoding='utf-8') as f:
    main = f.read().replace('\r\n', '\n')

# Add import after the xp import line
XP_IMPORT_LINE = "import { initXP, awardXP, getXPState, awardGold, spendGold, addItem, consumeItem, showLevelUpToast, showXPGain } from './xp.js';"
MASTER_IMPORT  = "\nimport { masterSave, masterLoad, downloadSave, uploadSave, getSaveInfo } from './mastersave.js';"
if 'mastersave' not in main:
    if XP_IMPORT_LINE in main:
        main = main.replace(XP_IMPORT_LINE, XP_IMPORT_LINE + MASTER_IMPORT, 1)
        print('[OK] main.js: import added')
    else:
        print('[!!] main.js: xp import line not found')
else:
    print('[--] main.js: mastersave import already present')

# Expose globals after awardXP global
OLD_EXPOSE = "window.awardXP    = awardXP;"
NEW_EXPOSE  = """window.awardXP      = awardXP;
window.masterSave   = masterSave;
window.masterLoad   = masterLoad;
window.downloadSave = downloadSave;
window.uploadSave   = uploadSave;
window.getSaveInfo  = getSaveInfo;"""
if 'window.masterSave' not in main:
    if OLD_EXPOSE in main:
        main = main.replace(OLD_EXPOSE, NEW_EXPOSE, 1)
        print('[OK] main.js: globals exposed')
    else:
        print('[!!] main.js: awardXP expose anchor not found')
else:
    print('[--] main.js: globals already exposed')

# Wire masterLoad in onAppReady after initXP
OLD_BOOT = "  await initXP();"
NEW_BOOT  = "  await initXP();\n  try { await masterLoad(); } catch(e) { console.warn('[boot] masterLoad failed:', e); }"
if 'masterLoad()' not in main:
    if OLD_BOOT in main:
        main = main.replace(OLD_BOOT, NEW_BOOT, 1)
        print('[OK] main.js: masterLoad wired into boot')
    else:
        print('[!!] main.js: initXP boot anchor not found')
else:
    print('[--] main.js: masterLoad boot call already present')

# Expose reloadXPState for mastersave hydrate()
OLD_XP_EXPOSE = "window.getXPState = getXPState;"
NEW_XP_EXPOSE  = "window.getXPState = getXPState;\nwindow._reloadXPState = async () => { const m = await import('./xp.js'); if (m.reloadXPState) await m.reloadXPState(); };"
if '_reloadXPState' not in main:
    if OLD_XP_EXPOSE in main:
        main = main.replace(OLD_XP_EXPOSE, NEW_XP_EXPOSE, 1)
        print('[OK] main.js: _reloadXPState exposed')
    else:
        print('[!!] main.js: getXPState expose anchor not found')
else:
    print('[--] main.js: _reloadXPState already exposed')

with open(MAIN_PATH, 'w', encoding='utf-8') as f:
    f.write(main)
print('[OK] main.js written')

# ── 4. PATCH account.js — inject save slot UI ────────────────
ACCT_PATH = os.path.join(BASE, 'js', 'app', 'views', 'account.js')
with open(ACCT_PATH, 'r', encoding='utf-8') as f:
    acct = f.read().replace('\r\n', '\n')

SAVE_STYLES = """
    /* ── SAVE SLOT (game-style) ── */
    .save-section-title { font-size: 0.52rem; letter-spacing: 0.22em; color: var(--subtext); text-transform: uppercase; margin-bottom: 10px; }
    .save-slot { border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; background: var(--surface); font-family: 'DM Mono', monospace; }
    .save-slot.empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; opacity: 0.4; }
    .save-slot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .save-slot-label { font-size: 0.5rem; letter-spacing: 0.2em; color: var(--subtext); text-transform: uppercase; }
    .save-slot-ver { font-size: 0.5rem; color: var(--teal); letter-spacing: 0.1em; border: 1px solid rgba(0,246,214,0.2); border-radius: 4px; padding: 1px 6px; }
    .save-slot-name { font-size: 1rem; font-family: var(--font-display); font-weight: 700; color: var(--text); margin-bottom: 2px; }
    .save-slot-sub { font-size: 0.6rem; color: var(--subtext); margin-bottom: 10px; }
    .save-slot-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 10px; }
    .sv-stat { background: var(--bg); border: 1px solid var(--border); border-radius: 7px; padding: 7px 4px; text-align: center; }
    .sv-stat-val { font-size: 0.88rem; font-weight: 700; color: var(--text); font-family: var(--font-display); }
    .sv-stat-lbl { font-size: 0.46rem; letter-spacing: 0.1em; color: var(--subtext); text-transform: uppercase; margin-top: 2px; }
    .save-slot-time { font-size: 0.54rem; color: var(--subtext); letter-spacing: 0.03em; }
    .save-slot-empty-text { font-size: 0.7rem; letter-spacing: 0.2em; color: var(--subtext); margin-top: 8px; }
    .save-actions { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 7px; margin-bottom: 10px; }
    .sv-btn { display: flex; align-items: center; justify-content: center; gap: 5px; padding: 10px 6px; border-radius: 8px; cursor: pointer; font-family: 'DM Mono', monospace; font-size: 0.58rem; letter-spacing: 0.08em; text-transform: uppercase; transition: all 0.15s; border: 1px solid transparent; }
    .sv-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .sv-btn-primary { background: linear-gradient(135deg, var(--teal), var(--accent)); color: #0a0a0f; }
    .sv-btn-primary:hover:not(:disabled) { opacity: 0.85; }
    .sv-btn-secondary { background: var(--surface); border-color: var(--border); color: var(--subtext); }
    .sv-btn-secondary:hover:not(:disabled) { border-color: var(--teal); color: var(--text); }
    .save-status { font-size: 0.62rem; letter-spacing: 0.06em; min-height: 18px; margin-bottom: 6px; text-align: center; }
    .save-status.ok  { color: var(--teal); }
    .save-status.err { color: var(--pink, #f76a8a); }
    .save-tip { font-size: 0.56rem; color: var(--subtext); text-align: center; line-height: 1.5; padding: 4px 0 0; opacity: 0.6; }"""

# Inject styles into injectAccountStyles
OLD_ABOUT_STYLE = "    /* __ About section __ */"
if '/* __ SAVE SLOT' not in acct:
    if "/* __ About section __ */" in acct:
        acct = acct.replace("/* __ About section __ */", "/* __ About section __ */")
    # Try the actual text from file
    if "/* ── About section ── */" in acct:
        acct = acct.replace("/* ── About section ── */", SAVE_STYLES + "\n\n    /* __ About section __ */", 1)
        print('[OK] account.js: save slot styles injected')
    else:
        # Just add before closing backtick of s.textContent
        # Find the end of the style string
        style_end = "  `;\n  document.head.appendChild(s);\n}"
        if style_end in acct:
            acct = acct.replace(style_end, SAVE_STYLES + "\n  `;\n  document.head.appendChild(s);\n}", 1)
            print('[OK] account.js: save slot styles injected (fallback)')
        else:
            print('[!!] account.js: could not find style injection point')
else:
    print('[--] account.js: save styles already present')

# Add renderSaveSlot function before initAccountView
SAVE_SLOT_FN = r"""
// ── SAVE SLOT UI ──────────────────────────────────────────────
function renderSaveSlot(container) {
  const info = window.getSaveInfo ? window.getSaveInfo() : null;
  const slot = info ? `
    <div class="save-slot filled">
      <div class="save-slot-header">
        <div class="save-slot-label">SLOT 01</div>
        <div class="save-slot-ver">v${info.version}</div>
      </div>
      <div class="save-slot-name">${info.botName}</div>
      <div class="save-slot-sub">${info.userEmail}</div>
      <div class="save-slot-stats">
        <div class="sv-stat"><div class="sv-stat-val">${info.level}</div><div class="sv-stat-lbl">LVL</div></div>
        <div class="sv-stat"><div class="sv-stat-val">${info.streak}d</div><div class="sv-stat-lbl">STREAK</div></div>
        <div class="sv-stat"><div class="sv-stat-val">${info.questCount}</div><div class="sv-stat-lbl">QUESTS</div></div>
        <div class="sv-stat"><div class="sv-stat-val">${info.gold}g</div><div class="sv-stat-lbl">GOLD</div></div>
      </div>
      <div class="save-slot-time">\u23F0 ${info.savedAt} &nbsp;&middot;&nbsp; ${info.savedAtFull}</div>
    </div>
  ` : `
    <div class="save-slot empty">
      <div class="save-slot-label">SLOT 01</div>
      <div class="save-slot-empty-text">NO DATA</div>
    </div>
  `;
  container.innerHTML = `
    <div class="save-section-title">SAVE DATA</div>
    ${slot}
    <div class="save-actions">
      <button class="sv-btn sv-btn-primary" id="sv-save-now">\u{1F4BE} SAVE</button>
      <button class="sv-btn sv-btn-secondary" id="sv-download">\u2B07 DOWNLOAD</button>
      <button class="sv-btn sv-btn-secondary" id="sv-restore-btn">\u2B06 RESTORE</button>
    </div>
    <div class="save-status" id="sv-status"></div>
    <input type="file" id="sv-file-input" accept=".json" style="display:none" />
    <div class="save-tip">files are portable &mdash; download to back up &middot; restore to migrate devices</div>
  `;

  const status = container.querySelector('#sv-status');

  container.querySelector('#sv-save-now').onclick = async () => {
    const btn = container.querySelector('#sv-save-now');
    btn.disabled = true; btn.textContent = '\u23F3 SAVING...'; status.textContent = '';
    try {
      if (window.masterSave) await window.masterSave();
      status.textContent = '\u2714 saved to cloud'; status.className = 'save-status ok';
      setTimeout(() => renderSaveSlot(container), 700);
    } catch(e) {
      status.textContent = '\u2716 save failed \u2014 check connection'; status.className = 'save-status err';
    }
    btn.disabled = false; btn.innerHTML = '\u{1F4BE} SAVE';
  };

  container.querySelector('#sv-download').onclick = async () => {
    const btn = container.querySelector('#sv-download');
    btn.disabled = true; btn.textContent = '\u23F3 PACKING...';
    try {
      const fname = await window.downloadSave();
      status.textContent = '\u2714 ' + fname; status.className = 'save-status ok';
    } catch(e) {
      status.textContent = '\u2716 download failed'; status.className = 'save-status err';
    }
    btn.disabled = false; btn.innerHTML = '\u2B07 DOWNLOAD';
  };

  container.querySelector('#sv-restore-btn').onclick = () => container.querySelector('#sv-file-input').click();
  container.querySelector('#sv-file-input').onchange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const btn = container.querySelector('#sv-restore-btn');
    btn.disabled = true; btn.textContent = '\u23F3 LOADING...'; status.textContent = '';
    try {
      await window.uploadSave(file);
      status.textContent = '\u2714 restored! reloading...'; status.className = 'save-status ok';
      setTimeout(() => window.location.reload(), 1200);
    } catch(err) {
      status.textContent = '\u2716 ' + (err.message || 'restore failed'); status.className = 'save-status err';
    }
    btn.disabled = false; btn.innerHTML = '\u2B06 RESTORE';
    e.target.value = '';
  };
}

"""

INIT_ANCHOR = "export function initAccountView()"
if 'renderSaveSlot' not in acct:
    if INIT_ANCHOR in acct:
        acct = acct.replace(INIT_ANCHOR, SAVE_SLOT_FN + INIT_ANCHOR, 1)
        print('[OK] account.js: renderSaveSlot added')
    else:
        print('[!!] account.js: initAccountView anchor not found')
else:
    print('[--] account.js: renderSaveSlot already present')

# Add save slot container div in the HTML, after the account section title
SAVE_CONTAINER_ANCHOR = "        <!-- __ Account actions __ -->"
SAVE_CONTAINER_ADD    = "        <!-- __ Save slot __ -->\n        <div class=\"acct-section-title\">save game</div>\n        <div id=\"acct-save-slot\"></div>\n\n        <!-- __ Account actions __ -->"
if 'acct-save-slot' not in acct:
    if "        <!-- __ Account actions __ -->" in acct:
        acct = acct.replace("        <!-- __ Account actions __ -->", SAVE_CONTAINER_ADD, 1)
        print('[OK] account.js: save slot container added to HTML')
    elif "        <!-- \u2500\u2500 Account actions \u2500\u2500 -->" in acct:
        acct = acct.replace("        <!-- \u2500\u2500 Account actions \u2500\u2500 -->",
                            "        <!-- \u2500\u2500 Save slot \u2500\u2500 -->\n        <div class=\"acct-section-title\">save game</div>\n        <div id=\"acct-save-slot\"></div>\n\n        <!-- \u2500\u2500 Account actions \u2500\u2500 -->", 1)
        print('[OK] account.js: save slot container added (unicode dashes)')
    else:
        print('[!!] account.js: account actions comment anchor not found — check manually')
else:
    print('[--] account.js: save slot container already present')

# Wire renderSaveSlot call in updateAccountView or initAccountView
WIRE_ANCHOR = "  updateAccountView();"
WIRE_ADD    = "  updateAccountView();\n  // Render save slot\n  const _svEl = document.getElementById('acct-save-slot');\n  if (_svEl) renderSaveSlot(_svEl);"
if '_svEl' not in acct:
    if WIRE_ANCHOR in acct:
        acct = acct.replace(WIRE_ANCHOR, WIRE_ADD, 1)
        print('[OK] account.js: renderSaveSlot call wired')
    else:
        print('[!!] account.js: updateAccountView() call anchor not found')
else:
    print('[--] account.js: renderSaveSlot call already wired')

with open(ACCT_PATH, 'w', encoding='utf-8') as f:
    f.write(acct)
print('[OK] account.js written')

print()
print('=== ALL PATCHES APPLIED ===')
print('Run: cd ~/spiralside && git add . && git commit -m "feat: master save system - one slot, cloud sync, download/restore" && git push --force origin main')
