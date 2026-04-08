#!/usr/bin/env python3
# SPIRALSIDE patch_p16_fix_positioned_bubbles.py
# Fix: positioned text bubbles not showing — position:absolute on bubble
# conflicts with wrap. Wrap is absolute (positioned), bubble is relative inside it.
# Run: cd ~/spiralside && python patch_p16_fix_positioned_bubbles.py

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
# Fix 1: _posCSS — wrap div is the absolute container
# The wrap sits directly on comic-panel (position:relative).
# It needs width:auto + min-width constraint so it sizes to content.
# ============================================================
patch(COMIC,
    """function _posCSS(pos) {
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
}""",
    """function _posCSS(pos) {
  // wrap is position:absolute on comic-panel; bubble is position:relative inside it
  const shared = 'position:absolute;z-index:11;max-width:82%;pointer-events:none;';
  const map = {
    'top-left':   shared + 'top:6%;left:4%;',
    'top-center': shared + 'top:6%;left:50%;transform:translateX(-50%);',
    'top-right':  shared + 'top:6%;right:4%;',
    'mid-left':   shared + 'top:40%;left:4%;',
    'mid-center': shared + 'top:40%;left:50%;transform:translateX(-50%);',
    'mid-right':  shared + 'top:40%;right:4%;',
    'bot-left':   shared + 'bottom:22%;left:4%;',
    'bot-center': shared + 'bottom:22%;left:50%;transform:translateX(-50%);',
    'bot-right':  shared + 'bottom:22%;right:4%;',
  };
  return map[pos] || map['bot-center'];
}""",
    'comic.js: fix _posCSS — absolute on wrap not bubble')

# ============================================================
# Fix 2: _bubbleStyle — remove position:absolute (wrap handles it)
# ============================================================
patch(COMIC,
    """function _bubbleStyle(style, speakerColor) {
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
}""",
    """function _bubbleStyle(style, speakerColor) {
  // No position here — positioning is on the wrap div
  const borderColor = speakerColor || '#00F6D6';
  switch(style) {
    case 'caption':
      return 'background:rgba(10,10,14,0.88);border:none;border-top:2px solid '+borderColor+';padding:8px 12px;font-size:0.82rem;color:#F3F7FF;';
    case 'narration':
      return 'background:rgba(10,10,14,0.82);border:1px solid rgba(243,247,255,0.2);border-radius:4px;padding:8px 12px;font-size:0.78rem;color:#F3F7FF;font-style:italic;';
    case 'shout':
      return 'background:rgba(255,75,203,0.12);border:2px solid '+borderColor+';border-radius:4px;padding:10px 14px;font-size:0.96rem;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.04em;';
    case 'dialogue':
    default:
      return 'background:rgba(10,10,14,0.88);border:2px solid '+borderColor+';border-radius:3px 12px 12px 12px;padding:10px 14px;';
  }
}""",
    'comic.js: fix _bubbleStyle — no position:absolute')

# ============================================================
# Fix 3: _renderPositionedBubble — apply posCSS to wrap, not bubble
# The wrap already carries position:absolute from _posCSS.
# Remove the stray position from bubble.style.cssText call.
# ============================================================
patch(COMIC,
    """  const wrap = document.createElement('div');
  wrap.className = 'comic-tb-overlay';
  wrap.style.cssText = _posCSS(line.pos || 'bot-center');

  // Apply bubble style
  const bubble = document.createElement('div');
  bubble.style.cssText = _bubbleStyle(line.style, speakerColor);""",
    """  const wrap = document.createElement('div');
  wrap.className = 'comic-tb-overlay';
  wrap.style.cssText = _posCSS(line.pos || 'bot-center');

  // Bubble is a child of wrap — no extra positioning needed
  const bubble = document.createElement('div');
  bubble.style.cssText = _bubbleStyle(line.style, speakerColor);""",
    'comic.js: _renderPositionedBubble clarity comment')

print()
print('Deploy:')
print('  git add js/app/comic.js')
print('  git commit -m "fix: positioned text bubbles — absolute on wrap, relative bubble inside"')
print('  git push --force origin main')
