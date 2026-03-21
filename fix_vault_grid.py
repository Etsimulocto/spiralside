# fix_vault_grid.py — run from ~/spiralside
# Changes vault from list to 4-wide grid with image thumbnails

with open('js/app/vault.js','r',encoding='utf-8') as f: s=f.read()

# Find the full renderVault function and replace it
# We need to see where it ends — find the next export function after it
idx_start = s.find('export function renderVault()')
idx_next  = s.find('\nexport function', idx_start + 10)
if idx_next == -1:
    idx_next = s.find('\nfunction', idx_start + 10)

old_fn = s[idx_start:idx_next]

new_fn = r"""export function renderVault() {
  const list = document.getElementById('vault-list');
  if (!list) return;  // view not mounted yet

  if (!state.vaultFiles.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon" style="font-size:2rem;margin-bottom:12px">🗂️</div>
        <div style="font-size:0.78rem;line-height:1.7;color:var(--subtext)">
          No files yet.<br>Add docs and your companion will remember them.
        </div>
      </div>`;
    return;
  }

  // ── 4-wide grid ──
  list.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px;';

  list.innerHTML = state.vaultFiles.map((f, i) => {
    const isImg = f.type && f.type.startsWith('image/');
    const color = VAULT_COLORS[i % VAULT_COLORS.length];

    // Thumbnail: image preview or emoji icon
    const thumb = isImg
      ? `<div style="width:100%;aspect-ratio:1;border-radius:8px;overflow:hidden;margin-bottom:6px;background:var(--muted);">
           <img src="${f.content}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
         </div>`
      : `<div style="width:100%;aspect-ratio:1;border-radius:8px;margin-bottom:6px;
                     background:var(--muted);display:flex;align-items:center;
                     justify-content:center;font-size:1.6rem;">
           ${mimeEmoji(f.type)}
         </div>`;

    return `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;
                  padding:8px;cursor:pointer;transition:border-color 0.2s;position:relative;"
           onmouseenter="this.style.borderColor='${color}'"
           onmouseleave="this.style.borderColor='var(--border)'"
           onclick="window._vaultOpenFile && window._vaultOpenFile(${i})">
        ${thumb}
        <div style="font-size:0.6rem;color:var(--text);white-space:nowrap;overflow:hidden;
                    text-overflow:ellipsis;letter-spacing:0.02em;" title="${escHtml(f.name)}">
          ${escHtml(f.name)}
        </div>
        <div style="font-size:0.55rem;color:var(--subtext);margin-top:2px;">
          ${fmtSize(f.size)}
        </div>
        <button onclick="event.stopPropagation();removeFile(${i})"
          style="position:absolute;top:4px;right:4px;width:18px;height:18px;border-radius:50%;
                 background:rgba(10,10,15,0.75);border:1px solid var(--border);
                 color:var(--subtext);font-size:0.6rem;cursor:pointer;display:flex;
                 align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;"
          onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0'"
          class="vault-del-btn">✕</button>
      </div>`;
  }).join('');
}

"""

# Helper functions to inject (if not already present)
HELPERS = r"""
// ── VAULT RENDER HELPERS ──────────────────────────────────
function mimeEmoji(type) {
  if (!type) return '📄';
  if (type.startsWith('image/'))        return '🖼️';
  if (type === 'application/pdf')       return '📕';
  if (type.includes('markdown'))        return '📝';
  if (type.includes('javascript') || type.includes('json')) return '🧩';
  if (type.includes('python'))          return '🐍';
  if (type.includes('html'))            return '🌐';
  if (type.startsWith('audio/'))        return '🎵';
  return '📄';
}
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmtSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
  return (b/1048576).toFixed(1) + ' MB';
}
"""

if idx_start == -1:
    print("ERROR: renderVault not found"); exit(1)
if idx_next == -1:
    print("ERROR: could not find end of renderVault"); exit(1)

# Replace the function
s = s[:idx_start] + new_fn + s[idx_next:]

# Inject helpers before renderVault if not already there
if 'function mimeEmoji' not in s:
    # Insert before renderVault
    ins = s.find('export function renderVault()')
    s = s[:ins] + HELPERS + s[ins:]
    print("✓ Injected mimeEmoji/escHtml/fmtSize helpers")

# Also expose _vaultOpenFile on window for grid item click
# Wire it in initVault after the existing event listeners
OPEN_WIRE = "  if (addBtn) addBtn.addEventListener('click', () => document.getElementById('file-input').click());"
OPEN_WIRE_NEW = OPEN_WIRE + r"""
  // Expose file preview opener for grid item clicks
  window._vaultOpenFile = (i) => {
    const f = state.vaultFiles[i];
    if (!f) return;
    // Simple preview: open image in new tab, show text in alert for now
    if (f.type && f.type.startsWith('image/')) {
      const w = window.open();
      w.document.write(`<img src="${f.content}" style="max-width:100%;background:#000;" />`);
    } else {
      // Could expand to a modal — for now just a peek
      alert(f.name + '\n\n' + (f.content || '').slice(0, 500));
    }
  };"""

if OPEN_WIRE in s:
    s = s.replace(OPEN_WIRE, OPEN_WIRE_NEW, 1)
    print("✓ Wired _vaultOpenFile preview")
else:
    print("WARN: addBtn wire anchor not found — _vaultOpenFile not wired (grid clicks won't preview)")

with open('js/app/vault.js','w',encoding='utf-8') as f: f.write(s)
print("✓ vault.js written — grid layout + thumbnails")

# Also update index.html CSS: make vault-btn smaller (toolbar)
# and add hover reveal for delete buttons
with open('index.html','r',encoding='utf-8') as f: h=f.read()

OLD_CSS = '.vault-toolbar { display: flex; gap: 8px; margin-bottom: 20px; }'
if OLD_CSS in h:
    h = h.replace(OLD_CSS, '.vault-toolbar { display: flex; gap: 8px; margin-bottom: 16px; }', 1)
    # Also add hover-reveal rule for vault del buttons
    if '.vault-del-btn:hover' not in h:
        h = h.replace(
            '.vault-toolbar { display: flex; gap: 8px; margin-bottom: 16px; }',
            '.vault-toolbar { display: flex; gap: 8px; margin-bottom: 16px; }\n    .vault-del-btn { opacity:0; transition:opacity 0.2s; }\n    .vault-item:hover .vault-del-btn { opacity:1; }'
        )
    with open('index.html','w',encoding='utf-8') as f: f.write(h)
    print("✓ index.html CSS updated")
else:
    print("SKIP: vault-toolbar CSS anchor not found (non-critical)")

print("\n✅ Done!")
print("git add js/app/vault.js index.html && git commit -m 'feat: vault grid layout with image thumbnails' && git push --force origin main")
