# fix_vault_preview.py — run from ~/spiralside
# Bug 1: showVaultPreview loads image from IDB via dbGet which returns the stored
#         object — but the stored content is already a dataURL string, just use it.
#         The binary garbage means content is being treated as text somewhere.
# Bug 2: close button not working — event listener on #vault-preview-close fails
#         because the element is inside innerHTML and the id may conflict.

with open('js/app/vault.js','r',encoding='utf-8') as f: v=f.read()

# ── REPLACE showVaultPreview entirely with a clean version ──
idx_start = v.find('\n// ── VAULT PREVIEW OVERLAY')
if idx_start == -1:
    idx_start = v.find('\nfunction showVaultPreview')
idx_end = v.find('\n// ──', idx_start + 10)
if idx_end == -1:
    idx_end = v.find('\nexport function', idx_start + 10)
if idx_end == -1:
    idx_end = v.find('\nasync function', idx_start + 10)

print(f"showVaultPreview block: chars {idx_start} to {idx_end}")
print("Old block preview:", repr(v[idx_start:idx_start+80]))

NEW_PREVIEW = r"""
// ── VAULT PREVIEW OVERLAY ─────────────────────────────────
// Slide-up panel — safe, no window.open, no alert, no freeze
// Close: ✕ button OR tap backdrop
async function showVaultPreview(f) {
  // Remove any existing preview first
  const existing = document.getElementById('vault-preview-modal');
  if (existing) existing.remove();

  const isImg = f.type && f.type.startsWith('image/');

  // Build a placeholder modal immediately — don't block on IDB
  const modal = document.createElement('div');
  modal.id = 'vault-preview-modal';
  modal.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9000',
    'background:rgba(10,10,15,0.88)', 'backdrop-filter:blur(6px)',
    'display:flex', 'align-items:flex-end', 'justify-content:center'
  ].join(';');

  modal.innerHTML = `
    <div id="vault-preview-panel" style="
      width:100%;max-width:600px;background:var(--surface);
      border:1px solid var(--border);border-radius:20px 20px 0 0;
      max-height:85dvh;display:flex;flex-direction:column;overflow:hidden;">
      <div style="display:flex;align-items:center;justify-content:space-between;
                  padding:16px 20px 12px;border-bottom:1px solid var(--border);flex-shrink:0;">
        <div>
          <div style="font-size:0.85rem;font-weight:600;color:var(--text);
                      word-break:break-all;">${escHtml(f.name)}</div>
          <div style="font-size:0.62rem;color:var(--subtext);margin-top:2px;">
            ${fmtSize(f.size)} · ${f.type || 'unknown'}</div>
        </div>
        <button id="vp-close-btn" style="
          background:var(--muted);border:1px solid var(--border);border-radius:50%;
          width:32px;height:32px;color:var(--text);font-size:0.9rem;
          cursor:pointer;display:flex;align-items:center;justify-content:center;
          flex-shrink:0;line-height:1;">✕</button>
      </div>
      <div id="vp-body" style="
        flex:1;min-height:0;overflow-y:auto;padding:16px 20px;
        -webkit-overflow-scrolling:touch;display:flex;align-items:center;
        justify-content:center;">
        <div style="color:var(--subtext);font-size:0.72rem;">loading…</div>
      </div>
    </div>`;

  document.body.appendChild(modal);

  // ── CLOSE HANDLERS ── wire by direct reference, not getElementById
  const closeBtn = modal.querySelector('#vp-close-btn');
  const closeModal = () => modal.remove();
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  // ── LOAD CONTENT ──
  const body = modal.querySelector('#vp-body');
  try {
    if (isImg) {
      // Load dataURL from IDB
      const record = await dbGet('vault', f.name);
      const src = record?.content || '';
      if (src && src.startsWith('data:')) {
        body.innerHTML = `<img src="${src}"
          style="max-width:100%;max-height:60dvh;border-radius:8px;display:block;" />`;
      } else {
        body.innerHTML = `<div style="color:var(--subtext);font-size:0.78rem;text-align:center;">
          Image not available locally.<br>Re-upload to view.</div>`;
      }
    } else {
      // Load text from IDB
      const record = await dbGet('vault', f.name);
      const text = record?.content || f.content || '[no content]';
      if (text.startsWith('data:')) {
        // Binary file stored as dataURL — not previewable as text
        body.innerHTML = `<div style="color:var(--subtext);font-size:0.78rem;text-align:center;">
          Binary file — not previewable as text.</div>`;
      } else {
        const safe = text.slice(0, 3000)
          .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const trunc = text.length > 3000 ? '\n… [truncated]' : '';
        body.innerHTML = `<pre style="font-size:0.72rem;line-height:1.6;color:var(--text);
          white-space:pre-wrap;word-break:break-word;margin:0;
          font-family:var(--font-ui);width:100%;">${safe}${trunc}</pre>`;
      }
    }
  } catch (err) {
    body.innerHTML = `<div style="color:var(--subtext);font-size:0.78rem;">
      Error loading file: ${err.message}</div>`;
  }
}

"""

if idx_start != -1 and idx_end != -1:
    v = v[:idx_start] + NEW_PREVIEW + v[idx_end:]
    print('✓ Replaced showVaultPreview with clean async version')
else:
    print('ERROR: could not find showVaultPreview bounds')
    print(f'  idx_start={idx_start}, idx_end={idx_end}')
    exit(1)

# ── ENSURE dbGet is imported (not just aliased) ──
if "import { dbSet, dbDelete, dbGet }" not in v and "dbGet" not in v.split('\n')[0:5]:
    if "import { dbSet, dbDelete }" in v:
        v = v.replace("import { dbSet, dbDelete }", "import { dbSet, dbDelete, dbGet }", 1)
        print('✓ Added dbGet to import')
    # Remove the const alias if it exists since we import directly
if "const dbGetOne = dbGet;" in v:
    v = v.replace("const dbGetOne = dbGet;  // alias — db.js uses dbGet(store, key)\n", "", 1)
    v = v.replace("const dbGetOne = dbGet;\n", "", 1)
    print('✓ Removed dbGetOne alias (using dbGet directly now)')

# Replace any remaining dbGetOne calls with dbGet
v = v.replace('dbGetOne(', 'dbGet(')
print('✓ Replaced any dbGetOne calls with dbGet')

with open('js/app/vault.js','w',encoding='utf-8') as f: f.write(v)
print('✓ vault.js written')
print('\ngit add js/app/vault.js && git commit -m "fix: vault preview binary/close bugs" && git push --force origin main')
