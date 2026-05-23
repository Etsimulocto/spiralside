import sys
sys.stdout.reconfigure(encoding='utf-8')

src = open(r'C:\Users\quart\spiralside-api\main.py', encoding='utf-8').read().replace('\r\n', '\n')

idx = src.find('@app.post("/pi")')
print(repr(src[idx:idx+600]))
