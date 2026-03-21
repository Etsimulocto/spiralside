#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — fix_store_tts_row.py
# Updates TTS feature row in store.js:
#   label: chatterbox → elevenlabs
#   price: 200 cr → 2 cr
# ============================================================

import subprocess, sys

PATH = 'js/app/views/store.js'

with open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

OLD = '<div class=\"feature-icon\">🖣️</div><div class=\"feature-name\">text to speech<div class=\"feature-sub\">chatterbox</div></div><div class=\"feature-cost\">200 cr</div>'
NEW = '<div class=\"feature-icon\">🎙️</div><div class=\"feature-name\">text to speech<div class=\"feature-sub\">elevenlabs · sky only</div></div><div class=\"feature-cost\">~2 cr</div>'

print('Anchor found:', OLD in src)
if OLD not in src:
    idx = src.find('text to speech')
    print(repr(src[idx-50:idx+150]))
    sys.exit('Anchor not found')

patched = src.replace(OLD, NEW, 1)
with open(PATH, 'w', encoding='utf-8') as f:
    f.write(patched)
print('store.js patched ✓')

subprocess.run(['git', 'add', 'js/app/views/store.js'], check=True)
subprocess.run(['git', 'commit', '-m', 'fix: store TTS row — elevenlabs label, ~2cr price'], check=True)
subprocess.run(['git', 'push', '--force', 'origin', 'main'], check=True)
print('\n✅ Done!')
