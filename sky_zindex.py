import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# All z-index rules
print("=== Z-INDEX RULES ===")
for m in re.finditer(r'([#.\w][^{]*)\{[^}]*z-index[^}]*\}', html):
    block = m.group(0)
    if 'z-index' in block:
        # just print selector + z-index line
        sel = m.group(1).strip()[:60]
        zi = re.search(r'z-index\s*:\s*[\d-]+', block)
        if zi:
            print(f"  {sel}  →  {zi.group()}")

print()
print("=== SKY CSS BLOCK ===")
i = html.find('sky-canvas')
while i != -1:
    # find the enclosing CSS rule or HTML tag
    start = html.rfind('\n', 0, i)
    print(repr(html[start:i+120]))
    print()
    i = html.find('sky-canvas', i+1)
