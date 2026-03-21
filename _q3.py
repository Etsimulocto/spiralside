
import sys

# ── PATCH 1: sheet.js — portrait upload for You card ─────────
path = 'C:/Users/quart/spiralside/js/app/sheet.js'
f = open(path, 'r', encoding='utf-8')
src = f.read()
f.close()

# 1a. Avatar block — add portrait load + tap-to-upload when isUser
OLD_AV = """  // Avatar block
  const av         = document.getElementById('sheet-avatar-lg');
  av.textContent   = char.initial;
  av.style.color   = char.color;
  av.style.background = `linear-gradient(135deg,${char.color}33,${char.color}11)`;
  av.style.border  = `2px solid ${char.color}66`;
  av.style.boxShadow = `0 0 24px ${char.color}44`;"""

NEW_AV = """  // Avatar block
  const av         = document.getElementById('sheet-avatar-lg');
  av.style.border  = `2px solid ${char.color}66`;
  av.style.boxShadow = `0 0 24px ${char.color}44`;
  // Portrait image — used by You card and soul prints
  if (char.portrait_base64) {
    av.textContent = '';
    av.style.backgroundImage    = `url(${char.portrait_base64})`;
    av.style.backgroundSize     = 'cover';
    av.style.backgroundPosition = 'center top';
    av.style.color              = 'transparent';
    av.style.background         = `url(${char.portrait_base64}) center top / cover`;
  } else {
    av.style.backgroundImage = '';
    av.textContent   = char.initial;
    av.style.color   = char.color;
    av.style.background = `linear-gradient(135deg,${char.color}33,${char.color}11)`;
  }
  // You card — make avatar tappable to upload portrait
  av.onclick = null;
  av.style.cursor = 'default';
  if (char.isUser) {
    av.title  = 'tap to set portrait';
    av.style.cursor = 'pointer';
    av.onclick = () => {
      const inp = document.createElement('input');
      inp.type   = 'file';
      inp.accept = 'image/*';
      inp.onchange = async e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async ev => {
          char.portrait_base64 = ev.target.result;
          // Re-render avatar immediately
          av.textContent = '';
          av.style.background = `url(${ev.target.result}) center top / cover`;
          av.style.backgroundImage = `url(${ev.target.result})`;
          av.style.backgroundSize  = 'cover';
          av.style.backgroundPosition = 'center top';
          // Persist — add portrait to IDB record
          const { dbSet: _dbSet } = await import('./db.js');
          await _dbSet('sheets', {
            id: 'you',
            arc:             char.arc,
            traits:          char.traits,
            handle:          char.handle,
            vibe:            char.vibe,
            song:            char.song,
            portrait_base64: ev.target.result,
          });
          // Feedback
          const hint = document.createElement('div');
          hint.textContent = '✓ portrait saved';
          hint.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--surface);border:1px solid var(--teal);color:var(--teal);padding:8px 16px;border-radius:20px;font-size:0.72rem;letter-spacing:0.08em;z-index:999;pointer-events:none;';
          document.body.appendChild(hint);
          setTimeout(() => hint.remove(), 2000);
        };
        reader.readAsDataURL(file);
      };
      inp.click();
    };
  }"""

if OLD_AV not in src:
    print('ERR: avatar block anchor not found')
    idx = src.find('// Avatar block')
    if idx >= 0: print(repr(src[idx:idx+300]))
    sys.exit(1)

src = src.replace(OLD_AV, NEW_AV, 1)
print('OK sheet.js: avatar upload block')

# 1b. loadSheetData — load portrait_base64 from IDB into char
# Find where sheets IDB data is loaded and applied to char
OLD_LOAD = """  // Persist to IndexedDB
  await dbSet('sheets', {
    id,
    arc:    char.arc,
    traits: char.traits,
    handle: char.handle,
    vibe:   char.vibe,
    song:   char.song,
  });"""

NEW_LOAD = """  // Persist to IndexedDB
  await dbSet('sheets', {
    id,
    arc:             char.arc,
    traits:          char.traits,
    handle:          char.handle,
    vibe:            char.vibe,
    song:            char.song,
    portrait_base64: char.portrait_base64 || null,
  });"""

if OLD_LOAD not in src:
    print('ERR: dbSet sheets anchor not found')
    idx = src.find('dbSet(\'sheets\'')
    if idx < 0: idx = src.find('dbSet("sheets"')
    if idx >= 0: print(repr(src[idx:idx+200]))
    sys.exit(1)

src = src.replace(OLD_LOAD, NEW_LOAD, 1)
print('OK sheet.js: saveSummarize saves portrait_base64')

# 1c. loadSavedSheets — restore portrait_base64 from IDB into CHARACTERS
# Find where sheets are loaded back from IDB
OLD_RESTORE = """export async function loadSavedSheets() {"""
if OLD_RESTORE not in src:
    print('WARN: loadSavedSheets not found by that name — searching...')
    for name in ['loadSheets', 'initSheet', 'loadAllSheets', 'loadCharSheets']:
        if ('async function ' + name) in src:
            print(f'  Found: {name}')
    # non-fatal, skip
else:
    # Find where it applies saved data to char — look for char.arc = saved
    OLD_APPLY = "    if (saved.arc    !== undefined) char.arc    = saved.arc;"
    NEW_APPLY = """    if (saved.arc    !== undefined) char.arc    = saved.arc;
    if (saved.portrait_base64)          char.portrait_base64 = saved.portrait_base64;"""
    if OLD_APPLY in src:
        src = src.replace(OLD_APPLY, NEW_APPLY, 1)
        print('OK sheet.js: loadSavedSheets restores portrait_base64')
    else:
        # Try alternate pattern
        OLD_APPLY2 = "    if (saved.handle !== undefined) char.handle = saved.handle;"
        NEW_APPLY2 = "    if (saved.handle !== undefined) char.handle = saved.handle;\n    if (saved.portrait_base64)          char.portrait_base64 = saved.portrait_base64;"
        if OLD_APPLY2 in src:
            src = src.replace(OLD_APPLY2, NEW_APPLY2, 1)
            print('OK sheet.js: loadSavedSheets restores portrait_base64 (alt anchor)')
        else:
            print('WARN: loadSavedSheets apply anchor not found — portrait wont auto-load on refresh (non-fatal, saves ok)')

open(path, 'w', encoding='utf-8').write(src)
print('sheet.js written')

# ── PATCH 2: quest.js — use portrait_base64 as Mii avatar ────
path2 = 'C:/Users/quart/spiralside/js/app/views/quest.js'
f = open(path2, 'r', encoding='utf-8')
src2 = f.read()
f.close()

# Replace the mii-avatar-wrap content to show portrait if present
OLD_MII = """    <!-- MII PANEL -->
    <div class="quest-mii-panel">
      <div class="mii-avatar-wrap">${buildMiiSvg(char)}</div>"""

NEW_MII = """    <!-- MII PANEL -->
    <div class="quest-mii-panel">
      <div class="mii-avatar-wrap" id="quest-mii-avatar-wrap"
        style="${char.portrait_base64 ? `background-image:url(${char.portrait_base64});background-size:cover;background-position:center top;` : ''}">
        ${char.portrait_base64 ? '' : buildMiiSvg(char)}
      </div>"""

if OLD_MII not in src2:
    print('ERR: quest.js mii-avatar-wrap anchor not found')
    idx = src2.find('mii-avatar-wrap')
    if idx >= 0: print(repr(src2[idx:idx+200]))
    sys.exit(1)

src2 = src2.replace(OLD_MII, NEW_MII, 1)
print('OK quest.js: mii avatar uses portrait_base64')

# Also pull portrait into loadCharacter return when reading codex You
OLD_CHAR_RETURN = """    return {
      name:       you.handle  || base.name  || 'Wanderer',
      class:      you.vibe    || base.class || 'adventurer · chaotic good',
      arc:        you.arc     || '',
      atk:        stats.atk,
      def:        stats.def,
      wit:        stats.wit,
      luk:        stats.luk,
      level:      base.level  || 1,
      xp:         base.xp     || 0,
      xpNext:     base.xpNext || 100,
      hairColor:  base.hairColor  || '#5a3a1a',
      skinColor:  base.skinColor  || '#FDDBB4',
      fromCodex:  true,
    };"""

NEW_CHAR_RETURN = """    return {
      name:            you.handle  || base.name  || 'Wanderer',
      class:           you.vibe    || base.class || 'adventurer · chaotic good',
      arc:             you.arc     || '',
      portrait_base64: you.portrait_base64 || base.portrait_base64 || null,
      atk:             stats.atk,
      def:             stats.def,
      wit:             stats.wit,
      luk:             stats.luk,
      level:           base.level  || 1,
      xp:              base.xp     || 0,
      xpNext:          base.xpNext || 100,
      hairColor:       base.hairColor  || '#5a3a1a',
      skinColor:       base.skinColor  || '#FDDBB4',
      fromCodex:       true,
    };"""

if OLD_CHAR_RETURN not in src2:
    print('WARN: quest.js char return block not found — portrait wont pull (non-fatal)')
else:
    src2 = src2.replace(OLD_CHAR_RETURN, NEW_CHAR_RETURN, 1)
    print('OK quest.js: portrait_base64 included in char object')

open(path2, 'w', encoding='utf-8').write(src2)
print('\n=== DONE ===')
print('Run: git add . && git commit -m "feat: You card portrait upload, quest Mii shows portrait" && git push origin main --force')
