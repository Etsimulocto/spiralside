import sys
sys.stdout.reconfigure(encoding='utf-8')

src = open(r'C:\Users\quart\spiralside\js\app\db.js', encoding='utf-8').read().replace('\r\n', '\n')
print(f"db.js: {len(src)} chars")
print(src)
