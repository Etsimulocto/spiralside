import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find switchView('style' and show context
idx = html.find("switchView('style'")
print('[preview]')
print(repr(html[max(0,idx-60):idx+120]))
