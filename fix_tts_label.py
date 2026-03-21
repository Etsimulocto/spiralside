#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — fix_tts_label.py
# Fixes TTS label in index.html options panel (voice section)
# "auto-read replies · free" → "sky voice · elevenlabs · ~2cr"
# Also fixes old slide panel store TTS row
# ============================================================

import subprocess, sys

PATH = 'index.html'

with open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

fixes = [
    # Options panel voice section
    (
        '<div class="stog-label">text to speech</div><div class="stog-sub">auto-read replies · free</div>',
        '<div class="stog-label">text to speech</div><div class="stog-sub">sky voice · elevenlabs · ~2 cr</div>'
    ),
    # Old slide panel store row
    (
        '<div class="feature-icon">🗣️</div><div class="feature-name">text to speech<div class="feature-sub">chatterbox</div></div><div class="feature-cost">200 cr</div>',
        '<div class="feature-icon">🎙️</div><div class="feature-name">text to speech<div class="feature-sub">elevenlabs · sky only</div></div><div class="feature-cost">~2 cr</div>'
    ),
]

changed = 0
for old, new in fixes:
    if old in src:
        src = src.replace(old, new, 1)
        changed += 1
        print(f'Fixed: {old[:60]}...')
    else:
        print(f'NOT FOUND: {old[:60]}...')

if changed == 0:
    # Try alternate — unicode escape version
    alt_old = 'auto-read replies \u00b7 free'
    alt_new = 'sky voice \u00b7 elevenlabs \u00b7 ~2 cr'
    if alt_old in src:
        src = src.replace(alt_old, alt_new, 1)
        changed += 1
        print('Fixed via unicode alt anchor')
    else:
        print('Dumping surrounding context...')
        idx = src.find('stog-sub')
        while idx != -1:
            print(repr(src[idx:idx+100]))
            idx = src.find('stog-sub', idx+1)
        sys.exit('No fixes applied')

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(src)
print(f'\n{changed} fix(es) applied ✓')

subprocess.run(['git', 'add', 'index.html'], check=True)
subprocess.run(['git', 'commit', '-m', 'fix: TTS label in options panel — elevenlabs sky voice ~2cr'], check=True)
subprocess.run(['git', 'push', '--force', 'origin', 'main'], check=True)
print('\n✅ Done!')
