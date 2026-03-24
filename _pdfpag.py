
path = "js/app/pdf.js"
src = open(path, encoding="utf-8").read()

# Add a checkPage helper after the roundRect helper
OLD = "// Draw a trait bar row"
NEW = """// Check if we need a new page, add one if so, reset cy
function checkPage(doc, cy, H, margin) {
  if (cy > H - margin) {
    doc.addPage();
    // Redraw dark background on new page
    doc.setFillColor('#0a0a0f');
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), H, 'F');
    return 20; // reset cy to top margin
  }
  return cy;
}

// Draw a trait bar row"""

# Patch the You page two-column loop to check page
OLD2 = """    _youFields.forEach((f, i) => {
      const x = i % 2 === 0 ? col1x : col2x;
      const useY = i % 2 === 0 ? col1y : col2y;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#7070a0');
      doc.text(f[0] + ':', x, useY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor('#e8e8f0');
      const val = String(f[1]).slice(0, 28);
      doc.text(val, x + 18, useY);
      if (i % 2 === 0) col1y += 5.5; else col2y += 5.5;
    });
    cy = Math.max(col1y, col2y) + 4;"""

NEW2 = """    _youFields.forEach((f, i) => {
      // If both columns near bottom, add page and reset
      if (col1y > H - 30 || col2y > H - 30) {
        doc.addPage();
        doc.setFillColor('#0a0a0f');
        doc.rect(0, 0, W, H, 'F');
        col1y = 20; col2y = 20;
      }
      const x = i % 2 === 0 ? col1x : col2x;
      const useY = i % 2 === 0 ? col1y : col2y;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#7070a0');
      doc.text(f[0] + ':', x, useY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor('#e8e8f0');
      const val = String(f[1]).slice(0, 28);
      doc.text(val, x + 18, useY);
      if (i % 2 === 0) col1y += 5.5; else col2y += 5.5;
    });
    cy = Math.max(col1y, col2y) + 4;"""

# Patch drawCardPage _field calls to check page
OLD3 = "  // ── IDENTITY section ──"
NEW3 = """  // Helper to check page overflow mid-card
  const _chk = (y) => {
    if (y > H - 20) {
      doc.addPage();
      doc.setFillColor('#0a0a0f');
      doc.rect(0, 0, W, H, 'F');
      // redraw footer
      doc.setFillColor('#111118');
      doc.rect(0, H - 12, W, 12, 'F');
      return 10;
    }
    return y;
  };

  // ── IDENTITY section ──"""

# Patch each section forEach to call _chk
OLD4 = "  if (idFields.length) {\n    cy = _section(doc, 'IDENTITY', 8, cy);\n    idFields.forEach(f => { cy = _field(doc, f[0], f[1], 8, cy, W); });"
NEW4 = "  if (idFields.length) {\n    cy = _section(doc, 'IDENTITY', 8, cy);\n    idFields.forEach(f => { cy = _chk(_field(doc, f[0], f[1], 8, cy, W)); });"

OLD5 = "  if (appFields.length) {\n    cy = _section(doc, 'APPEARANCE', 8, cy);\n    appFields.forEach(f => { cy = _field(doc, f[0], f[1], 8, cy, W); });"
NEW5 = "  if (appFields.length) {\n    cy = _section(doc, 'APPEARANCE', 8, cy);\n    appFields.forEach(f => { cy = _chk(_field(doc, f[0], f[1], 8, cy, W)); });"

OLD6 = "  if (perFields.length) {\n    cy = _section(doc, 'PERSONALITY', 8, cy);\n    perFields.forEach(f => { cy = _field(doc, f[0], f[1], 8, cy, W); });"
NEW6 = "  if (perFields.length) {\n    cy = _section(doc, 'PERSONALITY', 8, cy);\n    perFields.forEach(f => { cy = _chk(_field(doc, f[0], f[1], 8, cy, W)); });"

OLD7 = "  if (stoFields.length) {\n    cy = _section(doc, 'STORY', 8, cy);\n    stoFields.forEach(f => { cy = _field(doc, f[0], f[1], 8, cy, W); });"
NEW7 = "  if (stoFields.length) {\n    cy = _section(doc, 'STORY', 8, cy);\n    stoFields.forEach(f => { cy = _chk(_field(doc, f[0], f[1], 8, cy, W)); });"

OLD8 = "  if (flaFields.length) {\n    cy = _section(doc, 'FLAVOR', 8, cy);\n    flaFields.forEach(f => { cy = _field(doc, f[0], f[1], 8, cy, W); });"
NEW8 = "  if (flaFields.length) {\n    cy = _section(doc, 'FLAVOR', 8, cy);\n    flaFields.forEach(f => { cy = _chk(_field(doc, f[0], f[1], 8, cy, W)); });"

errors = []
if OLD  not in src: errors.append("ANCHOR helper")
if OLD2 not in src: errors.append("ANCHOR you-loop")
if OLD3 not in src: errors.append("ANCHOR identity")
if OLD4 not in src: errors.append("ANCHOR idFields")
if OLD5 not in src: errors.append("ANCHOR appFields")
if OLD6 not in src: errors.append("ANCHOR perFields")
if OLD7 not in src: errors.append("ANCHOR stoFields")
if OLD8 not in src: errors.append("ANCHOR flaFields")

if errors:
    print("NOT FOUND:", errors)
else:
    src = src.replace(OLD,  NEW,  1)
    src = src.replace(OLD2, NEW2, 1)
    src = src.replace(OLD3, NEW3, 1)
    src = src.replace(OLD4, NEW4, 1)
    src = src.replace(OLD5, NEW5, 1)
    src = src.replace(OLD6, NEW6, 1)
    src = src.replace(OLD7, NEW7, 1)
    src = src.replace(OLD8, NEW8, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK pdf.js — pagination added to You card + all card sections")
