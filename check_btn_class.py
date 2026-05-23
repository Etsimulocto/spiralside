import sys
sys.stdout.reconfigure(encoding='utf-8')

FILE = r'C:\Users\quart\spiralside\js\app\views\pi.js'
src = open(FILE, encoding='utf-8').read().replace('\r\n', '\n')

# Find what class the other action buttons use
idx = src.find("runBtn.id = 'pi-run-btn'")
print(repr(src[max(0,idx-50):idx+150]))
