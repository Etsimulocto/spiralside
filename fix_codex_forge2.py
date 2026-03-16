#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — CODEX + FORGE RENAME v2.0
# Fixes exact string mismatches from v1.0
# Only patches what v1.0 missed — state.js already done
# Run from repo root: python fix_codex_forge2.py
# Nimbis anchor: fix_codex_forge2.py
# ============================================================

def read(path):
    return open(path, encoding='utf-8').read()

def write(path, content):
    open(path, 'w', encoding='utf-8').write(content)
    print(f'  ✅ wrote {path}')

def patch(path, old, new, label=''):
    src = read(path)
    if old in src:
        result = src.replace(old, new, 1)
        write(path, result)
        print(f'  ✅ patched: {label}')
        return True
    else:
        print(f'  ⚠️  not found: {label}')
        return False

# ── 1. INDEX.HTML — TAB BUTTONS ──────────────────────────────
print('\n📄 Patching index.html — tab buttons...')

# Rename sheet tab button
patch('index.html',
    """<button class="tab-btn"        id="tab-sheet"   onclick="switchView('sheet')"  >✦ sheet</button>""",
    """<button class="tab-btn"        id="tab-codex"   onclick="switchView('codex')"  >✦ codex</button>""",
    'sheet tab → codex')

# Rename build tab button
patch('index.html',
    """<button class="tab-btn"        id="tab-build"   onclick="switchView('build')"  >⚙ build</button>""",
    """<button class="tab-btn"        id="tab-forge"   onclick="switchView('forge')"  >⚙ forge</button>""",
    'build tab → forge')

# Rename view-sheet div
patch('index.html',
    '<div class="view" id="view-sheet">',
    '<div class="view" id="view-codex">',
    'view-sheet → view-codex')

# Rename view-build div
patch('index.html',
    '<div class="view" id="view-build">',
    '<div class="view" id="view-forge">',
    'view-build → view-forge')

# Rename CSS rule #sheet-view
patch('index.html',
    '#sheet-view { overflow-y: auto; padding: 16px; }',
    '#codex-view { overflow-y: auto; padding: 16px; }',
    '#sheet-view css → #codex-view')

# ── 2. INDEX.HTML — ADD IDENTITY LINE + VIBE + TALK-TO ───────
print('\n📄 Patching index.html — identity line, vibe, talk-to button...')

# Find the mood chip and insert identity/vibe after it
# First let's see what's actually around the mood chip
src = read('index.html')

# Find sheet-char-mood and insert after its containing element
# The structure from the screenshot shows mood chip then traits
old_mood = 'id="sheet-char-mood"'

# Check it exists
if old_mood in src:
    print(f'  ✅ found sheet-char-mood — inserting identity/vibe/talk-to after mood block')
    # Find the position and insert the new elements after the mood chip's parent closes
    # We'll inject right before the trait-list section
    old_traits = '<div id="trait-list">'
    new_traits = '''<!-- identity line + vibe from soul print -->
      <div id="sheet-identity-line" style="
        font-size:0.82rem;line-height:1.5;margin-top:12px;padding:0 4px;
        font-style:italic;display:none;color:var(--subtext);
      "></div>
      <div id="sheet-vibe" style="
        font-size:0.7rem;color:var(--subtext);margin-top:4px;padding:0 4px;
        letter-spacing:0.04em;display:none;opacity:0.7;
      "></div>
      <div id="trait-list">'''
    patch('index.html', old_traits, new_traits, 'identity line + vibe before trait-list')
else:
    print('  ⚠️  sheet-char-mood not found — check index.html structure')

# Add talk-to button before save+summarize
old_save = 'id="save-summarize-btn"'
if old_save in src:
    # Re-read after previous patch
    src2 = read('index.html')
    old_btn_block = 'id="save-summarize-btn"'
    # Find the full button tag
    idx = src2.find(old_btn_block)
    # Find the start of that button tag
    btn_start = src2.rfind('<button', 0, idx)
    btn_tag_open = src2[btn_start:idx + len(old_btn_block)]

    new_insertion = '''id="talk-to-btn" style="
        display:none;width:100%;padding:13px;border:none;border-radius:12px;
        font-family:var(--font-ui);font-size:0.82rem;letter-spacing:0.06em;
        cursor:pointer;margin-bottom:10px;transition:all 0.2s;
        text-transform:lowercase;
      "></button>
      <button '''

    patch('index.html',
        '<button id="save-summarize-btn"',
        '<button id="talk-to-btn" style="display:none;width:100%;padding:13px;border:none;border-radius:12px;font-family:var(--font-ui);font-size:0.82rem;letter-spacing:0.06em;cursor:pointer;margin-bottom:10px;transition:all 0.2s;text-transform:lowercase;"></button>\n      <button id="save-summarize-btn"',
        'talk-to button before save-summarize')
else:
    print('  ⚠️  save-summarize-btn not found')

# ── 3. UI.JS — SWITCHVIEW REFERENCES ─────────────────────────
print('\n📄 Patching ui.js — switchView references...')

src = read('js/app/ui.js')
src = src.replace("'sheet'", "'codex'")
src = src.replace('"sheet"', '"codex"')
src = src.replace("'build'", "'forge'")
src = src.replace('"build"', '"forge"')
src = src.replace('view-sheet', 'view-codex')
src = src.replace('view-build', 'view-forge')
src = src.replace('tab-sheet', 'tab-codex')
src = src.replace('tab-build', 'tab-forge')
write('js/app/ui.js', src)

# ── 4. MAIN.JS — VIEW REFERENCES ─────────────────────────────
print('\n📄 Patching main.js — view references...')

src = read('js/app/main.js')
src = src.replace("'sheet'", "'codex'")
src = src.replace('"sheet"', '"codex"')
src = src.replace("'build'", "'forge'")
src = src.replace('"build"', '"forge"')
src = src.replace('view-sheet', 'view-codex')
src = src.replace('view-build', 'view-forge')
src = src.replace('tab-sheet', 'tab-codex')
src = src.replace('tab-build', 'tab-forge')
write('js/app/main.js', src)

# ── 5. BUILD.JS — VIEW REFERENCES ────────────────────────────
print('\n📄 Patching build.js — view references...')

src = read('js/app/build.js')
src = src.replace("switchView('build')", "switchView('forge')")
src = src.replace('"build"', '"forge"')
write('js/app/build.js', src)

# ── 6. GRIT — ADD CANONICAL DATA TO STATE.JS ─────────────────
print('\n📄 Patching state.js — grit canonical data...')

patch('js/app/state.js',
    '''  grit: {
    name: 'GRIT', color: '#FFD93D', initial: 'G',
    trait: 'Street Oracle', mood: 'grounded',''',
    '''  grit: {
    name: 'GRIT', color: '#FFD93D', initial: 'G',
    // ── canonical soul print data ──
    title:        'The Builder',
    identityLine: 'Nothing worth having came easy. Good.',
    vibe:         'calluses and coffee, something being made',
    firstWords:   "What are we building?",
    trait: 'The Builder', mood: 'grounded',''',
    'grit canonical data')

# ── DONE ─────────────────────────────────────────────────────
print('''
✅ Done. Deploy:

  git add .
  git commit -m "feat: codex + forge rename complete, talk-to button, grit canonical data"
  git push

Then Ctrl+Shift+R and verify:
  ✓ Tabs show "codex" and "forge"
  ✓ Codex card shows identity line + vibe under mood chip
  ✓ "talk to Sky" button appears, tapping it goes to chat as Sky
  ✓ Forge still saves companion correctly
''')
