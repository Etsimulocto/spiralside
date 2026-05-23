import os
BASE = os.path.expanduser('~/spiralside')
f = BASE + '/js/app/sheet.js'

src = open(f, encoding='utf-8').read().replace('\r\n', '\n')
print('file length:', len(src))
print('has makePrintCard:', 'makePrintCard' in src)
print('last 60 chars:', repr(src[-60:]))

fn = """

// -- MAKE PRINT CARD -----------------------------------------
window.makePrintCard = async function(print) {
  var card = await import('./card.js');
  if (!print) return;
  if (!print.card_id) print.card_id = card.generateCardId('companion');
  if (!print.display) print.display = {
    accent_color: (print.metadata && print.metadata.color) || '#00F6D6',
    rarity: card.calcRarity(print.lifecycle || {}),
  };
  var artImage = null;
  if (typeof print.portrait_base64 === 'string' && print.portrait_base64.startsWith('data:')) {
    artImage = print.portrait_base64;
  } else if (window.opfsRead) {
    try {
      var od = await window.opfsRead('prints/' + (print.id || print.card_id) + '_portrait.png');
      if (od) artImage = od;
    } catch(e) {}
  }
  var overlay = document.getElementById('you-card-overlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'you-card-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;';
  var wrap = document.createElement('div');
  wrap.id = 'you-card-wrap';
  wrap.style.cssText = 'width:100%;max-width:360px;padding:0 20px';
  var btns = document.createElement('div');
  btns.style.cssText = 'display:flex;gap:10px';
  var dlBtn = document.createElement('button');
  dlBtn.textContent = '\u2193 download png';
  dlBtn.style.cssText = 'padding:11px 20px;background:linear-gradient(135deg,var(--purple),var(--teal));border:none;border-radius:10px;color:#fff;font-family:var(--font-ui);font-size:0.78rem;cursor:pointer;letter-spacing:0.06em';
  dlBtn.onclick = function() { window.downloadYouCard(); };
  var closeBtn = document.createElement('button');
  closeBtn.textContent = 'close';
  closeBtn.style.cssText = 'padding:11px 20px;background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--subtext);font-family:var(--font-ui);font-size:0.78rem;cursor:pointer';
  closeBtn.onclick = function() { overlay.remove(); };
  btns.appendChild(dlBtn);
  btns.appendChild(closeBtn);
  overlay.appendChild(wrap);
  overlay.appendChild(btns);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  wrap.innerHTML = '<div style="color:var(--subtext);font-size:0.75rem;padding:20px;text-align:center">rendering...</div>';
  var canvas = await card.renderCard(print, artImage);
  canvas.style.cssText = 'width:100%;border-radius:10px;display:block;box-shadow:0 0 40px rgba(0,246,214,0.3)';
  window._youCardCanvas = canvas;
  wrap.innerHTML = '';
  wrap.appendChild(canvas);
};
"""

if 'makePrintCard' in src:
    print('already has makePrintCard - not appending')
else:
    open(f, 'a', encoding='utf-8').write(fn)
    print('appended ok')

final = open(f, encoding='utf-8').read()
print('final length:', len(final))
print('last 30 chars:', repr(final[-30:]))
