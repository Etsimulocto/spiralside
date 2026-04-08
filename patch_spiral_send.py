#!/usr/bin/env python
# ============================================================
# SPIRALSIDE -- PATCH: spiral send button (corrected anchors)
# Replaces the current compass/teardrop SVG on the send button
# with an Archimedean spiral matching the Bloomcore aesthetic.
#
# RUN FROM: ~/spiralside
#   /c/Users/quart/AppData/Local/Programs/Python/Python313/python.exe patch_spiral_send.py
# ============================================================

import sys

def patch(path, old, new, label):
    with open(path, 'r', encoding='utf-8') as f:
        src = f.read().replace('\r\n', '\n')
    count = src.count(old)
    if count == 0:
        print(f'MISS [{label}]: anchor not found')
        sys.exit(1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(src.replace(old, new))
    print(f'OK   [{label}] -- replaced {count} occurrence(s)')

PATH = 'index.html'

OLD_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none">\n              <path d="M12 3 C9 8 8 11 8 14 C8 18 10 21 12 21 C14 21 16 18 16 14 C16 11 15 8 12 3 Z" fill="rgba(255,255,255,0.25)" stroke="white" stroke-width="1.2"/>\n              <circle cx="12" cy="13" r="2" fill="white"/>\n            </svg>'

NEW_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round">\n              <path d="M12 12 C12 12 13.8 10.2 13.8 8.5 C13.8 6.8 12.6 5.8 11 5.8 C8.8 5.8 7 7.6 7 10 C7 13 9.2 15.2 12 15.2 C15.5 15.2 18 12.7 18 9.5 C18 5.5 14.8 3 11 3 C6.5 3 3 6.8 3 11.5 C3 17 7.2 21 13 21"/>\n            </svg>'

patch(PATH, OLD_SVG, NEW_SVG, 'spiral send button')

print('\nDone. Run:')
print('  git add index.html')
print('  git commit -m "style: replace send button with spiral icon"')
print('  git push --force origin main')
