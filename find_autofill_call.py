import sys
sys.stdout.reconfigure(encoding='utf-8')

src = open(r'C:\Users\quart\spiralside\js\app\views\pi.js', encoding='utf-8').read().replace('\r\n', '\n')
lines = src.split('\n')

for i, line in enumerate(lines, 1):
    if 'autofill' in line.lower() or 'data.result' in line:
        print(f"{i}: {line}")
