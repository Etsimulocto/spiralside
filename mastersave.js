// ============================================================
// SPIRALSIDE — MASTER SAVE v1.0
// One JSON blob per user. All metadata. No images.
// Inspired by old-school game save files — one slot, one truth.
//
// Architecture:
//   - Cloud: Supabase user_save_data table (one row per user)
//   - Local:  localStorage key 'ss_master_save' (fast cache)
//   - Format: versioned JSON with all app state merged in
//   - Images: never stored here — OPFS/Storage only
//
// Usage:
//   import { masterSave, masterLoad, downloadSave, uploadSave } from './mastersave.js';
//   await masterSave();           // collect + write everything
//   await masterLoad();           // read cloud -> hydrate all modules
//   downloadSave();               // triggers browser download
//   await uploadSave(file);       // restore from file
//
// Nimbis anchor: js/app/mastersave.js
// ============================================================

import { state }   from './state.js';
import { dbGet }   from './db.js';

// ── CONFIG ────────────────────────────────────────────────────
const SUPA_URL  = 'https://qfawusrelwthxabfbglg.supabase.co';
const SUPA_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYXd1c3JlbHd0aHhhYmZiZ2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzc5NzUsImV4cCI6MjA4ODc1Mzk3NX0.XkeFmWq-rOH2whgfkeMylyG7Ct_0u80fMkoJlEQ5K8E';
const LS_KEY    = 'ss_master_save';
const SAVE_FORMAT_VERSION = 2; // bump when schema changes

// ── IMAGE STRIP ───────────────────────────────────────────────
// Strips base64 images from any object. Same logic as sync.js.
const BASE64_KEYS = [
  'portrait_base64','dataURL','image','avatar_base64',
  'src','bg_image','imageData','thumbnail',
];

function stripImages(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(v => stripImages(v));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && v.startsWith('data:image/')) {
      out['_has_' + k] = true; // flag so app knows to look in OPFS
    } else if (BASE64_KEYS.includes(k) && typeof v === 'string' && v.length > 500) {
      out['_has_' + k] = true;
    } else if (v && typeof v === 'object') {
      out[k] = stripImages(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ── COLLECT ALL STATE ────────────────────────────────────────
// Reads from every persistence layer and merges into one object.
// Called before every cloud write.
async function collectState() {
  // XP state — from IDB via xp module in-memory state
  let xp_state = null;
  try {
    const xpRaw = await dbGet('config', 'xp_state');
    xp_state = xpRaw?.value || null;
  } catch(_) {}

  // Quest data — from localStorage
  let quest_events  = [];
  let quest_resolved = [];
  let quest_deltas  = {};
  let quest_char    = null;
  try { quest_events   = JSON.parse(localStorage.getItem('ss_quest_events')  || '[]'); } catch(_) {}
  try { quest_resolved = JSON.parse(localStorage.getItem('ss_quest_resolved') || '[]'); } catch(_) {}
  try { quest_deltas   = JSON.parse(localStorage.getItem('ss_quest_deltas')  || '{}'); } catch(_) {}
  try { quest_char     = JSON.parse(localStorage.getItem('ss_quest_char')    || 'null'); } catch(_) {}

  // Style prefs — from localStorage
  let style_prefs = null;
  try {
    const uid = state.user?.id;
    if (uid) style_prefs = JSON.parse(localStorage.getItem('ss_style_' + uid) || 'null');
  } catch(_) {}

  // Bot config — from localStorage
  let bot_config = null;
  try {
    const uid = state.user?.id;
    if (uid) bot_config = JSON.parse(localStorage.getItem('ss_bot_' + uid) || 'null');
  } catch(_) {}

  // You card — from IDB sheets store
  let you_card = null;
  try {
    const req  = indexedDB.open('spiralside');
    you_card = await new Promise(resolve => {
      req.onerror   = () => resolve(null);
      req.onsuccess = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('sheets')) { db.close(); resolve(null); return; }
        const tx  = db.transaction('sheets', 'readonly');
        const get = tx.objectStore('sheets').get('you');
        get.onsuccess = () => { db.close(); resolve(get.result || null); };
        get.onerror   = () => { db.close(); resolve(null); };
      };
    });
  } catch(_) {}

  // Assemble — strip images from everything
  const save = {
    format_version: SAVE_FORMAT_VERSION,
    user_id:        state.user?.id   || null,
    user_email:     state.user?.email || null,
    saved_at:       new Date().toISOString(),
    // Game state
    xp_state:       stripImages(xp_state),
    quest_events,
    quest_resolved,
    quest_deltas,
    quest_char:     stripImages(quest_char),
    // Character
    you_card:       stripImages(you_card),
    // Customization
    style_prefs,
    bot_config,
  };

  return save;
}

// ── CLOUD WRITE ───────────────────────────────────────────────
// Upserts one row into user_save_data. Increments version.
async function cloudWrite(save) {
  const token = state.session?.access_token;
  if (!token || !state.user?.id) return false;

  // Read current version first to increment it
  let currentVersion = 1;
  try {
    const r = await fetch(
      SUPA_URL + '/rest/v1/user_save_data?user_id=eq.' + state.user.id + '&select=save_version',
      { headers: { 'Authorization': 'Bearer ' + token, 'apikey': SUPA_KEY } }
    );
    const rows = await r.json();
    if (rows?.[0]?.save_version) currentVersion = rows[0].save_version + 1;
  } catch(_) {}

  try {
    await fetch(SUPA_URL + '/rest/v1/user_save_data', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + token,
        'apikey':        SUPA_KEY,
        'Prefer':        'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id:      state.user.id,
        save_data:    save,
        save_version: currentVersion,
        updated_at:   new Date().toISOString(),
      }),
    });
    console.log('[mastersave] cloud write OK — v' + currentVersion);
    return true;
  } catch(e) {
    console.warn('[mastersave] cloud write failed:', e);
    return false;
  }
}

// ── CLOUD READ ────────────────────────────────────────────────
async function cloudRead() {
  const token = state.session?.access_token;
  if (!token || !state.user?.id) return null;
  try {
    const r = await fetch(
      SUPA_URL + '/rest/v1/user_save_data?user_id=eq.' + state.user.id + '&select=save_data,save_version,updated_at',
      { headers: { 'Authorization': 'Bearer ' + token, 'apikey': SUPA_KEY } }
    );
    const rows = await r.json();
    if (!rows?.[0]) return null;
    return { ...rows[0].save_data, _save_version: rows[0].save_version, _saved_at: rows[0].updated_at };
  } catch(e) {
    console.warn('[mastersave] cloud read failed:', e);
    return null;
  }
}

// ── HYDRATE FROM SAVE ─────────────────────────────────────────
// Takes a save object and writes values back to all local stores.
// Called on masterLoad() and after uploadSave().
async function hydrate(save) {
  if (!save) return;

  // XP state — write to IDB
  if (save.xp_state) {
    try {
      const { dbSet } = await import('./db.js');
      await dbSet('config', { key: 'xp_state', value: save.xp_state });
      // Reload in-memory state in xp module
      const xpMod = await import('./xp.js');
      if (xpMod.reloadXPState) await xpMod.reloadXPState();
    } catch(_) {}
  }

  // Quest data — write to localStorage
  if (Array.isArray(save.quest_events))  localStorage.setItem('ss_quest_events',  JSON.stringify(save.quest_events));
  if (Array.isArray(save.quest_resolved)) localStorage.setItem('ss_quest_resolved', JSON.stringify(save.quest_resolved));
  if (save.quest_deltas)  localStorage.setItem('ss_quest_deltas',  JSON.stringify(save.quest_deltas));
  if (save.quest_char)    localStorage.setItem('ss_quest_char',     JSON.stringify(save.quest_char));

  // Style prefs
  const uid = state.user?.id;
  if (uid && save.style_prefs) localStorage.setItem('ss_style_' + uid, JSON.stringify(save.style_prefs));
  if (uid && save.bot_config)  localStorage.setItem('ss_bot_'   + uid, JSON.stringify(save.bot_config));

  // You card — write back to IDB sheets store
  if (save.you_card) {
    try {
      const req = indexedDB.open('spiralside');
      await new Promise((resolve, reject) => {
        req.onerror   = reject;
        req.onsuccess = e => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('sheets')) { db.close(); resolve(); return; }
          const tx  = db.transaction('sheets', 'readwrite');
          tx.objectStore('sheets').put(save.you_card);
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror    = () => { db.close(); reject(); };
        };
      });
    } catch(_) {}
  }

  console.log('[mastersave] hydrated from save v' + (save._save_version || '?'));
}

// ── PUBLIC: MASTER SAVE ───────────────────────────────────────
// Call this whenever anything important changes.
// Collects state, writes to localStorage cache + cloud.
export async function masterSave() {
  const save = await collectState();

  // Always write to localStorage for speed
  try { localStorage.setItem(LS_KEY, JSON.stringify(save)); } catch(_) {}

  // Write to cloud (non-blocking — fire and forget is fine)
  cloudWrite(save).catch(e => console.warn('[mastersave] background cloud write failed:', e));

  return save;
}

// ── PUBLIC: MASTER LOAD ───────────────────────────────────────
// On boot: read cloud, merge with local, hydrate all modules.
// Cloud wins if save_version is higher. Local wins if cloud read fails.
export async function masterLoad() {
  // Try cloud first
  const cloud = await cloudRead();
  let   local = null;
  try { local = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch(_) {}

  // Pick the newer save
  let best = null;
  if (cloud && local) {
    const cloudV = cloud._save_version || 0;
    const localV = local._save_version || 0;
    best = cloudV >= localV ? cloud : local;
    console.log('[mastersave] cloud v' + cloudV + ' vs local v' + localV + ' -> using ' + (cloudV >= localV ? 'cloud' : 'local'));
  } else {
    best = cloud || local;
  }

  if (!best) {
    console.log('[mastersave] no save found — fresh start');
    return null;
  }

  await hydrate(best);
  // Update local cache with winner
  try { localStorage.setItem(LS_KEY, JSON.stringify(best)); } catch(_) {}
  return best;
}

// ── PUBLIC: DOWNLOAD SAVE ─────────────────────────────────────
// Collects current state and triggers a browser download.
// Filename: spiralside_YYYY-MM-DD_vN.json
export async function downloadSave() {
  const save = await collectState();
  // Add local save version if available
  try {
    const local = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    save._save_version = (local._save_version || 0) + 1;
  } catch(_) { save._save_version = 1; }

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = 'spiralside_' + dateStr + '_v' + save._save_version + '.json';

  const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  console.log('[mastersave] downloaded:', filename);
  return filename;
}

// ── PUBLIC: UPLOAD SAVE ───────────────────────────────────────
// Reads a .json file, validates it, hydrates all modules,
// then writes to cloud so it propagates to all devices.
export async function uploadSave(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('file read failed'));
    reader.onload  = async (e) => {
      try {
        const save = JSON.parse(e.target.result);

        // Basic validation
        if (!save.format_version) throw new Error('not a spiralside save file');
        if (save.format_version > SAVE_FORMAT_VERSION) {
          throw new Error('save file is from a newer version of spiralside — update the app first');
        }

        // Hydrate all modules from the uploaded save
        await hydrate(save);

        // Bump version and write to cloud
        save._save_version = (save._save_version || 0) + 1;
        save.restored_at   = new Date().toISOString();
        try { localStorage.setItem(LS_KEY, JSON.stringify(save)); } catch(_) {}
        await cloudWrite(save);

        console.log('[mastersave] uploaded and restored from file');
        resolve(save);
      } catch(err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}

// ── PUBLIC: GET SAVE INFO ─────────────────────────────────────
// Returns displayable metadata about the current save.
// Used by the account tab UI to show save slot info.
export function getSaveInfo() {
  try {
    const local = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (!local) return null;

    const xp = local.xp_state || {};
    const savedAt = local._saved_at || local.saved_at || null;
    const when = savedAt ? _relativeTime(new Date(savedAt)) : 'never';

    return {
      version:      local._save_version || 1,
      savedAt:      when,
      savedAtFull:  savedAt ? new Date(savedAt).toLocaleString() : '—',
      level:        xp.level    || 1,
      xp:           xp.xp       || 0,
      xpNext:       xp.xpNext   || 300,
      streak:       xp.streakDays || 0,
      totalXP:      xp.totalXP  || 0,
      gold:         xp.gold     || 0,
      questCount:   (local.quest_resolved || []).length,
      botName:      local.bot_config?.name || 'Sky',
      userEmail:    local.user_email || state.user?.email || '—',
    };
  } catch(_) { return null; }
}

// ── HELPER ────────────────────────────────────────────────────
function _relativeTime(date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}
