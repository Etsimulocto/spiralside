
BASE = "C:/Users/quart/spiralside"
path = BASE + "/js/app/sheet.js"
src = open(path, encoding="utf-8").read()

OLD = """    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'spiralside-you-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);"""

NEW = """    // Open in new tab — Edge blocks silent downloads but always allows window.open
    // User can then Ctrl+S to save, or just keep it as a tab for reference
    const url = URL.createObjectURL(blob);
    const tab = window.open(url, '_blank');
    // Fallback: if popup blocked, show a toast with a manual download link
    if (!tab) {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'spiralside-you-' + new Date().toISOString().slice(0,10) + '.json';
      a.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--accent);color:#fff;padding:10px 20px;border-radius:20px;font-family:var(--font-ui);font-size:0.78rem;z-index:9999;text-decoration:none;';
      a.textContent = '⬇ download your backup';
      document.body.appendChild(a);
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 8000);
    } else {
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }"""

if OLD not in src:
    print("ANCHOR NOT FOUND")
else:
    src = src.replace(OLD, NEW, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK — download opens in new tab with fallback toast link")
