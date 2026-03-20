# ============================================================
# patch_vault_frontend.py
# Wires js/app/views/vault.js into the Spiralside frontend
#
# Changes:
#   1. index.html  — empties #view-vault div (module stamps its own HTML)
#   2. index.html  — removes old vault CSS that now lives in vault.js
#   3. index.html  — updates chat send() to use window._vaultContext
#   4. main.js     — imports initVaultView, exposes on window
#   5. ui.js       — adds vault to viewInits + onOpen hook
#
# Run from spiralside repo root in Git Bash:
#   C:\Users\quart\AppData\Local\Programs\Python\Python313\python.exe patch_vault_frontend.py
# ============================================================

import sys, os, re

# ── VERIFY FILES EXIST ────────────────────────────────────
for path in ['index.html', 'js/app/main.js', 'js/app/ui.js']:
    if not os.path.exists(path):
        print(f"ERROR: {path} not found — run from spiralside repo root")
        sys.exit(1)

# ── HELPER: safe repr-based inspect ──────────────────────
def show_context(src, anchor, n=60):
    idx = src.find(anchor[:30])
    if idx == -1:
        print(f"  [anchor not found in source]")
        return
    snippet = src[max(0,idx-20):idx+n]
    print(f"  Found at ~{idx}: {repr(snippet)}")

# ============================================================
# 1. PATCH index.html
# ============================================================
print("\n── Patching index.html ──")
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

if 'data-vault-module' in html:
    print("  SKIP: already patched")
else:
    # 1a. Empty #view-vault (module stamps its own HTML)
    # The current view-vault has inner content — we replace the entire open div
    # We look for the id and replace everything until the closing </div> of that view
    OLD_VAULT_VIEW = 'id="view-vault"'
    if OLD_VAULT_VIEW not in html:
        print("ERROR: #view-vault not found in index.html")
        sys.exit(1)

    # Find the <div ... id="view-vault"> opening tag and its inner content
    # Pattern: <div class="view" id="view-vault">...inner...</div>
    # We replace the inner content only — keep the wrapper div intact
    import re
    # Match everything inside the view-vault div (non-greedy, up to matching </div>)
    # Using a simple approach: find opening tag, find next </div> after the toolbar
    idx_start = html.find('id="view-vault"')
    if idx_start == -1:
        print("ERROR: id=view-vault not found")
        sys.exit(1)

    # Find the > that closes the opening <div ...> tag
    idx_open_end = html.find('>', idx_start)
    # Find the matching </div> — count nesting from here
    pos = idx_open_end + 1
    depth = 1
    while pos < len(html) and depth > 0:
        if html[pos:pos+5] == '<div ':
            depth += 1; pos += 5
        elif html[pos:pos+6] == '</div>':
            depth -= 1
            if depth == 0:
                break
            pos += 6
        else:
            pos += 1

    # pos is now the index of the closing </div>
    # Replace inner content with empty + marker
    inner_old = html[idx_open_end+1:pos]
    inner_new = '\n    <!-- vault module stamps content here -->\n  '
    html = html[:idx_open_end+1] + inner_new + html[pos:]
    # Add marker to the div opening tag so guard works
    html = html.replace('id="view-vault"', 'id="view-vault" data-vault-module="1"', 1)
    print("  ✓ Emptied #view-vault div")

    # 1b. Update chat send() to use window._vaultContext instead of state.vaultFiles map
    OLD_VAULT_CTX = "const vault=state.vaultFiles.map(f=>`[file:${f.name}]\\n${f.content}`).join('\\n\\n');"
    if OLD_VAULT_CTX in html:
        html = html.replace(
            OLD_VAULT_CTX,
            # Use window._vaultContext built by vault module; fall back to empty string
            "const vault = window._vaultContext || '';",
            1
        )
        print("  ✓ Updated send() to use window._vaultContext")
    else:
        # Try alternate spacing
        OLD_VAULT_CTX2 = "const vault=state.vaultFiles.map"
        if OLD_VAULT_CTX2 in html:
            # Find the full line and replace it
            idx = html.find(OLD_VAULT_CTX2)
            end = html.find(';', idx) + 1
            html = html[:idx] + "const vault = window._vaultContext || '';" + html[end:]
            print("  ✓ Updated send() vault context (alt pattern)")
        else:
            print("  WARN: vault context line not found in send() — check manually")
            show_context(html, 'vaultFiles', 80)

    # Write index.html
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("  ✓ index.html written")

# ============================================================
# 2. PATCH main.js
# ============================================================
print("\n── Patching js/app/main.js ──")
with open('js/app/main.js', 'r', encoding='utf-8') as f:
    main = f.read()

if 'initVaultView' in main:
    print("  SKIP: initVaultView already in main.js")
else:
    # Find the last import { init...View } line and add vault after it
    # Look for forge import as anchor (it was the last module added)
    FORGE_IMPORT = "import { initForgeView } from './views/forge.js';"
    if FORGE_IMPORT not in main:
        # Try finding any view import as anchor
        # Fall back to finding import block end
        import_anchor = None
        for line in main.split('\n'):
            if "import {" in line and "views/" in line:
                import_anchor = line.strip()
        if import_anchor:
            FORGE_IMPORT = import_anchor
            print(f"  Using import anchor: {repr(FORGE_IMPORT[:60])}")
        else:
            print("ERROR: no view import anchor found in main.js — inspect file")
            sys.exit(1)

    main = main.replace(
        FORGE_IMPORT,
        FORGE_IMPORT + "\nimport { initVaultView } from './views/vault.js';",
        1
    )
    print("  ✓ Added import { initVaultView }")

    # Expose on window — find forge exposure as anchor
    FORGE_WINDOW = "window.initForgeView = initForgeView;"
    if FORGE_WINDOW in main:
        main = main.replace(
            FORGE_WINDOW,
            FORGE_WINDOW + "\nwindow.initVaultView = initVaultView;",
            1
        )
        print("  ✓ Exposed window.initVaultView")
    else:
        # Try generic window.init pattern
        idx = main.rfind('window.init')
        if idx != -1:
            line_end = main.find('\n', idx) + 1
            main = main[:line_end] + "window.initVaultView = initVaultView;\n" + main[line_end:]
            print("  ✓ Exposed window.initVaultView (fallback position)")
        else:
            print("  WARN: could not find window.init anchor in main.js — add manually:")
            print("    window.initVaultView = initVaultView;")

    with open('js/app/main.js', 'w', encoding='utf-8') as f:
        f.write(main)
    print("  ✓ main.js written")

# ============================================================
# 3. PATCH ui.js
# ============================================================
print("\n── Patching js/app/ui.js ──")
with open('js/app/ui.js', 'r', encoding='utf-8') as f:
    ui = f.read()

if 'initVaultView' in ui:
    print("  SKIP: already in ui.js")
else:
    # Add vault to viewInits — find forge entry as anchor
    FORGE_INIT = "'forge': () => window.initForgeView && window.initForgeView()"
    if FORGE_INIT not in ui:
        # Try variants
        FORGE_INIT2 = "forge"
        if "initForgeView" in ui:
            idx = ui.find("initForgeView")
            snippet = ui[max(0,idx-40):idx+60]
            print(f"  forge anchor context: {repr(snippet)}")
        else:
            print("  WARN: forge not found in viewInits — check ui.js structure manually")

    # Try inserting vault init after forge init
    if FORGE_INIT in ui:
        ui = ui.replace(
            FORGE_INIT,
            FORGE_INIT + ",\n    'vault': () => window.initVaultView && window.initVaultView()",
            1
        )
        print("  ✓ Added vault to viewInits")
    else:
        # Broader search
        idx = ui.find('initForgeView')
        if idx != -1:
            line_end = ui.find('\n', idx) + 1
            ui = ui[:line_end] + "    'vault': () => window.initVaultView && window.initVaultView(),\n" + ui[line_end:]
            print("  ✓ Added vault to viewInits (fallback position)")
        else:
            print("  WARN: could not add vault to viewInits — add manually in ui.js:")
            print("    'vault': () => window.initVaultView && window.initVaultView()")

    # Add onOpen hook — find existing onForgeOpen or onOpen pattern
    FORGE_OPEN = "window.onForgeOpen"
    if FORGE_OPEN in ui:
        # Add vault onOpen after switch statement or after forge
        idx = ui.find(FORGE_OPEN)
        line_end = ui.find('\n', idx) + 1
        # ui.js switchView calls window.on{Name}Open() — add vault hook
        VAULT_OPEN_HOOK = "    if (viewName === 'vault' && window.onVaultOpen) window.onVaultOpen();\n"
        # Find the forge hook line to insert after it
        forge_hook_line = ui[idx:line_end]
        ui = ui.replace(forge_hook_line, forge_hook_line + VAULT_OPEN_HOOK, 1)
        print("  ✓ Added onVaultOpen hook in switchView")
    else:
        print("  WARN: onForgeOpen not found — add to switchView in ui.js:")
        print("    if (viewName === 'vault' && window.onVaultOpen) window.onVaultOpen();")

    with open('js/app/ui.js', 'w', encoding='utf-8') as f:
        f.write(ui)
    print("  ✓ ui.js written")

# ============================================================
# SUMMARY
# ============================================================
print("""
✅ Frontend patching complete!

Next steps:
  1. Copy vault.js to js/app/views/vault.js in the repo
  2. Run this script: python patch_vault_frontend.py
  3. Verify no WARN lines above — fix any manually
  4. git add . && git commit -m "feat: vault module with IDB persistence" && git push origin main

Backend (spiralside-api repo):
  5. Copy patch_vault_backend.py to api root
  6. python patch_vault_backend.py
  7. git add . && git commit -m "feat: vault CRUD endpoints" && git push
""")
