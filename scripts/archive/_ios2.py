
path = "js/app/pdf.js"
src = open(path, encoding="utf-8").read()

OLD = """    var pdfData = doc.output('datauristring');
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

NEW = """    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS || isSafari) {
      // Safari/iOS: render PDF inline in an overlay -- no popup needed
      var pdfData = doc.output('datauristring');
      var overlay = document.createElement('div');
      overlay.id = '_pdf_overlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.92);display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:env(safe-area-inset-top,20px);';
      overlay.innerHTML = '<div style="width:100%;max-width:480px;display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#111118;border-bottom:1px solid #1e1e2e;">'
        + '<span style="color:#00F6D6;font-family:monospace;font-size:0.82rem;font-weight:700;">SOUL PRINT</span>'
        + '<div style="display:flex;gap:8px;">'
        + '<a href="' + pdfData + '" download="' + fname + '" style="background:#00F6D6;color:#000;padding:6px 14px;border-radius:20px;font-family:monospace;font-size:0.72rem;font-weight:700;text-decoration:none;">&#8595; save</a>'
        + '<button onclick="document.getElementById(\'_pdf_overlay\').remove()" style="background:transparent;border:1px solid #2a2a3e;color:#7070a0;padding:6px 14px;border-radius:20px;font-family:monospace;font-size:0.72rem;cursor:pointer;">close</button>'
        + '</div></div>'
        + '<iframe src="' + pdfData + '" style="flex:1;width:100%;max-width:480px;border:none;background:#fff;" />';
      document.body.appendChild(overlay);
    } else {
      doc.save(fname);
    }"""

if OLD not in src:
    print("ANCHOR NOT FOUND")
else:
    src = src.replace(OLD, NEW, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK pdf.js — iOS uses inline overlay instead of window.open")
