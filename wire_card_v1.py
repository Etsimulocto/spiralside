#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — CARD SYSTEM v1.0 WIRE SCRIPT
# 1. Copies card.js to js/app/
# 2. Adds "Create Card" button + preview to Forge HTML
# 3. Wires card generation in build.js
# 4. Updates HANDOFF
# Run from repo root: python wire_card_v1.py
# Nimbis anchor: wire_card_v1.py
# ============================================================

import shutil, os

def read(path):
    return open(path, encoding='utf-8').read()

def write(path, content):
    open(path, 'w', encoding='utf-8').write(content)
    print(f'  ✅ wrote {path}')

def patch(path, old, new, label=''):
    src = read(path)
    if old in src:
        write(path, src.replace(old, new, 1))
        print(f'  ✅ patched: {label}')
        return True
    print(f'  ⚠️  not found: {label}')
    return False

# ── 1. COPY card.js TO REPO ───────────────────────────────────
print('\n📄 Copying card.js to js/app/...')
shutil.copy('card.js', 'js/app/card.js')
print('  ✅ js/app/card.js copied')

# ── 2. ADD CARD PREVIEW + BUTTON TO FORGE HTML ───────────────
print('\n📄 Patching index.html — card preview in Forge...')

patch('index.html',
    '''    <!-- ── SAVE ── -->
    <button id="save-bot-btn" style="''',
    '''    <!-- ── CARD PREVIEW ── -->
    <div id="forge-card-preview" style="
      margin-bottom:16px;display:none;
      background:var(--surface);border:1px solid var(--border);
      border-radius:12px;padding:16px;text-align:center;
    ">
      <div style="font-size:0.6rem;letter-spacing:0.12em;color:var(--subtext);
        text-transform:uppercase;margin-bottom:12px">card preview</div>
      <div id="forge-card-canvas-wrap"></div>
      <button id="forge-download-card-btn" style="
        margin-top:12px;width:100%;padding:11px;
        background:var(--surface2);border:1px solid var(--border);
        border-radius:10px;color:var(--teal);font-family:var(--font-ui);
        font-size:0.78rem;cursor:pointer;letter-spacing:0.06em;
        transition:all 0.2s
      ">⬇ download card (.png)</button>
    </div>

    <!-- ── CREATE CARD BUTTON ── -->
    <button id="create-card-btn" style="
      width:100%;padding:13px;margin-bottom:8px;
      background:linear-gradient(135deg,var(--teal),var(--purple));
      border:none;border-radius:12px;color:#fff;
      font-family:var(--font-display);font-weight:700;font-size:0.88rem;
      cursor:pointer;letter-spacing:0.04em;transition:opacity 0.2s;
      opacity:0.9
    ">✦ create card</button>

    <!-- ── SAVE ── -->
    <button id="save-bot-btn" style="''',
    'card preview + create card button')

# ── 3. WIRE CARD BUTTON IN build.js ──────────────────────────
print('\n📄 Patching build.js — wire create card button...')

patch('js/app/build.js',
    '''  // Wire save button
  const saveBtn = document.getElementById('save-bot-btn');
  if (saveBtn) saveBtn.addEventListener('click', handleSave);''',
    '''  // Wire save button
  const saveBtn = document.getElementById('save-bot-btn');
  if (saveBtn) saveBtn.addEventListener('click', handleSave);

  // Wire create card button
  const cardBtn = document.getElementById('create-card-btn');
  if (cardBtn) cardBtn.addEventListener('click', handleCreateCard);

  // Wire download button
  const dlBtn = document.getElementById('forge-download-card-btn');
  if (dlBtn) dlBtn.addEventListener('click', handleDownloadCard);''',
    'card button wiring')

# ── 4. ADD handleCreateCard + handleDownloadCard TO build.js ──
print('\n📄 Adding card handlers to build.js...')

patch('js/app/build.js',
    '''// ── SAVE ──────────────────────────────────────────────────────
async function handleSave() {''',
    '''// ── CREATE CARD ───────────────────────────────────────────────
// Generates card visual from current form data + shows preview
let _lastCardPrint = null;

async function handleCreateCard() {
  const { generateCardId, renderCard, calcRarity } = await import('./card.js');

  // Read current form into a print object
  const print = readPrint();

  // Generate card ID if not set
  if (!print.card_id || print.card_id.startsWith('print_')) {
    print.card_id = generateCardId('companion');
  }

  // Set version
  print.version = print.version || 'v1';

  // Set display block for rarity/accent
  print.display = {
    accent_color: state.botColor || '#00F6D6',
    rarity:       calcRarity(print.lifecycle || {}),
  };

  _lastCardPrint = print;

  // Show preview
  const wrap = document.getElementById('forge-card-canvas-wrap');
  const preview = document.getElementById('forge-card-preview');
  if (!wrap || !preview) return;

  preview.style.display = 'block';
  wrap.innerHTML = '<div style="color:var(--subtext);font-size:0.75rem;padding:20px">rendering...</div>';

  // Check if there's an art image in vault/imagine
  let artImage = null;
  const imgEl = document.querySelector('#library-last-image');
  if (imgEl) artImage = imgEl;

  const canvas = await renderCard(print, artImage);
  canvas.style.cssText = 'width:100%;max-width:360px;border-radius:8px;display:block;margin:0 auto;box-shadow:0 0 32px rgba(0,246,214,0.2)';
  wrap.innerHTML = '';
  wrap.appendChild(canvas);

  // Scroll to preview
  preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Update button
  const btn = document.getElementById('create-card-btn');
  if (btn) {
    btn.textContent = '✓ card rendered — download below';
    setTimeout(() => { btn.textContent = '✦ create card'; }, 3000);
  }
}

async function handleDownloadCard() {
  if (!_lastCardPrint) {
    alert('Create a card first!');
    return;
  }
  const { downloadCard } = await import('./card.js');
  await downloadCard(_lastCardPrint);
}

// ── SAVE ──────────────────────────────────────────────────────
async function handleSave() {''',
    'handleCreateCard + handleDownloadCard')

# ── 5. UPDATE HANDOFF ─────────────────────────────────────────
print('\n📄 Updating HANDOFF.md...')
with open('HANDOFF.md', 'a', encoding='utf-8') as f:
    f.write('''
---

## SESSION LOG — March 17 2026

### COMPLETED THIS SESSION
- [x] js/app/card.js — canvas card renderer
      - generateCardId() — CHR-XXXX-XXXX format
      - calcRarity() — auto from lifecycle stats
      - renderCard(print, artImage) — returns canvas
      - downloadCard(print) — triggers PNG download
      - showCardPreview(print, el) — renders into DOM element
- [x] Forge — "Create Card" button renders preview in-page
- [x] Forge — "Download Card" button saves PNG
- [x] Card layout: header / art / identity line / stats / vibe+lifecycle / footer
- [x] 4 rarity tiers: standard / bloom / signal / sanctum (auto-calculated)
- [x] S.H.E.S default stats shown if no user stats defined

### CARD SYSTEM ARCHITECTURE
- card.js is pure renderer — no DOM dependencies except canvas
- Soul print JSON → card canvas → PNG download
- Art image optional — gradient placeholder if none
- Card ID format: CHR-XXXX-XXXX (type prefix + random hex)
- Rarity auto-calculated from lifecycle stats (usage/transfers/upgrades/age)

### NEXT SESSION PRIORITIES
1. Wire art image from imagine tab into card renderer
2. Add card_id + version + lifecycle to soul print JSON schema
3. Codex card face shows rendered card canvas (trading card view)
4. Card import — upload JSON → appears in Codex
5. Echo button on archetype cards
6. Conversation memory
''')
print('  ✅ HANDOFF updated')

print('''
✅ Done! Now run:

  cp card.js ~/spiralside/card.js   (if not already there)
  cd ~/spiralside
  python wire_card_v1.py
  git add .
  git commit -m "feat: card renderer v1 — canvas card, create/download, rarity tiers"
  git push

Then in Forge:
  Fill in identity fields → tap "create card" → see preview → tap download → get PNG
''')
