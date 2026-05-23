import sys
sys.stdout.reconfigure(encoding='utf-8')
src = open(r'C:\Users\quart\spiralside\js\app\views\pi.js', encoding='utf-8').read().replace('\r\n', '\n')
lines = src.split('\n')
# Show lines around mapBtn
for i, l in enumerate(lines[155:170], 156):
    print(f"{i}: {l}")
