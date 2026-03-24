
path = "js/app/pdf.js"
src = open(path, encoding="utf-8").read()

# Fix 1: workTags not chips
OLD1 = "  if (you.chips && you.chips.length) {\n    doc.setTextColor('#7070a0');\n    doc.setFontSize(7);\n    doc.setFont('helvetica', 'bold');\n    doc.text('HOW YOU WORK', 10, cy);\n    cy += 6;\n    let cx = 10;\n    you.chips.forEach(chip => {\n      const label = typeof chip === 'string' ? chip : chip.label || '';"
NEW1 = "  const _tags = you.workTags || you.chips || [];\n  if (_tags.length) {\n    doc.setTextColor('#7070a0');\n    doc.setFontSize(7);\n    doc.setFont('helvetica', 'bold');\n    doc.text('HOW YOU WORK', 10, cy);\n    cy += 6;\n    let cx = 10;\n    _tags.forEach(chip => {\n      const label = typeof chip === 'string' ? chip : chip.label || '';"

# Fix 2: freetext not tell_sky/sky_note
OLD2 = "  if (you.tell_sky || you.sky_note) {\n    const note = you.tell_sky || you.sky_note;"
NEW2 = "  if (you.freetext || you.tell_sky || you.sky_note) {\n    const note = you.freetext || you.tell_sky || you.sky_note;"

# Fix 3: add more fields to the You page — song, location, project, hobbies, job
OLD3 = "  // Traits\n  if (you.traits && you.traits.length) {"
NEW3 = """  // Extra fields row
  const _extras = [
    you.song      ? '\\u266a ' + you.song      : null,
    you.location  ? '\\ud83d\\udccd ' + you.location : null,
    you.job       ? '\\ud83d\\udcbc ' + you.job       : null,
    you.hobbies   ? '\\u2605 ' + you.hobbies   : null,
  ].filter(Boolean);
  if (_extras.length) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#7070a0');
    _extras.forEach(ex => {
      const lines = doc.splitTextToSize(ex, W - 20);
      doc.text(lines[0], W / 2, cy, { align: 'center' });
      cy += 5;
    });
    cy += 3;
  }

  // Traits
  if (you.traits && you.traits.length) {"""

errors = []
if OLD1 not in src: errors.append("ANCHOR1 chips")
if OLD2 not in src: errors.append("ANCHOR2 tell_sky")
if OLD3 not in src: errors.append("ANCHOR3 extras")

if errors:
    print("NOT FOUND:", errors)
else:
    src = src.replace(OLD1, NEW1, 1)
    src = src.replace(OLD2, NEW2, 1)
    src = src.replace(OLD3, NEW3, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK pdf.js — fields fixed")
