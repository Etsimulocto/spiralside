import sys
sys.stdout.reconfigure(encoding='utf-8')
src = open(r'C:\Users\quart\spiralside\js\app\views\pi.js', encoding='utf-8').read().replace('\r\n', '\n')
lines = src.split('\n')
print("=== lines 528-555 ===")
for i, l in enumerate(lines[527:555], 528): print(f"{i}: {l}")
print("\n=== lines 640-660 ===")
for i, l in enumerate(lines[639:660], 640): print(f"{i}: {l}")
