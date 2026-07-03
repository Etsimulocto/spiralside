
import re

BASE = "C:/Users/quart/spiralside"

# ── Shared iOS detection helper — inject into pdf.js and sheet.js ──
IOS_HELPER = """
// iOS Safari cannot handle blob: URLs or programmatic downloads
// Use data URI + window.open instead
function _iosSave(datauri, fname) {
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS || isSafari) {
    // Open data URI in new tab -- user can long-press Save to Files
    var w = window.open();
    if (w) {
      w.document.write('<html><body style="margin:0;background:#000"><p style="color:#fff;font-family:monospace;padding:16px">Long-press the link below and choose Save to Files:<br><br><a href="' + datauri + '" style="color:#00F6D6" download="' + fname + '">' + fname + '</a></p></body></html>');
      w.document.close();
    }
    return true;
  }
  return false;
}
"""

# ── Fix pdf.js: replace doc.save() with iOS-aware version ──
path = BASE + "/js/app/pdf.js"
src = open(path, encoding="utf-8").read()

OLD_PDF = "    doc.save(fname);"
NEW_PDF = """    // iOS Safari fix -- use data URI instead of blob save
    var pdfData = doc.output('datauristring');
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS || isSafari) {
      var w = window.open();
      if (w) {
        w.document.write('<html><body style="margin:0;background:#0a0a0f;display:flex;align-items:center;justify-content:center;min-height:100vh"><div style="text-align:center;font-family:monospace;color:#e8e8f0;padding:32px"><div style="color:#00F6D6;font-size:1.1rem;margin-bottom:16px">Soul Print ready</div><p style="color:#7070a0;font-size:0.85rem;margin-bottom:24px">Tap and hold the button, then choose<br><strong>Download Linked File</strong> or <strong>Save to Files</strong></p><a href="' + pdfData + '" download="' + fname + '" style="display:inline-block;background:#00F6D6;color:#000;padding:12px 28px;border-radius:20px;font-weight:700;text-decoration:none;font-size:0.9rem">&#8595; ' + fname + '</a></div></body></html>');
        w.document.close();
      }
    } else {
      doc.save(fname);
    }"""

if OLD_PDF not in src:
    print("pdf ANCHOR NOT FOUND")
else:
    src = src.replace(OLD_PDF, NEW_PDF, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK pdf.js")

# ── Fix sheet.js: JSON toast blob URL → data URI on iOS ──
path = BASE + "/js/app/sheet.js"
src = open(path, encoding="utf-8").read()

OLD_TOAST = """    // Toast with inline download link — no popup permission needed
    const _burl = URL.createObjectURL(blob);
    const _fname = 'spiralside-you-' + new Date().toISOString().slice(0,10) + '.json';
    const _toast = document.createElement('div');
    _toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--surface);border:2px solid var(--accent);border-radius:12px;padding:14px 20px;z-index:9999;display:flex;align-items:center;gap:14px;font-family:var(--font-ui);font-size:0.78rem;color:var(--text);box-shadow:0 4px 24px rgba(0,0,0,0.5);';
    _toast.innerHTML = '<span style="color:var(--accent3)">&#10003; saved to cloud</span>'
      + '<a href="' + _burl + '" download="' + _fname + '" style="color:#fff;background:var(--accent);text-decoration:none;border-radius:20px;padding:6px 14px;font-size:0.75rem;">&#8595; backup json</a>'
      + '<span style="color:var(--subtext);cursor:pointer;font-size:1.1rem;line-height:1;" onclick="this.parentNode.remove()">&#215;</span>';
    document.body.appendChild(_toast);
    setTimeout(function(){ if(_toast.parentNode) _toast.parentNode.removeChild(_toast); URL.revokeObjectURL(_burl); }, 15000);"""

NEW_TOAST = """    // Toast with inline download -- iOS Safari gets data URI, others get blob
    const _fname = 'spiralside-you-' + new Date().toISOString().slice(0,10) + '.json';
    const _isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const _isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const _toast = document.createElement('div');
    _toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--surface);border:2px solid var(--accent);border-radius:12px;padding:14px 20px;z-index:9999;display:flex;align-items:center;gap:14px;font-family:var(--font-ui);font-size:0.78rem;color:var(--text);box-shadow:0 4px 24px rgba(0,0,0,0.5);';
    if (_isIOS || _isSafari) {
      // iOS: convert to data URI, open in new tab
      const _reader = new FileReader();
      _reader.onload = function() {
        const _datauri = _reader.result;
        _toast.innerHTML = '<span style="color:var(--accent3)">&#10003; saved to cloud</span>'
          + '<a href="' + _datauri + '" download="' + _fname + '" style="color:#fff;background:var(--accent);text-decoration:none;border-radius:20px;padding:6px 14px;font-size:0.75rem;" onclick="window.open(this.href);return false;">&#8595; backup json</a>'
          + '<span style="color:var(--subtext);cursor:pointer;font-size:1.1rem;line-height:1;" onclick="this.parentNode.remove()">&#215;</span>';
        document.body.appendChild(_toast);
        setTimeout(function(){ if(_toast.parentNode) _toast.parentNode.removeChild(_toast); }, 15000);
      };
      _reader.readAsDataURL(blob);
    } else {
      const _burl = URL.createObjectURL(blob);
      _toast.innerHTML = '<span style="color:var(--accent3)">&#10003; saved to cloud</span>'
        + '<a href="' + _burl + '" download="' + _fname + '" style="color:#fff;background:var(--accent);text-decoration:none;border-radius:20px;padding:6px 14px;font-size:0.75rem;">&#8595; backup json</a>'
        + '<span style="color:var(--subtext);cursor:pointer;font-size:1.1rem;line-height:1;" onclick="this.parentNode.remove()">&#215;</span>';
      document.body.appendChild(_toast);
      setTimeout(function(){ if(_toast.parentNode) _toast.parentNode.removeChild(_toast); URL.revokeObjectURL(_burl); }, 15000);
    }"""

if OLD_TOAST not in src:
    print("sheet toast ANCHOR NOT FOUND")
else:
    src = src.replace(OLD_TOAST, NEW_TOAST, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK sheet.js toast")

print("ALL DONE")
