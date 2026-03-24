
import os
BASE = "C:/Users/quart/spiralside"

open(BASE + "/js/app/pdf.js", "w", encoding="utf-8").write("""\
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
  if (you.chips && you.chips.length) {
    doc.setTextColor('#7070a0');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('HOW YOU WORK', 10, cy);
    cy += 6;
    let cx = 10;
    you.chips.forEach(chip => {
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

  // Tell Sky anything
  if (you.tell_sky || you.sky_note) {
    const note = you.tell_sky || you.sky_note;
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

// ── CARD PAGES: one per codex print ──────────────────────────
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
    doc.save(fname);

  } catch(e) {
    console.error('[pdf] generation failed:', e);
    alert('PDF generation failed: ' + e.message);
  } finally {
    if (btn) { btn.textContent = '\\u2913 soul print PDF'; btn.disabled = false; }
  }
}
""")
print("OK pdf.js")

# ── Patch account.js to add PDF button + import ──
path = BASE + "/js/app/views/account.js"
src = open(path, encoding="utf-8").read()

OLD = "import { syncLoadAll, syncSave } from '../sync.js';"
NEW = """import { syncLoadAll, syncSave } from '../sync.js';
import { generateSoulPrint }          from '../pdf.js';"""

# Add PDF button to the account view render function
# Find the export button area and add PDF button after it
OLD2 = "export async function exportUserData() {"
NEW2 = """export async function exportSoulPrintPDF() {
  // Pull You card data from CHARACTERS global (set by sheet.js)
  const you = window.CHARACTERS?.you || {};
  await generateSoulPrint(you);
}

export async function exportUserData() {"""

if OLD not in src:
    print("account ANCHOR1 NOT FOUND")
elif OLD2 not in src:
    print("account ANCHOR2 NOT FOUND")
else:
    src = src.replace(OLD, NEW, 1)
    src = src.replace(OLD2, NEW2, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK account.js")

# ── Patch index.html to add PDF button in account panel ──
path = BASE + "/index.html"
src = open(path, encoding="utf-8").read()

OLD3 = "      <button onclick=\"handleSignout()\">sign out</button>"
NEW3 = """      <button onclick=\"handleSignout()\">sign out</button>
      <div style="margin-top:16px">
        <div style="font-size:0.6rem;letter-spacing:0.12em;color:var(--subtext);text-transform:uppercase;margin-bottom:10px">your data</div>
        <button id="pdf-btn" onclick="window._exportSoulPrint && window._exportSoulPrint()" style="width:100%;padding:12px;background:linear-gradient(135deg,#00F6D6,#7c6af7);border:none;border-radius:10px;color:#000;font-family:var(--font-ui);font-size:0.78rem;font-weight:700;cursor:pointer;letter-spacing:0.04em;margin-bottom:8px">&#8595; soul print PDF</button>
        <button onclick="window._exportJSON && window._exportJSON()" style="width:100%;padding:11px;background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--subtext);font-family:var(--font-ui);font-size:0.75rem;cursor:pointer;letter-spacing:0.04em;margin-bottom:8px">&#8595; backup JSON</button>
        <button onclick="window._importJSON && window._importJSON()" style="width:100%;padding:11px;background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--subtext);font-family:var(--font-ui);font-size:0.75rem;cursor:pointer;letter-spacing:0.04em">&#8593; restore from backup</button>
      </div>"""

if OLD3 not in src:
    print("index ANCHOR NOT FOUND")
else:
    src = src.replace(OLD3, NEW3, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK index.html")

# ── Patch main.js to expose _exportSoulPrint + _exportJSON + _importJSON on window ──
path = BASE + "/js/app/main.js"
src = open(path, encoding="utf-8").read()

OLD4 = "// Nimbis anchor: js/app/main.js"
NEW4 = """// Nimbis anchor: js/app/main.js
import { exportSoulPrintPDF, exportUserData, importUserData } from './views/account.js';"""

# Find where window globals are set and add ours
OLD5 = "window.handleSignout"
NEW5 = """window._exportSoulPrint = exportSoulPrintPDF;
window._exportJSON      = exportUserData;
window._importJSON      = importUserData;
window.handleSignout"""

if OLD4 not in src:
    print("main ANCHOR1 NOT FOUND")
elif OLD5 not in src:
    print("main ANCHOR2 NOT FOUND - showing handleSignout lines:")
    for i,l in enumerate(src.split("\n")):
        if "handleSignout" in l or "Signout" in l: print(i+1, l)
else:
    src = src.replace(OLD4, NEW4, 1)
    src = src.replace(OLD5, NEW5, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK main.js")

print("ALL DONE")
