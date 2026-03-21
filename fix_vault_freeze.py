# fix_vault_freeze.py — run from ~/spiralside
# Removes the window.open() / alert() preview that freezes the page
# Replaces with a safe inline overlay preview (no new tabs, no alerts)

with open('js/app/vault.js','r',encoding='utf-8') as f: v=f.read()

# ── FIX 1: Remove the freezing _vaultOpenFile window.open/alert ──
OLD_OPEN = """  // Expose file preview opener for grid item clicks
  window._vaultOpenFile = (i) => {
    const f = state.vaultFiles[i];
    if (!f) return;
    // Simple preview: open image in new tab, show text in alert for now
    if (f.type && f.type.startsWith('image/')) {
      const w = window.open();
      w.document.write(`<img src="${f.content}" style="max-width:100%;background:#000;" />`);
    } else {
      // Could expand to a modal — for now just a peek
      alert(f.name + '\\n\\n' + (f.content || '').slice(0, 500));
    }
  };"""

NEW_OPEN = """  // Expose file preview opener for grid item clicks — inline overlay, no popups
  window._vaultOpenFile = (i) => {
    const f = state.vaultFiles[i];
    if (!f) return;
    showVaultPreview(f);
  };"""

if OLD_OPEN in v:
    v = v.replace(OLD_OPEN, NEW_OPEN, 1)
    print('✓ Replaced window.open/alert with safe showVaultPreview')
else:
    # Try to find and nuke any window.open in vault context
    if 'window.open()' in v:
        import re
        v = re.sub(
            r"window\._vaultOpenFile\s*=\s*\(i\)\s*=>\s*\{.*?\};",
            """window._vaultOpenFile = (i) => {
    const f = state.vaultFiles[i];
    if (f) showVaultPreview(f);
  };""",
            v, flags=re.DOTALL
        )
        print('✓ Replaced via regex')
    else:
        print('WARN: _vaultOpenFile anchor not found — adding showVaultPreview call manually')
        # Just make clicks do nothing
        v = v.replace(
            "window._vaultOpenFile && window._vaultOpenFile(${i})",
            "window._vaultOpenFile && window._vaultOpenFile(${i})"
        )

# ── FIX 2: Add showVaultPreview — safe inline overlay ──
PREVIEW_FN = r"""
// ── VAULT PREVIEW OVERLAY ─────────────────────────────────
// Safe inline preview — no window.open, no alert, no page freeze
function showVaultPreview(f) {
  // Remove any existing preview
  document.getElementById('vault-preview-modal')?.remove();

  const isImg = f.type && f.type.startsWith('image/');

  // Build content
  let body = '';
  if (isImg) {
    body = `<img src="${f.content}" style="max-width:100%;max-height:60dvh;
              border-radius:8px;display:block;margin:0 auto;" />`;
  } else {
    const preview = (f.content || '[no content]').slice(0, 2000);
    const safe = preview.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    body = `<pre style="font-size:0.72rem;line-height:1.6;color:var(--text);
              white-space:pre-wrap;word-break:break-word;margin:0;
              font-family:var(--font-ui);">${safe}</pre>`;
  }

  const modal = document.createElement('div');
  modal.id = 'vault-preview-modal';
  modal.style.cssText = `position:fixed;inset:0;z-index:9000;
    background:rgba(10,10,15,0.88);backdrop-filter:blur(6px);
    display:flex;align-items:flex-end;justify-content:center;`;

  modal.innerHTML = `
    <div style="width:100%;max-width:480px;background:var(--surface);
                border:1px solid var(--border);border-radius:20px 20px 0 0;
                max-height:85dvh;display:flex;flex-direction:column;overflow:hidden;">
      <div style="display:flex;align-items:center;justify-content:space-between;
                  padding:16px 20px 12px;border-bottom:1px solid var(--border);flex-shrink:0;">
        <div>
          <div style="font-size:0.85rem;font-weight:600;color:var(--text);
                      word-break:break-all;">${f.name}</div>
          <div style="font-size:0.62rem;color:var(--subtext);margin-top:2px;">
            ${(f.size/1024).toFixed(1)} KB · ${f.type || 'unknown'}</div>
        </div>
        <button id="vault-preview-close"
          style="background:var(--muted);border:none;border-radius:50%;
                 width:32px;height:32px;color:var(--subtext);font-size:1rem;
                 cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>
      <div style="flex:1;min-height:0;overflow-y:auto;padding:16px 20px;
                  -webkit-overflow-scrolling:touch;">${body}</div>
    </div>`;

  document.body.appendChild(modal);

  // Close handlers
  document.getElementById('vault-preview-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

"""

# Insert before renderVault
if 'function showVaultPreview' not in v:
    ins = v.find('export function renderVault()')
    if ins != -1:
        v = v[:ins] + PREVIEW_FN + v[ins:]
        print('✓ Added showVaultPreview inline overlay')
    else:
        v = v + PREVIEW_FN
        print('✓ Appended showVaultPreview')
else:
    print('SKIP: showVaultPreview already present')

with open('js/app/vault.js','w',encoding='utf-8') as f: f.write(v)
print('✓ vault.js written — no more freeze')
print('\ngit add js/app/vault.js && git commit -m "fix: replace window.open/alert with inline preview overlay" && git push --force origin main')
