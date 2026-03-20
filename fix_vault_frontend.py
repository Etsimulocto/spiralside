# ============================================================
# fix_vault_frontend.py
# Two fixes:
#   1. Rewrites js/app/views/vault.js to delegate to existing
#      js/app/vault.js (which already has all IDB + state logic)
#   2. Adds onVaultOpen hook into ui.js switchView body
#
# Run from ~/spiralside
# ============================================================
import sys, os

for p in ['js/app/vault.js', 'js/app/views/vault.js', 'js/app/ui.js']:
    if not os.path.exists(p):
        print(f"ERROR: {p} not found — run from spiralside root"); sys.exit(1)

# ============================================================
# FIX 1: Rewrite js/app/views/vault.js
# ============================================================
# The new views/vault.js tried to import getDB/getState which
# don't exist with those names. The existing js/app/vault.js
# already handles all IDB/state logic via initVault()/renderVault().
# The views module just needs to: stamp HTML, call initVault(), renderVault().
# HTML structure must match what vault.js expects (file-input, open-folder-btn, vault-list)

NEW_VIEWS_VAULT = r'''// ============================================================
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
'''

with open('js/app/views/vault.js', 'w', encoding='utf-8') as f:
    f.write(NEW_VIEWS_VAULT)
print("✓ js/app/views/vault.js rewritten (delegates to vault.js)")

# ============================================================
# FIX 2: Expose initVault + renderVault on window in main.js
# ============================================================
# views/vault.js calls window.initVault and window.renderVault
# These need to be exposed from main.js (same as initForgeView etc.)

with open('js/app/main.js', 'r', encoding='utf-8') as f:
    main = f.read()

if 'window.initVault ' in main or 'window.initVault=' in main or "window.initVault =" in main:
    print("✓ window.initVault already exposed in main.js")
else:
    # Find where initVault is imported
    # From inspect: "import { initVault, renderVault, removeFile, loadVaultFromDB } from './vault.js';"
    # Find the window.initVaultView exposure we added and put initVault/renderVault next to it
    ANCHOR = 'window.initVaultView = initVaultView;'
    if ANCHOR in main:
        main = main.replace(
            ANCHOR,
            ANCHOR + '\nwindow.initVault    = initVault;\nwindow.renderVault  = renderVault;',
            1
        )
        print("✓ Exposed window.initVault + window.renderVault in main.js")
    else:
        # Fallback: find window.init pattern end
        idx = main.rfind('window.init')
        if idx != -1:
            line_end = main.find('\n', idx) + 1
            main = main[:line_end] + 'window.initVault    = initVault;\nwindow.renderVault  = renderVault;\n' + main[line_end:]
            print("✓ Exposed window.initVault + window.renderVault (fallback)")
        else:
            print("WARN: could not find window.init anchor — add manually to main.js:")
            print("  window.initVault   = initVault;")
            print("  window.renderVault = renderVault;")

    with open('js/app/main.js', 'w', encoding='utf-8') as f:
        f.write(main)
    print("✓ main.js written")

# ============================================================
# FIX 3: Add onVaultOpen hook into ui.js switchView
# ============================================================
with open('js/app/ui.js', 'r', encoding='utf-8') as f:
    ui = f.read()

if 'onVaultOpen' in ui:
    print("✓ onVaultOpen already in ui.js")
else:
    # switchView calls viewInits[id]() — find that call and add onOpen hook after it
    # From inspect we know the pattern has vault in viewInits already
    # Find the line that calls the init function and add onOpen hook after
    # Pattern: something like `if (viewInits[id]) viewInits[id]();`
    # or `const init = viewInits[id]; if (init) init();`
    for candidate in [
        'viewInits[id]()',
        'init()',
        'viewInits[id] && viewInits[id]()',
    ]:
        idx = ui.find(candidate)
        if idx != -1:
            line_end = ui.find('\n', idx) + 1
            ui = ui[:line_end] + \
                '  // Fire onOpen hook so modules can refresh state on revisit\n' + \
                '  if (window[`on${id[0].toUpperCase()}${id.slice(1)}Open`]) {\n' + \
                '    window[`on${id[0].toUpperCase()}${id.slice(1)}Open`]();\n' + \
                '  }\n' + \
                ui[line_end:]
            print(f"✓ Added generic onOpen hook in switchView (anchor: {repr(candidate)})")
            break
    else:
        # Last resort: find where active class is set on a view and insert after
        VIEW_SHOW = "classList.add('active')"
        idx = ui.rfind(VIEW_SHOW)  # last occurrence likely in switchView
        if idx != -1:
            line_end = ui.find('\n', idx) + 1
            ui = ui[:line_end] + \
                '  if (window[`on${id[0].toUpperCase()}${id.slice(1)}Open`]) {\n' + \
                '    window[`on${id[0].toUpperCase()}${id.slice(1)}Open`]();\n  }\n' + \
                ui[line_end:]
            print("✓ Added onOpen hook in switchView (classList anchor)")
        else:
            print("WARN: could not find switchView body — add manually to ui.js switchView:")
            print("  if (window[`on${id[0].toUpperCase()}${id.slice(1)}Open`]) {")
            print("    window[`on${id[0].toUpperCase()}${id.slice(1)}Open`]();")
            print("  }")

    with open('js/app/ui.js', 'w', encoding='utf-8') as f:
        f.write(ui)
    print("✓ ui.js written")

print("""
✅ Frontend fixes complete!

Run:
  git add . && git commit -m "fix: vault view module delegates to vault.js, onOpen hook" && git push origin main
""")
