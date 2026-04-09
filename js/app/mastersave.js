// ============================================================
// SPIRALSIDE — MASTER SAVE v2.0
// One JSON blob per user. ALL metadata. No images.
// Like an old-school game save — one file, one truth.
//
// Stores: xp_state, quest_*, you_card, prints, scenes, worlds,
//         canon_blocks, style_prefs, bot_config, tab_order
// Never stores: base64 images, OPFS blobs, Storage files
//
// Cloud: Supabase user_save_data (one row per user)
// Local: localStorage ss_master_save (fast cache)
// Autosave: debounced 5min
//
// Nimbis anchor: js/app/mastersave.js
// ============================================================

import { state } from './state.js';
import { dbGet, dbSet } from './db.js';

const SUPA_URL = 'https://qfawusrelwthxabfbglg.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYXd1c3JlbHd0aHhhYmZiZ2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzc5NzUsImV4cCI6MjA4ODc1Mzk3NX0.XkeFmWq-rOH2whgfkeMylyG7Ct_0u80fMkoJlEQ5K8E';
const LS_KEY   = 'ss_master_save';
const FORMAT_V = 3;

// ── DEBOUNCE ──────────────────────────────────────────────────
let _debounceTimer = null;
const DEBOUNCE_MS = 5 * 60 * 1000;

export function masterSaveDebounced() {
  if (_debounceTimer) return;
  _debounceTimer = setTimeout(() => {
    _debounceTimer = null;
    masterSave().catch(() => {});
  }, DEBOUNCE_MS);
}

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

// ── IDB HELPERS ───────────────────────────────────────────────
async function idbGetAll(storeName) {
  return new Promise(resolve => {
    try {
      const req = indexedDB.open('spiralside');
      req.onerror = () => resolve([]);
      req.onsuccess = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(storeName)) { db.close(); resolve([]); return; }
        const tx  = db.transaction(storeName, 'readonly');
        const all = tx.objectStore(storeName).getAll();
        all.onsuccess = () => { db.close(); resolve(all.result || []); };
        all.onerror   = () => { db.close(); resolve([]); };
      };
    } catch(_) { resolve([]); }
  });
}

async function idbPutAll(storeName, items) {
  if (!items || !items.length) return;
  return new Promise(resolve => {
    try {
      const req = indexedDB.open('spiralside');
      req.onerror = () => resolve();
      req.onsuccess = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(storeName)) { db.close(); resolve(); return; }
        const tx = db.transaction(storeName, 'readwrite');
        items.forEach(item => { try { tx.objectStore(storeName).put(item); } catch(_) {} });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror    = () => { db.close(); resolve(); };
      };
    } catch(_) { resolve(); }
  });
}

// ── COLLECT ALL STATE ─────────────────────────────────────────
async function collectState() {
  let xp_state = null;
  try { const r = await dbGet('config', 'xp_state'); xp_state = r ? r.value || null : null; } catch(_) {}

  let quest_events = [], quest_resolved = [], quest_deltas = {}, quest_char = null;
  try { quest_events   = JSON.parse(localStorage.getItem('ss_quest_events')  || '[]'); } catch(_) {}
  try { quest_resolved = JSON.parse(localStorage.getItem('ss_quest_resolved') || '[]'); } catch(_) {}
  try { quest_deltas   = JSON.parse(localStorage.getItem('ss_quest_deltas')  || '{}'); } catch(_) {}
  try { quest_char     = JSON.parse(localStorage.getItem('ss_quest_char')    || 'null'); } catch(_) {}

  const uid = state.user ? state.user.id : null;
  let style_prefs = null, bot_config = null;
  try { if (uid) style_prefs = JSON.parse(localStorage.getItem('ss_style_' + uid) || 'null'); } catch(_) {}
  try { if (uid) bot_config  = JSON.parse(localStorage.getItem('ss_bot_'   + uid) || 'null'); } catch(_) {}

  let tab_order = null;
  try { const r = await dbGet('config', 'tab_order'); tab_order = r ? r.value || null : null; } catch(_) {}

  let you_card = null;
  try {
    const sheets = await idbGetAll('sheets');
    you_card = sheets.find(function(s) { return s.id === 'you'; }) || null;
  } catch(_) {}

  let prints = [];
  try {
    const all = await idbGetAll('prints');
    prints = all
      .filter(function(p) { return p.id && !String(p.id).startsWith('builtin_'); })
      .map(function(p) { return stripImages(p); });
  } catch(_) {}

  let scenes = [];
  try {
    const all = await idbGetAll('scenes');
    scenes = all.map(function(s) { return stripImages(s); });
  } catch(_) {}

  let worlds = [];
  try {
    const all = await idbGetAll('worlds');
    worlds = all.map(function(w) { return stripImages(w); });
  } catch(_) {}

  let canon_blocks = [];
  try {
    const token = state.session ? state.session.access_token : null;
    if (token && uid) {
      const r = await fetch(
        SUPA_URL + '/rest/v1/canon_blocks?user_id=eq.' + uid + '&select=*&order=created_at.desc&limit=100',
        { headers: { 'Authorization': 'Bearer ' + token, 'apikey': SUPA_KEY } }
      );
      if (r.ok) canon_blocks = await r.json() || [];
    }
  } catch(_) {}

  return {
    format_version: FORMAT_V,
    user_id:        uid || null,
    user_email:     state.user ? state.user.email || null : null,
    saved_at:       new Date().toISOString(),
    xp_state:       stripImages(xp_state),
    quest_events:   quest_events,
    quest_resolved: quest_resolved,
    quest_deltas:   quest_deltas,
    quest_char:     stripImages(quest_char),
    you_card:       stripImages(you_card),
    prints:         prints,
    scenes:         scenes,
    worlds:         worlds,
    canon_blocks:   canon_blocks,
    style_prefs:    style_prefs,
    bot_config:     bot_config,
    tab_order:      tab_order,
  };
}

// ── CLOUD WRITE ───────────────────────────────────────────────
async function cloudWrite(save) {
  const token = state.session ? state.session.access_token : null;
  if (!token || !state.user || !state.user.id) return false;
  let ver = 1;
  try {
    const r = await fetch(
      SUPA_URL + '/rest/v1/user_save_data?user_id=eq.' + state.user.id + '&select=save_version',
      { headers: { 'Authorization': 'Bearer ' + token, 'apikey': SUPA_KEY } }
    );
    const rows = await r.json();
    if (rows && rows[0] && rows[0].save_version) ver = rows[0].save_version + 1;
  } catch(_) {}
  try {
    await fetch(SUPA_URL + '/rest/v1/user_save_data', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + token,
        'apikey':        SUPA_KEY,
        'Prefer':        'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id:      state.user.id,
        save_data:    save,
        save_version: ver,
        updated_at:   new Date().toISOString(),
      }),
    });
    console.log('[mastersave] cloud write v' + ver);
    return ver;
  } catch(e) { console.warn('[mastersave] cloud write failed:', e); return false; }
}

// ── CLOUD READ ────────────────────────────────────────────────
async function cloudRead() {
  const token = state.session ? state.session.access_token : null;
  if (!token || !state.user || !state.user.id) return null;
  try {
    const r = await fetch(
      SUPA_URL + '/rest/v1/user_save_data?user_id=eq.' + state.user.id + '&select=save_data,save_version,updated_at',
      { headers: { 'Authorization': 'Bearer ' + token, 'apikey': SUPA_KEY } }
    );
    const rows = await r.json();
    if (!rows || !rows[0]) return null;
    return Object.assign({}, rows[0].save_data, { _save_version: rows[0].save_version, _saved_at: rows[0].updated_at });
  } catch(e) { console.warn('[mastersave] cloud read failed:', e); return null; }
}

// ── HYDRATE ───────────────────────────────────────────────────
async function hydrate(save) {
  if (!save) return;

  if (save.xp_state) {
    try {
      const localXP     = await dbGet('config', 'xp_state');
      const localVal    = localXP ? localXP.value || null : null;
      const localTotal  = localVal ? localVal.totalXP   || 0 : 0;
      const cloudTotal  = save.xp_state.totalXP     || 0;
      const localStreak = localVal ? localVal.streakDays || 0 : 0;
      const cloudStreak = save.xp_state.streakDays   || 0;
      if (cloudTotal > localTotal) {
        const merged = Object.assign({}, save.xp_state, { streakDays: Math.max(localStreak, cloudStreak) });
        await dbSet('config', { key: 'xp_state', value: merged });
        if (window._patchXPStreak) window._patchXPStreak(Math.max(localStreak, cloudStreak));
      } else if (cloudStreak > localStreak) {
        const patched = Object.assign({}, localVal || {}, { streakDays: cloudStreak });
        await dbSet('config', { key: 'xp_state', value: patched });
        if (window._patchXPStreak) window._patchXPStreak(cloudStreak);
      }
    } catch(_) {}
  }

  if (Array.isArray(save.quest_events))   localStorage.setItem('ss_quest_events',  JSON.stringify(save.quest_events));
  if (Array.isArray(save.quest_resolved)) localStorage.setItem('ss_quest_resolved', JSON.stringify(save.quest_resolved));
  if (save.quest_char) localStorage.setItem('ss_quest_char', JSON.stringify(save.quest_char));

  if (save.quest_deltas) {
    try {
      const local  = JSON.parse(localStorage.getItem('ss_quest_deltas') || '{}');
      const merged = {};
      const allKeys = new Set(Object.keys(local).concat(Object.keys(save.quest_deltas)));
      allKeys.forEach(function(k) {
        const l = local[k] || 0, c = save.quest_deltas[k] || 0;
        merged[k] = Math.abs(l) >= Math.abs(c) ? l : c;
      });
      localStorage.setItem('ss_quest_deltas', JSON.stringify(merged));
    } catch(_) { localStorage.setItem('ss_quest_deltas', JSON.stringify(save.quest_deltas)); }
  }

  const uid = state.user ? state.user.id : null;
  if (uid && save.style_prefs) localStorage.setItem('ss_style_' + uid, JSON.stringify(save.style_prefs));
  if (uid && save.bot_config)  localStorage.setItem('ss_bot_'   + uid, JSON.stringify(save.bot_config));

  if (save.tab_order) {
    try { await dbSet('config', { key: 'tab_order', value: save.tab_order }); } catch(_) {}
  }

  if (save.you_card) {
    try { await idbPutAll('sheets', [save.you_card]); } catch(_) {}
  }

  if (save.prints && save.prints.length) {
    try {
      const existing = await idbGetAll('prints');
      const existMap = {};
      existing.forEach(function(p) { existMap[p.id] = p; });
      const toWrite = save.prints.filter(function(p) {
        if (!p.id || String(p.id).startsWith('builtin_')) return false;
        const loc = existMap[p.id];
        return !loc || (p.updated_at || '') > (loc.updated_at || '');
      });
      if (toWrite.length) await idbPutAll('prints', toWrite);
    } catch(_) {}
  }

  if (save.scenes && save.scenes.length) {
    try {
      const existing = await idbGetAll('scenes');
      const existMap = {};
      existing.forEach(function(s) { existMap[s.id] = s; });
      const toWrite = save.scenes.filter(function(s) {
        return s.id && (!existMap[s.id] || (s.updated_at || '') > (existMap[s.id].updated_at || ''));
      });
      if (toWrite.length) await idbPutAll('scenes', toWrite);
    } catch(_) {}
  }

  if (save.worlds && save.worlds.length) {
    try {
      const existing = await idbGetAll('worlds');
      const existMap = {};
      existing.forEach(function(w) { existMap[w.id] = w; });
      const toWrite = save.worlds.filter(function(w) {
        return w.id && (!existMap[w.id] || (w.updated_at || '') > (existMap[w.id].updated_at || ''));
      });
      if (toWrite.length) await idbPutAll('worlds', toWrite);
    } catch(_) {}
  }

  if (save.restored_at && save.canon_blocks && save.canon_blocks.length) {
    try {
      const token = state.session ? state.session.access_token : null;
      if (token) {
        for (var i = 0; i < save.canon_blocks.length; i++) {
          await fetch(SUPA_URL + '/rest/v1/canon_blocks', {
            method: 'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': 'Bearer ' + token,
              'apikey':        SUPA_KEY,
              'Prefer':        'resolution=merge-duplicates',
            },
            body: JSON.stringify(save.canon_blocks[i]),
          });
        }
      }
    } catch(_) {}
  }

  console.log('[mastersave] hydrated v' + (save._save_version || '?'),
    '| prints:', (save.prints || []).length,
    '| scenes:', (save.scenes || []).length,
    '| worlds:', (save.worlds || []).length,
    '| canon:',  (save.canon_blocks || []).length);
}

// ── PUBLIC: SAVE ──────────────────────────────────────────────
export async function masterSave() {
  const save = await collectState();
  try {
    const local = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    save._save_version = (local._save_version || 0) + 1;
    localStorage.setItem(LS_KEY, JSON.stringify(save));
  } catch(_) {}
  cloudWrite(save).catch(function(e) { console.warn('[mastersave] bg write failed:', e); });
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
  const date  = new Date().toISOString().slice(0, 10);
  const fname = 'spiralside_' + date + '_v' + save._save_version + '.json';
  const blob  = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href = url; a.download = fname; a.click();
  URL.revokeObjectURL(url);
  console.log('[mastersave] downloaded:', fname,
    '| prints:', (save.prints || []).length,
    '| scenes:', (save.scenes || []).length,
    '| canon:',  (save.canon_blocks || []).length);
  return fname;
}

// ── PUBLIC: UPLOAD / RESTORE ──────────────────────────────────
export async function uploadSave(file) {
  return new Promise(function(resolve, reject) {
    const reader = new FileReader();
    reader.onerror = function() { reject(new Error('file read failed')); };
    reader.onload = async function(e) {
      try {
        const save = JSON.parse(e.target.result);
        if (!save.format_version) throw new Error('not a spiralside save file');
        if (save.format_version > FORMAT_V) throw new Error('save from newer version — update app first');
        save.restored_at = new Date().toISOString();
        await hydrate(save);
        save._save_version = (save._save_version || 0) + 1;
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
export function getSaveInfo() {
  try {
    const local  = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (!local) return null;
    const xp      = local.xp_state || {};
    const savedAt = local._saved_at || local.saved_at || null;
    return {
      version:     local._save_version || 1,
      savedAt:     savedAt ? _rel(new Date(savedAt)) : 'never',
      savedAtFull: savedAt ? new Date(savedAt).toLocaleString() : '--',
      level:       xp.level       || 1,
      streak:      xp.streakDays  || 0,
      totalXP:     xp.totalXP    || 0,
      gold:        xp.gold        || 0,
      questCount:  (local.quest_resolved || []).length,
      printCount:  (local.prints         || []).length,
      sceneCount:  (local.scenes         || []).length,
      worldCount:  (local.worlds         || []).length,
      canonCount:  (local.canon_blocks   || []).length,
      botName:     local.bot_config ? local.bot_config.name || 'Sky' : 'Sky',
      userEmail:   local.user_email || (state.user ? state.user.email || '--' : '--'),
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
