# ============================================================
# SPIRALSIDE — PATCH: sheet.js portrait restore fix
# Fixes: portrait_base64 not restored from IDB on refresh
# Run ONCE from Git Bash in ~/spiralside
# Nimbis anchor: _patch_portrait.py
# ============================================================

import sys

TARGET = 'js/app/sheet.js'

OLD = '''export async function loadSavedSheets(dbGet) {
  for (const id of Object.keys(CHARACTERS)) {
    const saved = await dbGet('sheets', id);
    if (!saved) continue;
    if (saved.arc)    CHARACTERS[id].arc    = saved.arc;
    if (saved.traits) CHARACTERS[id].traits = saved.traits;
    // User-specific fields
    if (id === 'you') {
      if (saved.handle) CHARACTERS.you.handle = saved.handle;
      if (saved.vibe)   CHARACTERS.you.vibe   = saved.vibe;
      if (saved.song)   CHARACTERS.you.song   = saved.song;
    }
  }
}'''

NEW = '''export async function loadSavedSheets(dbGet) {
  // Nimbis anchor: loadSavedSheets — restores IDB data onto CHARACTERS at boot
  for (const id of Object.keys(CHARACTERS)) {
    const saved = await dbGet('sheets', id);
    if (!saved) continue;
    if (saved.arc)    CHARACTERS[id].arc    = saved.arc;
    if (saved.traits) CHARACTERS[id].traits = saved.traits;
    // User-specific fields
    if (id === 'you') {
      if (saved.handle) CHARACTERS.you.handle = saved.handle;
      if (saved.vibe)   CHARACTERS.you.vibe   = saved.vibe;
      if (saved.song)   CHARACTERS.you.song   = saved.song;
      // FIX: restore portrait so You card shows uploaded photo after page refresh
      if (saved.portrait_base64) CHARACTERS.you.portrait_base64 = saved.portrait_base64;
    }
  }
}'''

# Read file
with open(TARGET, 'r', encoding='utf-8') as f:
    src = f.read()

# Safety check — confirm old block is present exactly once
count = src.count(OLD)
if count == 0:
    print(f'ERROR: anchor not found in {TARGET}')
    print('Has the function already been patched or changed?')
    sys.exit(1)
if count > 1:
    print(f'ERROR: anchor found {count} times — ambiguous, aborting')
    sys.exit(1)

# Apply patch
patched = src.replace(OLD, NEW, 1)

# Write back
with open(TARGET, 'w', encoding='utf-8') as f:
    f.write(patched)

print(f'OK: patched {TARGET}')
print('Added: portrait_base64 restore inside loadSavedSheets()')
print()
print('Next: git add . && git commit -m "fix: restore portrait_base64 on refresh in loadSavedSheets" && git push --force origin main')
