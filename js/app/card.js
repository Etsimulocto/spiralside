// ============================================================
// SPIRALSIDE — CARD v1.0
// Canvas-based trading card renderer
// Generates card image from soul print JSON
// Nimbis anchor: js/app/card.js
// ============================================================

// ── CARD DIMENSIONS ──────────────────────────────────────────
const CARD_W = 400;
const CARD_H = 560;

// ── RARITY TIERS ─────────────────────────────────────────────
const RARITY = {
  standard: { border: '#00F6D6', glow: '#00F6D644', label: 'STANDARD',  sigil: '✦' },
  bloom:    { border: '#FF4BCB', glow: '#FF4BCB44', label: 'BLOOM',     sigil: '✿' },
  signal:   { border: '#4DA3FF', glow: '#4DA3FF66', label: 'SIGNAL',    sigil: '◈' },
  sanctum:  { border: '#FFD93D', glow: '#FFD93D88', label: 'SANCTUM',   sigil: '❋' },
};

// ── CARD ID GENERATOR ─────────────────────────────────────────
// Format: CHR-XXXX-XXXX (type prefix + random hex segments)
const TYPE_PREFIX = {
  character: 'CHR',
  world:     'WRD',
  event:     'EVT',
  scene:     'SCN',
  companion: 'CMP',
};

export function generateCardId(type = 'companion') {
  const prefix = TYPE_PREFIX[type] || 'CMP';
  const seg1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const seg2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${seg1}-${seg2}`;
}

// ── RARITY CALCULATOR ─────────────────────────────────────────
// Auto-calculates rarity from lifecycle stats
export function calcRarity(lifecycle = {}) {
  const score =
    (lifecycle.usage_count     || 0) * 2 +
    (lifecycle.transfer_count  || 0) * 3 +
    (lifecycle.upgrade_count   || 0) * 5 +
    Math.floor((Date.now() - (lifecycle.created_ms || Date.now())) / 86400000) * 0.1;

  if (score >= 250) return 'sanctum';
  if (score >= 120) return 'signal';
  if (score >= 50)  return 'bloom';
  return 'standard';
}

// ── MAIN RENDER FUNCTION ──────────────────────────────────────
// Returns a canvas element with the card drawn on it
// print = soul print JSON object
// artImage = optional HTMLImageElement for the art
export async function renderCard(print, artImage = null) {
  // If artImage is a base64 string, convert to Image element
  if (typeof artImage === 'string' && artImage.startsWith('data:')) {
    const img = new Image();
    await new Promise(res => { img.onload = res; img.src = artImage; });
    artImage = img;
  }
  // Also check print.portrait_base64 if no artImage passed
  if (!artImage && print.portrait_base64) {
    const img = new Image();
    await new Promise(res => { img.onload = res; img.src = print.portrait_base64; });
    artImage = img;
  }
  const canvas = document.createElement('canvas');
  canvas.width  = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');

  const id       = print.identity     || {};
  const stats    = print.stats        || {};
  const meta     = print.metadata     || {};
  const display  = print.display      || {};
  const lifecycle = print.lifecycle   || {};

  const name     = id.name            || 'Unknown';
  const title    = id.title           || 'Companion';
  const idLine   = id.identity_line   || '';
  const vibe     = id.vibe            || '';
  const color    = display.accent_color || '#00F6D6';
  const cardId   = print.card_id      || generateCardId('companion');
  const version  = print.version      ? 'v' + print.version
                 : print.card_version ? 'v' + print.card_version : 'v1';
  const level    = print.level        || (print.metadata && print.metadata.level) || 1;
  const creator  = (print.metadata && (print.metadata.creator_name || print.metadata.handle))
                 || (print.metadata && print.metadata.owner_id === 'platform' ? 'Spiralside' : null)
                 || (typeof CHARACTERS !== 'undefined' && CHARACTERS.you?.handle)
                 || 'unknown';
  const rarity   = display.rarity     || calcRarity(lifecycle);
  const tier     = RARITY[rarity]     || RARITY.standard;

  // ── BACKGROUND ──
  ctx.fillStyle = '#08080d';
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // ── OUTER GLOW ──
  ctx.shadowColor = tier.glow;
  ctx.shadowBlur  = 24;
  ctx.strokeStyle = tier.border;
  ctx.lineWidth   = 3;
  _roundRect(ctx, 4, 4, CARD_W - 8, CARD_H - 8, 12);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // ── HEADER BAR ──
  const headerH = 56;
  const headerGrad = ctx.createLinearGradient(0, 0, CARD_W, 0);
  headerGrad.addColorStop(0, color + 'dd');
  headerGrad.addColorStop(1, '#08080d');
  ctx.fillStyle = headerGrad;
  _roundRect(ctx, 4, 4, CARD_W - 8, headerH, { tl: 10, tr: 10, bl: 0, br: 0 });
  ctx.fill();

  // Name
  ctx.fillStyle    = '#ffffff';
  ctx.font         = 'bold 26px "Syne", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.toUpperCase(), 16, 4 + headerH / 2);

  // Type label under name
  ctx.fillStyle  = '#ffffff99';
  ctx.font       = '10px "DM Mono", monospace';
  ctx.fillText('CHARACTER CARD', 16, 4 + headerH - 12);

  // Level badge + rarity sigil top right
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.roundRect(CARD_W - 52, 10, 44, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px "DM Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LV ' + level, CARD_W - 30, 20);
  ctx.fillStyle = tier.border;
  ctx.font = '11px serif';
  ctx.fillText(tier.sigil, CARD_W - 30, 36);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // ── ART AREA (top 50%) ──
  const artY = headerH + 4;
  const artH = 200;

  if (artImage) {
    // Clip to art area
    ctx.save();
    ctx.beginPath();
    ctx.rect(4, artY, CARD_W - 8, artH);
    ctx.clip();
    // Cover-fit the image
    const scale = Math.max((CARD_W - 8) / artImage.width, artH / artImage.height);
    const sw = artImage.width  * scale;
    const sh = artImage.height * scale;
    const sx = 4  + ((CARD_W - 8) - sw) / 2;
    const sy = artY + (artH - sh) / 2;
    ctx.drawImage(artImage, sx, sy, sw, sh);
    ctx.restore();

    // Art overlay gradient (bottom fade into card)
    const fadeGrad = ctx.createLinearGradient(0, artY, 0, artY + artH);
    fadeGrad.addColorStop(0,   'transparent');
    fadeGrad.addColorStop(0.7, 'transparent');
    fadeGrad.addColorStop(1,   '#08080d');
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(4, artY, CARD_W - 8, artH);
  } else {
    // Gradient placeholder if no art
    const artGrad = ctx.createLinearGradient(0, artY, CARD_W, artY + artH);
    artGrad.addColorStop(0, color + '33');
    artGrad.addColorStop(1, '#08080daa');
    ctx.fillStyle = artGrad;
    ctx.fillRect(4, artY, CARD_W - 8, artH);

    // Placeholder initial
    ctx.fillStyle  = color + '66';
    ctx.font       = 'bold 80px "Syne", sans-serif';
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name[0]?.toUpperCase() || '?', CARD_W / 2, artY + artH / 2);
    ctx.textAlign  = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // ── IDENTITY LINE STRIP ──
  const quoteY = artY + artH;
  const quoteH = 36;
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(4, quoteY, CARD_W - 8, quoteH);
  // Accent line
  ctx.fillStyle = color;
  ctx.fillRect(4, quoteY, 3, quoteH);

  if (idLine) {
    ctx.fillStyle    = '#F0F0FF';
    ctx.font         = 'italic 11px "DM Mono", monospace';
    ctx.textBaseline = 'middle';
    const truncated  = idLine.length > 52 ? idLine.slice(0, 52) + '…' : idLine;
    ctx.fillText(`"${truncated}"`, 14, quoteY + quoteH / 2);
  }

  // ── STATS SECTION ──
  const statsY = quoteY + quoteH + 8;
  const statEntries = Object.entries(stats).slice(0, 4);
  const statRowH    = 28;

  ctx.textBaseline = 'middle';
  statEntries.forEach(([key, stat], i) => {
    const y     = statsY + i * statRowH;
    const label = key.replace(/_/g, ' ');
    const val   = stat.value || stat || 50;
    const max   = stat.max   || 100;
    const pct   = Math.min(val / max, 1);

    // Label
    ctx.fillStyle = '#9090c0';
    ctx.font      = '10px "DM Mono", monospace';
    ctx.fillText(label.toUpperCase(), 16, y + statRowH / 2);

    // Value
    ctx.fillStyle  = color;
    ctx.font       = 'bold 12px "DM Mono", monospace';
    ctx.textAlign  = 'right';
    ctx.fillText(val, 160, y + statRowH / 2);
    ctx.textAlign  = 'left';

    // Bar background
    const barX = 168;
    const barW = CARD_W - barX - 16;
    const barH = 4;
    const barY = y + statRowH / 2 - barH / 2;
    ctx.fillStyle = '#1e1e35';
    ctx.fillRect(barX, barY, barW, barH);

    // Bar fill
    const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    barGrad.addColorStop(0, color);
    barGrad.addColorStop(1, color + '88');
    ctx.fillStyle = barGrad;
    ctx.fillRect(barX, barY, barW * pct, barH);
  });

  // Default S.H.E.S stats if no user stats
  if (statEntries.length === 0) {
    const shes = [
      { label: 'SIGNAL',      val: 50 },
      { label: 'HISTORY',     val: 50 },
      { label: 'EXPLORATION', val: 50 },
      { label: 'STYLE',       val: 50 },
    ];
    shes.forEach(({ label, val }, i) => {
      const y = statsY + i * statRowH;
      ctx.fillStyle = '#9090c0';
      ctx.font      = '10px "DM Mono", monospace';
      ctx.fillText(label, 16, y + statRowH / 2);
      ctx.fillStyle  = color + '66';
      ctx.font       = 'bold 12px "DM Mono", monospace';
      ctx.textAlign  = 'right';
      ctx.fillText(val, 160, y + statRowH / 2);
      ctx.textAlign  = 'left';
      const barX = 168, barW = CARD_W - 184, barH = 4;
      const barY = y + statRowH / 2 - 2;
      ctx.fillStyle = '#1e1e35';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = color + '44';
      ctx.fillRect(barX, barY, barW * 0.5, barH);
    });
  }

  // ── VIBE + LIFECYCLE ROW ──
  const infoY = statsY + 4 * statRowH + 8;
  const infoH = 56;

  // Left: vibe
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(4, infoY, (CARD_W - 8) / 2 - 2, infoH);
  ctx.fillStyle = color;
  ctx.font      = '8px "DM Mono", monospace';
  ctx.fillText('VIBE', 12, infoY + 12);
  ctx.fillStyle    = '#9090c0';
  ctx.font         = '9px "DM Mono", monospace';
  ctx.textBaseline = 'top';
  const vibeTags   = vibe || id.tone_tags?.join(' · ') || '—';
  _wrapText(ctx, vibeTags, 12, infoY + 18, (CARD_W - 8) / 2 - 16, 11);

  // Right: lifecycle
  const rightX = 4 + (CARD_W - 8) / 2 + 2;
  const rightW = (CARD_W - 8) / 2 - 2;
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(rightX, infoY, rightW, infoH);
  ctx.fillStyle = color;
  ctx.font      = '8px "DM Mono", monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('CARD HISTORY', rightX + 8, infoY + 12);
  ctx.fillStyle = '#9090c0';
  ctx.font      = '8px "DM Mono", monospace';
  ctx.fillText('by ' + creator, rightX + 8, infoY + 24);
  ctx.fillText('usage: ' + (lifecycle.usage_count || 0), rightX + 8, infoY + 34);
  ctx.fillText(version + '  lv ' + level, rightX + 8, infoY + 44);

  // ── FOOTER ──
  const footerY = CARD_H - 36;
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(4, footerY, CARD_W - 8, 32);
  // Footer top accent line
  ctx.fillStyle = color + '66';
  ctx.fillRect(4, footerY, CARD_W - 8, 1);

  // Card ID
  ctx.fillStyle    = color;
  ctx.font         = 'bold 10px "DM Mono", monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText(cardId, 12, footerY + 16);

  // Title center
  ctx.fillStyle  = '#9090c0';
  ctx.font       = '9px "DM Mono", monospace';
  ctx.textAlign  = 'center';
  ctx.fillText((title || 'COMPANION').toUpperCase(), CARD_W / 2, footerY + 16);

  // Spiralside right
  ctx.fillStyle  = color + '88';
  ctx.font       = '9px "DM Mono", monospace';
  ctx.textAlign  = 'right';
  ctx.fillText('SPIRALSIDE', CARD_W - 12, footerY + 16);
  ctx.textAlign  = 'left';

  // ── RARITY CORNER BADGE ──
  ctx.fillStyle = tier.border;
  ctx.font      = '8px "DM Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(tier.label, CARD_W - 12, footerY - 6);
  ctx.textAlign = 'left';

  return canvas;
}

// ── DOWNLOAD CARD ─────────────────────────────────────────────
// Renders card and triggers PNG download
export async function downloadCard(print, artImage = null) {
  const canvas   = await renderCard(print, artImage);
  const cardId   = print.card_id || 'card';
  const link     = document.createElement('a');
  link.download  = `${cardId}.png`;
  link.href      = canvas.toDataURL('image/png');
  link.click();
}

// ── SHOW CARD PREVIEW ─────────────────────────────────────────
// Renders card into a target DOM element
export async function showCardPreview(print, targetEl, artImage = null) {
  const canvas = await renderCard(print, artImage);
  canvas.style.cssText = 'width:100%;max-width:400px;border-radius:12px;display:block;margin:0 auto';
  targetEl.innerHTML = '';
  targetEl.appendChild(canvas);
  return canvas;
}


// ── SCENE CARD RENDER ─────────────────────────────────────────
export async function renderSceneCard(scene) {
  const W = 560, H = 360;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const name = scene.name || 'untitled scene';
  const caption = scene.caption || '';
  const mood = scene.mood || '';
  const time = scene.time || '';
  const camera = scene.camera || '';
  const location = scene.location || '';
  const world = scene.world || '';
  const color = '#00F6D6';
  ctx.fillStyle = '#08080d'; ctx.fillRect(0,0,W,H);
  if (scene.image) {
    try {
      const img = new Image();
      await new Promise((res,rej) => { img.onload=res; img.onerror=rej; img.src=scene.image; });
      ctx.save(); ctx.globalAlpha=0.55;
      const sc = Math.max(W/img.width, H/img.height);
      ctx.drawImage(img,(W-img.width*sc)/2,(H-img.height*sc)/2,img.width*sc,img.height*sc);
      ctx.globalAlpha=1; ctx.restore();
    } catch(e) {}
  } else {
    const g = ctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0,'#1a0a2e'); g.addColorStop(1,'#08080d');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(0,246,214,0.04)'; ctx.lineWidth=1;
    for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  }
  const vig=ctx.createLinearGradient(0,0,0,H);
  vig.addColorStop(0,'rgba(8,8,13,0.5)');vig.addColorStop(0.45,'rgba(8,8,13,0)');
  vig.addColorStop(0.65,'rgba(8,8,13,0)');vig.addColorStop(1,'rgba(8,8,13,0.93)');
  ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);
  for(let y=0;y<H;y+=4){ctx.fillStyle='rgba(0,246,214,0.018)';ctx.fillRect(0,y+2,W,1);}
  ctx.shadowColor='#00F6D644'; ctx.shadowBlur=20;
  ctx.strokeStyle=color; ctx.lineWidth=2;
  _roundRect(ctx,2,2,W-4,H-4,10); ctx.stroke(); ctx.shadowBlur=0;
  ctx.fillStyle='rgba(0,246,214,0.1)'; ctx.strokeStyle='rgba(0,246,214,0.25)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.roundRect(14,14,88,17,2); ctx.fill(); ctx.stroke();
  ctx.fillStyle=color; ctx.font='8px "DM Mono",monospace'; ctx.textBaseline='middle';
  ctx.fillText('SCENE CARD',20,22);
  if (mood) {
    ctx.fillStyle='rgba(243,247,255,0.35)'; ctx.textAlign='right';
    ctx.fillText(mood.toUpperCase(),W-14,22); ctx.textAlign='left';
  }
  ctx.fillStyle='#F3F7FF'; ctx.font='bold 26px "Syne",sans-serif'; ctx.textBaseline='bottom';
  ctx.shadowColor='rgba(0,0,0,0.8)'; ctx.shadowBlur=8;
  ctx.fillText(name.length>28?name.slice(0,28)+'\u2026':name,16,H-76); ctx.shadowBlur=0;
  if (caption) {
    ctx.fillStyle='rgba(243,247,255,0.6)'; ctx.font='italic 10px "DM Mono",monospace';
    ctx.textBaseline='top';
    ctx.fillText('"'+(caption.length>62?caption.slice(0,62)+'\u2026':caption)+'"',16,H-72);
  }
  const my=H-44; ctx.textBaseline='middle';
  let mx=16;
  [{l:'TIME',v:time},{l:'CAM',v:camera},{l:'LOC',v:location.slice(0,18)}].forEach(({l,v}) => {
    if (!v) return;
    ctx.fillStyle='rgba(243,247,255,0.3)'; ctx.font='8px "DM Mono",monospace';
    ctx.fillText(l,mx,my); mx+=ctx.measureText(l).width+4;
    ctx.fillStyle=color; ctx.fillText(v.toUpperCase(),mx,my); mx+=ctx.measureText(v.toUpperCase()).width+16;
  });
  const fy=H-26;
  ctx.fillStyle='rgba(8,8,13,0.75)'; ctx.fillRect(2,fy,W-4,24);
  ctx.fillStyle='rgba(0,246,214,0.18)'; ctx.fillRect(2,fy,W-4,1);
  ctx.fillStyle=color; ctx.font='bold 8px "DM Mono",monospace'; ctx.textBaseline='middle';
  ctx.fillText(scene.id||'SCN-????-????',12,fy+12);
  ctx.fillStyle='rgba(0,246,214,0.65)'; ctx.textAlign='center';
  ctx.fillText(world.toUpperCase()||'\u2014',W/2,fy+12);
  ctx.fillStyle='rgba(243,247,255,0.28)'; ctx.textAlign='right';
  ctx.fillText('SPIRALSIDE',W-12,fy+12); ctx.textAlign='left';
  return canvas;
}


// ── WORLD CARD RENDER ─────────────────────────────────────────
export async function renderWorldCard(world) {
  const W=400,H=560;
  const canvas=document.createElement('canvas');
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  const name=world.name||'untitled world';
  const tagline=world.tagline||'';
  const biome=world.biome||'';
  const lore=world.lore||'';
  const threat=world.threat||50;
  const locations=world.locations||[];
  const palette=world.palette||['#00F6D6','#FF4BCB','#4DA3FF','#FFD93D','#7c6af7','#F3F7FF'];
  const color='#7c6af7';
  ctx.fillStyle='#08080d'; ctx.fillRect(0,0,W,H);
  ctx.shadowColor='#7c6af744'; ctx.shadowBlur=20;
  ctx.strokeStyle=color; ctx.lineWidth=2;
  _roundRect(ctx,2,2,W-4,H-4,10); ctx.stroke(); ctx.shadowBlur=0;
  const hg=ctx.createLinearGradient(0,0,W,0);
  hg.addColorStop(0,'#7c6af7cc'); hg.addColorStop(1,'#08080d');
  ctx.fillStyle=hg; _roundRect(ctx,2,2,W-4,50,{tl:8,tr:8,bl:0,br:0}); ctx.fill();
  ctx.fillStyle='#fff'; ctx.font='bold 20px "Syne",sans-serif'; ctx.textBaseline='middle';
  ctx.fillText(name.toUpperCase().slice(0,22),14,27);
  ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.font='7px "DM Mono",monospace';
  ctx.fillText('WORLD CARD',14,44);
  ctx.fillStyle=color; ctx.save(); ctx.translate(W-20,20); ctx.rotate(Math.PI/4);
  ctx.fillRect(-7,-7,14,14); ctx.restore();
  const artY=58,artH=155;
  ctx.fillStyle='#0e0e1a'; ctx.fillRect(14,artY,W-28,artH);
  if (world.image) {
    try {
      const img=new Image();
      await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=world.image;});
      ctx.save(); ctx.beginPath(); ctx.rect(14,artY,W-28,artH); ctx.clip();
      const sc=Math.max((W-28)/img.width,artH/img.height);
      ctx.drawImage(img,14+((W-28)-img.width*sc)/2,artY+(artH-img.height*sc)/2,img.width*sc,img.height*sc);
      ctx.restore();
    } catch(e) {}
  } else {
    const ag=ctx.createLinearGradient(14,artY,W-14,artY+artH);
    ag.addColorStop(0,'#1a0a3e'); ag.addColorStop(1,'#08080d');
    ctx.fillStyle=ag; ctx.fillRect(14,artY,W-28,artH);
    ctx.strokeStyle='rgba(124,106,247,0.06)'; ctx.lineWidth=1;
    for(let x=14;x<W-14;x+=30){ctx.beginPath();ctx.moveTo(x,artY);ctx.lineTo(x,artY+artH);ctx.stroke();}
    for(let y=artY;y<artY+artH;y+=30){ctx.beginPath();ctx.moveTo(14,y);ctx.lineTo(W-14,y);ctx.stroke();}
    ctx.fillStyle='rgba(124,106,247,0.2)'; ctx.font='9px "DM Mono",monospace';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('NO IMAGE',W/2,artY+artH/2); ctx.textAlign='left';
  }
  ctx.strokeStyle='rgba(124,106,247,0.2)'; ctx.lineWidth=1; ctx.strokeRect(14,artY,W-28,artH);
  let by=artY+artH+10;
  const bx=16,bw=W-32;
  if (tagline) {
    ctx.fillStyle='#0e0e1a'; ctx.fillRect(bx,by,bw,30);
    ctx.fillStyle=color; ctx.fillRect(bx,by,2,30);
    ctx.fillStyle='rgba(243,247,255,0.5)'; ctx.font='italic 9px "DM Mono",monospace'; ctx.textBaseline='middle';
    ctx.fillText('"'+(tagline.length>50?tagline.slice(0,50)+'\u2026':tagline)+'"',bx+8,by+15);
    by+=38;
  }
  if (lore) {
    ctx.fillStyle='rgba(124,106,247,0.65)'; ctx.font='7px "DM Mono",monospace'; ctx.textBaseline='top';
    ctx.fillText('LORE',bx,by); by+=11;
    ctx.fillStyle='rgba(243,247,255,0.45)'; ctx.font='9px "DM Mono",monospace';
    _wrapText(ctx,lore.slice(0,110)+(lore.length>110?'\u2026':''),bx,by,bw,13); by+=40;
  }
  ctx.fillStyle='rgba(124,106,247,0.65)'; ctx.font='7px "DM Mono",monospace'; ctx.textBaseline='top';
  ctx.fillText('PALETTE',bx,by); by+=11;
  palette.forEach((c,i)=>{ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(bx+i*22,by,16,16,3);ctx.fill();}); by+=24;
  if (locations.length) {
    ctx.fillStyle='rgba(124,106,247,0.65)'; ctx.font='7px "DM Mono",monospace';
    ctx.fillText('KEY LOCATIONS',bx,by); by+=11;
    locations.slice(0,3).forEach(loc=>{
      ctx.fillStyle=color; ctx.beginPath(); ctx.arc(bx+3,by+5,2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(243,247,255,0.55)'; ctx.font='9px "DM Mono",monospace'; ctx.textBaseline='top';
      ctx.fillText(loc.slice(0,38),bx+10,by); by+=14;
    }); by+=4;
  }
  ctx.fillStyle='rgba(124,106,247,0.65)'; ctx.font='7px "DM Mono",monospace'; ctx.textBaseline='middle';
  ctx.fillText('THREAT',bx,by+5);
  ctx.fillStyle='#1e1e35'; ctx.fillRect(bx+50,by,bw-70,5);
  const tg=ctx.createLinearGradient(bx+50,0,bx+50+bw-70,0);
  tg.addColorStop(0,color); tg.addColorStop(1,'#FF4BCB');
  ctx.fillStyle=tg; ctx.fillRect(bx+50,by,(bw-70)*(threat/100),5);
  ctx.fillStyle=color; ctx.font='8px "DM Mono",monospace'; ctx.textAlign='right';
  ctx.fillText(threat,W-14,by+5); ctx.textAlign='left';
  const fy=H-26;
  ctx.fillStyle='rgba(8,8,13,0.75)'; ctx.fillRect(2,fy,W-4,24);
  ctx.fillStyle='rgba(124,106,247,0.18)'; ctx.fillRect(2,fy,W-4,1);
  ctx.fillStyle=color; ctx.font='bold 8px "DM Mono",monospace'; ctx.textBaseline='middle';
  ctx.fillText(world.id||'WLD-????-????',12,fy+12);
  ctx.fillStyle='rgba(124,106,247,0.65)'; ctx.textAlign='center';
  ctx.fillText(biome.toUpperCase()||'\u2014',W/2,fy+12);
  ctx.fillStyle='rgba(243,247,255,0.28)'; ctx.textAlign='right';
  ctx.fillText('SPIRALSIDE',W-12,fy+12); ctx.textAlign='left';
  return canvas;
}


// ── BUILD CARD RENDER ─────────────────────────────────────────
// Bloomslice Studio project card — components, learn, difficulty
// build = { id, title, author, description, platform, language,
//           difficulty, time_minutes, components[], what_you_learn[],
//           image, tags[], created_at }
export async function renderBuildCard(build) {
  const W = 400, H = 560;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── PULL FIELDS ──
  const title       = build.title            || 'Untitled Build';
  const author      = build.author           || 'anonymous';
  const description = build.description      || '';
  const platform    = build.platform         || 'Raspberry Pi';
  const language    = build.language         || 'Python';
  const difficulty  = (build.difficulty      || 'Beginner').toUpperCase();
  const timeMin     = build.time_minutes     || 0;
  const components  = build.components       || [];
  const whatLearn   = build.what_you_learn   || [];
  const cardId      = build.id               || generateCardId('build');
  const color       = '#FF4BCB';  // Bloomslice pink — distinct from teal/purple

  // difficulty badge color — beginner teal, intermediate yellow, advanced pink
  const diffColor = { BEGINNER:'#00F6D6', INTERMEDIATE:'#FFD93D', ADVANCED:'#FF4BCB' }[difficulty] || '#00F6D6';

  // ── BACKGROUND ──
  ctx.fillStyle = '#08080d';
  ctx.fillRect(0, 0, W, H);

  // ── BORDER + GLOW ── same pattern as renderCard
  ctx.shadowColor = color + '44'; ctx.shadowBlur = 24;
  ctx.strokeStyle = color; ctx.lineWidth = 3;
  _roundRect(ctx, 4, 4, W-8, H-8, 12); ctx.stroke();
  ctx.shadowBlur = 0;

  // ── HEADER BAR ──
  const headerH = 56;
  const hg = ctx.createLinearGradient(0, 0, W, 0);
  hg.addColorStop(0, color + 'dd'); hg.addColorStop(1, '#08080d');
  ctx.fillStyle = hg;
  _roundRect(ctx, 4, 4, W-8, headerH, { tl:10, tr:10, bl:0, br:0 }); ctx.fill();

  // title
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px "Syne",sans-serif';
  ctx.textBaseline = 'middle';
  const tt = title.length > 22 ? title.slice(0,22)+'…' : title;
  ctx.fillText(tt.toUpperCase(), 16, 4 + headerH/2 - 6);

  // platform · language sublabel
  ctx.fillStyle = '#ffffff99'; ctx.font = '9px "DM Mono",monospace';
  ctx.fillText(platform + '  ·  ' + language, 16, 4 + headerH - 10);

  // pi sigil top right
  ctx.font = '20px serif'; ctx.textAlign = 'right';
  ctx.fillText('🍓', W-16, 4 + headerH/2); ctx.textAlign = 'left';

  // ── ART AREA ──
  const artY = headerH + 4, artH = 160;
  if (build.image) {
    try {
      let img = build.image;
      if (typeof img === 'string') {
        const el = new Image();
        await new Promise((res,rej) => { el.onload=res; el.onerror=rej; el.src=img; });
        img = el;
      }
      ctx.save(); ctx.beginPath(); ctx.rect(4, artY, W-8, artH); ctx.clip();
      const sc = Math.max((W-8)/img.width, artH/img.height);
      const sw = img.width*sc, sh = img.height*sc;
      ctx.drawImage(img, 4+((W-8)-sw)/2, artY+(artH-sh)/2, sw, sh);
      ctx.restore();
      // bottom fade
      const fg = ctx.createLinearGradient(0, artY, 0, artY+artH);
      fg.addColorStop(0,'transparent'); fg.addColorStop(0.6,'transparent'); fg.addColorStop(1,'#08080d');
      ctx.fillStyle = fg; ctx.fillRect(4, artY, W-8, artH);
    } catch(e) { _buildPlaceholder(ctx, W, artY, artH, color); }
  } else {
    _buildPlaceholder(ctx, W, artY, artH, color);
  }

  // ── DIFFICULTY BADGE overlaid on art ──
  const bx = W-90, by = artY+8;
  ctx.fillStyle = diffColor+'dd';
  ctx.beginPath(); ctx.roundRect(bx, by, 78, 18, 4); ctx.fill();
  ctx.fillStyle = '#08080d'; ctx.font = 'bold 8px "DM Mono",monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(difficulty, bx+39, by+9); ctx.textAlign = 'left';

  // time badge
  if (timeMin > 0) {
    ctx.fillStyle = 'rgba(8,8,13,0.75)';
    ctx.beginPath(); ctx.roundRect(bx-52, by, 44, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffffff88'; ctx.font = '8px "DM Mono",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('~'+timeMin+'min', bx-30, by+9); ctx.textAlign = 'left';
  }

  // ── DESCRIPTION STRIP ── same position as identity line in renderCard
  const descY = artY+artH, descH = 34;
  ctx.fillStyle = '#0d0d1a'; ctx.fillRect(4, descY, W-8, descH);
  ctx.fillStyle = color; ctx.fillRect(4, descY, 3, descH);  // left accent bar
  if (description) {
    ctx.fillStyle = '#F0F0FF'; ctx.font = 'italic 10px "DM Mono",monospace';
    ctx.textBaseline = 'middle';
    const td = description.length > 55 ? description.slice(0,55)+'…' : description;
    ctx.fillText(td, 14, descY + descH/2);
  }

  // ── COMPONENTS ──
  let curY = descY + descH + 8;
  ctx.fillStyle = color; ctx.font = '7px "DM Mono",monospace'; ctx.textBaseline = 'top';
  ctx.fillText('COMPONENTS', 16, curY); curY += 12;
  components.slice(0,4).forEach(c => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(20, curY+5, 2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#9090c0'; ctx.font = '9px "DM Mono",monospace'; ctx.textBaseline = 'top';
    ctx.fillText(c.length>40?c.slice(0,40)+'…':c, 28, curY); curY += 14;
  });
  if (components.length > 4) {
    ctx.fillStyle = color+'88'; ctx.font = '8px "DM Mono",monospace';
    ctx.fillText('+' + (components.length-4) + ' more', 28, curY);
  }
  curY += 8;

  // ── WHAT YOU'LL LEARN ──
  if (whatLearn.length > 0) {
    ctx.fillStyle = color; ctx.font = '7px "DM Mono",monospace'; ctx.textBaseline = 'top';
    ctx.fillText("WHAT YOU'LL LEARN", 16, curY); curY += 12;
    whatLearn.slice(0,3).forEach(item => {
      ctx.fillStyle = diffColor; ctx.font = '9px "DM Mono",monospace'; ctx.textBaseline = 'top';
      ctx.fillText('✓', 16, curY);
      ctx.fillStyle = '#9090c0';
      ctx.fillText(item.length>38?item.slice(0,38)+'…':item, 28, curY); curY += 14;
    });
  }

  // ── AUTHOR STRIP ──
  const authorY = H-58;
  ctx.fillStyle = '#0d0d1a'; ctx.fillRect(4, authorY, W-8, 26);
  ctx.fillStyle = color+'66'; ctx.fillRect(4, authorY, W-8, 1);
  ctx.fillStyle = '#9090c0'; ctx.font = '8px "DM Mono",monospace'; ctx.textBaseline = 'middle';
  ctx.fillText('by @'+author+'  ·  BLOOMSLICE STUDIO', 12, authorY+13);

  // ── FOOTER ── exact same pattern as renderCard + renderWorldCard
  const footerY = H-28;
  ctx.fillStyle = '#0a0a14'; ctx.fillRect(4, footerY, W-8, 24);
  ctx.fillStyle = color+'66'; ctx.fillRect(4, footerY, W-8, 1);
  ctx.fillStyle = color; ctx.font = 'bold 10px "DM Mono",monospace'; ctx.textBaseline = 'middle';
  ctx.fillText(cardId, 12, footerY+12);
  ctx.fillStyle = '#9090c0'; ctx.font = '9px "DM Mono",monospace';
  ctx.textAlign = 'center'; ctx.fillText('BUILD CARD', W/2, footerY+12);
  ctx.fillStyle = color+'88'; ctx.textAlign = 'right';
  ctx.fillText('SPIRALSIDE', W-12, footerY+12); ctx.textAlign = 'left';

  return canvas;
}

// Circuit dot-grid placeholder — distinct from character (letter) and world (lines)
function _buildPlaceholder(ctx, W, artY, artH, color) {
  const g = ctx.createLinearGradient(0, artY, W, artY+artH);
  g.addColorStop(0,'#1a0a1a'); g.addColorStop(1,'#08080d');
  ctx.fillStyle = g; ctx.fillRect(4, artY, W-8, artH);
  ctx.fillStyle = color+'18';
  for (let x=14; x<W-14; x+=20) {
    for (let y=artY+10; y<artY+artH-10; y+=20) {
      ctx.beginPath(); ctx.arc(x,y,1,0,Math.PI*2); ctx.fill();
    }
  }
  ctx.strokeStyle = color+'12'; ctx.lineWidth = 1;
  for (let y=artY+20; y<artY+artH-20; y+=40) {
    ctx.beginPath(); ctx.moveTo(20,y); ctx.lineTo(W-20,y); ctx.stroke();
  }
  ctx.fillStyle = color+'22'; ctx.font = 'bold 64px serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🍓', W/2, artY+artH/2);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}


// ── HELPERS ───────────────────────────────────────────────────
function _roundRect(ctx, x, y, w, h, r) {
  const radius = typeof r === 'number'
    ? { tl: r, tr: r, bl: r, br: r }
    : { tl: r.tl||0, tr: r.tr||0, bl: r.bl||0, br: r.br||0 };
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + w - radius.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius.tr);
  ctx.lineTo(x + w, y + h - radius.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius.br, y + h);
  ctx.lineTo(x + radius.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
}

function _wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  let lineY = y;
  words.forEach(word => {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, lineY);
      line  = word;
      lineY += lineH;
    } else {
      line = test;
    }
  });
  if (line) ctx.fillText(line, x, lineY);
}
