#!/usr/bin/env python3
# SPIRALSIDE patch_p15_positioned_text_boxes.py
# Make comic viewer respect text box pos property (top-left, bot-center etc.)
# Lines with pos → absolutely positioned overlay on panel
# Lines without pos → existing bottom dialogue box (Sky intro compat)
# Run: cd ~/spiralside && python patch_p15_positioned_text_boxes.py

import sys, os
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

def read(p):
    with open(p,'r',encoding='utf-8') as f: return f.read().replace('\r\n','\n')
def write(p,c):
    with open(p,'w',encoding='utf-8') as f: f.write(c)
def patch(path, old, new, label):
    src = read(path); old=old.replace('\r\n','\n'); new=new.replace('\r\n','\n')
    if old not in src:
        print(f'[MISS] {label}')
        idx=src.find(old[:30])
        print(repr(src[max(0,idx-30):idx+200] if idx>=0 else '[not found] '+repr(old[:60])))
        sys.exit(1)
    if src.count(old)>1: print(f'[DUPE] {label}'); sys.exit(1)
    write(path, src.replace(old, new)); print(f'[OK] {label}')

COMIC = 'js/app/comic.js'

# ============================================================
# 1. Add positioned text overlay helper + replace comicTypeLine
#    to support pos-based rendering
# ============================================================
patch(COMIC,
    """function comicTypeLine(lines, idx, onFinish) {
  if (!lines.length) return;
  comicLineIdx = idx;
  if (idx >= lines.length) return;

  const line      = lines[idx];
  const speakerEl = document.getElementById('comic-speaker');
  const textEl    = document.getElementById('comic-text');

  speakerEl.textContent = line.speaker === 'narrator' ? '' : line.speaker;
  speakerEl.className   = line.speaker.toLowerCase();
  textEl.textContent    = '';

  if (comicTyping) clearInterval(comicTyping);

  let i = 0;
  const speed = line.speaker === 'narrator' ? 32 : 20;

  comicTyping = setInterval(function() {
    textEl.textContent += line.text[i++];
    if (i >= line.text.length) {
      clearInterval(comicTyping);
      comicTyping = null;
      if (idx + 1 < lines.length) {
        setTimeout(function() { comicTypeLine(lines, idx + 1, onFinish); }, 1100);
      }
    }
  }, speed);
}""",
    """// ── SPEAKER COLOR MAP ─────────────────────────────────────────
const COMIC_SPEAKER_COLORS = {
  sky:'#00F6D6', monday:'#FF4BCB', cold:'#4DA3FF',
  grit:'#FFD93D', you:'#7B5FFF', narrator:'rgba(243,247,255,0.85)',
};

// ── POSITION MAP ───────────────────────────────────────────────
// pos string → CSS for the overlay bubble container
function _posCSS(pos) {
  const map = {
    'top-left':    'top:8%;left:4%;right:auto;bottom:auto;',
    'top-center':  'top:8%;left:50%;transform:translateX(-50%);right:auto;bottom:auto;',
    'top-right':   'top:8%;right:4%;left:auto;bottom:auto;',
    'mid-left':    'top:50%;transform:translateY(-50%);left:4%;right:auto;bottom:auto;',
    'mid-center':  'top:50%;left:50%;transform:translate(-50%,-50%);right:auto;bottom:auto;',
    'mid-right':   'top:50%;transform:translateY(-50%);right:4%;left:auto;bottom:auto;',
    'bot-left':    'bottom:14%;left:4%;right:auto;top:auto;',
    'bot-center':  'bottom:14%;left:50%;transform:translateX(-50%);right:auto;top:auto;',
    'bot-right':   'bottom:14%;right:4%;left:auto;top:auto;',
  };
  return map[pos] || map['bot-center'];
}

// ── STYLE MAP ─────────────────────────────────────────────────
function _bubbleStyle(style, speakerColor) {
  const base = 'position:absolute;z-index:11;max-width:80%;pointer-events:none;';
  const borderColor = speakerColor || '#00F6D6';
  switch(style) {
    case 'caption':
      return base + 'background:rgba(10,10,14,0.82);border:none;border-top:2px solid '+borderColor+';padding:8px 12px;font-size:0.82rem;color:#F3F7FF;';
    case 'narration':
      return base + 'background:rgba(10,10,14,0.75);border:1px solid rgba(243,247,255,0.2);border-radius:4px;padding:8px 12px;font-size:0.78rem;color:#F3F7FF;font-style:italic;';
    case 'shout':
      return base + 'background:rgba(255,75,203,0.12);border:2px solid '+borderColor+';border-radius:4px;padding:10px 14px;font-size:0.96rem;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.04em;';
    case 'dialogue':
    default:
      return base + 'background:rgba(10,10,14,0.88);border:2px solid '+borderColor+';border-radius:3px 12px 12px 12px;padding:10px 14px;';
  }
}

// Clear all positioned text overlays on the panel
function _clearPositionedOverlays() {
  document.querySelectorAll('.comic-tb-overlay').forEach(el => el.remove());
}

// Render a positioned text box (typewriter) — returns the bubble el
function _renderPositionedBubble(line) {
  const panel = document.getElementById('comic-panel');
  if (!panel) return null;

  const speakerColor = COMIC_SPEAKER_COLORS[(line.speaker||'').toLowerCase()] || '#F3F7FF';

  const wrap = document.createElement('div');
  wrap.className = 'comic-tb-overlay';
  wrap.style.cssText = _posCSS(line.pos || 'bot-center');

  // Apply bubble style
  const bubble = document.createElement('div');
  bubble.style.cssText = _bubbleStyle(line.style, speakerColor);

  // Speaker label (not for narrator or empty)
  if (line.speaker && line.speaker !== 'narrator') {
    const spk = document.createElement('div');
    spk.style.cssText = 'font-size:0.56rem;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:'+speakerColor+';margin-bottom:4px;';
    spk.textContent = line.speaker;
    bubble.appendChild(spk);
  }

  const textEl = document.createElement('div');
  textEl.style.cssText = 'font-size:0.84rem;line-height:1.55;color:#F3F7FF;';
  bubble.appendChild(textEl);
  wrap.appendChild(bubble);
  panel.appendChild(wrap);

  return textEl;
}

function comicTypeLine(lines, idx, onFinish) {
  if (!lines.length) return;
  comicLineIdx = idx;
  if (idx >= lines.length) return;

  const line = lines[idx];

  if (comicTyping) clearInterval(comicTyping);

  if (line.pos) {
    // ── POSITIONED TEXT BOX ─────────────────────────────────
    // Clear previous overlays for this panel, then render at position
    // (keep overlays from earlier lines — accumulate them)
    const textEl = _renderPositionedBubble(line);
    if (!textEl) { comicTyping = null; return; }

    // Hide the standard dialogue box for positioned lines
    const dlg = document.getElementById('comic-dialogue');
    if (dlg) dlg.style.visibility = 'hidden';

    let i = 0;
    const speed = line.speaker === 'narrator' ? 32 : 20;
    comicTyping = setInterval(function() {
      textEl.textContent += line.text[i++];
      if (i >= line.text.length) {
        clearInterval(comicTyping);
        comicTyping = null;
        if (idx + 1 < lines.length) {
          setTimeout(function() { comicTypeLine(lines, idx + 1, onFinish); }, 1100);
        }
      }
    }, speed);

  } else {
    // ── STANDARD DIALOGUE BOX (Sky intro compat) ─────────────
    const dlg = document.getElementById('comic-dialogue');
    if (dlg) dlg.style.visibility = '';
    const speakerEl = document.getElementById('comic-speaker');
    const textEl    = document.getElementById('comic-text');

    speakerEl.textContent = line.speaker === 'narrator' ? '' : line.speaker;
    speakerEl.className   = line.speaker.toLowerCase();
    textEl.textContent    = '';

    let i = 0;
    const speed = line.speaker === 'narrator' ? 32 : 20;
    comicTyping = setInterval(function() {
      textEl.textContent += line.text[i++];
      if (i >= line.text.length) {
        clearInterval(comicTyping);
        comicTyping = null;
        if (idx + 1 < lines.length) {
          setTimeout(function() { comicTypeLine(lines, idx + 1, onFinish); }, 1100);
        }
      }
    }, speed);
  }
}""",
    'comic.js: positioned text box rendering')

# ============================================================
# 2. Clear positioned overlays + reset dialogue visibility on each panel render
# ============================================================
patch(COMIC,
    "  comicLineIdx = 0;\n  comicTypeLine(p.dialogue || [], 0, onFinish);",
    """  // Clear positioned text overlays from previous panel
  _clearPositionedOverlays();
  // Reset dialogue box visibility
  const _dlg = document.getElementById('comic-dialogue');
  if (_dlg) _dlg.style.visibility = '';
  // If all lines have pos, hide dialogue box preemptively
  const _lines = p.dialogue || [];
  if (_lines.length && _lines.every(l => l.pos)) {
    if (_dlg) _dlg.style.visibility = 'hidden';
  }

  comicLineIdx = 0;
  comicTypeLine(_lines, 0, onFinish);""",
    'comic.js: clear overlays on panel change')

# ============================================================
# 3. comicFlush — handle positioned lines too
# ============================================================
patch(COMIC,
    """function comicFlush() {
  if (!comicTyping) return;
  clearInterval(comicTyping);
  comicTyping = null;

  const lines = PANELS[comicPanel] ? PANELS[comicPanel].dialogue || [] : [];
  const line  = lines[comicLineIdx];
  if (!line) return;

  document.getElementById('comic-text').textContent    = line.text;
  document.getElementById('comic-speaker').textContent = line.speaker === 'narrator' ? '' : line.speaker;
  document.getElementById('comic-speaker').className   = line.speaker.toLowerCase();
}""",
    """function comicFlush() {
  if (!comicTyping) return;
  clearInterval(comicTyping);
  comicTyping = null;

  const lines = PANELS[comicPanel] ? PANELS[comicPanel].dialogue || [] : [];
  const line  = lines[comicLineIdx];
  if (!line) return;

  if (line.pos) {
    // Flush to the last positioned overlay's text element
    const overlays = document.querySelectorAll('.comic-tb-overlay');
    const last = overlays[overlays.length - 1];
    if (last) {
      const textEl = last.querySelector('div:last-child');
      if (textEl) textEl.textContent = line.text;
    }
  } else {
    document.getElementById('comic-text').textContent    = line.text;
    document.getElementById('comic-speaker').textContent = line.speaker === 'narrator' ? '' : line.speaker;
    document.getElementById('comic-speaker').className   = line.speaker.toLowerCase();
  }
}""",
    'comic.js: comicFlush handles positioned lines')

print()
print('Deploy:')
print('  git add js/app/comic.js')
print('  git commit -m "feat: positioned text boxes render at selected position in comic viewer"')
print('  git push --force origin main')
