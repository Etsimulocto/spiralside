"""
IMAGINE PIPELINE PATCH
======================
1. build.js — handleForgeGenImg passes ALL forge fields including eyes/marks/color_theme
2. imagine.js — initImagine gets onImagineOpen hook that auto-loads active character

Run from: ~/spiralside
Command:  /c/Users/quart/AppData/Local/Programs/Python/Python313/python.exe imagine_pipeline.py
"""

import sys
ROOT = 'C:/Users/quart/spiralside'

def patch(fp, old, new, label):
    full = ROOT + '/' + fp
    with open(full, 'r', encoding='utf-8') as f:
        src = f.read()
    src = src.replace('\r\n', '\n')
    count = src.count(old)
    if count != 1:
        print(f'[MISS] {label} — found {count} times')
        sys.exit(1)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(src.replace(old, new, 1))
    print(f'[OK]   {label}')

# ================================================================
# PATCH 1 — build.js
# handleForgeGenImg: pass all forge fields including eyes/marks/color_theme
# ================================================================

patch('js/app/build.js',
"""  if (window.imagineWithContext) {
    window.imagineWithContext({
      subject:     g('bot-name') || 'character',
      hair:        g('forge-hair'),
      eyes:        g('forge-eyes'),
      clothing:    g('forge-style'),
      marks:       g('forge-marks'),
      species:     g('forge-species'),
      vibe:        g('forge-vibe'),
      pose:        g('forge-pose'),
      scene:       g('forge-background'),
      world:       g('forge-origin'),
      artStyle:    g('forge-art-style'),
      lighting:    g('forge-lighting'),
      renderStyle: g('forge-render-style'),
      negativePrompt: 'blurry, low quality, ugly, deformed, bad anatomy',
    });
  }""",
"""  if (window.imagineWithContext) {
    window.imagineWithContext({
      subject:        g('bot-name') || 'character',
      hair:           g('forge-hair'),
      eyes:           g('forge-eyes'),
      clothing:       g('forge-style'),
      marks:          g('forge-marks'),
      species:        g('forge-species'),
      vibe:           g('forge-vibe'),
      pose:           g('forge-pose'),
      scene:          g('forge-background'),
      world:          g('forge-origin'),
      artStyle:       g('forge-art-style'),
      lighting:       g('forge-lighting'),
      renderStyle:    g('forge-render-style'),
      colorTheme:     g('forge-color-theme'),
      identityLine:   g('forge-identity-line'),
      negativePrompt: 'blurry, low quality, ugly, deformed, bad anatomy',
    });
  }""",
'build.js — handleForgeGenImg: all fields including colorTheme + identityLine')

# ================================================================
# PATCH 2 — imagine.js
# initImagine: add onImagineOpen that auto-loads active character
# Anchor: end of initImagine(), right before the closing brace
# ================================================================

patch('js/app/imagine.js',
"""  _syncCostBar();
  document.querySelectorAll('.forge-gen-btn').forEach(b => {
    const m = MODELS.find(x => x.id === _model) || MODELS[0];
    b.textContent = `❆ generate from fields · ${m.label} · ${m.cost.toLocaleString()} cr`;
    b.style.background = `linear-gradient(135deg,${m.color},var(--purple))`;
  });
}""",
"""  _syncCostBar();
  document.querySelectorAll('.forge-gen-btn').forEach(b => {
    const m = MODELS.find(x => x.id === _model) || MODELS[0];
    b.textContent = `❆ generate from fields · ${m.label} · ${m.cost.toLocaleString()} cr`;
    b.style.background = `linear-gradient(135deg,${m.color},var(--purple))`;
  });

  // ── AUTO-LOAD ACTIVE CHARACTER ────────────────────────────────
  // On every Imagine open: silently populate character fields from
  // the active forge print or You card — only if fields are empty
  _autoLoadActiveChar();
}

// Reads active character from IDB and pre-fills Imagine fields
// Only fills fields that are currently blank — never overwrites user input
async function _autoLoadActiveChar() {
  try {
    const { state }  = await import('./state.js');
    const { dbGet, dbGetAll } = await import('./db.js');

    let char = null;

    // Priority 1: active print from forge
    if (state.activePrintId && state.activePrintId !== 'you_card') {
      const print = await dbGet('prints', state.activePrintId).catch(() => null);
      if (print) {
        const id = print.identity    || {};
        const ap = print.appearance  || {};
        char = {
          subject:      id.name        || '',
          hair:         ap.hair        || '',
          eyes:         ap.eyes        || '',
          clothing:     ap.style       || '',
          marks:        ap.marks       || '',
          species:      id.species     || '',
          vibe:         id.vibe        || '',
          colorTheme:   ap.color_theme || '',
          artStyle:     ap.art_style   || '',
          renderStyle:  ap.render_style || '',
          identityLine: id.identity_line || '',
        };
      }
    }

    // Priority 2: You card from sheets store
    if (!char) {
      const you = await dbGet('sheets', 'you').catch(() => null);
      if (you && you.handle) {
        char = {
          subject:    you.handle || '',
          hair:       you.hair   || '',
          eyes:       you.eyes   || '',
          clothing:   you.style  || '',
          marks:      you.marks  || '',
          species:    'human',
          vibe:       you.vibe   || '',
          colorTheme: '',
        };
      }
    }

    if (!char) return;

    // Only fill if field is currently blank
    const fill = (id, val) => {
      if (!val) return;
      const el = document.getElementById(id);
      if (el && !el.value.trim()) el.value = val;
    };

    // Fill subject prompt only if blank
    fill('im-prompt',      char.subject);
    // Fill extended fields
    _fillFieldIfEmpty('ix-hair',         char.hair);
    _fillFieldIfEmpty('ix-eyes',         char.eyes);
    _fillFieldIfEmpty('ix-clothing',     char.clothing);
    _fillFieldIfEmpty('ix-marks',        char.marks);
    _fillFieldIfEmpty('ix-species',      char.species);
    _fillFieldIfEmpty('ix-vibe',         char.vibe);
    _fillFieldIfEmpty('ix-visual-desc',  char.colorTheme);
    _fillFieldIfEmpty('ix-render-style', char.renderStyle || '');

    // Activate art style chip if set and nothing selected
    if (char.artStyle) {
      const chips = document.getElementById('ix-chips-style');
      if (chips && !chips.querySelector('.active')) {
        _activateChip('ix-chips-style', char.artStyle);
      }
    }

    _updatePreview();
    console.log('[imagine] auto-loaded char:', char.subject || '(you)');
  } catch(e) {
    // Silent fail — never block Imagine from loading
    console.warn('[imagine] auto-load failed:', e);
  }
}

// Like _fillField but only fills if currently blank
function _fillFieldIfEmpty(id, val) {
  if (!val) return;
  const el = document.getElementById(id);
  if (el && !el.value.trim()) el.value = val;
}""",
'imagine.js — initImagine: auto-load active character on tab open')

# ================================================================
# PATCH 3 — imagine.js
# imagineWithContext: handle colorTheme + identityLine new fields
# ================================================================

patch('js/app/imagine.js',
"""    // STYLE fields
    _fillField('ix-background',  ctx.background  || '');
    _fillField('ix-render-style', ctx.renderStyle  || '');""",
"""    // STYLE fields
    _fillField('ix-background',   ctx.background   || '');
    _fillField('ix-render-style', ctx.renderStyle  || '');
    // EXTRA fields from forge
    if (ctx.colorTheme)   _fillField('ix-visual-desc',  ctx.colorTheme);
    if (ctx.identityLine) _fillField('ix-vibe',         ctx.identityLine);""",
'imagine.js — imagineWithContext: handle colorTheme + identityLine')

print('\nAll 3 patches applied. Run:')
print('  cd ~/spiralside')
print('  git add js/app/build.js js/app/imagine.js')
print('  git commit -m "feat: imagine auto-loads active character + forge passes all fields"')
print('  git push --force origin main')
