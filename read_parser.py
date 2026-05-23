import sys
sys.stdout.reconfigure(encoding='utf-8')
src = open(r'C:\Users\quart\spiralside\js\app\views\pi.js', encoding='utf-8').read().replace('\r\n', '\n')
idx = src.find('function parseGPIOFromText')
end = src.find('\nfunction ', idx+10)
print(repr(src[idx:end]))
