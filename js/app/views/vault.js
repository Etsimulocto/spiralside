// ============================================================
// SPIRALSIDE — VAULT VIEW v2.0
// View module shell — stamps HTML, delegates all logic to
// js/app/vault.js which owns IDB + state.vaultFiles
// Follows forge/guide init-guard pattern exactly
// Nimbis anchor: js/app/views/vault.js
// ============================================================

// ── HTML TEMPLATE ─────────────────────────────────────────
// Element IDs must match what js/app/vault.js wires up:
//   #file-input, #open-folder-btn, #vault-list
function vaultViewHTML() {
  return `
    <div id="vault-inner"
      style="flex:1;min-height:0;overflow-y:auto;
             padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));
             -webkit-overflow-scrolling:touch;">

      <!-- ── TOOLBAR ── -->
      <div class="vault-toolbar">
        <button class="vault-btn" id="add-file-btn">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9"  y1="15" x2="15" y2="15"/>
          </svg>
          add file
        </button>
        <button class="vault-btn" id="open-folder-btn">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
          folder
        </button>
      </div>

      <!-- ── FILE LIST ── -->
      <div id="vault-list"></div>

      <!-- ── HIDDEN FILE INPUT (wired by vault.js initVault) ── -->
      <input type="file" id="file-input" style="display:none"
        accept=".txt,.md,.pdf,.json,.js,.ts,.py,.html,.css,.csv,.png,.jpg,.jpeg,.webp,.mp3,.wav,.ogg,.flac,.m4a"
        multiple />
    </div>
  `;
}

// ── PUBLIC INIT ───────────────────────────────────────────
// Called by viewInits in ui.js on first visit
export function initVaultView() {
  const el = document.getElementById('view-vault');
  if (!el) return;

  // Init guard — same pattern as forge/guide
  if (el.dataset.initialized) {
    // Revisit — just re-render the list with current state
    window.renderVault && window.renderVault();
    return;
  }
  el.dataset.initialized = 'true';

  // Stamp HTML
  el.innerHTML = vaultViewHTML();

  // Wire all vault logic (file input, folder picker, IDB) via existing vault.js
  window.initVault && window.initVault();

  // Render current files
  window.renderVault && window.renderVault();
}

// onVaultOpen called by ui.js switchView on every revisit
window.onVaultOpen = () => {
  window.renderVault && window.renderVault();
};
