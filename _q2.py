
import sys

# ── PATCH quest.js — pull from codex You card (IDB sheets store) ──
path = 'C:/Users/quart/spiralside/js/app/views/quest.js'
f = open(path, 'r', encoding='utf-8')
src = f.read()
f.close()

# 1. Replace loadCharacter() to also read from IDB
OLD_LOAD = """// ── STORAGE ──────────────────────────────────────────────────
function loadEvents() {
  try { return JSON.parse(localStorage.getItem('ss_quest_events') || '[]'); }
  catch { return []; }
}
function saveEvents(evs) {
  localStorage.setItem('ss_quest_events', JSON.stringify(evs));
}
function loadCharacter() {
  try { return JSON.parse(localStorage.getItem('ss_quest_char') || 'null'); }
  catch { return null; }
}
function saveCharacter(c) {
  localStorage.setItem('ss_quest_char', JSON.stringify(c));
}"""

NEW_LOAD = """// ── STORAGE ──────────────────────────────────────────────────
function loadEvents() {
  try { return JSON.parse(localStorage.getItem('ss_quest_events') || '[]'); }
  catch { return []; }
}
function saveEvents(evs) {
  localStorage.setItem('ss_quest_events', JSON.stringify(evs));
}
function saveCharacter(c) {
  localStorage.setItem('ss_quest_char', JSON.stringify(c));
}

// Reads codex You card from IDB sheets store, returns promise
// IDB access mirrors the pattern in db.js (same DB name + version range)
function readCodexYou() {
  return new Promise(resolve => {
    try {
      // Open without version bump — read-only, just need existing stores
      const req = indexedDB.open('spiralside');
      req.onerror = () => resolve(null);
      req.onsuccess = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('sheets')) { db.close(); resolve(null); return; }
        const tx = db.transaction('sheets', 'readonly');
        const get = tx.objectStore('sheets').get('you');
        get.onsuccess = () => { db.close(); resolve(get.result || null); };
        get.onerror  = () => { db.close(); resolve(null); };
      };
    } catch { resolve(null); }
  });
}

// Maps codex trait names to quest stats
// Curiosity/Wit → WIT, Energy/Chaos → ATK, Patience/Trust → DEF, Luck/Spark → LUK
function traitsToStats(traits) {
  const stats = { atk: 10, def: 8, wit: 12, luk: 9 };
  if (!traits || !traits.length) return stats;
  traits.forEach(t => {
    const n = (t.label || t.name || '').toLowerCase();
    const v = Math.round((t.score || t.value || 50) / 10); // 0-100 → 0-10, add to base
    if (/curiosity|wit|intellect|clever|smart|knowledge/.test(n)) stats.wit = Math.min(20, 8 + v);
    else if (/energy|chaos|attack|strength|bold|fierce/.test(n)) stats.atk = Math.min(20, 8 + v);
    else if (/patience|trust|defense|calm|steady|loyal/.test(n)) stats.def = Math.min(20, 8 + v);
    else if (/luck|spark|charm|wild|random|creative/.test(n))    stats.luk = Math.min(20, 8 + v);
  });
  return stats;
}

// Load character — codex You card takes priority over quest localStorage
async function loadCharacter() {
  // 1. Try IDB codex You card first
  const you = await readCodexYou();
  if (you && (you.handle || you.vibe)) {
    const stats = traitsToStats(you.traits);
    const base = JSON.parse(localStorage.getItem('ss_quest_char') || 'null') || {};
    return {
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
    };
  }
  // 2. Fall back to quest-local storage
  try { return JSON.parse(localStorage.getItem('ss_quest_char') || 'null'); }
  catch { return null; }
}"""

if OLD_LOAD not in src:
    print('ERR: loadCharacter anchor not found')
    # Show what is around that area for diagnosis
    idx = src.find('function loadCharacter')
    if idx >= 0:
        print('Found loadCharacter at char', idx)
        print(repr(src[idx:idx+200]))
    sys.exit(1)

src = src.replace(OLD_LOAD, NEW_LOAD, 1)
print('OK: storage block replaced')

# 2. initQuestView must await loadCharacter now — update the call
OLD_INIT = """  let char = loadCharacter();
  if (!char) {
    // Try to grab name from forge state
    const botName = typeof state !== 'undefined' && state.botName ? state.botName : 'Wanderer';
    char = defaultCharacter(botName);
    saveCharacter(char);
  }

  const events = loadEvents();
  renderQuest(el, char, events);"""

NEW_INIT = """  let char = await loadCharacter();
  if (!char) {
    const botName = (typeof state !== 'undefined' && state.botName) ? state.botName : 'Wanderer';
    char = defaultCharacter(botName);
    saveCharacter(char);
  }

  const events = loadEvents();
  renderQuest(el, char, events);"""

if OLD_INIT not in src:
    print('ERR: initQuestView loadCharacter call not found')
    idx = src.find('let char = ')
    if idx >= 0: print(repr(src[idx:idx+300]))
    sys.exit(1)

src = src.replace(OLD_INIT, NEW_INIT, 1)
print('OK: initQuestView updated to await loadCharacter')

# 3. Also show arc under the Mii panel if present
OLD_MII_CLASS = '        <div class="quest-mii-class">${char.class}</div>'
NEW_MII_CLASS = '        <div class="quest-mii-class">${char.class}</div>\n        ${char.arc ? `<div class="quest-mii-arc">${char.arc}</div>` : \'\'}'

if OLD_MII_CLASS not in src:
    print('WARN: mii-class anchor not found — skipping arc line (non-fatal)')
else:
    src = src.replace(OLD_MII_CLASS, NEW_MII_CLASS, 1)
    print('OK: arc line added under mii class')

# 4. Add quest-mii-arc CSS into injectQuestStyles
OLD_CSS_ANCHOR = '    .quest-mii-class {'
NEW_CSS_ANCHOR = """    .quest-mii-arc {
      font-size: 0.62rem; color: var(--subtext); line-height: 1.5;
      margin-top: 4px; font-style: italic;
      display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
    }
    .quest-mii-class {"""

if OLD_CSS_ANCHOR not in src:
    print('WARN: CSS anchor not found — skipping arc CSS (non-fatal)')
else:
    src = src.replace(OLD_CSS_ANCHOR, NEW_CSS_ANCHOR, 1)
    print('OK: arc CSS added')

open(path, 'w', encoding='utf-8').write(src)
print('\n=== DONE ===')
print('Run: git add . && git commit -m "feat: quest Mii pulls from codex You card" && git push origin main --force')
