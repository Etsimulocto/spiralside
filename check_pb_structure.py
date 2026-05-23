import sys
sys.stdout.reconfigure(encoding='utf-8')

src = open(r'C:\Users\quart\spiralside\js\app\views\pi.js', encoding='utf-8').read().replace('\r\n', '\n')

# Find how pb-row and pb-in-label are built in the DOM
idx = src.find('pb-in-label')
print(f"=== pb-in-label occurrences ===")
for i, line in enumerate(src.split('\n'), 1):
    if 'pb-in' in line or 'pb-row' in line:
        print(f"{i}: {line.strip()}")
