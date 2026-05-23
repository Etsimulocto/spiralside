import sys
sys.stdout.reconfigure(encoding='utf-8')

src = open(r'C:\Users\quart\spiralside\js\app\views\pi.js', encoding='utf-8').read().replace('\r\n', '\n')
lines = src.split('\n')

# Find finally block
for i, l in enumerate(lines, 1):
    if 'finally' in l or '_lastPiResult' in l or 'autofillPatchbay' in l:
        print(f"{i}: {l}")
