
path = "js/app/pdf.js"
src = open(path, encoding="utf-8").read()

OLD = """      overlay.innerHTML = '<div style="width:100%;max-width:480px;display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#111118;border-bottom:1px solid #1e1e2e;">'
        + '<span style="color:#00F6D6;font-family:monospace;font-size:0.82rem;font-weight:700;">SOUL PRINT</span>'
        + '<div style="display:flex;gap:8px;">'
        + '<a href="' + pdfData + '" download="' + fname + '" style="background:#00F6D6;color:#000;padding:6px 14px;border-radius:20px;font-family:monospace;font-size:0.72rem;font-weight:700;text-decoration:none;">&#8595; save</a>'
        + '<button onclick="document.getElementById(&#39;_pdf_overlay&#39;).remove()" style="background:transparent;border:1px solid #2a2a3e;color:#7070a0;padding:6px 14px;border-radius:20px;font-family:monospace;font-size:0.72rem;cursor:pointer;">close</button>'
        + '</div></div>'
        + '<iframe src="' + pdfData + '" style="flex:1;width:100%;max-width:480px;border:none;background:#fff;" />';"""

NEW = """      overlay.innerHTML = '<div style="width:100%;max-width:480px;flex-shrink:0;background:#111118;border-bottom:1px solid #1e1e2e;">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;">'
        + '<span style="color:#00F6D6;font-family:monospace;font-size:0.82rem;font-weight:700;">SOUL PRINT</span>'
        + '<button onclick="document.getElementById(&#39;_pdf_overlay&#39;).remove()" style="background:transparent;border:1px solid #2a2a3e;color:#7070a0;padding:6px 14px;border-radius:20px;font-family:monospace;font-size:0.72rem;cursor:pointer;">close</button>'
        + '</div>'
        + '<div style="padding:10px 16px 14px;background:#0a0a0f;border-top:1px solid #1e1e2e;">'
        + '<div style="color:#00F6D6;font-family:monospace;font-size:0.7rem;font-weight:700;margin-bottom:6px;">TO SAVE ON iPHONE:</div>'
        + '<div style="color:#e8e8f0;font-family:monospace;font-size:0.7rem;line-height:1.8;">'
        + '1. Tap the <strong style="color:#00F6D6;">share button</strong> &#8679; in Safari (bottom toolbar)<br>'
        + '2. Scroll down and tap <strong style="color:#00F6D6;">Save to Files</strong><br>'
        + '3. Choose <strong style="color:#00F6D6;">On My iPhone</strong> or iCloud Drive<br>'
        + '4. Tap <strong style="color:#00F6D6;">Save</strong>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<iframe src="' + pdfData + '" style="flex:1;width:100%;max-width:480px;border:none;background:#fff;"></iframe>';"""

if OLD not in src:
    print("ANCHOR NOT FOUND")
else:
    src = src.replace(OLD, NEW, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK pdf.js — iOS save instructions added to overlay")
