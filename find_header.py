import re

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Find anything that looks like a header
for pattern in ['<header', 'id="header"', 'id=\'header\'', 'class="header"', '#app-header', 'app-bar', 'top-bar']:
    idx = html.find(pattern)
    if idx != -1:
        print(f"FOUND '{pattern}' at char {idx}:")
        print(repr(html[idx:idx+200]))
        print()

# Also show lines 1-50 of the body section
body_idx = html.find('<body')
if body_idx != -1:
    print("=== BODY START ===")
    print(repr(html[body_idx:body_idx+800]))
