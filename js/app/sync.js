// ============================================================
// SPIRALSIDE — SYNC v2.0
// Cloud backup with image stripping — text to DB, blobs to Storage
// Free: text only. Archive ($2/mo): images backed up to Supabase Storage.
// Nimbis anchor: js/app/sync.js
// ============================================================

import { state } from './state.js';

const SUPA_URL = 'https://qfawusrelwthxabfbglg.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYXd1c3JlbHd0aHhhYmZiZ2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzc5NzUsImV4cCI6MjA4ODc1Mzk3NX0.XkeFmWq-rOH2whgfkeMylyG7Ct_0u80fMkoJlEQ5K8E';
const STORAGE_BUCKET = 'user-assets';

// ── IMAGE STRIP ───────────────────────────────────────────────
// Removes base64 image data from any object before writing to DB.
// Replaces with _has_image: true so app knows to look in OPFS/Storage.
// Handles nested objects and arrays recursively.
const BASE64_KEYS = [
  'portrait_base64', 'dataURL', 'image', 'avatar_base64',
  'src', 'bg_image', 'imageData', 'thumbnail',
];

function stripImages(obj, path = '') {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((v, i) => stripImages(v, path + '[' + i + ']'));
  const out = {};
  let stripped = false;
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && v.startsWith('data:image/')) {
      // Replace blob with flag — app reads from OPFS instead
      out['_has_' + k] = true;
      stripped = true;
      if (process?.env?.NODE_ENV !== 'production') {
        console.log('[sync] stripped', k, 'at', path, '(' + Math.round(v.length / 1024) + ' KB)');
      }
    } else if (BASE64_KEYS.includes(k) && typeof v === 'string' && v.length > 500) {
      // Key looks like an image field and value is large — strip it
      out['_has_' + k] = true;
      stripped = true;
    } else if (v && typeof v === 'object') {
      out[k] = stripImages(v, path + '.' + k);
    } else {
      out[k] = v;
    }
  }
  if (stripped) out._images_stripped = true;
  return out;
}

// ── ESTIMATE STRIPPED SIZE ────────────────────────────────────
function estimateSize(obj) {
  return new Blob([JSON.stringify(obj)]).size;
}

// ── CORE SYNC SAVE ────────────────────────────────────────────
// Always strips images before saving.
// If user has archive plan AND image key provided, also backs up to Storage.
export async function syncSave(record_type, data, opts = {}) {
  const token = state.session?.access_token;
  if (!token) return;

  // Strip images from DB payload
  const stripped = stripImages(data);
  const sizeKB = Math.round(estimateSize(stripped) / 1024);
  console.log('[sync] saving', record_type, sizeKB + ' KB (stripped)');

  try {
    await fetch(SUPA_URL + '/rest/v1/user_data', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + token,
        'apikey':        SUPA_KEY,
        'Prefer':        'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id:     state.user.id,
        record_type,
        data:        stripped,
        updated_at:  new Date().toISOString(),
      }),
    });
  } catch(e) { console.warn('[sync] save failed:', record_type, e); }

  // If archive user and image data provided, back up to Storage too
  if (opts.imageKey && opts.imageData) {
    await syncSaveImage(opts.imageKey, opts.imageData);
  }
}

// ── STORAGE: SAVE IMAGE (Archive plan only) ───────────────────
export async function syncSaveImage(path, dataURL) {
  const token = state.session?.access_token;
  if (!token) return false;

  // Check plan before uploading
  const plan = await getStoragePlan();
  if (plan !== 'archive') {
    console.log('[sync] storage upload skipped — not on archive plan');
    return false;
  }

  try {
    // Convert dataURL to blob
    const res  = await fetch(dataURL);
    const blob = await res.blob();
    const fullPath = state.user.id + '/' + path;

    const r = await fetch(
      SUPA_URL + '/storage/v1/object/' + STORAGE_BUCKET + '/' + fullPath,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'apikey':        SUPA_KEY,
          'Content-Type':  blob.type || 'image/png',
          'x-upsert':      'true',
        },
        body: blob,
      }
    );
    if (r.ok) {
      console.log('[sync:storage] uploaded', fullPath);
      return true;
    } else {
      console.warn('[sync:storage] upload failed', r.status, await r.text());
      return false;
    }
  } catch(e) {
    console.warn('[sync:storage] upload error:', e);
    return false;
  }
}

// ── STORAGE: GET IMAGE URL (Archive plan only) ────────────────
export function syncGetImageURL(path) {
  if (!state.user?.id) return null;
  return SUPA_URL + '/storage/v1/object/public/' + STORAGE_BUCKET + '/' + state.user.id + '/' + path;
}

// ── STORAGE: DELETE IMAGE ─────────────────────────────────────
export async function syncDeleteImage(path) {
  const token = state.session?.access_token;
  if (!token) return;
  try {
    const fullPath = state.user.id + '/' + path;
    await fetch(
      SUPA_URL + '/storage/v1/object/' + STORAGE_BUCKET + '/' + fullPath,
      { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token, 'apikey': SUPA_KEY } }
    );
    console.log('[sync:storage] deleted', fullPath);
  } catch(e) { console.warn('[sync:storage] delete error:', e); }
}

// ── STORAGE PLAN CHECK ────────────────────────────────────────
// Cached for 5 minutes — avoids Supabase call on every sync
let _planCache = null;
let _planCacheTs = 0;
const PLAN_TTL = 300000; // 5 min

export async function getStoragePlan() {
  if (_planCache && Date.now() - _planCacheTs < PLAN_TTL) return _planCache;
  const token = state.session?.access_token;
  if (!token) return 'free';
  try {
    const r = await fetch(
      SUPA_URL + '/rest/v1/user_usage?user_id=eq.' + state.user.id + '&select=storage_plan,storage_expires_at',
      { headers: { 'Authorization': 'Bearer ' + token, 'apikey': SUPA_KEY } }
    );
    const rows = await r.json();
    const row  = rows?.[0];
    if (!row) { _planCache = 'free'; _planCacheTs = Date.now(); return 'free'; }
    const plan    = row.storage_plan || 'free';
    const expires = row.storage_expires_at ? new Date(row.storage_expires_at) : null;
    const active  = plan === 'archive' && expires && expires > new Date();
    _planCache   = active ? 'archive' : 'free';
    _planCacheTs = Date.now();
    return _planCache;
  } catch(e) {
    return 'free';
  }
}

// Bust plan cache on purchase
export function bustPlanCache() { _planCache = null; _planCacheTs = 0; }

// ── STORAGE USAGE ─────────────────────────────────────────────
// Returns { db_bytes, storage_bytes, plan }
export async function getStorageUsage() {
  const token = state.session?.access_token;
  if (!token) return { db_bytes: 0, storage_bytes: 0, plan: 'free' };
  try {
    const r = await fetch(
      SUPA_URL + '/rest/v1/user_data?user_id=eq.' + state.user.id + '&select=data',
      { headers: { 'Authorization': 'Bearer ' + token, 'apikey': SUPA_KEY } }
    );
    const rows = await r.json();
    const db_bytes = (rows || []).reduce((acc, row) => acc + estimateSize(row.data), 0);
    const plan = await getStoragePlan();
    return { db_bytes, plan };
  } catch(e) {
    return { db_bytes: 0, plan: 'free' };
  }
}

// ── CORE LOAD ─────────────────────────────────────────────────
export async function syncLoad(record_type) {
  const token = state.session?.access_token;
  if (!token) return null;
  try {
    const r = await fetch(
      SUPA_URL + '/rest/v1/user_data?user_id=eq.' + state.user.id + '&record_type=eq.' + record_type + '&select=data',
      { headers: { 'Authorization': 'Bearer ' + token, 'apikey': SUPA_KEY } }
    );
    const rows = await r.json();
    return (rows && rows[0]) ? rows[0].data : null;
  } catch(e) { console.warn('[sync] load failed:', record_type, e); return null; }
}

export async function syncDelete(record_type) {
  const token = state.session?.access_token;
  if (!token) return;
  try {
    await fetch(
      SUPA_URL + '/rest/v1/user_data?user_id=eq.' + state.user.id + '&record_type=eq.' + encodeURIComponent(record_type),
      { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token, 'apikey': SUPA_KEY } }
    );
  } catch(e) { console.warn('[sync] delete failed:', record_type, e); }
}

export async function syncLoadAll() {
  const token = state.session?.access_token;
  if (!token) return [];
  try {
    const r = await fetch(
      SUPA_URL + '/rest/v1/user_data?user_id=eq.' + state.user.id + '&select=record_type,data,updated_at',
      { headers: { 'Authorization': 'Bearer ' + token, 'apikey': SUPA_KEY } }
    );
    return await r.json() || [];
  } catch(e) { console.warn('[sync] loadAll failed:', e); return []; }
}
