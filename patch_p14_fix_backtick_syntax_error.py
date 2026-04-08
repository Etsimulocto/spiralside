#!/usr/bin/env python3
# SPIRALSIDE patch_p14_fix_backtick_syntax_error.py
# Fix: library.js:451 SyntaxError — escaped backtick \` written literally
# Run: cd ~/spiralside && python patch_p14_fix_backtick_syntax_error.py

import sys, os
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

def read(p):
    with open(p, 'r', encoding='utf-8') as f:
        return f.read().replace('\r\n', '\n')
def write(p, c):
    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)

LIB = 'js/app/library.js'
src = read(LIB)

# The bad line written by p13: ends with \`; instead of `;
# The exact bytes on disk: "  \`;\n  document.head.appendChild(s);\n}"
BAD  = "  \\`;\n  document.head.appendChild(s);\n}"
GOOD = "  `;\n  document.head.appendChild(s);\n}"

if BAD not in src:
    # Try the repr form to diagnose
    idx = src.find('document.head.appendChild(s)')
    print('[MISS] bad backtick not found — context:')
    print(repr(src[max(0,idx-30):idx+60]))
    sys.exit(1)

write(LIB, src.replace(BAD, GOOD))
print('[OK] Fixed escaped backtick syntax error in library.js')
print()
print('Deploy:')
print('  git add js/app/library.js')
print('  git commit -m "fix: syntax error from escaped backtick in CSS injection"')
print('  git push --force origin main')
