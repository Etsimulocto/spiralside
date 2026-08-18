// ============================================================
// SPIRALSIDE - BLOOM3D v1.0
// 3D engine tab - iframe-embeds the self-contained BLOOM3D
// build served from /bloom3d/index.html (same origin).
// Same-origin matters: the engine keeps its entire save layer
// in localStorage, and a cross-origin frame would get that
// partitioned by tracking prevention with no error.
// Lazy: iframe is built on first tab open, zero cost at boot.
// Nimbis anchor: js/app/views/bloom3d.js
// ============================================================

// remembers whether the iframe already exists (init runs every open)
let _loaded = false;

export function initBloom3D() {
  // only build once - later opens are no-ops
  if (_loaded) return;

  // the view container created in index.html
  const view = document.getElementById('view-bloom3d');
  if (!view) return;
  _loaded = true;

  // NOTE: never set display on #view-bloom3d.
  // The .view / .view.active system owns display.
  const s = document.createElement('style');
  s.textContent = [
    '#view-bloom3d { padding: 0; }',        // edge-to-edge viewport
    '#bloom3d-frame {',
    '  flex: 1;',                           // fill the flex column
    '  min-height: 0;',                     // let flexbox size it
    '  width: 100%;',
    '  border: none;',                      // no iframe chrome
    '  background: #08080d;',               // match app bg while loading
    '}',
  ].join('\n');
  document.head.appendChild(s);

  // the iframe. allow=fullscreen is required: the engine calls
  // requestFullscreen from a HUD button and a viewport control,
  // and without this it silently does nothing.
  const f = document.createElement('iframe');
  f.id = 'bloom3d-frame';
  f.src = '/bloom3d/index.html';
  f.allow = 'fullscreen';

  // Fast path: post the grant the moment the frame loads, without waiting
  // for the engine to announce. May be dropped if the engine's listener is
  // not attached yet (its mount sits behind a project fetch) - that is what
  // the ready re-post below is for. Neither is a contract alone; the pair is.
  f.addEventListener('load', () => sendEntitlement(f));

  view.appendChild(f);
  wireEntitlementBridge(f);

  // Read the entitlement, then post it. This is a third trigger alongside
  // the frame's load event and the engine's ready announce - whichever
  // resolves last still delivers, and repeat grants are idempotent.
  loadEntitlement().then(() => sendEntitlement(f));
}

// Ask Supabase what this user owns. bloom3d_entitlement() is read-only and
// charges nothing; signed-out callers get {paid:false} rather than an error.
// Any failure leaves state alone, which reads as unentitled - the safe
// direction to fail, since a wrong 'unpaid' only greys pickers while a wrong
// 'paid' would give away the product.
async function loadEntitlement() {
  try {
    if (!window._sb) return;
    const { data, error } = await window._sb.rpc('bloom3d_entitlement');
    if (error || !data) return;
    window.state.bloom3dPaid = !!data.paid;
    window.state.bloom3dRef  = data.ref || '';
  } catch (e) { /* unentitled is the safe default */ }
}

// -- ENTITLEMENT BRIDGE --------------------------------------
// The engine has no concept of an account. It knows two states:
// entitled to some packs, or not. Every session gets exactly one
// answer - silence is never correct, because the engine retries
// four times waiting for one.
const ENGINE_ORIGIN = window.location.origin;

// Build the message for the current user.
// IMPORTANT: a signed-out or unpaid visitor gets 'bloom3d:none', NOT an
// entitlement with empty packs. Empty packs is a REVOKE - sending it on
// sign-out would strip packs from a browser that paid for them.
// Reserve empty packs for a genuine refund.
function buildGrantMessage() {
  const paid = !!(window.state && window.state.bloom3dPaid);
  if (!paid) return { type: 'bloom3d:none' };
  return {
    type:  'bloom3d:entitlement',
    packs: ['*'],                                   // everything, today
    ref:   String(window.state.bloom3dRef || ''),   // credit_transactions row id
  };
}

// Post to the frame, pinned to our own origin as the target.
function sendEntitlement(frame) {
  const f = frame || document.getElementById('bloom3d-frame');
  if (!f || !f.contentWindow) return;
  try { f.contentWindow.postMessage(buildGrantMessage(), ENGINE_ORIGIN); }
  catch (e) { /* frame torn down mid-post - nothing to do */ }
}

// Guarantee path: the engine announces on mount and keeps announcing
// until answered. Answering stops the retries.
function wireEntitlementBridge(f) {
  window.addEventListener('message', (e) => {
    // Exact origin match. Never a prefix test, never '*'.
    if (e.origin !== ENGINE_ORIGIN) return;
    if (!e.data || e.data.type !== 'bloom3d:ready') return;
    sendEntitlement(f);
  });
}

// Called by the store right after a purchase so the pickers ungrey without
// a reload. Re-sending an identical grant is idempotent on the engine side.
window.bloom3dRefreshEntitlement = () => sendEntitlement(null);
