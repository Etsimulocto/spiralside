import os, sys
BASE = os.path.expanduser('~/spiralside')
f = BASE + '/js/app/sheet.js'

src = open(f, encoding='utf-8').read().replace('\r\n', '\n')

# Find the last clean anchor — the _styleChip function which is the real end of the file
# Everything after it is corrupt junk from failed patches
anchor = '// ── PRIVATE: STYLE CHIP ─────────────────────────────────────────\nfunction _styleChip(chip, id, active) {'
if anchor not in src:
    print('anchor not found, trying alt')
    anchor = 'function _styleChip(chip, id, active)'
    
if anchor not in src:
    print('ERROR: cannot find _styleChip anchor')
    sys.exit(1)

idx = src.find(anchor)
# Find the closing brace of _styleChip — it's 4 lines, ends with single }
chunk = src[idx:]
# _styleChip body ends at the first standalone }
end = chunk.find('\n}\n', 50)
if end < 0:
    end = chunk.find('\n}', 50)
clean_end = idx + end + 3  # include the closing }\n
src = src[:clean_end]

print('file trimmed to length:', len(src))
print('last 80 chars:', repr(src[-80:]))

if not src.rstrip().endswith('}'):
    print('ERROR: still does not end with }')
    sys.exit(1)

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
  dlBtn.textContent = '\\u2193 download png';
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
print('final length:', len(final))
print('has makePrintCard:', 'window.makePrintCard' in final)
print('last 30 chars:', repr(final[-30:]))
