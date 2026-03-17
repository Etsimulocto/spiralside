#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — STYLE EDITOR v2.0
# Full collapsible style editor — sections like Forge
# Adds: font size slider, text/subtext/border colors,
#       bot bubble color, accessibility presets, mom mode
# Fixes: text color picker bug
# Run from repo root: python fix_style_editor.py
# Nimbis anchor: fix_style_editor.py
# ============================================================

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

# ── 1. REPLACE view-style HTML ────────────────────────────────
print('\n📄 Replacing view-style HTML...')

NEW_STYLE_VIEW = '''<div class="view" id="view-style">
  <div style="overflow-y:auto;padding:12px 16px calc(80px + var(--safe-bot));-webkit-overflow-scrolling:touch">

    <!-- ── ACCESSIBILITY PRESETS ── -->
    <div class="forge-section" style="margin-bottom:10px">
      <div class="forge-section-header" onclick="toggleStyleSection('access')">
        <span class="forge-section-icon" id="sicon-access">▾</span>
        <span class="forge-section-title">♿ accessibility presets</span>
      </div>
      <div class="forge-section-body" id="sbody-access">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:4px">
          <button onclick="applyAccessPreset('large')" style="
            padding:14px 8px;background:var(--surface2);border:2px solid var(--teal);
            border-radius:10px;color:var(--teal);font-family:var(--font-ui);
            font-size:0.9rem;cursor:pointer;letter-spacing:0.04em">
            🔠 large text
          </button>
          <button onclick="applyAccessPreset('contrast')" style="
            padding:14px 8px;background:var(--surface2);border:2px solid var(--pink);
            border-radius:10px;color:var(--pink);font-family:var(--font-ui);
            font-size:0.9rem;cursor:pointer;letter-spacing:0.04em">
            ◑ high contrast
          </button>
          <button onclick="applyAccessPreset('tablet')" style="
            padding:14px 8px;background:var(--surface2);border:2px solid var(--purple);
            border-radius:10px;color:var(--purple);font-family:var(--font-ui);
            font-size:0.9rem;cursor:pointer;letter-spacing:0.04em">
            📱 tablet mode
          </button>
          <button onclick="applyAccessPreset('default')" style="
            padding:14px 8px;background:var(--surface2);border:1px solid var(--border);
            border-radius:10px;color:var(--subtext);font-family:var(--font-ui);
            font-size:0.9rem;cursor:pointer;letter-spacing:0.04em">
            ↺ reset all
          </button>
        </div>
      </div>
    </div>

    <!-- ── THEMES ── -->
    <div class="forge-section" style="margin-bottom:10px">
      <div class="forge-section-header" onclick="toggleStyleSection('themes')">
        <span class="forge-section-icon" id="sicon-themes">▾</span>
        <span class="forge-section-title">🎨 themes</span>
      </div>
      <div class="forge-section-body" id="sbody-themes">
        <div class="theme-grid" id="theme-grid-view"></div>
      </div>
    </div>

    <!-- ── TYPOGRAPHY ── -->
    <div class="forge-section" style="margin-bottom:10px">
      <div class="forge-section-header" onclick="toggleStyleSection('typo')">
        <span class="forge-section-icon" id="sicon-typo">▾</span>
        <span class="forge-section-title">Aa typography</span>
      </div>
      <div class="forge-section-body" id="sbody-typo">

        <!-- Font size BIG slider — for mom -->
        <div class="forge-field">
          <label class="forge-label">text size</label>
          <div class="slider-row" style="gap:12px;align-items:center">
            <span style="font-size:0.7rem;color:var(--subtext)">A</span>
            <input type="range" min="12" max="22" value="14" id="font-size-slider"
              style="flex:1;accent-color:var(--teal)"
              oninput="previewFontSize(this.value)" />
            <span style="font-size:1.2rem;color:var(--subtext)">A</span>
            <span id="font-size-val" style="
              min-width:36px;text-align:right;font-size:0.78rem;color:var(--teal)
            ">14px</span>
          </div>
          <!-- Preview text -->
          <div id="font-size-preview" style="
            margin-top:8px;padding:10px 12px;background:var(--surface2);
            border-radius:8px;border:1px solid var(--border);
            font-size:1rem;line-height:1.6;color:var(--text)
          ">The quick brown fox jumps over the lazy dog. 0123456789</div>
        </div>

        <!-- Line height -->
        <div class="forge-field">
          <label class="forge-label">line height</label>
          <div class="slider-row">
            <input type="range" min="120" max="200" value="155" id="line-height-slider"
              style="flex:1;accent-color:var(--teal)"
              oninput="previewLineHeight(this.value)" />
            <span id="line-height-val" style="min-width:36px;text-align:right;font-size:0.78rem;color:var(--teal)">1.55</span>
          </div>
        </div>

        <!-- UI Font -->
        <div class="forge-field">
          <label class="forge-label">ui font</label>
          <div class="font-grid" id="font-grid-ui-v">
            <div class="font-chip selected" data-font="'DM Mono',monospace" style="font-family:'DM Mono',monospace" onclick="selectFont('ui',this)">DM Mono</div>
            <div class="font-chip" data-font="'JetBrains Mono',monospace" style="font-family:'JetBrains Mono',monospace" onclick="selectFont('ui',this)">JetBrains</div>
            <div class="font-chip" data-font="'Space Grotesk',sans-serif" style="font-family:'Space Grotesk',sans-serif" onclick="selectFont('ui',this)">Grotesk</div>
            <div class="font-chip" data-font="'Outfit',sans-serif" style="font-family:'Outfit',sans-serif" onclick="selectFont('ui',this)">Outfit</div>
            <div class="font-chip" data-font="'Raleway',sans-serif" style="font-family:'Raleway',sans-serif" onclick="selectFont('ui',this)">Raleway</div>
            <div class="font-chip" data-font="'Playfair Display',serif" style="font-family:'Playfair Display',serif" onclick="selectFont('ui',this)">Playfair</div>
          </div>
        </div>

        <!-- Display Font -->
        <div class="forge-field">
          <label class="forge-label">display / logo font</label>
          <div class="font-grid" id="font-grid-display-v">
            <div class="font-chip selected" data-font="'Syne',sans-serif" style="font-family:'Syne',sans-serif" onclick="selectFont('display',this)">Syne</div>
            <div class="font-chip" data-font="'Outfit',sans-serif" style="font-family:'Outfit',sans-serif" onclick="selectFont('display',this)">Outfit</div>
            <div class="font-chip" data-font="'Space Grotesk',sans-serif" style="font-family:'Space Grotesk',sans-serif" onclick="selectFont('display',this)">Grotesk</div>
            <div class="font-chip" data-font="'Playfair Display',serif" style="font-family:'Playfair Display',serif" onclick="selectFont('display',this)">Playfair</div>
          </div>
        </div>

      </div>
    </div>

    <!-- ── COLORS ── -->
    <div class="forge-section" style="margin-bottom:10px">
      <div class="forge-section-header" onclick="toggleStyleSection('colors')">
        <span class="forge-section-icon" id="sicon-colors">▸</span>
        <span class="forge-section-title">🌈 colors</span>
      </div>
      <div class="forge-section-body" id="sbody-colors" style="display:none">
        <div class="color-row"><span class="color-label">background</span><div class="color-swatch"><div class="color-swatch-bg" id="sw-bg-v" style="background:#08080d"></div><input type="color" value="#08080d" oninput="previewColor('bg',this.value)" /></div></div>
        <div class="color-row"><span class="color-label">surface / cards</span><div class="color-swatch"><div class="color-swatch-bg" id="sw-surface-v" style="background:#0f0f18"></div><input type="color" value="#0f0f18" oninput="previewColor('surface',this.value)" /></div></div>
        <div class="color-row"><span class="color-label">border</span><div class="color-swatch"><div class="color-swatch-bg" id="sw-border-v" style="background:#1e1e35"></div><input type="color" value="#1e1e35" oninput="previewColor('border',this.value)" /></div></div>
        <div class="color-row"><span class="color-label">accent (primary)</span><div class="color-swatch"><div class="color-swatch-bg" id="sw-teal-v" style="background:#00F6D6"></div><input type="color" value="#00F6D6" oninput="previewColor('teal',this.value)" /></div></div>
        <div class="color-row"><span class="color-label">accent (secondary)</span><div class="color-swatch"><div class="color-swatch-bg" id="sw-pink-v" style="background:#FF4BCB"></div><input type="color" value="#FF4BCB" oninput="previewColor('pink',this.value)" /></div></div>
        <div class="color-row"><span class="color-label">text color</span><div class="color-swatch"><div class="color-swatch-bg" id="sw-text-v" style="background:#F0F0FF"></div><input type="color" value="#F0F0FF" oninput="previewColor('text',this.value)" /></div></div>
        <div class="color-row"><span class="color-label">subtext color</span><div class="color-swatch"><div class="color-swatch-bg" id="sw-subtext-v" style="background:#6060A0"></div><input type="color" value="#6060A0" oninput="previewColor('subtext',this.value)" /></div></div>
        <div class="color-row"><span class="color-label">user bubble</span><div class="color-swatch"><div class="color-swatch-bg" id="sw-userbubble-v" style="background:#7B5FFF"></div><input type="color" value="#7B5FFF" oninput="previewColor('userbubble',this.value)" /></div></div>
        <div class="color-row"><span class="color-label">bot bubble</span><div class="color-swatch"><div class="color-swatch-bg" id="sw-botbubble-v" style="background:#0f0f18"></div><input type="color" value="#0f0f18" oninput="previewColor('botbubble',this.value)" /></div></div>
      </div>
    </div>

    <!-- ── CHAT BUBBLES ── -->
    <div class="forge-section" style="margin-bottom:10px">
      <div class="forge-section-header" onclick="toggleStyleSection('bubbles')">
        <span class="forge-section-icon" id="sicon-bubbles">▸</span>
        <span class="forge-section-title">💬 chat bubbles</span>
      </div>
      <div class="forge-section-body" id="sbody-bubbles" style="display:none">
        <div class="forge-field">
          <label class="forge-label">bubble shape</label>
          <div class="bubble-shape-row">
            <div class="shape-chip selected" data-shape="16" onclick="selectBubbleShape(this,'16')">soft</div>
            <div class="shape-chip" data-shape="24" onclick="selectBubbleShape(this,'24')">pill</div>
            <div class="shape-chip" data-shape="3" onclick="selectBubbleShape(this,'3')">sharp</div>
          </div>
        </div>
        <div class="forge-field">
          <label class="forge-label">bubble radius</label>
          <div class="slider-row">
            <input type="range" min="2" max="28" value="14"
              style="flex:1;accent-color:var(--teal)"
              oninput="previewSlider('bubble-radius',this.value+'px');document.getElementById('sv-br-v').textContent=this.value" />
            <span class="slider-val" id="sv-br-v">14</span>
          </div>
        </div>
        <div class="forge-field">
          <label class="forge-label">message gap</label>
          <div class="slider-row">
            <input type="range" min="4" max="32" value="10"
              style="flex:1;accent-color:var(--teal)"
              oninput="previewSlider('msg-spacing',this.value+'px');document.getElementById('sv-mg-v').textContent=this.value" />
            <span class="slider-val" id="sv-mg-v">10</span>
          </div>
        </div>
        <div class="forge-field">
          <label class="forge-label">bubble max width</label>
          <div class="slider-row">
            <input type="range" min="50" max="95" value="75"
              style="flex:1;accent-color:var(--teal)"
              oninput="previewBubbleWidth(this.value);document.getElementById('sv-bw').textContent=this.value+'%'" />
            <span class="slider-val" id="sv-bw">75%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── BACKGROUND ── -->
    <div class="forge-section" style="margin-bottom:10px">
      <div class="forge-section-header" onclick="toggleStyleSection('background')">
        <span class="forge-section-icon" id="sicon-background">▸</span>
        <span class="forge-section-title">✦ background</span>
      </div>
      <div class="forge-section-body" id="sbody-background" style="display:none">
        <div class="forge-field">
          <label class="forge-label">background type</label>
          <div class="bg-type-row">
            <div class="bg-chip selected" data-bg="solid" onclick="selectBgType(this,'solid')">solid</div>
            <div class="bg-chip" data-bg="scanlines" onclick="selectBgType(this,'scanlines')">scanlines</div>
            <div class="bg-chip" data-bg="particles" onclick="selectBgType(this,'particles')">particles</div>
            <div class="bg-chip" data-bg="grid" onclick="selectBgType(this,'grid')">grid</div>
          </div>
        </div>
        <div class="scanline-row" id="scanline-control" style="display:none">
          <span class="scanline-label">intensity</span>
          <input type="range" min="0" max="6" value="2"
            style="flex:1;accent-color:var(--teal)"
            oninput="previewScanlines(this.value);document.getElementById('sl-val').textContent=this.value" />
          <span class="scanline-val" id="sl-val">2</span>
        </div>
        <div class="scanline-row" id="particle-control" style="display:none">
          <span class="scanline-label">density</span>
          <input type="range" min="10" max="80" value="30"
            style="flex:1;accent-color:var(--teal)"
            oninput="updateParticleDensity(this.value);document.getElementById('pd-val').textContent=this.value" />
          <span class="scanline-val" id="pd-val">30</span>
        </div>
      </div>
    </div>

    <!-- ── SAVE / RESET ── -->
    <button class="style-apply-btn" onclick="applyAndSaveStyle()" style="
      width:100%;padding:14px;margin-bottom:10px;
      background:linear-gradient(135deg,var(--teal),var(--purple));
      border:none;border-radius:12px;color:#fff;
      font-family:var(--font-display);font-weight:700;font-size:1rem;
      cursor:pointer;letter-spacing:0.04em;transition:opacity 0.2s
    ">apply + save theme</button>
    <button class="style-reset-btn" onclick="resetStyle()" style="
      width:100%;padding:12px;background:transparent;
      border:1px solid var(--border);border-radius:12px;
      color:var(--subtext);font-family:var(--font-ui);font-size:0.82rem;
      cursor:pointer;letter-spacing:0.04em;transition:all 0.2s;margin-bottom:40px
    ">reset to default</button>

  </div>
</div>'''

src = read('index.html')

# Find and replace the entire view-style div
start = src.find('<div class="view" id="view-style">')
end_marker = '<div class="view" id="view-account">'
end = src.find(end_marker)

if start != -1 and end != -1:
    src = src[:start] + NEW_STYLE_VIEW + '\n\n' + src[end:]
    write('index.html', src)
    print('  ✅ view-style replaced')
else:
    print(f'  ⚠️  not found start={start} end={end}')

# ── 2. ADD toggleStyleSection + new style functions to style.js ──
print('\n📄 Patching style.js...')

patch('js/app/style.js',
    'export function initStylePanel() {',
    '''// ── STYLE SECTION TOGGLE ─────────────────────────────────────
window.toggleStyleSection = function(id) {
  const body = document.getElementById(`sbody-${id}`);
  const icon = document.getElementById(`sicon-${id}`);
  if (!body) return;
  const open = body.style.display !== 'none';
  body.style.display = open ? 'none' : 'block';
  if (icon) icon.textContent = open ? '▸' : '▾';
};

// ── FONT SIZE PREVIEW ─────────────────────────────────────────
window.previewFontSize = function(val) {
  pendingStyle.fontSize = parseInt(val);
  document.documentElement.style.setProperty('--font-size-base', val + 'px');
  document.getElementById('font-size-val').textContent = val + 'px';
  // Update preview text size
  const preview = document.getElementById('font-size-preview');
  if (preview) preview.style.fontSize = val + 'px';
};

// ── LINE HEIGHT PREVIEW ───────────────────────────────────────
window.previewLineHeight = function(val) {
  const lh = (val / 100).toFixed(2);
  pendingStyle.lineHeight = lh;
  document.documentElement.style.setProperty('--line-height', lh);
  document.getElementById('line-height-val').textContent = lh;
};

// ── BUBBLE WIDTH PREVIEW ──────────────────────────────────────
window.previewBubbleWidth = function(val) {
  pendingStyle.bubbleMaxWidth = val;
  document.documentElement.style.setProperty('--bubble-max-width', val + '%');
};

// ── ACCESSIBILITY PRESETS ─────────────────────────────────────
window.applyAccessPreset = function(preset) {
  const presets = {
    large: {
      fontSize: 18, lineHeight: '1.7', bubbleRadius: 18, msgSpacing: 16,
      fontUi: "'Space Grotesk',sans-serif", bubbleMaxWidth: 85,
    },
    contrast: {
      bg: '#000000', surface: '#111111', surface2: '#1a1a1a',
      border: '#444444', text: '#ffffff', subtext: '#aaaaaa',
      teal: '#00ffff', pink: '#ff66cc', purple: '#aa88ff',
      fontSize: 16,
    },
    tablet: {
      fontSize: 17, lineHeight: '1.65', msgSpacing: 14,
      bubbleRadius: 20, bubbleMaxWidth: 88,
      fontUi: "'Outfit',sans-serif",
    },
    default: null,
  };
  if (preset === 'default') { resetStyle(); return; }
  const p = presets[preset];
  if (!p) return;
  pendingStyle = { ...pendingStyle, ...p };
  applyStyleVars(pendingStyle);
  if (p.fontSize) {
    document.documentElement.style.setProperty('--font-size-base', p.fontSize + 'px');
    const slider = document.getElementById('font-size-slider');
    const val    = document.getElementById('font-size-val');
    if (slider) slider.value = p.fontSize;
    if (val)    val.textContent = p.fontSize + 'px';
  }
};

export function initStylePanel() {''',
    'toggleStyleSection + presets added')

# ── 3. FIX previewColor — add subtext + botbubble + border ────
patch('js/app/style.js',
    '''export function previewColor(key, val) {
  pendingStyle[key] = val;
  const map = { bg:'sw-bg', surface:'sw-surface', teal:'sw-teal', pink:'sw-pink', userbubble:'sw-userbubble', text:'sw-text' };
  const mapV = { bg:'sw-bg-v', surface:'sw-surface-v', teal:'sw-teal-v', pink:'sw-pink-v', userbubble:'sw-userbubble-v', text:'sw-text-v' };
  const el = document.getElementById(map[key]);
  if (el) el.style.background = val;
  const elV = document.getElementById(mapV[key]);
  if (elV) elV.style.background = val;
  applyStyleVars(pendingStyle);
}''',
    '''export function previewColor(key, val) {
  pendingStyle[key] = val;
  // All swatch IDs — panel (old) + view (new)
  const swatchIds = {
    bg:         ['sw-bg',         'sw-bg-v'],
    surface:    ['sw-surface',    'sw-surface-v'],
    teal:       ['sw-teal',       'sw-teal-v'],
    pink:       ['sw-pink',       'sw-pink-v'],
    userbubble: ['sw-userbubble', 'sw-userbubble-v'],
    text:       ['sw-text',       'sw-text-v'],
    subtext:    ['sw-subtext',    'sw-subtext-v'],
    border:     ['sw-border',     'sw-border-v'],
    botbubble:  ['sw-botbubble',  'sw-botbubble-v'],
  };
  (swatchIds[key] || []).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.background = val;
  });
  applyStyleVars(pendingStyle);
}''',
    'previewColor fixed — all swatches + new colors')

# ── 4. FIX applyStyleVars — add all missing CSS vars ─────────
patch('js/app/style.js',
    '''export function applyStyleVars(s) {
  const r = document.documentElement.style;
  r.setProperty('--bg',            s.bg);
  r.setProperty('--surface',       s.surface);
  r.setProperty('--surface2',      s.surface2   || s.surface);
  r.setProperty('--border',        s.border     || '#1e1e35');
  r.setProperty('--teal',          s.teal);
  r.setProperty('--pink',          s.pink);
  r.setProperty('--purple',        s.purple     || s.userbubble || '#7B5FFF');
  r.setProperty('--text',          s.text);
  r.setProperty('--subtext',       s.subtext    || '#6060A0');
  r.setProperty('--user-bubble',   s.userbubble || s.purple || '#7B5FFF');
  r.setProperty('--bubble-radius', (s.bubbleRadius || 14) + 'px');
  r.setProperty('--msg-spacing',   (s.msgSpacing   || 10)  + 'px');
  r.setProperty('--font-ui',       s.fontUi      || "'DM Mono',monospace");
  r.setProperty('--font-display',  s.fontDisplay || "'Syne',sans-serif");
}''',
    '''export function applyStyleVars(s) {
  const r = document.documentElement.style;
  r.setProperty('--bg',              s.bg);
  r.setProperty('--surface',         s.surface);
  r.setProperty('--surface2',        s.surface2      || s.surface);
  r.setProperty('--border',          s.border        || '#1e1e35');
  r.setProperty('--teal',            s.teal);
  r.setProperty('--pink',            s.pink);
  r.setProperty('--purple',          s.purple        || s.userbubble || '#7B5FFF');
  r.setProperty('--text',            s.text);
  r.setProperty('--subtext',         s.subtext       || '#6060A0');
  r.setProperty('--user-bubble',     s.userbubble    || s.purple || '#7B5FFF');
  r.setProperty('--bubble-user-bg',  s.userbubble    || s.purple || '#7B5FFF');
  r.setProperty('--bot-bubble',      s.botbubble     || s.surface);
  r.setProperty('--bubble-radius',   (s.bubbleRadius || 14)   + 'px');
  r.setProperty('--msg-spacing',     (s.msgSpacing   || 10)   + 'px');
  r.setProperty('--bubble-max-width',(s.bubbleMaxWidth|| 75)  + '%');
  r.setProperty('--font-ui',         s.fontUi        || "'DM Mono',monospace");
  r.setProperty('--font-display',    s.fontDisplay   || "'Syne',sans-serif");
  if (s.fontSize)    r.setProperty('--font-size-base', s.fontSize + 'px');
  if (s.lineHeight)  r.setProperty('--line-height',    s.lineHeight);
}''',
    'applyStyleVars — all vars including text/subtext/botbubble/fontSize')

# ── 5. ADD CSS VARS TO :root ──────────────────────────────────
print('\n📄 Adding CSS vars to :root...')

patch('index.html',
    '--safe-bot:env(safe-area-inset-bottom,0px);',
    '''--safe-bot:env(safe-area-inset-bottom,0px);
      --font-size-base:14px;
      --line-height:1.55;
      --bubble-max-width:75%;
      --bot-bubble:var(--surface);''',
    'CSS vars added to :root')

# Apply font-size-base to body
patch('index.html',
    'html,body{height:100%;background:var(--bg);color:var(--text);font-family:var(--font-ui);overflow:hidden;-webkit-font-smoothing:antialiased;}',
    'html,body{height:100%;background:var(--bg);color:var(--text);font-family:var(--font-ui);font-size:var(--font-size-base,14px);line-height:var(--line-height,1.55);overflow:hidden;-webkit-font-smoothing:antialiased;}',
    'body uses font-size-base CSS var')

# Apply bubble max width to msg-bubble
patch('index.html',
    '.msg-bubble{max-width:75%;',
    '.msg-bubble{max-width:var(--bubble-max-width,75%);',
    'bubble max-width uses CSS var')

# Apply bot bubble color
patch('index.html',
    '.msg.bot .msg-bubble{background:var(--bubble-bot-bg)',
    '.msg.bot .msg-bubble{background:var(--bot-bubble,var(--surface))',
    'bot bubble uses CSS var')

# ── 6. UPDATE HANDOFF ─────────────────────────────────────────
print('\n📄 Updating HANDOFF.md...')
with open('HANDOFF.md', 'a', encoding='utf-8') as f:
    f.write('''
---

## SESSION LOG — March 17 2026 (style editor)

### COMPLETED THIS SESSION
- [x] Style editor v2 — full collapsible sections like Forge
- [x] Accessibility presets: large text, high contrast, tablet mode, reset
- [x] Font size slider (12-22px) with live preview — mom friendly
- [x] Line height slider
- [x] Bubble max width slider
- [x] All color pickers fixed — text, subtext, border, bot bubble added
- [x] CSS vars: --font-size-base, --line-height, --bubble-max-width, --bot-bubble
- [x] previewColor fixed — updates all swatches correctly
- [x] applyStyleVars fixed — sets all vars including new ones
- [x] body uses CSS vars for font-size and line-height

### NEXT SESSION PRIORITIES
1. Imagine → card art (use generated image as portrait)
2. Card JSON export alongside PNG
3. Echo button on archetypes
4. Conversation memory save/load
5. Clean up duplicate panel-style divs in old slide panel HTML
''')
print('  ✅ HANDOFF updated')

print('''
✅ Done. Deploy:

  git add .
  git commit -m "feat: style editor v2 — collapsible sections, font size, accessibility presets"
  git push

Then verify:
  ✓ Style tab shows collapsible sections
  ✓ Accessibility presets work (large text makes everything bigger)
  ✓ Font size slider changes text size live
  ✓ Text color picker changes text (not bubbles)
  ✓ Bot bubble color picker works
  ✓ apply + save persists everything
''')
