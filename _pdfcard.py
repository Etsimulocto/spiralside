
path = "js/app/pdf.js"
src = open(path, encoding="utf-8").read()

OLD = """// ── CARD PAGES: one per codex print ──────────────────────────
function drawCardPage(doc, print, idx, total) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor('#0a0a0f');
  doc.rect(0, 0, W, H, 'F');

  // Header
  doc.setFillColor('#111118');
  doc.rect(0, 0, W, 18, 'F');
  doc.setTextColor('#00F6D6');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('SPIRALSIDE', 10, 11);
  doc.setTextColor('#7070a0');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('CODEX CARD ' + (idx + 1) + ' / ' + total, W / 2, 11, { align: 'center' });

  // Card image (canvas PNG)
  let cy = 24;
  if (print._pngData) {
    try {
      // Center the card image -- standard card is ~360x500 aspect
      const imgW = 80;
      const imgH = 110;
      doc.addImage(print._pngData, 'PNG', (W - imgW) / 2, cy, imgW, imgH);
      cy += imgH + 8;
    } catch(e) {
      cy += 4;
    }
  }

  // Accent line
  doc.setDrawColor('#7c6af7');
  doc.setLineWidth(0.4);
  doc.line(10, cy, W - 10, cy);
  cy += 6;

  // Card name
  const name = print.identity?.name || print.name || 'Unknown';
  doc.setTextColor('#e8e8f0');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(name, W / 2, cy, { align: 'center' });
  cy += 6;

  // Identity line / vibe
  const idLine = print.identity?.identity_line || print.vibe || '';
  if (idLine) {
    doc.setTextColor('#7c6af7');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(idLine.toUpperCase(), W / 2, cy, { align: 'center' });
    cy += 7;
  }

  // Card ID + type
  doc.setTextColor('#2a2a3e');
  doc.setFontSize(6);
  const cardId = print.card_id || print.id || '????';
  const cardType = print.card_type || print.type || 'CHR';
  doc.text(cardId + '  //  ' + cardType, W / 2, cy, { align: 'center' });
  cy += 8;

  // Lore / description
  const lore = print.lore || print.description || print.identity?.description || '';
  if (lore) {
    doc.setFillColor('#111118');
    doc.setDrawColor('#1e1e2e');
    doc.roundedRect(8, cy, W - 16, 28, 2, 2, 'FD');
    doc.setTextColor('#e8e8f0');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    const loreLines = doc.splitTextToSize(lore, W - 26);
    doc.text(loreLines.slice(0, 4), 13, cy + 7);
    cy += 32;
  }

  // Stats if present
  const stats = print.stats || print.identity?.stats;
  if (stats && typeof stats === 'object') {
    doc.setFont('helvetica', 'normal');
    cy += 2;
    Object.entries(stats).forEach(([k, v]) => {
      doc.setTextColor('#7070a0');
      doc.setFontSize(7);
      doc.text(k.toUpperCase(), 10, cy);
      doc.setTextColor('#00F6D6');
      doc.text(String(v), 40, cy);
      cy += 6;
    });
  }

  // Creator stamp
  const creator = print.metadata?.creator_name || print.creator_name || '';
  if (creator) {
    doc.setTextColor('#2a2a3e');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('created by ' + creator, W / 2, H - 18, { align: 'center' });
  }

  // Footer
  doc.setFillColor('#111118');
  doc.rect(0, H - 12, W, 12, 'F');
  doc.setTextColor('#2a2a3e');
  doc.setFontSize(6);
  doc.text('spiralside.com  //  your companion. your data. your rules.', W / 2, H - 5, { align: 'center' });
}"""

NEW = """// ── helpers ──────────────────────────────────────────────────
function _section(doc, label, x, cy) {
  doc.setTextColor('#7070a0');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text(label, x, cy);
  return cy + 5;
}
function _field(doc, label, value, x, cy, W) {
  if (!value) return cy;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor('#7070a0');
  doc.text(label + ':', x, cy);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#e8e8f0');
  const lines = doc.splitTextToSize(value, W - x - 10);
  doc.text(lines.slice(0, 2), x + 22, cy);
  return cy + (lines.length > 1 ? 9 : 5.5);
}

// ── CARD PAGES: one per codex print ──────────────────────────
function drawCardPage(doc, print, idx, total) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const accent = print._color || '#7c6af7';
  const id   = print.identity    || {};
  const app  = print.appearance  || {};
  const per  = print.personality || {};
  const sto  = print.story       || {};
  const fla  = print.flavor      || {};
  const stats = print.stats      || {};

  // Background
  doc.setFillColor('#0a0a0f');
  doc.rect(0, 0, W, H, 'F');

  // Header bar
  doc.setFillColor('#111118');
  doc.rect(0, 0, W, 16, 'F');
  doc.setTextColor('#00F6D6');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SPIRALSIDE', 8, 10);
  doc.setTextColor('#7070a0');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('CODEX  ' + (idx + 1) + ' / ' + total, W / 2, 10, { align: 'center' });
  doc.setTextColor('#2a2a3e');
  doc.text(print.template_type || 'companion', W - 8, 10, { align: 'right' });

  // Portrait
  let cy = 20;
  if (print.portrait_base64) {
    try {
      const fmt = print.portrait_base64.includes('data:image/png') ? 'PNG' : 'JPEG';
      const imgW = 36; const imgH = 36;
      doc.addImage(print.portrait_base64, fmt, W / 2 - imgW / 2, cy, imgW, imgH);
      cy += imgH + 4;
    } catch(e) { cy += 4; }
  }

  // Accent line
  doc.setDrawColor(accent);
  doc.setLineWidth(0.5);
  doc.line(8, cy, W - 8, cy);
  cy += 5;

  // Name + title
  doc.setTextColor('#e8e8f0');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(id.name || 'Unknown', W / 2, cy, { align: 'center' });
  cy += 5;
  if (id.title) {
    doc.setTextColor(accent);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(id.title.toUpperCase(), W / 2, cy, { align: 'center' });
    cy += 5;
  }
  if (id.identity_line) {
    doc.setTextColor('#7070a0');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('"' + id.identity_line + '"', W / 2, cy, { align: 'center' });
    cy += 5;
  }

  // Card ID
  doc.setTextColor('#2a2a3e');
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.text((print.card_id || print.id || '') + '  //  ' + (print.schema_version || ''), W / 2, cy, { align: 'center' });
  cy += 7;

  // ── IDENTITY section ──
  const idFields = [
    ['vibe',       id.vibe],
    ['personality',id.personality],
    ['first words',id.first_words],
    ['pronouns',   id.pronouns],
    ['species',    id.species],
    ['age',        id.age],
    ['origin',     id.origin],
    ['alignment',  id.alignment],
    ['occupation', id.occupation],
  ].filter(f => f[1] && f[1] !== '?');
  if (idFields.length) {
    cy = _section(doc, 'IDENTITY', 8, cy);
    idFields.forEach(f => { cy = _field(doc, f[0], f[1], 8, cy, W); });
    cy += 2;
  }

  // ── APPEARANCE section ──
  const appFields = [
    ['description', app.description],
    ['hair',        app.hair],
    ['eyes',        app.eyes],
    ['style',       app.style],
    ['marks',       app.marks],
    ['color theme', app.color_theme],
  ].filter(f => f[1]);
  if (appFields.length) {
    cy = _section(doc, 'APPEARANCE', 8, cy);
    appFields.forEach(f => { cy = _field(doc, f[0], f[1], 8, cy, W); });
    cy += 2;
  }

  // ── PERSONALITY section ──
  const perFields = [
    ['temperament', per.temperament],
    ['strengths',   per.strengths],
    ['weaknesses',  per.weaknesses],
    ['fears',       per.fears],
    ['motivations', per.motivations],
  ].filter(f => f[1]);
  if (perFields.length) {
    cy = _section(doc, 'PERSONALITY', 8, cy);
    perFields.forEach(f => { cy = _field(doc, f[0], f[1], 8, cy, W); });
    cy += 2;
  }

  // ── STORY section ──
  const stoFields = [
    ['backstory',    sto.backstory],
    ['current arc',  sto.current_arc],
    ['affiliations', sto.affiliations],
    ['theme song',   sto.theme_song],
  ].filter(f => f[1]);
  if (stoFields.length) {
    cy = _section(doc, 'STORY', 8, cy);
    stoFields.forEach(f => { cy = _field(doc, f[0], f[1], 8, cy, W); });
    cy += 2;
  }

  // ── FLAVOR section ──
  const flaFields = [
    ['catchphrase', fla.catchphrase],
    ['motto',       fla.motto],
    ['hobbies',     fla.hobbies],
  ].filter(f => f[1]);
  if (flaFields.length) {
    cy = _section(doc, 'FLAVOR', 8, cy);
    flaFields.forEach(f => { cy = _field(doc, f[0], f[1], 8, cy, W); });
    cy += 2;
  }

  // ── STATS section ──
  const statEntries = Object.entries(stats).filter(([k,v]) => v && v.value !== undefined);
  if (statEntries.length) {
    cy = _section(doc, 'STATS', 8, cy);
    statEntries.forEach(([k, v]) => {
      const barW = W - 50;
      const fillW = (v.value / (v.max || 100)) * barW;
      doc.setTextColor('#7070a0');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.text(k.toUpperCase(), 8, cy);
      doc.setFillColor('#1e1e2e');
      doc.roundedRect(30, cy - 3, barW, 3, 1, 1, 'F');
      doc.setFillColor(accent);
      if (fillW > 0) doc.roundedRect(30, cy - 3, fillW, 3, 1, 1, 'F');
      doc.setTextColor(accent);
      doc.setFont('helvetica', 'normal');
      doc.text(String(v.value), W - 8, cy, { align: 'right' });
      if (v.description) {
        doc.setTextColor('#2a2a3e');
        doc.setFontSize(5.5);
        doc.text(v.description, 30, cy + 3.5);
        cy += 8;
      } else { cy += 6; }
    });
    cy += 2;
  }

  // ── TONE TAGS ──
  if (id.tone_tags && id.tone_tags.length) {
    doc.setTextColor('#2a2a3e');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(id.tone_tags.join('  /  '), W / 2, cy, { align: 'center' });
    cy += 5;
  }

  // Footer
  doc.setFillColor('#111118');
  doc.rect(0, H - 12, W, 12, 'F');
  doc.setTextColor('#2a2a3e');
  doc.setFontSize(6);
  doc.text('spiralside.com  //  your companion. your data. your rules.', W / 2, H - 5, { align: 'center' });
}"""

if OLD not in src:
    print("ANCHOR NOT FOUND")
else:
    src = src.replace(OLD, NEW, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK pdf.js — full forge card schema rendered")
