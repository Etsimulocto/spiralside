import sys
sys.stdout.reconfigure(encoding='utf-8')

src = open(r'C:\Users\quart\spiralside\js\app\views\pi.js', encoding='utf-8').read().replace('\r\n', '\n')
lines = src.split('\n')
print(f"Total lines: {len(lines)}")
# Show lines 205-225
for i, line in enumerate(lines[204:230], start=205):
    print(f"{i}: {line}")
