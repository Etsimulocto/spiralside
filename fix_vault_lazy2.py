# fix_vault_lazy2.py — run from ~/spiralside
# Root cause: images stored as full base64 in state.vaultFiles
# renderVault inlines them as src= in every tile = browser freeze
#
# Fix:
#   1. handleFileInput: store full content in IDB but state entry gets content='' for images
#   2. renderVault grid: image tiles use CSS gradient placeholder, no inline src
#   3. showVaultPreview: loads full content from IDB via dbGet on demand
#   4. loadVaultFromDB: already loads from IDB — strip content for images there too

with open('js/app/vault.js','r',encoding='utf-8') as f: v=f.read()

# ── FIX 1: handleFileInput — keep state lean for images ──
OLD_HANDLE = """  const content = isAudio ? '[audio file — added to music player]' : await f.text().catch(() => '[binary]');
    const entry   = { name: f.name, size: f.size, content, type: f.type };
    state.vaultFiles.push(entry);
    await dbSet('vault', entry);"""

NEW_HANDLE = """  const isImage = f.type && f.type.startsWith('image/');
  let content;
  if (isAudio) {
    content = '[audio file — added to music player]';
  } else if (isImage) {
    // Read full dataURL for IDB storage but DON'T keep in state (freeze risk)
    content = await new Promise(res => {
      const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(f);
    });
  } else {
    content = await f.text().catch(() => '[binary]');
  }
  // IDB entry has full content; state entry is lean (no image data)
  const idbEntry   = { name: f.name, size: f.size, content, type: f.type };
  const stateEntry = { name: f.name, size: f.size, content: isImage ? '' : content, type: f.type };
  state.vaultFiles.push(stateEntry);
  await dbSet('vault', idbEntry);"""

if OLD_HANDLE in v:
    v = v.replace(OLD_HANDLE, NEW_HANDLE, 1)
    print('✓ Fixed handleFileInput — lean state for images')
else:
    print('ANCHOR NOT FOUND for handleFileInput — showing context:')
    idx = v.find('await f.text()')
    print(repr(v[max(0,idx-120):idx+200]))

# ── FIX 2: loadVaultFromDB — strip image content from state ──
OLD_LOAD = """export function loadVaultFromDB(files) {"""

# Find the full loadVaultFromDB function
idx = v.find('export function loadVaultFromDB')
idx2 = v.find('\nexport function', idx+10)
if idx2 == -1: idx2 = v.find('\nfunction', idx+10)
old_load_fn = v[idx:idx2]
print('loadVaultFromDB found:', repr(old_load_fn[:100]))

NEW_LOAD_FN = """export function loadVaultFromDB(files) {
  // Strip image content from state — images stay in IDB, loaded lazily for preview
  state.vaultFiles = files.map(f => ({
    ...f,
    content: (f.type && f.type.startsWith('image/')) ? '' : f.content
  }));
}
"""

if 'export function loadVaultFromDB' in v:
    v = v[:idx] + NEW_LOAD_FN + v[idx2:]
    print('✓ Fixed loadVaultFromDB — lean state for images')

# ── FIX 3: renderVault grid — no inline src for images ──
# Replace the thumbnail section that inlines f.content as src
OLD_THUMB = """    // Thumbnail: image preview or emoji icon
    const thumb = isImg
      ? `<div style="width:100%;aspect-ratio:1;border-radius:8px;overflow:hidden;margin-bottom:6px;background:var(--muted);">
           <img src="${f.content}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
         </div>`
      : `<div style="width:100%;aspect-ratio:1;border-radius:8px;margin-bottom:6px;
                     background:var(--muted);display:flex;align-items:center;
                     justify-content:center;font-size:1.6rem;">
           ${mimeEmoji(f.type)}
         </div>`;"""

NEW_THUMB = """    // Thumbnail: lazy-loaded image or emoji icon
    // Images use a placeholder — src loaded async after render to avoid freeze
    const thumb = isImg
      ? `<div style="width:100%;aspect-ratio:1;border-radius:8px;overflow:hidden;
                     margin-bottom:6px;background:var(--muted);">
           <img data-vault-name="${escHtml(f.name)}"
                style="width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.3s;"
                loading="lazy" class="vault-thumb" />
         </div>`
      : `<div style="width:100%;aspect-ratio:1;border-radius:8px;margin-bottom:6px;
                     background:var(--muted);display:flex;align-items:center;
                     justify-content:center;font-size:1.6rem;">
           ${mimeEmoji(f.type)}
         </div>`;"""

if OLD_THUMB in v:
    v = v.replace(OLD_THUMB, NEW_THUMB, 1)
    print('✓ Fixed renderVault thumbnails — no inline base64')
else:
    print('ANCHOR NOT FOUND for thumb — showing context:')
    idx = v.find('Thumbnail: image preview')
    print(repr(v[max(0,idx-20):idx+300]))

# ── FIX 4: Add lazy image loader after renderVault ──
# After list.innerHTML is set, load images from IDB asynchronously
OLD_RENDER_END = """  list.innerHTML = state.vaultFiles.map((f, i) => {"""

# Find the closing of the renderVault function — find the line that sets list.innerHTML
# and add a post-render lazy load call
LAZY_LOAD_CALL = """
  // After stamping HTML, lazily load image thumbnails from IDB
  requestAnimationFrame(() => loadVaultThumbs());
"""

# Insert the lazy load call before the closing brace of renderVault
# Find it by looking for the line after list.innerHTML = ...join('')
OLD_JOIN = """  ).join('');
}

"""
NEW_JOIN = """  ).join('');

  // Lazy-load image thumbnails from IDB after render
  requestAnimationFrame(() => loadVaultThumbs());
}

"""
if OLD_JOIN in v:
    v = v.replace(OLD_JOIN, NEW_JOIN, 1)
    print('✓ Added requestAnimationFrame lazy thumb loader')
else:
    # Try alternate
    OLD_JOIN2 = "  ).join('');\n}\n"
    if OLD_JOIN2 in v:
        v = v.replace(OLD_JOIN2, "  ).join('');\n\n  requestAnimationFrame(() => loadVaultThumbs());\n}\n", 1)
        print('✓ Added lazy thumb loader (alt anchor)')
    else:
        print('WARN: join anchor not found — lazy load not wired (non-critical, images just wont show in grid)')

# ── FIX 5: Add loadVaultThumbs function ──
LAZY_FN = """
// ── LAZY THUMBNAIL LOADER ─────────────────────────────────
// Loads image content from IDB after grid is rendered
// so the main thread isn't blocked by base64 strings
async function loadVaultThumbs() {
  const imgs = document.querySelectorAll('.vault-thumb');
  for (const img of imgs) {
    const name = img.dataset.vaultName;
    if (!name) continue;
    try {
      // dbGet from IDB vault store by name (keyPath)
      const record = await dbGetOne('vault', name);
      if (record && record.content && record.content.startsWith('data:')) {
        img.src = record.content;
        img.style.opacity = '1';
      }
    } catch { /* skip if not found */ }
  }
}

"""

if 'function loadVaultThumbs' not in v:
    # Insert before renderVault
    ins = v.find('export function renderVault()')
    if ins != -1:
        v = v[:ins] + LAZY_FN + v[ins:]
        print('✓ Added loadVaultThumbs function')
    else:
        v = v + LAZY_FN
        print('✓ Appended loadVaultThumbs')

# ── FIX 6: showVaultPreview — load image from IDB ──
OLD_PREVIEW_IMG = """  if (isImg) {
    body = `<img src="${f.content}" style="max-width:100%;max-height:60dvh;
              border-radius:8px;display:block;margin:0 auto;" />`;"""

NEW_PREVIEW_IMG = """  if (isImg) {
    // Load full image from IDB (state entry has content='' for images)
    body = `<div id="vault-preview-img-wrap" style="text-align:center;">
              <div style="color:var(--subtext);font-size:0.72rem;padding:20px;">loading...</div>
            </div>`;"""

if OLD_PREVIEW_IMG in v:
    v = v.replace(OLD_PREVIEW_IMG, NEW_PREVIEW_IMG, 1)
    print('✓ Fixed showVaultPreview — deferred image load')
else:
    print('WARN: preview img anchor not found')

# Also need to add async image load after modal is appended
OLD_MODAL_APPEND = """  document.body.appendChild(modal);

  // Close handlers
  document.getElementById('vault-preview-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}"""

NEW_MODAL_APPEND = """  document.body.appendChild(modal);

  // Close handlers
  document.getElementById('vault-preview-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  // If image, load from IDB now that modal is in DOM
  if (isImg) {
    dbGetOne('vault', f.name).then(record => {
      const wrap = document.getElementById('vault-preview-img-wrap');
      if (!wrap) return;
      if (record && record.content) {
        wrap.innerHTML = `<img src="${record.content}"
          style="max-width:100%;max-height:60dvh;border-radius:8px;display:block;margin:0 auto;" />`;
      } else {
        wrap.innerHTML = `<div style="color:var(--subtext);font-size:0.72rem;padding:20px;">image not available locally</div>`;
      }
    }).catch(() => {});
  }
}"""

if OLD_MODAL_APPEND in v:
    v = v.replace(OLD_MODAL_APPEND, NEW_MODAL_APPEND, 1)
    print('✓ Added async IDB image load in showVaultPreview')
else:
    print('WARN: modal append anchor not found')

# ── FIX 7: Add dbGetOne import ──
OLD_IMPORT = "import { dbSet, dbDelete } from './db.js';"
if 'dbGetOne' not in v:
    if OLD_IMPORT in v:
        v = v.replace(OLD_IMPORT, "import { dbSet, dbDelete, dbGetOne } from './db.js';", 1)
        print('✓ Added dbGetOne to import')
    else:
        print('WARN: db import line not found — add dbGetOne manually')
else:
    print('SKIP: dbGetOne already imported')

with open('js/app/vault.js','w',encoding='utf-8') as f: f.write(v)
print('\n✓ vault.js written')
print('\nNow check if dbGetOne exists in db.js:')

with open('js/app/db.js','r',encoding='utf-8') as f: db=f.read()
if 'export' in db and 'dbGetOne' in db:
    print('  dbGetOne EXISTS in db.js ✓')
elif 'export async function dbGet' in db:
    print('  dbGet exists — need to check signature')
    idx=db.find('export async function dbGet')
    print(' ', repr(db[idx:idx+120]))
else:
    print('  WARNING: dbGetOne not in db.js — need to add it')
    print('  Check what single-record get function is called in db.js')
    for line in db.split('\n'):
        if 'export' in line: print(' ', line.strip())
