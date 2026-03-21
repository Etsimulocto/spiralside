import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Show what the module script block actually looks like
m = re.search(r'<script type=["\']module["\'][^>]*>(.*?)</script>', html, re.DOTALL)
if m:
    print('[module script found]:')
    print(repr(m.group(1)[:400]))
else:
    print('NO module script found')
