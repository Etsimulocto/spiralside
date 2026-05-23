import sys
sys.stdout.reconfigure(encoding='utf-8')
src = open(r'C:\Users\quart\spiralside\js\app\views\pi.js', encoding='utf-8').read().replace('\r\n', '\n')
lines = src.split('\n')
for i, l in enumerate(lines, 1):
    if 'autofill' in l or 'map-btn' in l or 'map pins' in l.lower():
        print(f"{i}: {l}")
