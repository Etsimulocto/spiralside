"""
YOU CARD FORGE EQUALIZATION PATCH
==================================
Patches 3 files:
  1. js/app/views/forge.js  — adds "about you" section (hidden by default, shown when editing you_card)
  2. js/app/build.js        — extends _loadPrintDataIntoForm + handleSave for you_card mode
  3. js/app/sheet.js        — adds "edit in forge" button to You card render

Run from: ~/spiralside  (Git Bash)
Command:  /c/Users/quart/AppData/Local/Programs/Python/Python313/python.exe you_card_patch.py
"""

import sys, os, re

PY = sys.executable
ROOT = os.path.expanduser('~/spiralside')

def patch(filepath, old, new, label):
    full = os.path.join(ROOT, filepath)
    with open(full, 'r', encoding='utf-8') as f:
        src = f.read()
    src = src.replace('\r\n', '\n')
    count = src.count(old)
    if count == 0:
        print(f'[MISS] {label} — anchor not found in {filepath}')
        sys.exit(1)
    if count > 1:
        print(f'[DUPE] {label} — anchor found {count} times in {filepath}')
        sys.exit(1)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(src.replace(old, new, 1))
    print(f'[OK]   {label}')

# ================================================================
# PATCH 1 — forge.js
# Add "about you" section HTML before <!-- APPEARANCE -->
# It starts hidden; shown via JS when editing you_card
# ================================================================

FORGE_ANCHOR = '    <!-- APPEARANCE -->'

FORGE_NEW = '''    <!-- ABOUT YOU (only shown when editing you_card) -->
    <div class="forge-section" id="forge-section-aboutyou" style="display:none">
      <div class="forge-section-header" onclick="toggleForgeSection('aboutyou')">
        <span class="forge-section-icon" id="forge-icon-aboutyou">&#x25BE;</span>
        <span class="forge-section-title">about you</span>
      </div>
      <div class="forge-section-body" id="forge-body-aboutyou">
        <div class="forge-row">
          <div class="forge-field forge-half"><label class="forge-label">hair</label>
            <input class="forge-input" id="yc-hair" placeholder="samurai cut..." /></div>
          <div class="forge-field forge-half"><label class="forge-label">height / build</label>
            <input class="forge-input" id="yc-build" placeholder="5\'9 skinny..." /></div>
        </div>
        <div class="forge-field"><label class="forge-label">marks / features</label>
          <input class="forge-input" id="yc-marks" placeholder="distinctive stuff..." /></div>
        <div class="forge-field"><label class="forge-label">life right now</label>
          <textarea class="forge-input" id="yc-life-now" rows="2" placeholder="what are you actually going through right now..."></textarea></div>
        <div class="forge-field"><label class="forge-label">current arc</label>
          <textarea class="forge-input" id="yc-current-arc" rows="2" placeholder="the chapter you're in..."></textarea></div>
        <div class="forge-row">
          <div class="forge-field forge-half"><label class="forge-label">working on</label>
            <input class="forge-input" id="yc-working-on" placeholder="Spiralside.com..." /></div>
          <div class="forge-field forge-half"><label class="forge-label">theme song right now</label>
            <input class="forge-input" id="yc-theme-song" placeholder="i wrote the sky..." /></div>
        </div>
        <div class="forge-row">
          <div class="forge-field forge-half"><label class="forge-label">pet name(s) / species</label>
            <input class="forge-input" id="yc-pets" placeholder="Bellota..." /></div>
          <div class="forge-field forge-half"><label class="forge-label">fav food / drink</label>
            <input class="forge-input" id="yc-fav-food" placeholder="Ramen!" /></div>
        </div>
        <div class="forge-row">
          <div class="forge-field forge-half"><label class="forge-label">comfort show / game</label>
            <input class="forge-input" id="yc-comfort-show" placeholder="Stargate SG1..." /></div>
          <div class="forge-field forge-half"><label class="forge-label">hates / dealbreakers</label>
            <input class="forge-input" id="yc-hates" placeholder="none..." /></div>
        </div>
        <div class="forge-row">
          <div class="forge-field forge-half"><label class="forge-label">hobbies</label>
            <input class="forge-input" id="yc-hobbies" placeholder="making things..." /></div>
          <div class="forge-field forge-half"><label class="forge-label">current obsession</label>
            <input class="forge-input" id="yc-obsession" placeholder="spiralside.com..." /></div>
        </div>
        <div class="forge-row">
          <div class="forge-field forge-half"><label class="forge-label">job / role</label>
            <input class="forge-input" id="yc-job" placeholder="architect..." /></div>
          <div class="forge-field forge-half"><label class="forge-label">creative medium</label>
            <input class="forge-input" id="yc-creative-medium" placeholder="all..." /></div>
        </div>
        <div class="forge-row">
          <div class="forge-field forge-half"><label class="forge-label">who matters</label>
            <input class="forge-input" id="yc-who-matters" placeholder="Bellota..." /></div>
          <div class="forge-field forge-half"><label class="forge-label">wins lately</label>
            <input class="forge-input" id="yc-wins" placeholder="clean builds..." /></div>
        </div>
        <div class="forge-row">
          <div class="forge-field forge-half"><label class="forge-label">stuck on</label>
            <input class="forge-input" id="yc-stuck-on" placeholder="spriialside.com..." /></div>
          <div class="forge-field forge-half"><label class="forge-label">influences</label>
            <input class="forge-input" id="yc-influences" placeholder="all..." /></div>
        </div>
        <div class="forge-field"><label class="forge-label">how you work</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px" id="yc-how-chips">
            <button class="tone-chip" data-yc="night owl">night owl</button>
            <button class="tone-chip" data-yc="morning person">morning person</button>
            <button class="tone-chip" data-yc="hyperfocus">hyperfocus</button>
            <button class="tone-chip" data-yc="needs breaks">needs breaks</button>
            <button class="tone-chip" data-yc="visual thinker">visual thinker</button>
            <button class="tone-chip" data-yc="list maker">list maker</button>
            <button class="tone-chip" data-yc="voice processor">voice processor</button>
            <button class="tone-chip" data-yc="chaotic good">chaotic good</button>
            <button class="tone-chip" data-yc="overthinker">overthinker</button>
            <button class="tone-chip" data-yc="ADHD">ADHD</button>
            <button class="tone-chip" data-yc="introvert">introvert</button>
            <button class="tone-chip" data-yc="extrovert">extrovert</button>
          </div>
        </div>
        <div class="forge-field"><label class="forge-label">tell Sky anything</label>
          <textarea class="forge-input" id="yc-tell-sky" rows="3" placeholder="stuff Sky should just know..."></textarea></div>
      </div>
    </div>

    <!-- APPEARANCE -->'''

patch('js/app/views/forge.js', FORGE_ANCHOR, FORGE_NEW, 'forge.js — about you section')

# ================================================================
# PATCH 2a — build.js
# Show/hide about-you section + wire yc chips in initBuild()
# Anchor: the end of initBuild tone chip wiring
# ================================================================

BUILD_INIT_ANCHOR = '  // Wire stat add button\n  const addStatBtn = document.getElementById(\'forge-add-stat\');'

BUILD_INIT_NEW = '''  // Wire "about you" chips (yc chips — separate from tone chips)
  document.querySelectorAll('[data-yc]').forEach(chip => {
    chip.addEventListener('click', () => chip.classList.toggle('selected'));
  });

  // Wire stat add button
  const addStatBtn = document.getElementById('forge-add-stat');'''

patch('js/app/build.js', BUILD_INIT_ANCHOR, BUILD_INIT_NEW, 'build.js — yc chip wiring in initBuild')

# ================================================================
# PATCH 2b — build.js
# Add showYouSection / hideYouSection helpers + you_card load path
# Append after _loadPrintDataIntoForm function's closing brace
# Anchor: unique line just before loadPrintIntoForm
# ================================================================

BUILD_LOAD_ANCHOR = 'async function loadPrintIntoForm() {'

BUILD_LOAD_NEW = '''// ── YOU CARD SECTION VISIBILITY ──────────────────────────────
function showYouSection() {
  const sec = document.getElementById('forge-section-aboutyou');
  if (sec) sec.style.display = '';
  // Also expand it open
  const body = document.getElementById('forge-body-aboutyou');
  const icon = document.getElementById('forge-icon-aboutyou');
  if (body) body.style.display = 'block';
  if (icon) icon.textContent = '▾';
  // Update save button label
  const saveBtn = document.getElementById('save-bot-btn');
  if (saveBtn) saveBtn.textContent = 'save your card';
}
function hideYouSection() {
  const sec = document.getElementById('forge-section-aboutyou');
  if (sec) sec.style.display = 'none';
  const saveBtn = document.getElementById('save-bot-btn');
  if (saveBtn) saveBtn.textContent = 'save companion';
}
window.showYouSection = showYouSection;
window.hideYouSection = hideYouSection;

// ── LOAD YOU CARD INTO FORGE ──────────────────────────────────
// Called when editing you_card — reads from sheets IDB store
export async function loadYouCardIntoForge() {
  const { dbGet: _dbGet } = await import('./db.js');
  // you_card lives in sheets store as id: 'you'
  const char = await _dbGet('sheets', 'you').catch(() => null);
  if (!char) return;

  state.activePrintId = 'you_card';

  // Map shared identity fields into forge
  const s = id => { const el = document.getElementById(id); return (val) => { if (el) el.value = val || ''; }; };
  const id = char.identity || {};
  s('bot-name')(char.name || id.name || '');
  s('bot-greeting')(id.first_words || char.first_words || '');
  s('bot-personality')(id.personality || char.personality || '');
  s('forge-title')(id.title || char.role || '');
  s('forge-identity-line')(id.identity_line || '');
  s('forge-vibe')(id.vibe || '');
  s('forge-pronouns')(id.pronouns || '');
  s('forge-species')(id.species || '');
  s('forge-age')(id.age || '');
  s('forge-alignment')(id.alignment || '');
  s('forge-origin')(id.origin || '');
  s('forge-occupation')(id.occupation || char.job || '');

  // Portrait
  const portrait = char.portrait_base64 || char.avatar_base64 || null;
  if (!portrait && window.opfsRead) {
    try {
      const d = await window.opfsRead('you_card_avatar.png');
      if (d) {
        _portraitBase64 = d;
        const pv = document.getElementById('forge-portrait-preview');
        const ph = document.getElementById('forge-portrait-hint');
        const pw = document.getElementById('forge-portrait-wrap');
        if (pv) { pv.src = d; pv.style.display = 'block'; }
        if (ph) ph.style.display = 'none';
        if (pw) pw.style.borderColor = 'var(--teal)';
      }
    } catch(_) {}
  } else if (portrait) {
    _portraitBase64 = portrait;
    const pv = document.getElementById('forge-portrait-preview');
    const ph = document.getElementById('forge-portrait-hint');
    const pw = document.getElementById('forge-portrait-wrap');
    if (pv) { pv.src = portrait; pv.style.display = 'block'; }
    if (ph) ph.style.display = 'none';
    if (pw) pw.style.borderColor = 'var(--teal)';
  }

  // Map you-specific fields into about-you section
  const yc = id => { const el = document.getElementById(id); return (val) => { if (el) el.value = val || ''; }; };
  yc('yc-hair')(char.hair || '');
  yc('yc-build')(char.build || char.height_build || '');
  yc('yc-marks')(char.marks || '');
  yc('yc-life-now')(char.life_now || char.life_right_now || '');
  yc('yc-current-arc')(char.current_arc || '');
  yc('yc-working-on')(char.working_on || '');
  yc('yc-theme-song')(char.theme_song || '');
  yc('yc-pets')(char.pets || char.pet_names || '');
  yc('yc-fav-food')(char.fav_food || '');
  yc('yc-comfort-show')(char.comfort_show || '');
  yc('yc-hates')(char.hates || '');
  yc('yc-hobbies')(char.hobbies || '');
  yc('yc-obsession')(char.obsession || char.current_obsession || '');
  yc('yc-job')(char.job || '');
  yc('yc-creative-medium')(char.creative_medium || '');
  yc('yc-who-matters')(char.who_matters || '');
  yc('yc-wins')(char.wins || char.wins_lately || '');
  yc('yc-stuck-on')(char.stuck_on || '');
  yc('yc-influences')(char.influences || '');
  yc('yc-tell-sky')(char.tell_sky || '');

  // Restore how-you-work chips
  const howYouWork = char.how_you_work || [];
  document.querySelectorAll('[data-yc]').forEach(c => {
    c.classList.toggle('selected', howYouWork.includes(c.dataset.yc));
  });

  // Show the about-you section
  showYouSection();
  console.log('[forge] you_card loaded into forge');
}
window.loadYouCardIntoForge = loadYouCardIntoForge;

async function loadPrintIntoForm() {'''

patch('js/app/build.js', BUILD_LOAD_ANCHOR, BUILD_LOAD_NEW, 'build.js — loadYouCardIntoForge + showYouSection')

# ================================================================
# PATCH 2c — build.js
# Intercept handleSave — if activePrintId === 'you_card', write back to sheets
# Anchor: start of handleSave
# ================================================================

BUILD_SAVE_ANCHOR = '  // Keep state in sync for chat persona\n  state.botName        = print.identity.name        || \'companion\';'

BUILD_SAVE_NEW = '''  // ── YOU CARD SAVE PATH ──
  if (state.activePrintId === 'you_card') {
    const { dbGet: _g, dbSet: _s } = await import('./db.js');
    const existing = await _g('sheets', 'you').catch(() => ({})) || {};
    // Collect how-you-work chips
    const howYouWork = [];
    document.querySelectorAll('[data-yc].selected').forEach(c => howYouWork.push(c.dataset.yc));
    const g = id => document.getElementById(id)?.value?.trim() || '';
    const updated = Object.assign({}, existing, {
      id:             'you',
      name:           print.identity.name || existing.name,
      first_words:    print.identity.first_words || existing.first_words,
      personality:    print.identity.personality || existing.personality,
      hair:           g('yc-hair'),
      build:          g('yc-build'),
      marks:          g('yc-marks'),
      life_now:       g('yc-life-now'),
      current_arc:    g('yc-current-arc'),
      working_on:     g('yc-working-on'),
      theme_song:     g('yc-theme-song'),
      pets:           g('yc-pets'),
      fav_food:       g('yc-fav-food'),
      comfort_show:   g('yc-comfort-show'),
      hates:          g('yc-hates'),
      hobbies:        g('yc-hobbies'),
      obsession:      g('yc-obsession'),
      job:            g('yc-job'),
      creative_medium:g('yc-creative-medium'),
      who_matters:    g('yc-who-matters'),
      wins:           g('yc-wins'),
      stuck_on:       g('yc-stuck-on'),
      influences:     g('yc-influences'),
      tell_sky:       g('yc-tell-sky'),
      how_you_work:   howYouWork,
      updated_at:     new Date().toISOString(),
    });
    if (_portraitBase64) updated.portrait_base64 = _portraitBase64;
    await _s('sheets', updated);
    // Cloud backup
    if (window.syncSave) window.syncSave('you_card', Object.assign({}, updated, { id: 'you' })).catch(() => {});
    // Feedback
    const btn2 = document.getElementById('save-bot-btn');
    if (btn2) { btn2.textContent = 'saved'; setTimeout(() => { btn2.textContent = 'save your card'; }, 1800); }
    state.activePrintId = null;
    hideYouSection();
    // Switch back to the You card view
    if (window.switchView) window.switchView('sheet');
    console.log('[forge] you_card saved back to sheets IDB');
    return;
  }

  // Keep state in sync for chat persona
  state.botName        = print.identity.name        || 'companion';'''

patch('js/app/build.js', BUILD_SAVE_ANCHOR, BUILD_SAVE_NEW, 'build.js — handleSave you_card branch')

# ================================================================
# PATCH 3 — sheet.js
# Add "edit in forge" button to You card render
# Anchor: the "make my card" button text line (line 823 area)
# ================================================================

SHEET_ANCHOR = "_makePrintBtn.textContent = '✦ make my card';"

SHEET_NEW = """_makePrintBtn.textContent = '\\u2736 make my card';

  // ── EDIT IN FORGE BUTTON (you card only) ──
  const _ycEditBtn = document.createElement('button');
  _ycEditBtn.textContent = 'edit in forge';
  _ycEditBtn.style.cssText = 'width:100%;margin-top:8px;padding:11px;background:var(--surface2);border:1px solid var(--teal);border-radius:10px;color:var(--teal);font-family:var(--font-ui);font-size:0.78rem;cursor:pointer;letter-spacing:0.06em;transition:all 0.2s';
  _ycEditBtn.addEventListener('click', async () => {
    const { initForgeView } = await import('./views/forge.js');
    initForgeView();
    if (window.loadYouCardIntoForge) await window.loadYouCardIntoForge();
    if (window.switchView) window.switchView('forge');
  });
  // Insert after make my card button
  _makePrintBtn.parentNode.insertBefore(_ycEditBtn, _makePrintBtn.nextSibling);"""

patch('js/app/sheet.js', SHEET_ANCHOR, SHEET_NEW, 'sheet.js — edit in forge button on You card')

# ================================================================
# Done
# ================================================================
print('\nAll patches applied. Now run:')
print('  cd ~/spiralside')
print('  git add js/app/views/forge.js js/app/build.js js/app/sheet.js')
print('  git commit -m "feat: equalize you_card with forge — about you section + edit in forge button"')
print('  git push --force origin main')
