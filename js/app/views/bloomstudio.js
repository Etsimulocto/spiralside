// ============================================================
// SPIRALSIDE - BLOOMSTUDIO v1.0
// Game maker tab - iframe-embeds the self-contained BloomStudio
// build served from /bloomstudio/index.html (same origin).
// Lazy: iframe is only created on first tab open, so it adds
// zero cost to app boot. Fully isolated - no style collisions.
// Nimbis anchor: js/app/views/bloomstudio.js
// ============================================================

// sb = Supabase client, state = app state (state.user.id is the owner)
import { sb } from '../auth.js';
import { state } from '../state.js';

// remembers whether the iframe already exists (init runs on every tab open)
let _loaded = false;

// ── CLOUD SYNC HOOKS ──────────────────────────────────────────
// BloomStudio 2.2.1 added a cloudHook(name) resolver that looks for
// window[name] then window.parent[name]. We define both here on the
// parent. The engine picks them up on its own schedule.
//
// Table: bloom_projects (user_id pk, project_json, engine_version, updated_at)
// Deliberately NOT routed through mastersave.js - its stripImages() walk
// would gut base64 sprite data into _has_imageData:true and hand back a
// project that looks like it loaded but is hollow.
function _wireCloudHooks() {
  // Only wire once.
  if (window.bloomstudioCloudSave) return;

  // ── SAVE ───────────────────────────────────────────────────
  // Engine debounces internally (_cloudT) and hands us projectData().
  // Returning true makes it log "Cloud sync on" once. Never throw:
  // the engine wraps us in Promise.resolve().catch(), but a rejection
  // would silently disable the "cloud on" confirmation forever.
  window.bloomstudioCloudSave = async function (data, slot, engineVersion) {
    try {
      const uid = state.user && state.user.id;
      if (!uid || !data) return false;
      // Slot 0 is the autosave. Engine 2.2.1 and earlier called this with
      // one argument, so an absent or invalid slot MUST mean 0 - that is
      // what keeps build 70 working if it is ever loaded against this code.
      const s = (Number.isInteger(slot) && slot >= 0 && slot <= 10) ? slot : 0;
      const { error } = await sb.from('bloom_projects').upsert({
        user_id:        uid,
        slot:           s,
        project_json:   data,
        // The engine now passes its ENGINE constant. The old data.engine
        // probe was always null - the project JSON has no engine key,
        // which is why every row on record read as backfilled.
        engine_version: engineVersion || (data && data.engine) || null,
        updated_at:     new Date().toISOString(),
      }, { onConflict: 'user_id,slot' });
      if (error) {
        // Free tier cap. Raised by the BEFORE INSERT trigger on
        // bloom_projects. The LOCAL save already succeeded before we were
        // called, so this is a nudge, never a lost save. Token is stable
        // and matched by the engine to raise the upgrade modal.
        if (error.message && error.message.indexOf('bloom_slot_cap') !== -1) {
          console.log('[bloom] slot cap reached - local save is fine, cloud backup needs the unlock');
          return 'bloom_slot_cap';
        }
        console.warn('[bloom] cloud save failed:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[bloom] cloud save threw:', e);
      return false;
    }
  };

  // ── LOAD ───────────────────────────────────────────────────
  // The engine only calls this when it found NO local save, so this
  // can never clobber good local work. Return null on anything
  // unusable and the engine falls back to its own storage-reset notice.
  window.bloomstudioCloudLoad = async function (slot) {
    try {
      const uid = state.user && state.user.id;
      if (!uid) return null;
      // Same defaulting rule as save: absent or invalid slot means the
      // autosave. Keeps a one-argument caller working unchanged.
      const s = (Number.isInteger(slot) && slot >= 0 && slot <= 10) ? slot : 0;
      const { data, error } = await sb
        .from('bloom_projects')
        .select('project_json')
        .eq('user_id', uid)
        .eq('slot', s)
        .maybeSingle();
      if (error) {
        console.warn('[bloom] cloud load failed:', error.message);
        return null;
      }
      const proj = data && data.project_json;
      // Guard: never hand back an empty or non-object record. A thin
      // record is worse than none - the engine would apply it and the
      // user would watch their project load as nothing.
      if (!proj || typeof proj !== 'object' || !Object.keys(proj).length) return null;
      console.log('[bloom] project restored from cloud');
      return proj;
    } catch (e) {
      console.warn('[bloom] cloud load threw:', e);
      return null;
    }
  };

  console.log('[bloom] cloud hooks wired');
}

export function initBloomstudio() {
  // only build the iframe once - later opens are no-ops
  if (_loaded) return;
  // the view container created in index.html
  const view = document.getElementById('view-bloomstudio');
  if (!view) return;
  _loaded = true;

  // Define the cloud hooks before the frame exists. The engine resolves
  // them at call time, so ordering is not critical, but this keeps the
  // hooks guaranteed present for the very first boot.
  _wireCloudHooks();

  // inject the tiny bit of CSS this view needs
  // NOTE: never set display on #view-bloomstudio - .view/.view.active own display
  const s = document.createElement('style');
  s.textContent = [
    '#view-bloomstudio { padding: 0; }',                    // edge-to-edge canvas
    '#bloomstudio-frame {',
    '  flex: 1;',                                           // fill the flex column
    '  min-height: 0;',                                     // allow flexbox to size it
    '  width: 100%;',
    '  border: none;',                                      // no iframe chrome
    '  background: #08080d;',                               // match app bg while loading
    '}',
  ].join('\n');
  document.head.appendChild(s);

  // the iframe itself - same-origin static file, so a future
  // postMessage bridge for auth/credits is a clean upgrade
  const f = document.createElement('iframe');
  f.id = 'bloomstudio-frame';
  f.src = '/bloomstudio/index.html';                        // served by Vercel
  f.allow = 'fullscreen';                                   // let the studio go fullscreen
  view.appendChild(f);
}
