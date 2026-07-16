# ============================================================
# WIRE BLOOMSTUDIO CLOUD SYNC
# Defines window.bloomstudioCloudSave / bloomstudioCloudLoad on the
# parent window. BloomStudio 2.2.1+ resolves them via its cloudHook()
# helper, which checks the frame's own window first, then window.parent.
# Same origin, so no postMessage bridge is needed.
#
# Resolution happens at CALL time, not boot time, so there is no race
# between us defining the hooks and the engine booting.
#
# Run from anywhere:
#   /c/Users/quart/AppData/Local/Programs/Python/Python313/python.exe wire_bloom_cloud.py
# ============================================================

import os

# Target module. Verified against the live Vercel build before writing.
path = os.path.expanduser("~/spiralside/js/app/views/bloomstudio.js")

# Read raw, preserving whatever line endings are on disk.
# newline='' stops Python from translating them on read.
raw = open(path, encoding="utf-8", newline="").read()

# Remember if this file is CRLF so we can restore it exactly on write.
# Flipping the whole file to LF makes a 700 line diff out of a 40 line patch.
was_crlf = "\r\n" in raw

# Normalize to LF for matching only.
src = raw.replace("\r\n", "\n")

# Bail if the patch is already applied, so re-running is safe.
if "bloomstudioCloudSave" in src:
    print("ABORT: hooks already present. Nothing written.")
    raise SystemExit(0)

# ── PATCH 1: imports ─────────────────────────────────────────
# bloomstudio.js currently imports nothing. It needs the Supabase
# client and the app state (for the signed in user id).
OLD_HEAD = """// ============================================================

// remembers whether the iframe already exists (init runs on every tab open)
let _loaded = false;"""

NEW_HEAD = """// ============================================================

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
  window.bloomstudioCloudSave = async function (data) {
    try {
      const uid = state.user && state.user.id;
      if (!uid || !data) return false;
      const { error } = await sb.from('bloom_projects').upsert({
        user_id:        uid,
        project_json:   data,
        engine_version: (data && data.engine) || null,
        updated_at:     new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) {
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
  window.bloomstudioCloudLoad = async function () {
    try {
      const uid = state.user && state.user.id;
      if (!uid) return null;
      const { data, error } = await sb
        .from('bloom_projects')
        .select('project_json')
        .eq('user_id', uid)
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
}"""

# Abort unless the anchor appears exactly once.
n = src.count(OLD_HEAD)
if n != 1:
    print("ABORT: head anchor count =", n)
    i = src.find("let _loaded")
    print(repr(src[max(0, i - 200):i + 100]))
    raise SystemExit(1)
src = src.replace(OLD_HEAD, NEW_HEAD, 1)

# ── PATCH 2: call the wiring before the iframe is created ────
OLD_CALL = """  _loaded = true;

  // inject the tiny bit of CSS this view needs"""

NEW_CALL = """  _loaded = true;

  // Define the cloud hooks before the frame exists. The engine resolves
  // them at call time, so ordering is not critical, but this keeps the
  // hooks guaranteed present for the very first boot.
  _wireCloudHooks();

  // inject the tiny bit of CSS this view needs"""

n = src.count(OLD_CALL)
if n != 1:
    print("ABORT: call anchor count =", n)
    i = src.find("_loaded = true")
    print(repr(src[max(0, i - 100):i + 300]))
    raise SystemExit(1)
src = src.replace(OLD_CALL, NEW_CALL, 1)

# Restore the original line endings so the diff stays small and readable.
out = src.replace("\n", "\r\n") if was_crlf else src

open(path, "w", encoding="utf-8", newline="").write(out)
print("OK patched bloomstudio.js")
print("   line endings preserved:", "CRLF" if was_crlf else "LF")
print("   next: git add js/app/views/bloomstudio.js && git commit && git push origin main")
