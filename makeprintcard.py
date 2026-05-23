import os, sys
BASE = os.path.expanduser('~/spiralside')
f = BASE + '/js/app/sheet.js'

src = open(f, encoding='utf-8').read().replace('\r\n', '\n')

# Strip everything from any makePrintCard attempt onward
for marker in ['// -- MAKE PRINT CARD', 'window.makePrintCard']:
    if marker in src:
        src = src[:src.find(marker)].rstrip()
        print('stripped at:', marker)

# Verify file ends with the _styleChip function properly closed
if not src.rstrip().endswith('}'):
    print('WARNING: file does not end with }')
    print('last 100 chars:', repr(src[-100:]))
    sys.exit(1)

fn = r"""

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
      var opfsData = await window.opfsRead('prints/' + (print.id || print.card_id) + '_portrait.png');
      if (opfsData) artImage = opfsData;
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

open(f, 'w', encoding='utf-8').write(src + fn)
final = open(f, encoding='utf-8').read()
print('done, length:', len(final))
print('has makePrintCard:', 'window.makePrintCard' in final)
print('last 50 chars:', repr(final[-50:]))
