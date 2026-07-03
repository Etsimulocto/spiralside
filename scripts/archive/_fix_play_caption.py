#!/usr/bin/env python3
# _fix_play_caption.py
# Fixes [object Object] in comic playback — caption was {speaker,text} not just text

import os

PATH = os.path.expanduser('~/spiralside/js/app/library.js')

with open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

OLD = '''      return {
        image:    p?.dataURL || '',
        dialogue: slot.caption?.text
          ? [{ speaker: slot.caption.speaker || 'narrator', text: slot.caption.text }]
          : [],
        transition: 'fade',
        bg_gradient: 'radial-gradient(ellipse at 50% 50%,#1a0a2e 0%,#101014 70%)',
      };'''

NEW = '''      const capText    = typeof slot.caption === 'string' ? slot.caption : slot.caption?.text || '';
      const capSpeaker = typeof slot.caption === 'string' ? 'narrator'   : slot.caption?.speaker || 'narrator';
      return {
        image:    p?.dataURL || '',
        dialogue: capText ? [{ speaker: capSpeaker, text: capText }] : [],
        transition: 'fade',
        bg_gradient: 'radial-gradient(ellipse at 50% 50%,#1a0a2e 0%,#101014 70%)',
      };'''

if OLD not in src:
    print('[ERROR] Caption block not found — check library.js')
    import sys; sys.exit(1)

src = src.replace(OLD, NEW)

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(src)

print('[OK] Fixed caption [object Object] bug in playTimeline')
print('[DONE] Push:')
print('  git add . && git commit -m "fix: comic playback caption [object Object]" && git push --force origin main')
