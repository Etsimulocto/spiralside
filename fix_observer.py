f = open('index.html', 'r', encoding='utf-8')
html = f.read()
f.close()
idx = html.find('  document.addEventListener(\'DOMContentLoaded\', () => {\n    // Draw color row sketches')
if idx == -1:
    print('Pattern not found')
else:
    html = html[:idx] + '  <script>\n' + html[idx:]
    f = open('index.html', 'w', encoding='utf-8')
    f.write(html)
    f.close()
    print('Fixed')
