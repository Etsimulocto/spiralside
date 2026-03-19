// ============================================================
// SPIRALSIDE — STUDIO VIEW v1.0
// Scene + World card builder — renders into view-studio
// Nimbis anchor: js/app/views/studio.js
// ============================================================

let initialized = false;

// Called by switchView('studio') via FAB_TABS onOpen
export function initStudioView() {
  const el = document.getElementById('view-studio');
  if (!el) return;

  if (!initialized) {
    el.innerHTML = `
      <div class="codex-tabs">
        <button class="codex-tab active" data-tab="scenes">scenes</button>
        <button class="codex-tab" data-tab="worlds">worlds</button>
      </div>
      <div class="codex-body">
        <div class="codex-toolbar">
          <button class="codex-new-btn" id="codex-new-scene-btn">+ new scene</button>
          <button class="codex-new-btn" id="codex-new-world-btn" style="display:none">+ new world</button>
        </div>
        <div class="codex-scene-grid" id="codex-scene-grid"></div>
        <div class="codex-world-grid" id="codex-world-grid" style="display:none"></div>
      </div>`;
    initialized = true;
  }

  // Init codex module now that DOM exists
  if (window.initCodex) window.initCodex();
}
