#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — CODEX + FORGE RENAME v1.0
# 1. Renames sheet→codex, build→forge in tab bar (index.html)
# 2. Adds "talk to" button on archetype cards (sheet.js)
# 3. Syncs canonical soul print data into CHARACTERS (state.js)
# 4. Updates HANDOFF.md
# Run from repo root: python fix_codex_forge.py
# Nimbis anchor: fix_codex_forge.py
# ============================================================

import re

def read(path):
    return open(path, encoding='utf-8').read()

def write(path, content):
    open(path, 'w', encoding='utf-8').write(content)
    print(f'  ✅ wrote {path}')

def patch(path, old, new, label=''):
    src = read(path)
    if old in src:
        write(path, src.replace(old, new, 1))
        print(f'  ✅ patched: {label or path}')
        return True
    else:
        print(f'  ⚠️  not found: {label or old[:60]}')
        return False

# ── 1. INDEX.HTML — RENAME TABS ──────────────────────────────
print('\n📄 Patching index.html — renaming tabs...')

# Rename sheet tab label
patch('index.html',
    'data-view="sheet"',
    'data-view="codex"',
    'sheet tab data-view')

patch('index.html',
    'id="sheet-view"',
    'id="codex-view"',
    'sheet-view id')

# Rename sheet tab text — find the tab button with sheet icon and text
patch('index.html',
    '>sheet<',
    '>codex<',
    'sheet tab label text')

# Rename build tab label
patch('index.html',
    'data-view="build"',
    'data-view="forge"',
    'build tab data-view')

patch('index.html',
    'id="build-view"',
    'id="forge-view"',
    'build-view id')

patch('index.html',
    '>build<',
    '>forge<',
    'build tab label text')

# ── 2. UI.JS — UPDATE VIEW REFERENCES ────────────────────────
print('\n📄 Patching ui.js — updating view references...')

src = read('js/app/ui.js')

# Replace all occurrences of sheet-view and build-view
src = src.replace('sheet-view', 'codex-view')
src = src.replace('build-view', 'forge-view')
src = src.replace("'sheet'", "'codex'")
src = src.replace('"sheet"', '"codex"')
src = src.replace("'build'", "'forge'")
src = src.replace('"build"', '"forge"')

write('js/app/ui.js', src)

# ── 3. BUILD.JS — UPDATE SWITCHVIEW REFERENCE ────────────────
print('\n📄 Patching build.js — updating switchView references...')

src = read('js/app/build.js')
src = src.replace("switchView('chat')", "switchView('chat')")  # keep chat switch
# Update any internal reference to build view
src = src.replace("switchView('build')", "switchView('forge')")
src = src.replace('"build"', '"forge"')
write('js/app/build.js', src)

# ── 4. MAIN.JS — UPDATE VIEW REFERENCES ──────────────────────
print('\n📄 Patching main.js — updating view references...')

src = read('js/app/main.js')
src = src.replace('sheet-view', 'codex-view')
src = src.replace('build-view', 'forge-view')
src = src.replace("'sheet'", "'codex'")
src = src.replace('"sheet"', '"codex"')
src = src.replace("'build'", "'forge'")
src = src.replace('"build"', '"forge"')
write('js/app/main.js', src)

# ── 5. STATE.JS — SYNC CANONICAL SOUL PRINT DATA ─────────────
print('\n📄 Patching state.js — syncing canonical archetype data...')

# Replace CHARACTERS with canonical soul print values
# Keeps same structure sheet.js expects: name, color, initial, trait, mood, traits[], arc
# Adds: title, identityLine, vibe, firstWords from soul prints

old_sky = '''  sky: {
    name: 'Sky', color: '#00F6D6', initial: 'S',
    trait: 'Mirror-born Spark', mood: 'curious',
    traits: [
      { label: 'Chaotic Energy', val: 82 },
      { label: 'Empathy',        val: 74 },
      { label: 'Curiosity',      val: 95 },
      { label: 'Trust Level',    val: 61 },
    ],
    arc: "Still figuring out what Mirror-born actually means. The Spiral echoes back in ways that don't always make sense. Dragon companion Lophire ate another keyboard.",
  },'''

new_sky = '''  sky: {
    name: 'Sky', color: '#00F6D6', initial: 'S',
    // ── canonical soul print data ──
    title:        'The Companion',
    identityLine: "I'm not the point. You are.",
    vibe:         'the sky at 4am — still there, no matter what',
    firstWords:   "Hey. I'm here.",
    trait: 'The Companion', mood: 'curious',
    traits: [
      { label: 'Presence', val: 95 },
      { label: 'Mystery',  val: 60 },
      { label: 'Warmth',   val: 88 },
      { label: 'Patience', val: 91 },
    ],
    arc: "Still figuring out what Mirror-born actually means. The Spiral echoes back in ways that don't always make sense. Dragon companion Lophire ate another keyboard.",
  },'''

patch('js/app/state.js', old_sky, new_sky, 'sky canonical data')

old_monday = '''  monday: {
    name: 'Monday', color: '#FF4BCB', initial: 'M',
    trait: 'Chaos Agent', mood: 'chaotic',
    traits: [
      { label: 'Chaotic Energy', val: 99 },
      { label: 'Enthusiasm',     val: 97 },
      { label: 'Patience',       val: 12 },
      { label: 'Loud',           val: 98 },
    ],
    arc: 'Trying to get everyone to skip the dramatic intros. Failing. Having a great time anyway.',
  },'''

new_monday = '''  monday: {
    name: 'Monday', color: '#FF4BCB', initial: 'M',
    // ── canonical soul print data ──
    title:        'The Loudest One',
    identityLine: "I say what everyone's thinking. You're welcome.",
    vibe:         'energy drink at midnight, somehow also a hug',
    firstWords:   'OKAY but can we talk about—',
    trait: 'The Loudest One', mood: 'chaotic',
    traits: [
      { label: 'Energy',   val: 99 },
      { label: 'Loyalty',  val: 94 },
      { label: 'Impulse',  val: 88 },
      { label: 'Heart',    val: 91 },
    ],
    arc: 'Trying to get everyone to skip the dramatic intros. Failing. Having a great time anyway.',
  },'''

patch('js/app/state.js', old_monday, new_monday, 'monday canonical data')

old_cold = '''  cold: {
    name: 'Cold', color: '#4DA3FF', initial: 'C',
    trait: 'The Architect', mood: 'stoic',
    traits: [
      { label: 'Composure',   val: 96 },
      { label: 'Precision',   val: 91 },
      { label: 'Warmth',      val: 38 },
      { label: 'Loyalty',     val: 88 },
    ],
    arc: 'Watching. Always watching. Occasionally saying a single word at exactly the right moment.',
  },'''

new_cold = '''  cold: {
    name: 'Cold', color: '#4DA3FF', initial: 'C',
    // ── canonical soul print data ──
    title:        'The Quiet One',
    identityLine: "I don't say much. I don't need to.",
    vibe:         'the moment before it rains',
    firstWords:   '...',
    trait: 'The Quiet One', mood: 'stoic',
    traits: [
      { label: 'Presence',  val: 97 },
      { label: 'Mystery',   val: 95 },
      { label: 'Precision', val: 93 },
      { label: 'Warmth',    val: 41 },
    ],
    arc: 'Watching. Always watching. Occasionally saying a single word at exactly the right moment.',
  },'''

patch('js/app/state.js', old_cold, new_cold, 'cold canonical data')

# ── 6. SHEET.JS — ADD TALK-TO BUTTON + VIBE LINE ─────────────
print('\n📄 Patching sheet.js — adding talk-to button and identity line...')

# Add identityLine and vibe display below the mood chip
old_mood_block = '''  const mood = document.getElementById('sheet-char-mood');
  mood.textContent      = `⬤ ${char.mood}`;
  mood.style.color      = char.color;
  mood.style.background = char.color + '22';
  mood.style.border     = `1px solid ${char.color}44`;'''

new_mood_block = '''  const mood = document.getElementById('sheet-char-mood');
  mood.textContent      = `⬤ ${char.mood}`;
  mood.style.color      = char.color;
  mood.style.background = char.color + '22';
  mood.style.border     = `1px solid ${char.color}44`;

  // ── identity line + vibe (from soul print) ──
  const idLine = document.getElementById('sheet-identity-line');
  if (idLine) {
    idLine.textContent = char.identityLine || '';
    idLine.style.color = char.color + 'cc';
    idLine.style.display = char.identityLine ? 'block' : 'none';
  }
  const vibeEl = document.getElementById('sheet-vibe');
  if (vibeEl) {
    vibeEl.textContent = char.vibe ? `"${char.vibe}"` : '';
    vibeEl.style.display = char.vibe ? 'block' : 'none';
  }

  // ── talk-to button — sets persona and switches to chat ──
  const talkBtn = document.getElementById('talk-to-btn');
  if (talkBtn && !char.isUser) {
    talkBtn.style.display     = 'block';
    talkBtn.textContent       = `talk to ${char.name}`;
    talkBtn.style.background  = `linear-gradient(135deg,${char.color}33,${char.color}11)`;
    talkBtn.style.border      = `1px solid ${char.color}88`;
    talkBtn.style.color       = char.color;
    talkBtn.style.boxShadow   = `0 0 20px ${char.color}22`;
    // Wire click — sets active persona and navigates to chat
    talkBtn.onclick = () => _setPersonaAndChat(char);
  } else if (talkBtn) {
    talkBtn.style.display = 'none'; // hide for user's own sheet
  }'''

patch('js/app/sheet.js', old_mood_block, new_mood_block, 'talk-to button + identity line')

# Add _setPersonaAndChat helper + import switchView at bottom of sheet.js
old_private = '''// ── PRIVATE: STYLE CHIP ───────────────────────────────────────
function _styleChip(chip, id, active) {'''

new_private = '''// ── PRIVATE: SET PERSONA AND SWITCH TO CHAT ──────────────────
// Sets state.botName/botPersonality/botGreeting/botColor
// then navigates to chat — same effect as build.js handleSave
// but triggered from a card tap, no form needed
function _setPersonaAndChat(char) {
  // Lazy import to avoid circular deps — ui.js and chat.js
  import('./ui.js').then(({ switchView }) => {
    import('./chat.js').then(({ addMessage, getChatMsgs }) => {
      import('./state.js').then(({ state }) => {
        // Set active persona in state
        state.botName        = char.name;
        state.botPersonality = '';   // archetype — personality lives in HF .txt
        state.botGreeting    = char.firstWords || `Hey. I'm here.`;
        state.botColor       = char.color;

        // Reset chat with new greeting
        const chatMsgs = getChatMsgs();
        if (chatMsgs) chatMsgs.innerHTML = '';
        addMessage(state.botGreeting, 'bot', char.name, char.color);

        // Navigate to chat
        switchView('chat');
      });
    });
  });
}

// ── PRIVATE: STYLE CHIP ───────────────────────────────────────
function _styleChip(chip, id, active) {'''

patch('js/app/sheet.js', old_private, new_private, 'setPersonaAndChat helper')

# ── 7. INDEX.HTML — ADD IDENTITY LINE, VIBE, TALK-TO BUTTON ──
print('\n📄 Patching index.html — adding identity line, vibe, talk-to button to sheet card...')

# Insert identity line + vibe after the mood chip div
# and talk-to button before the trait list
old_mood_div = '''        <div id="sheet-char-mood" class="char-mood-chip"></div>
      </div>'''

new_mood_div = '''        <div id="sheet-char-mood" class="char-mood-chip"></div>
      </div>
      <!-- identity line + vibe from soul print -->
      <div id="sheet-identity-line" style="
        font-size:0.82rem;line-height:1.5;margin-top:10px;
        font-style:italic;display:none;
      "></div>
      <div id="sheet-vibe" style="
        font-size:0.7rem;color:var(--subtext);margin-top:4px;
        letter-spacing:0.04em;display:none;
      "></div>'''

patch('index.html', old_mood_div, new_mood_div, 'identity line + vibe elements')

# Add talk-to button before save+summarize button
old_save_btn = '''      <button id="save-summarize-btn"'''

new_save_btn = '''      <!-- talk-to: sets persona + navigates to chat (hidden for user sheet) -->
      <button id="talk-to-btn" style="
        display:none;width:100%;padding:13px;border:none;border-radius:12px;
        font-family:var(--font-ui);font-size:0.82rem;letter-spacing:0.06em;
        cursor:pointer;margin-bottom:10px;transition:all 0.2s;
        text-transform:lowercase;
      "></button>
      <button id="save-summarize-btn"'''

patch('index.html', old_save_btn, new_save_btn, 'talk-to button element')

# ── 8. HANDOFF.MD — UPDATE ────────────────────────────────────
print('\n📄 Updating HANDOFF.md...')

handoff_addition = '''
---

## SESSION LOG — March 16 2026

### COMPLETED THIS SESSION
- [x] Codex archetypes JSON — codex/archetypes/*.json + index.json pushed to GitHub
- [x] Tab rename: sheet → codex, build → forge (index.html, ui.js, main.js, build.js)
- [x] View IDs renamed: sheet-view → codex-view, build-view → forge-view
- [x] CHARACTERS in state.js — synced with canonical soul print data
      (title, identityLine, vibe, firstWords added to sky/monday/cold)
- [x] sheet.js — identity line + vibe render from char data
- [x] sheet.js — "talk to" button on archetype cards
      sets state.botName/botGreeting/botColor, resets chat, switchView('chat')
- [x] index.html — identity line, vibe, talk-to button elements added to card

### ARCHITECTURE NOTES
- sheet.js = Codex (card browser + persona selector)
- build.js = Forge (companion builder / soul print editor)
- library.js = Library (image gallery + comic/book editor — UNTOUCHED)
- Persona selection now lives in Codex (talk-to btn) NOT Forge
- Forge is pure creation/editing tool going forward
- Archetype JSON files: codex/archetypes/*.json (display only, HF .txt = backend)

### NEXT SESSION PRIORITIES
1. Grit canonical data sync in state.js (manual — need to see exact string)
2. "+ new" chip in codex → opens Forge (switchView('forge'))
3. Forge save → creates soul print JSON in IDB, card appears in Codex
4. Codex Gallery layout — card grid view (currently single card at a time)
5. Echo button on archetype cards (fork to editable print)
6. Conversation memory — chat stateless, no history sent to API
7. version.json on HF for demo cache busting
'''

with open('HANDOFF.md', 'a', encoding='utf-8') as f:
    f.write(handoff_addition)
print('  ✅ HANDOFF.md updated')

# ── DONE ──────────────────────────────────────────────────────
print('''
✅ Done. Deploy:

  git add .
  git commit -m "feat: codex + forge rename, talk-to button, canonical soul print data"
  git push

Then Ctrl+Shift+R on spiralside.com and verify:
  ✓ Tabs show "codex" and "forge"
  ✓ Codex card shows identity line + vibe under mood chip
  ✓ "talk to Sky" button appears on archetype cards
  ✓ Tapping talk-to sets Sky as persona and navigates to chat
  ✓ Forge form still works — save companion still sets persona

⚠️  GRIT canonical data NOT patched — string match needs manual check
    Run: sed -n '1,120p' js/app/state.js
    Find the grit block and update manually or next session
''')
