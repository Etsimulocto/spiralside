import os
BASE = os.path.expanduser('~/spiralside')
f = BASE + '/js/app/sheet.js'

src = open(f, encoding='utf-8').read().replace('\r\n', '\n')

# Verify _setPersonaAndChat is there (our anchor point after renderPrintCard)
if '_setPersonaAndChat' not in src:
    print('ERROR: _setPersonaAndChat not found - file too corrupt')
    exit(1)

# Everything after _setPersonaAndChat and makePrintCard is missing
# Append all missing exports + functions

missing = """

// -- BUILD YOU CONTEXT ---------------------------------------
export function buildYouContext() {
  const you = CHARACTERS.you;
  if (!you) return '';
  const parts = [];
  if (you.handle)   parts.push('The user\'s name is ' + you.handle + '.');
  if (you.pronouns) parts.push('Pronouns: ' + you.pronouns + '.');
  if (you.vibe)     parts.push('Their vibe: ' + you.vibe + '.');
  if (you.location) parts.push('They\'re based around: ' + you.location + '.');
  if (you.arc)      parts.push('What they\'re going through right now: ' + you.arc);
  if (you.project)  parts.push('Currently working on: ' + you.project + '.');
  if (you.song)     parts.push('Theme song right now: ' + you.song + '.');
  if (you.pets)     parts.push('Pets: ' + you.pets + '.');
  if (you.food)     parts.push('Fav food/drink: ' + you.food + '.');
  if (you.comfort)  parts.push('Comfort show/game: ' + you.comfort + '.');
  if (you.hates)    parts.push('Things they dislike: ' + you.hates + '.');
  if (you.workTags && you.workTags.length) parts.push('How they work: ' + you.workTags.join(', ') + '.');
  if (you.hair)       parts.push('Their hair: ' + you.hair + '.');
  if (you.eyes)       parts.push('Their eyes: ' + you.eyes + '.');
  if (you.build)      parts.push('Height/build: ' + you.build + '.');
  if (you.style)      parts.push('Their style: ' + you.style + '.');
  if (you.marks)      parts.push('Distinguishing features: ' + you.marks + '.');
  if (you.wearing)    parts.push('Usually wearing: ' + you.wearing + '.');
  if (you.hobbies)    parts.push('Hobbies: ' + you.hobbies + '.');
  if (you.obsession)  parts.push('Currently obsessed with: ' + you.obsession + '.');
  if (you.job)        parts.push('Job/role: ' + you.job + '.');
  if (you.medium)     parts.push('Creative medium: ' + you.medium + '.');
  if (you.people)     parts.push('People who matter: ' + you.people + '.');
  if (you.wins)       parts.push('Recent wins: ' + you.wins + '.');
  if (you.stuck)      parts.push('Currently stuck on: ' + you.stuck + '.');
  if (you.influences) parts.push('Influences: ' + you.influences + '.');
  if (you.freetext)   parts.push(you.freetext);
  if (!parts.length) return '';
  return 'About the person you are talking to:\\n' + parts.join(' ') + '\\n\\n';
}

// -- GLOBAL: EDIT PRINT --------------------------------------
window.editPrint = function(printId) {
  import('./state.js').then(function(m) {
    m.state.activePrintId = printId;
    import('./ui.js').then(function(u) { u.switchView('forge'); });
  });
};

// -- GLOBAL: DELETE PRINT ------------------------------------
window.deletePrint = function(printId, name) {
  if (!confirm('Delete "' + name + '" from your Codex?\\n\\nThis cannot be undone.')) return;
  import('./db.js').then(function(m) {
    m.dbDelete('prints', printId).then(function() {
      buildCharSelector();
      renderActiveChar('sky');
    });
  });
};

// -- MAKE YOU CARD -------------------------------------------
window.makeYouCard = async function() {
  var card = await import('./card.js');
  var st   = await import('./state.js');
  var you  = st.CHARACTERS.you;
  if (!you) return;
  var print = {
    card_id:         you.card_id || card.generateCardId('character'),
    card_version:    you.card_version || 1,
    level:           you.level || 1,
    portrait_base64: you.portrait_base64 || null,
    identity: {
      name:          you.handle || 'You',
      title:         you.trait  || 'the one who showed up',
      identity_line: you.vibe   || '',
      vibe:          you.vibe   || '',
      tone_tags:     you.workTags || [],
    },
    stats: {
      curiosity:   { value: (you.traits && you.traits[0] && you.traits[0].val) || 50, max: 100 },
      creativity:  { value: (you.traits && you.traits[1] && you.traits[1].val) || 50, max: 100 },
      chaos_level: { value: (you.traits && you.traits[2] && you.traits[2].val) || 50, max: 100 },
      trust:       { value: (you.traits && you.traits[3] && you.traits[3].val) || 50, max: 100 },
    },
    metadata: { owner_id:'you', creator_name: you.handle||'you', is_archetype:false },
    display:  { accent_color:'#7B5FFF', rarity: card.calcRarity({}) },
    lifecycle: {},
  };
  var overlay = document.getElementById('you-card-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'you-card-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;';
    var wrap2 = document.createElement('div');
    wrap2.id = 'you-card-wrap';
    wrap2.style.cssText = 'width:100%;max-width:360px;padding:0 20px';
    var btns2 = document.createElement('div');
    btns2.style.cssText = 'display:flex;gap:10px';
    var dlBtn2 = document.createElement('button');
    dlBtn2.textContent = '\u2193 download png';
    dlBtn2.style.cssText = 'padding:11px 20px;background:linear-gradient(135deg,var(--purple),var(--teal));border:none;border-radius:10px;color:#fff;font-family:var(--font-ui);font-size:0.78rem;cursor:pointer;letter-spacing:0.06em';
    dlBtn2.onclick = function() { window.downloadYouCard(); };
    var closeBtn2 = document.createElement('button');
    closeBtn2.textContent = 'close';
    closeBtn2.style.cssText = 'padding:11px 20px;background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--subtext);font-family:var(--font-ui);font-size:0.78rem;cursor:pointer';
    closeBtn2.onclick = function() { overlay.remove(); };
    btns2.appendChild(dlBtn2);
    btns2.appendChild(closeBtn2);
    overlay.appendChild(wrap2);
    overlay.appendChild(btns2);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }
  var wrap = document.getElementById('you-card-wrap');
  wrap.innerHTML = '<div style="color:var(--subtext);font-size:0.75rem;padding:20px;text-align:center">rendering...</div>';
  overlay.style.display = 'flex';
  var canvas = await card.renderCard(print, print.portrait_base64 || null);
  canvas.style.cssText = 'width:100%;border-radius:10px;display:block;box-shadow:0 0 40px rgba(123,95,255,0.3)';
  window._youCardCanvas = canvas;
  wrap.innerHTML = '';
  wrap.appendChild(canvas);
  var db = await import('./db.js');
  await db.dbSet('prints', {
    id: 'you_card', card_id: print.card_id, card_version: print.card_version,
    level: print.level, portrait_base64: print.portrait_base64 || null,
    identity: print.identity, stats: print.stats,
    metadata: { owner_id:'you', creator_name: you.handle||'you', is_archetype:false, is_you:true },
    display: { accent_color:'#7B5FFF' }, lifecycle: {},
  });
  console.log('[you_card] saved to prints IDB');
};

window.downloadYouCard = async function() {
  if (!window._youCardCanvas) return;
  var you = window.CHARACTERS && window.CHARACTERS.you;
  var id  = (you && you.card_id) || 'you-card';
  var dataUrl = window._youCardCanvas.toDataURL('image/png');
  if (window.opfsWrite) {
    try { var res = await fetch(dataUrl); var blob = await res.blob(); await window.opfsWrite('cards/' + id + '.png', blob); } catch(e) {}
  }
  var a = document.createElement('a');
  a.download = id + '.png';
  a.href = dataUrl;
  a.click();
};

window.imagineYouCard = function() {
  var you = CHARACTERS.you;
  if (!you) return;
  if (window.imagineWithContext) {
    window.imagineWithContext({
      subject: you.handle || 'You', hair: you.hair || '', eyes: you.eyes || '',
      clothing: you.wearing || you.style || '', marks: you.marks || '',
      species: 'human', vibe: you.vibe || '', pose: you.build || '',
      renderStyle: 'character portrait',
      negativePrompt: 'blurry, low quality, ugly, deformed, bad anatomy',
    });
  }
};

// -- EXPORT CODEX --------------------------------------------
export async function exportCodex() {
  var db = await import('./db.js');
  var prints = await db.dbGetAll('prints').catch(function() { return []; });
  if (!prints.length) { alert('No cards to export!'); return; }
  var data = {
    schema_version: 'spiralside_codex_v1',
    exported_at: new Date().toISOString(),
    card_count: prints.length,
    prints: prints,
  };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var name = 'spiralside-codex-' + Date.now() + '.json';
  if (window.opfsWrite) { try { await window.opfsWrite('cannonized/' + name, blob); } catch(e) {} }
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

// -- IMPORT CODEX --------------------------------------------
export async function importCodex(file) {
  try {
    var text = await file.text();
    var data = JSON.parse(text);
    if (!data.prints || !data.prints.length) { alert('No cards found in file.'); return; }
    var db = await import('./db.js');
    var count = 0;
    for (var i = 0; i < data.prints.length; i++) {
      var p = data.prints[i];
      if (!p.id && p.card_id) p.id = p.card_id;
      if (!p.id) continue;
      await db.dbSet('prints', p);
      count++;
    }
    buildCharSelector();
    alert('Imported ' + count + ' card' + (count !== 1 ? 's' : '') + ' into your Codex!');
  } catch(e) {
    alert('Import failed - invalid file.');
    console.error(e);
  }
}

// -- PRIVATE: STYLE CHIP -------------------------------------
function _styleChip(chip, id, active) {
  var c = CHARACTERS[id].color;
  chip.classList.toggle('active', active);
  chip.style.color       = active ? c        : 'var(--subtext)';
  chip.style.borderColor = active ? c + '88' : 'var(--border)';
  chip.style.boxShadow   = active ? '0 0 16px ' + c + '44' : 'none';
  chip.style.background  = active ? c + '11' : 'var(--surface2)';
}
"""

open(f, 'a', encoding='utf-8').write(missing)
final = open(f, encoding='utf-8').read()
print('final length:', len(final))
print('buildYouContext:', 'buildYouContext' in final)
print('editPrint:', 'editPrint' in final)
print('makeYouCard:', 'makeYouCard' in final)
print('exportCodex:', 'exportCodex' in final)
print('_styleChip:', '_styleChip' in final)
