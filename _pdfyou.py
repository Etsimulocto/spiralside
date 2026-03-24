
path = "js/app/pdf.js"
src = open(path, encoding="utf-8").read()

# Add full You card fields after the trait bars section
OLD = """  // Tell Sky anything
  if (you.freetext || you.tell_sky || you.sky_note) {"""

NEW = """  // ── Full profile fields ──
  const _youFields = [
    ['pronouns',   you.pronouns],
    ['location',   you.location],
    ['project',    you.project],
    ['song',       you.song],
    ['pets',       you.pets],
    ['food',       you.food],
    ['comfort',    you.comfort],
    ['hates',      you.hates],
    ['hair',       you.hair],
    ['eyes',       you.eyes],
    ['build',      you.build],
    ['style',      you.style],
    ['marks',      you.marks],
    ['wearing',    you.wearing],
    ['hobbies',    you.hobbies],
    ['obsession',  you.obsession],
    ['job',        you.job],
    ['medium',     you.medium],
    ['people',     you.people],
    ['wins',       you.wins],
    ['stuck',      you.stuck],
    ['influences', you.influences],
  ].filter(f => f[1]);
  if (_youFields.length) {
    // two-column layout
    doc.setFontSize(6.5);
    const col1x = 10; const col2x = W / 2 + 2;
    let col1y = cy; let col2y = cy;
    _youFields.forEach((f, i) => {
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
    cy = Math.max(col1y, col2y) + 4;
  }

  // Tell Sky anything
  if (you.freetext || you.tell_sky || you.sky_note) {"""

if OLD not in src:
    print("ANCHOR NOT FOUND")
else:
    src = src.replace(OLD, NEW, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK pdf.js — You card full fields added in two-column layout")
