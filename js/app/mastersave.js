// ============================================================
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
