// ============================================================
// SPIRALSIDE -- PDF SOUL PRINT v1.0
// Generates a Bloomcore-styled PDF: You card page + one page per codex card
// Uses jsPDF (loaded dynamically from cdnjs) + IDB prints store
// Nimbis anchor: js/app/pdf.js
// ============================================================

import { dbGetAll } from './db.js';

const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

// Dynamically load jsPDF if not already present
async function loadJsPDF() {
  if (window.jspdf) return window.jspdf.jsPDF;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = JSPDF_URL;
    s.onload = () => resolve(window.jspdf.jsPDF);
    s.onerror = () => reject(new Error('jsPDF failed to load'));
    document.head.appendChild(s);
  });
}

// Draw a rounded rectangle (jsPDF helper)
function roundRect(doc, x, y, w, h, r) {
  doc.roundedRect(x, y, w, h, r, r, 'FD');
}

// Draw a pill badge
function drawPill(doc, text, x, y, accentHex) {
  const tw = doc.getTextWidth(text);
  const pw = tw + 10;
  const ph = 7;
  doc.setFillColor(accentHex);
  doc.setDrawColor(accentHex);
  doc.roundedRect(x, y - 5, pw, ph, 2, 2, 'F');
  doc.setTextColor('#ffffff');
  doc.setFontSize(7);
  doc.text(text, x + 5, y);
  return pw + 4; // return width used for next pill
}

// Check if we need a new page, add one if so, reset cy
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

// Draw a trait bar row
function drawTraitBar(doc, label, val, x, y, pageW) {
  const barW = pageW - x - 20;
  const fillW = (val / 100) * barW;
  doc.setFontSize(8);
  doc.setTextColor('#7070a0');
  doc.text(label, x, y);
  doc.setFillColor('#1e1e2e');
  doc.roundedRect(x, y + 2, barW, 3, 1, 1, 'F');
  doc.setFillColor('#7c6af7');
  if (fillW > 0) doc.roundedRect(x, y + 2, fillW, 3, 1, 1, 'F');
  doc.setTextColor('#7c6af7');
  doc.setFontSize(7);
  doc.text(String(val), x + barW + 2, y + 4);
}

// ── PAGE 1: YOU CARD ─────────────────────────────────────────
function drawYouPage(doc, you) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor('#0a0a0f');
  doc.rect(0, 0, W, H, 'F');

  // Header bar
  doc.setFillColor('#111118');
  doc.rect(0, 0, W, 18, 'F');
  doc.setTextColor('#00F6D6');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('SPIRALSIDE', 10, 11);
  doc.setTextColor('#7070a0');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('SOUL PRINT', W / 2, 11, { align: 'center' });
  doc.setTextColor('#2a2a3e');
  doc.text(new Date().toISOString().slice(0, 10), W - 10, 11, { align: 'right' });

  // Portrait circle
  let portraitY = 28;
  if (you.portrait_base64) {
    try {
      doc.addImage(you.portrait_base64, 'JPEG', W/2 - 20, portraitY, 40, 40);
    } catch(e) {}
  }

  // Accent divider
  doc.setDrawColor('#00F6D6');
  doc.setLineWidth(0.5);
  doc.line(10, portraitY + 44, W - 10, portraitY + 44);

  // Handle + vibe
  let cy = portraitY + 52;
  doc.setTextColor('#e8e8f0');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(you.handle || 'Unknown', W / 2, cy, { align: 'center' });
  cy += 8;
  doc.setTextColor('#00F6D6');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text((you.vibe || '').toUpperCase(), W / 2, cy, { align: 'center' });
  cy += 10;

  // Card ID
  doc.setTextColor('#2a2a3e');
  doc.setFontSize(7);
  doc.text(you.card_id || 'CHR-????-????', W / 2, cy, { align: 'center' });
  cy += 10;

  // Arc
  if (you.arc) {
    doc.setTextColor('#7070a0');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('CURRENT ARC', 10, cy);
    cy += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#e8e8f0');
    doc.setFontSize(8);
    const arcLines = doc.splitTextToSize(you.arc, W - 20);
    doc.text(arcLines, 10, cy);
    cy += arcLines.length * 5 + 4;
  }

  // Extra fields row
  const _extras = [
    you.song      ? 'song: '     + you.song      : null,
    you.location  ? 'location: ' + you.location  : null,
    you.job       ? 'job: '      + you.job        : null,
    you.hobbies   ? 'hobbies: '  + you.hobbies   : null,
    you.obsession ? 'obsession: '+ you.obsession : null,
    you.project   ? 'project: '  + you.project   : null,
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
  if (you.traits && you.traits.length) {
    doc.setTextColor('#7070a0');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('CORE TRAITS', 10, cy);
    cy += 6;
    you.traits.forEach(t => {
      drawTraitBar(doc, t.label || '', t.val || t.score || 50, 10, cy, W);
      cy += 9;
    });
    cy += 2;
  }

  // Chips
  const _tags = you.workTags || you.chips || [];
  if (_tags.length) {
    doc.setTextColor('#7070a0');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('HOW YOU WORK', 10, cy);
    cy += 6;
    let cx = 10;
    _tags.forEach(chip => {
      const label = typeof chip === 'string' ? chip : chip.label || '';
      if (!label) return;
      const tw = doc.getTextWidth(label);
      if (cx + tw + 14 > W - 10) { cx = 10; cy += 8; }
      const used = drawPill(doc, label, cx, cy, '#1e1e2e');
      // pill outline
      doc.setDrawColor('#2a2a3e');
      doc.setLineWidth(0.3);
      doc.roundedRect(cx, cy - 5, tw + 10, 7, 2, 2, 'S');
      cx += used;
    });
    cy += 10;
  }

  // ── Full profile fields ──
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
    cy = Math.max(col1y, col2y) + 4;
  }

  // Tell Sky anything
  if (you.freetext || you.tell_sky || you.sky_note) {
    const note = you.freetext || you.tell_sky || you.sky_note;
    doc.setFillColor('#111118');
    doc.setDrawColor('#1e1e2e');
    doc.roundedRect(8, cy, W - 16, 30, 2, 2, 'FD');
    doc.setTextColor('#7070a0');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('TELL SKY ANYTHING', 13, cy + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#e8e8f0');
    doc.setFontSize(8);
    const noteLines = doc.splitTextToSize(note, W - 28);
    doc.text(noteLines.slice(0, 4), 13, cy + 12);
    cy += 34;
  }

  // Footer
  doc.setFillColor('#111118');
  doc.rect(0, H - 12, W, 12, 'F');
  doc.setTextColor('#2a2a3e');
  doc.setFontSize(6);
  doc.text('spiralside.com  //  your companion. your data. your rules.', W / 2, H - 5, { align: 'center' });
}

// ── helpers ──────────────────────────────────────────────────
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

  // Helper to check page overflow mid-card
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
    idFields.forEach(f => { cy = _chk(_field(doc, f[0], f[1], 8, cy, W)); });
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
    appFields.forEach(f => { cy = _chk(_field(doc, f[0], f[1], 8, cy, W)); });
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
    perFields.forEach(f => { cy = _chk(_field(doc, f[0], f[1], 8, cy, W)); });
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
    stoFields.forEach(f => { cy = _chk(_field(doc, f[0], f[1], 8, cy, W)); });
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
    flaFields.forEach(f => { cy = _chk(_field(doc, f[0], f[1], 8, cy, W)); });
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
}

// ── PUBLIC: GENERATE SOUL PRINT PDF ──────────────────────────
export async function generateSoulPrint(you) {
  const btn = document.getElementById('pdf-btn');
  if (btn) { btn.textContent = 'generating...'; btn.disabled = true; }

  try {
    const JsPDF = await loadJsPDF();

    // Load all prints from IDB
    const allPrints = await dbGetAll('prints') || [];
    // Filter out system prints, keep real codex cards
    const cards = allPrints.filter(p =>
      p && p.id !== 'you_card' && p.identity?.name &&
      !String(p.id).startsWith('builtin_')
    );

    // Create PDF -- A5 portrait feels right for a card/soul print document
    const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });

    // Page 1 -- You card
    drawYouPage(doc, you);

    // One page per codex card
    cards.forEach((print, i) => {
      doc.addPage();
      drawCardPage(doc, print, i, cards.length);
    });

    // If no cards, add a placeholder page
    if (!cards.length) {
      doc.addPage();
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      doc.setFillColor('#0a0a0f');
      doc.rect(0, 0, W, H, 'F');
      doc.setTextColor('#2a2a3e');
      doc.setFontSize(9);
      doc.text('no codex cards yet', W / 2, H / 2, { align: 'center' });
      doc.setFontSize(7);
      doc.text('build some in the forge', W / 2, H / 2 + 8, { align: 'center' });
    }

    // Save
    const fname = 'spiralside-soulprint-' + new Date().toISOString().slice(0, 10) + '.pdf';
    // iOS Safari fix -- use data URI instead of blob save
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
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
        + '<button onclick="document.getElementById(&#39;_pdf_overlay&#39;).remove()" style="background:transparent;border:1px solid #2a2a3e;color:#7070a0;padding:6px 14px;border-radius:20px;font-family:monospace;font-size:0.72rem;cursor:pointer;">close</button>'
        + '</div>'
        + '<div style="width:100%;max-width:480px;padding:10px 16px;background:#0a0a0f;border-top:1px solid #1e1e2e;">'
        + '<div style="color:#00F6D6;font-family:monospace;font-size:0.7rem;font-weight:700;margin-bottom:6px;">TO SAVE ON iPHONE:</div>'
        + '<div style="color:#e8e8f0;font-family:monospace;font-size:0.7rem;line-height:2;">1. Tap the share button in Safari toolbar (box with arrow up)<br>2. Scroll and tap Save to Files<br>3. Choose On My iPhone or iCloud Drive<br>4. Tap Save</div>'
        + '</div></div>'
        + '<iframe src="' + pdfData + '" style="flex:1;width:100%;max-width:480px;border:none;background:#fff;"></iframe>';
      document.body.appendChild(overlay);
    } else {
      doc.save(fname);
    }

  } catch(e) {
    console.error('[pdf] generation failed:', e);
    alert('PDF generation failed: ' + e.message);
  } finally {
    if (btn) { btn.textContent = '\u2913 soul print PDF'; btn.disabled = false; }
  }
}
