
path = "js/app/sheet.js"
src = open(path, encoding="utf-8").read()

# Find the entire old window.open block and replace with toast
import re

OLD = """    const url = URL.createObjectURL(blob);
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

NEW = """    // Toast with inline download link — no popup permission needed
    const _burl = URL.createObjectURL(blob);
    const _fname = 'spiralside-you-' + new Date().toISOString().slice(0,10) + '.json';
    const _toast = document.createElement('div');
    _toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--surface);border:2px solid var(--accent);border-radius:12px;padding:14px 20px;z-index:9999;display:flex;align-items:center;gap:14px;font-family:var(--font-ui);font-size:0.78rem;color:var(--text);box-shadow:0 4px 24px rgba(0,0,0,0.5);';
    _toast.innerHTML = '<span style="color:var(--accent3)">&#10003; saved to cloud</span>'
      + '<a href="' + _burl + '" download="' + _fname + '" style="color:#fff;background:var(--accent);text-decoration:none;border-radius:20px;padding:6px 14px;font-size:0.75rem;">&#8595; backup json</a>'
      + '<span style="color:var(--subtext);cursor:pointer;font-size:1.1rem;line-height:1;" onclick="this.parentNode.remove()">&#215;</span>';
    document.body.appendChild(_toast);
    setTimeout(function(){ if(_toast.parentNode) _toast.parentNode.removeChild(_toast); URL.revokeObjectURL(_burl); }, 15000);"""

if OLD not in src:
    print("ANCHOR NOT FOUND — showing createObjectURL lines:")
    for i, line in enumerate(src.split("\n")):
        if "createObjectURL" in line or "window.open" in line:
            print(f"  {i+1}: {line}")
else:
    open(path, "w", encoding="utf-8").write(src.replace(OLD, NEW, 1))
    print("OK toast_patch")
