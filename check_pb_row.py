import sys
sys.stdout.reconfigure(encoding='utf-8')

src = open(r'C:\Users\quart\spiralside\js\app\views\pi.js', encoding='utf-8').read().replace('\r\n', '\n')
lines = src.split('\n')

# Show lines 270-320 — the pb-row building code
print("=== pb-row DOM building (lines 270-325) ===")
for i, line in enumerate(lines[269:325], start=270):
    print(f"{i}: {line}")
