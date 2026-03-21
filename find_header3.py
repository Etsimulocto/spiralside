with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

idx = html.find('app-header')
while idx != -1:
    print(f"=== char {idx} ===")
    print(repr(html[max(0,idx-20):idx+300]))
    print()
    idx = html.find('app-header', idx+1)
