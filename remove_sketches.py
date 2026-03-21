import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

before = html.count('color-sketch-canvas')
print(f'[before] {before} sketch canvases')

# Remove all sketch canvas elements from the HTML body
html2 = re.sub(r'<canvas class="color-sketch-canvas"[^>]*></canvas>', '', html)

after = html2.count('color-sketch-canvas')
print(f'[after] {after} sketch canvases in HTML')
# CSS class definition will still be there but no elements — that's fine

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html2)
print('[done] written')
print()
print('git add index.html && git commit -m "fix: remove sketch canvases from color rows" && git push --force origin main')
