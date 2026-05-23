import sys
sys.stdout.reconfigure(encoding='utf-8')

src = open(r'C:\Users\quart\spiralside\js\app\views\pi.js', encoding='utf-8').read().replace('\r\n', '\n')
lines = src.split('\n')

# Show lines 520-545 — the full generate() response handling
print("=== generate() response block ===")
for i, line in enumerate(lines[515:550], start=516):
    print(f"{i}: {line}")
