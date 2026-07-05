# color_scheme_patch.py - declare native dark scheme for browser chrome
import sys

# read local file, normalize line endings
src = open('index.html', encoding='utf-8').read().replace('\r\n', '\n')

# idempotency guard
if 'name="color-scheme"' in src:
    print('SKIP: color-scheme already declared'); sys.exit(0)

# anchor on existing theme-color meta - must appear exactly once
ANCHOR = '<meta name="theme-color" content="#08080d" />'
n = src.count(ANCHOR)
if n != 1:
    print('FAIL: theme-color anchor count =', n); sys.exit(1)

# append color-scheme meta right after theme-color
NEW = ANCHOR + '\n  <meta name="color-scheme" content="dark" />'
src = src.replace(ANCHOR, NEW, 1)

# write back
open('index.html', 'w', encoding='utf-8').write(src)
print('OK: color-scheme dark declared')
