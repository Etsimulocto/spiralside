#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — fix_duplicate_import.py
# Removes duplicate initMusic import from main.js
# Run from ~/spiralside: py fix_duplicate_import.py
# ============================================================

import os, re

BASE = os.path.dirname(os.path.abspath(__file__))

def read(path):
    with open(os.path.join(BASE, path), 'r', encoding='utf-8') as f:
        return f.read()

def write(path, content):
    with open(os.path.join(BASE, path), 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  wrote: {path}')

print('🔧 Fixing duplicate import...')

main = read('js/app/main.js')

# Show all music-related import lines so we can see the duplicates
print('  Current music imports:')
for i, line in enumerate(main.split('\n'), 1):
    if 'music' in line.lower() or 'Music' in line:
        print(f'    line {i}: {line}')

# Remove ALL music-related import lines first
lines = main.split('\n')
cleaned = []
music_import_seen = False
musicview_import_seen = False

for line in lines:
    # Skip duplicate initMusic import lines
    if 'initMusic' in line and 'import' in line:
        if music_import_seen:
            print(f'  removed duplicate: {line.strip()}')
            continue
        music_import_seen = True
    # Skip duplicate musicview import lines
    if 'musicview' in line and 'import' in line:
        if musicview_import_seen:
            print(f'  removed duplicate: {line.strip()}')
            continue
        musicview_import_seen = True
    cleaned.append(line)

result = '\n'.join(cleaned)

# Verify only one of each remains
music_count = result.count("from './music.js'")
musicview_count = result.count("from './musicview.js'")
print(f'  music.js imports remaining: {music_count}')
print(f'  musicview.js imports remaining: {musicview_count}')

write('js/app/main.js', result)

print()
print('✅ Done! Run:')
print('  git add .')
print('  git commit -m "fix: remove duplicate music import"')
print('  git push')
