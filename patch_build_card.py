#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — PATCH: Add renderBuildCard to card.js
# Adds BCK- prefix to TYPE_PREFIX and renderBuildCard() function
# Run from ~/spiralside:
#   /c/Users/quart/AppData/Local/Programs/Python/Python313/python.exe /tmp/patch_build_card.py
# ============================================================

import sys

path = 'js/app/card.js'
src  = open(path, encoding='utf-8').read()

# ── PATCH 1: Add BCK to TYPE_PREFIX ──────────────────────
OLD_PREFIX = """const TYPE_PREFIX = {
  character: 'CHR',
  world:     'WRD',
  event:     'EVT',
  scene:     'SCN',
  companion: 'CMP',
};"""

NEW_PREFIX = """const TYPE_PREFIX = {
  character: 'CHR',
  world:     'WRD',
  event:     'EVT',
  scene:     'SCN',
  companion: 'CMP',
  build:     'BCK',  // Bloomslice build cards
};"""

if OLD_PREFIX in src:
    src = src.replace(OLD_PREFIX, NEW_PREFIX, 1)
    print('card.js ✓ BCK prefix added to TYPE_PREFIX')
else:
    print('card.js ✗ TYPE_PREFIX anchor not found')
    sys.exit(1)

# ── PATCH 2: Add renderBuildCard before the helpers section ──
BUILD_CARD_FN = '''
// ── BUILD CARD RENDER ─────────────────────────────────────────
// Renders a Bloomslice Studio build card — Pi project with code,
// components, wiring, difficulty, and what-you-learn sections
// build = build card JSON object (see HANDOFF for full schema)
export async function renderBuildCard(build) {
  const W = 400;
  const H = 560;

  const canvas    = document.createElement('canvas');
  canvas.width    = W;
  canvas.height   = H;
  const ctx       = canvas.getContext('2d');

  // ── PULL FIELDS ──
  const title       = build.title        || 'Untitled Build';
  const author      = build.author       || 'anonymous';
  const description = build.description  || '';
  const platform    = build.platform     || 'Raspberry Pi';
  const language    = build.language     || 'Python';
  const difficulty  = (build.difficulty  || 'Beginner').toUpperCase();
  const timeMin     = build.time_minutes || 0;
  const components  = build.components   || [];
  const whatLearn   = build.what_you_learn || [];
  const cardId      = build.id           || generateCardId('build');
  const color       = '#FF4BCB';  // Bloomslice pink — distinct from other card types

  // ── DIFFICULTY COLORS ──
  const diffColor = {
    BEGINNER:     '#00F6D6',  // teal — approachable
    INTERMEDIATE: '#FFD93D',  // yellow — caution
    ADVANCED:     '#FF4BCB',  // pink — expert
  }[difficulty] || '#00F6D6';

  // ── BACKGROUND ──
  ctx.fillStyle = '#08080d';
  ctx.fillRect(0, 0, W, H);

  // ── OUTER GLOW + BORDER ──
  ctx.shadowColor = color + '44';
  ctx.shadowBlur  = 24;
  ctx.strokeStyle = color;
  ctx.lineWidth   = 3;
  _roundRect(ctx, 4, 4, W - 8, H - 8, 12);
  ctx.stroke();
  ctx.shadowBlur  = 0;

  // ── HEADER BAR ──
  const headerH   = 56;
  const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
  headerGrad.addColorStop(0, color + 'dd');
  headerGrad.addColorStop(1, '#08080d');
  ctx.fillStyle   = headerGrad;
  _roundRect(ctx, 4, 4, W - 8, headerH, { tl: 10, tr: 10, bl: 0, br: 0 });
  ctx.fill();

  // Title
  ctx.fillStyle    = '#ffffff';
  ctx.font         = 'bold 22px "Syne", sans-serif';
  ctx.textBaseline = 'middle';
  const titleTrunc = title.length > 22 ? title.slice(0, 22) + '…' : title;
  ctx.fillText(titleTrunc.toUpperCase(), 16, 4 + headerH / 2 - 6);

  // Platform + language sub-label
  ctx.fillStyle = '#ffffff99';
  ctx.font      = '9px "DM Mono", monospace';
  ctx.fillText(`${platform}  ·  ${language}`, 16, 4 + headerH - 10);

  // Pi sigil top right
  ctx.fillStyle = '#ffffff';
  ctx.font      = '20px serif';
  ctx.textAlign = 'right';
  ctx.fillText('🍓', W - 16, 4 + headerH / 2);
  ctx.textAlign = 'left';

  // ── ART AREA ──
  const artY = headerH + 4;
  const artH = 160;

  if (build.image) {
    // Load and cover-fit the image — same pattern as renderCard
    try {
      let img = build.image;
      if (typeof img === 'string') {
        const el = new Image();
        await new Promise((res, rej) => { el.onload = res; el.onerror = rej; el.src = img; });
        img = el;
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(4, artY, W - 8, artH);
      ctx.clip();
      const scale = Math.max((W - 8) / img.width, artH / img.height);
      const sw    = img.width  * scale;
      const sh    = img.height * scale;
      const sx    = 4  + ((W - 8) - sw) / 2;
      const sy    = artY + (artH - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh);
      ctx.restore();

      // Bottom fade into card
      const fadeGrad = ctx.createLinearGradient(0, artY, 0, artY + artH);
      fadeGrad.addColorStop(0,   'transparent');
      fadeGrad.addColorStop(0.6, 'transparent');
      fadeGrad.addColorStop(1,   '#08080d');
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(4, artY, W - 8, artH);
    } catch (e) {
      // Fall through to gradient placeholder on image load failure
      _buildArtPlaceholder(ctx, W, artY, artH, color, title);
    }
  } else {
    // Gradient placeholder with circuit-grid pattern
    _buildArtPlaceholder(ctx, W, artY, artH, color, title);
  }

  // ── DIFFICULTY BADGE ── (overlaid on art, top-right)
  const badgeX = W - 90;
  const badgeY = artY + 8;
  ctx.fillStyle   = diffColor + 'dd';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, 78, 18, 4);
  ctx.fill();
  ctx.fillStyle    = '#08080d';
  ctx.font         = 'bold 8px "DM Mono", monospace';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(difficulty, badgeX + 39, badgeY + 9);
  ctx.textAlign    = 'left';

  // Time badge next to difficulty
  if (timeMin > 0) {
    const tbX = badgeX - 52;
    ctx.fillStyle = 'rgba(8,8,13,0.75)';
    ctx.beginPath();
    ctx.roundRect(tbX, badgeY, 44, 18, 4);
    ctx.fill();
    ctx.fillStyle    = '#ffffff88';
    ctx.font         = '8px "DM Mono", monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`~${timeMin}min`, tbX + 22, badgeY + 9);
    ctx.textAlign    = 'left';
  }

  // ── DESCRIPTION STRIP ── (same position as identity line in renderCard)
  const descY = artY + artH;
  const descH = 34;
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(4, descY, W - 8, descH);
  ctx.fillStyle = color;
  ctx.fillRect(4, descY, 3, descH);  // left accent bar

  if (description) {
    ctx.fillStyle    = '#F0F0FF';
    ctx.font         = 'italic 10px "DM Mono", monospace';
    ctx.textBaseline = 'middle';
    const truncDesc  = description.length > 55 ? description.slice(0, 55) + '…' : description;
    ctx.fillText(truncDesc, 14, descY + descH / 2);
  }

  // ── COMPONENTS SECTION ──
  let curY = descY + descH + 8;

  ctx.fillStyle    = color;
  ctx.font         = '7px "DM Mono", monospace';
  ctx.textBaseline = 'top';
  ctx.fillText('COMPONENTS', 16, curY);
  curY += 11;

  const compsToShow = components.slice(0, 4);  // max 4 to fit card
  compsToShow.forEach(comp => {
    // Bullet dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(20, curY + 5, 2, 0, Math.PI * 2);
    ctx.fill();
    // Component text
    ctx.fillStyle    = '#9090c0';
    ctx.font         = '9px "DM Mono", monospace';
    ctx.textBaseline = 'top';
    const truncComp  = comp.length > 40 ? comp.slice(0, 40) + '…' : comp;
    ctx.fillText(truncComp, 28, curY);
    curY += 14;
  });

  if (components.length > 4) {
    ctx.fillStyle = color + '88';
    ctx.font      = '8px "DM Mono", monospace';
    ctx.fillText(`+${components.length - 4} more`, 28, curY);
    curY += 14;
  }

  curY += 4;

  // ── WHAT YOU WILL LEARN ──
  if (whatLearn.length > 0) {
    ctx.fillStyle    = color;
    ctx.font         = '7px "DM Mono", monospace';
    ctx.textBaseline = 'top';
    ctx.fillText('WHAT YOU\'LL LEARN', 16, curY);
    curY += 11;

    whatLearn.slice(0, 3).forEach(item => {  // max 3 items
      // Checkmark
      ctx.fillStyle    = diffColor;
      ctx.font         = '9px "DM Mono", monospace';
      ctx.textBaseline = 'top';
      ctx.fillText('✓', 16, curY);
      // Item text
      ctx.fillStyle    = '#9090c0';
      ctx.font         = '9px "DM Mono", monospace';
      const truncItem  = item.length > 38 ? item.slice(0, 38) + '…' : item;
      ctx.fillText(truncItem, 28, curY);
      curY += 14;
    });
  }

  // ── AUTHOR STRIP ──
  const authorY = H - 58;
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(4, authorY, W - 8, 26);
  ctx.fillStyle    = color + '66';
  ctx.fillRect(4, authorY, W - 8, 1);  // top accent line
  ctx.fillStyle    = '#9090c0';
  ctx.font         = '8px "DM Mono", monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText(`by @${author}  ·  BLOOMSLICE STUDIO`, 12, authorY + 13);

  // ── FOOTER ── (matches renderCard / renderWorldCard footer pattern exactly)
  const footerY = H - 28;
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(4, footerY, W - 8, 24);
  ctx.fillStyle = color + '66';
  ctx.fillRect(4, footerY, W - 8, 1);  // top accent line

  // Card ID left
  ctx.fillStyle    = color;
  ctx.font         = 'bold 10px "DM Mono", monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText(cardId, 12, footerY + 12);

  // BUILD CARD center
  ctx.fillStyle  = '#9090c0';
  ctx.font       = '9px "DM Mono", monospace';
  ctx.textAlign  = 'center';
  ctx.fillText('BUILD CARD', W / 2, footerY + 12);

  // SPIRALSIDE right
  ctx.fillStyle  = color + '88';
  ctx.font       = '9px "DM Mono", monospace';
  ctx.textAlign  = 'right';
  ctx.fillText('SPIRALSIDE', W - 12, footerY + 12);
  ctx.textAlign  = 'left';

  return canvas;
}

// ── BUILD CARD ART PLACEHOLDER ────────────────────────────────
// Circuit-grid gradient placeholder — shown when no art image exists
// Distinct visual from character (letter initial) and world (grid lines)
function _buildArtPlaceholder(ctx, W, artY, artH, color, title) {
  // Base gradient
  const artGrad = ctx.createLinearGradient(0, artY, W, artY + artH);
  artGrad.addColorStop(0, '#1a0a1a');
  artGrad.addColorStop(1, '#08080d');
  ctx.fillStyle = artGrad;
  ctx.fillRect(4, artY, W - 8, artH);

  // Circuit dot-grid pattern
  ctx.fillStyle = color + '18';
  for (let x = 14; x < W - 14; x += 20) {
    for (let y = artY + 10; y < artY + artH - 10; y += 20) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Horizontal trace lines — circuit board aesthetic
  ctx.strokeStyle = color + '12';
  ctx.lineWidth   = 1;
  for (let y = artY + 20; y < artY + artH - 20; y += 40) {
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(W - 20, y);
    ctx.stroke();
  }

  // Pi sigil large, centered
  ctx.fillStyle    = color + '22';
  ctx.font         = 'bold 64px "Syne", sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🍓', W / 2, artY + artH / 2);
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
}

'''

# Insert before the helpers section
HELPERS_ANCHOR = '// ── HELPERS ─────────────────────────────────────────────────────'

if HELPERS_ANCHOR in src:
    src = src.replace(HELPERS_ANCHOR, BUILD_CARD_FN + '\n' + HELPERS_ANCHOR, 1)
    print('card.js ✓ renderBuildCard added')
else:
    print('card.js ✗ helpers anchor not found')
    sys.exit(1)

open(path, 'w', encoding='utf-8').write(src)
print('\n=== card.js patched ===')
print('Next: git add . && git commit -m "feat: renderBuildCard — BCK card type, circuit placeholder, components + learn sections" && git push origin main --force')
