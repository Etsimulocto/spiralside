// ============================================================
// SPIRALSIDE — SHEET v1.1
// Character sheet: selector chips, card render, save+summarize
// Reads CHARACTERS from state, persists to IndexedDB
// Adds: identity line, vibe, talk-to button from soul prints
// Nimbis anchor: js/app/sheet.js
// ============================================================

import { state, CHARACTERS, RAIL } from './state.js';
import { dbSet, dbGetAll }          from './db.js';
import { syncSave, syncLoad }         from './sync.js';
import { getToken }                 from './auth.js';
import { getChatMsgs }              from './chat.js';

// ── BUILD SELECTOR CHIPS ──────────────────────────────────────
// Renders the horizontal chip row at top of sheet view
export function buildCharSelector() {
  const container = document.getElementById('char-selector');
  container.innerHTML = '';

  Object.entries(CHARACTERS).forEach(([id, char]) => {
    const chip       = document.createElement('div');
    chip.className   = `char-chip ${id === state.activeChar ? 'active' : ''}`;
    chip.textContent = char.name;
    chip.id          = `chip-${id}`;
    _styleChip(chip, id, id === state.activeChar);
    chip.onclick     = () => renderActiveChar(id);
    container.appendChild(chip);
  });

  // ── USER PRINTS from IDB ──────────────────────────────────
  dbGetAll('prints').then(prints => {
    if (!prints) return;
    prints.forEach(print => {
      if (!print.identity?.name) return;
      if (String(print.id).startsWith('builtin_')) return; // skip seeded archetypes
      if (print.id === 'you_card') return; // skip — You archetype chip handles this
      const chip     = document.createElement('div');
      chip.className = 'char-chip';
      chip.textContent = print.identity.name;
      chip.id        = `chip-print-${print.id}`;
      // Style with print color or default teal
      const color = print.metadata?.color || '#00F6D6';
      chip.style.color       = 'var(--subtext)';
      chip.style.borderColor = 'var(--border)';
      chip.style.background  = 'var(--surface2)';
      // Show portrait thumbnail if available
      // Load portrait — from IDB or OPFS fallback
      const _applyPortrait = (b64) => {
        chip.style.backgroundImage    = `url(${b64})`;
        chip.style.backgroundSize     = 'cover';
        chip.style.backgroundPosition = 'center top';
        chip.style.color              = '#fff';
        chip.style.textShadow         = '0 1px 3px rgba(0,0,0,0.8)';
        chip.style.border             = `2px solid ${color}`;
        chip.style.minWidth           = '72px';
        chip.style.height             = '48px';
        chip.style.borderRadius       = '8px';
        chip.style.display            = 'flex';
        chip.style.alignItems         = 'flex-end';
        chip.style.padding            = '4px 6px';
        chip.style.fontSize           = '0.6rem';
      };
      if (print.portrait_base64) {
        _applyPortrait(print.portrait_base64);
      } else if (print._has_portrait_base64 && window.opfsRead) {
        const _opfsKey = 'prints/' + print.id + '_portrait.png';
        window.opfsRead(_opfsKey).then(data => {
          if (data) { print.portrait_base64 = data; _applyPortrait(data); }
        }).catch(() => {});
      }
      chip.onclick = () => renderPrintCard(print);
      container.insertBefore(chip, addChip);
    });
  }).catch(() => {});

  // "+" chip
  const addChip       = document.createElement('div');
  addChip.className   = 'char-add-chip';
  addChip.textContent = '+ new';
  addChip.onclick     = () => {
    import('./state.js').then(({ state }) => { state.activePrintId = null; });
    import('./build.js').then(({ clearForgeForm }) => clearForgeForm());
    import('./ui.js').then(({ switchView }) => switchView('forge'));
  };
  container.appendChild(addChip);
}

// ── RENDER ACTIVE CHARACTER ───────────────────────────────────
// Populates the sheet card with char data and updates all chips
export function renderActiveChar(id) {
  state.activeChar = id;
  const char = CHARACTERS[id];
  if (!char) return;

  // Update all chip highlight states
  Object.keys(CHARACTERS).forEach(cid => {
    const chip = document.getElementById(`chip-${cid}`);
    if (chip) _styleChip(chip, cid, cid === id);
  });

  // Card color accents
  document.getElementById('card-accent').style.background =
    `linear-gradient(90deg,${char.color},transparent)`;
  document.getElementById('arc-accent').style.background =
    `linear-gradient(90deg,${char.color},transparent)`;

  // Avatar block
  const av         = document.getElementById('sheet-avatar-lg');
  av.style.border  = `2px solid ${char.color}66`;
  av.style.boxShadow = `0 0 24px ${char.color}44`;
  // Portrait image — used by You card and soul prints
  if (char.portrait_base64) {
    av.textContent = '';
    av.style.backgroundImage    = `url(${char.portrait_base64})`;
    av.style.backgroundSize     = 'cover';
    av.style.backgroundPosition = 'center top';
    av.style.color              = 'transparent';
    av.style.background         = `url(${char.portrait_base64}) center top / cover`;
  } else {
    av.style.backgroundImage = '';
    av.textContent   = char.initial;
    av.style.color   = char.color;
    av.style.background = `linear-gradient(135deg,${char.color}33,${char.color}11)`;
  }
  // You card — make avatar tappable to upload portrait
  av.onclick = null;
  av.style.cursor = 'default';
  if (char.isUser) {
    av.title  = 'tap to set portrait';
    av.style.cursor = 'pointer';
    av.onclick = () => {
      const inp = document.createElement('input');
      inp.type   = 'file';
      inp.accept = 'image/*';
      inp.onchange = async e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async ev => {
          char.portrait_base64 = ev.target.result;
          // Re-render avatar immediately
          av.textContent = '';
          av.style.background = `url(${ev.target.result}) center top / cover`;
          av.style.backgroundImage = `url(${ev.target.result})`;
          av.style.backgroundSize  = 'cover';
          av.style.backgroundPosition = 'center top';
          // Persist — add portrait to IDB record
          const { dbSet: _dbSet } = await import('./db.js');
          await _dbSet('sheets', {
            id: 'you',
            arc:             char.arc,
            traits:          char.traits,
            handle:          char.handle,
            vibe:            char.vibe,
            song:            char.song,
            portrait_base64: ev.target.result,
          });
          // Save portrait to OPFS — survives cloud hydration overwrites
          try {
            if (window.opfsWrite) {
              const _res  = await fetch(ev.target.result);
              const _blob = await _res.blob();
              await window.opfsWrite('you_card_avatar.png', _blob);
              console.log('[sheet] portrait saved to OPFS');
            }
          } catch(_e) { console.warn('[sheet] OPFS portrait save failed:', _e); }
          // Also sync to cloud (stripped) so text fields update
          const { syncSave: _syncSave } = await import('./sync.js');
          _syncSave('you_card', Object.assign({}, char, {
            id: 'you', portrait_base64: ev.target.result
          })).catch(() => {});
          // Feedback
          const hint = document.createElement('div');
          hint.textContent = '✓ portrait saved';
          hint.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--surface);border:1px solid var(--teal);color:var(--teal);padding:8px 16px;border-radius:20px;font-size:0.72rem;letter-spacing:0.08em;z-index:999;pointer-events:none;';
          document.body.appendChild(hint);
          setTimeout(() => hint.remove(), 2000);
        };
        reader.readAsDataURL(file);
      };
      inp.click();
    };
  }

  // Name / trait / mood
  const nameEl = document.getElementById('sheet-char-name');
  nameEl.textContent  = char.name;
  nameEl.style.textShadow = `0 0 20px ${char.color}66`;

  const traitEl = document.getElementById('sheet-char-trait');
  traitEl.textContent = char.trait;
  traitEl.style.color = char.color;

  const mood = document.getElementById('sheet-char-mood');
  mood.textContent      = `⬤ ${char.mood}`;
  mood.style.color      = char.color;
  mood.style.background = char.color + '22';
  mood.style.border     = `1px solid ${char.color}44`;

  // ── identity line + vibe (from soul print) ──
  const idLine = document.getElementById('sheet-identity-line');
  if (idLine) {
    idLine.textContent   = char.identityLine || '';
    idLine.style.color   = char.color + 'cc';
    idLine.style.display = char.identityLine ? 'block' : 'none';
  }

  const vibeEl = document.getElementById('sheet-vibe');
  if (vibeEl) {
    vibeEl.textContent   = char.vibe ? `"${char.vibe}"` : '';
    vibeEl.style.display = char.vibe ? 'block' : 'none';
  }

  // ── talk-to button — sets persona and switches to chat ──
  const talkBtn = document.getElementById('talk-to-btn');
  // Crew members (sky/cold/monday/grit) are always present â€” no talk-to button
  // Only custom Codex bots get the talk-to button so users can focus them
  const _CREW = ['sky', 'cold', 'monday', 'grit'];
  const _isCustomBot = !char.isUser && !_CREW.includes(char.id || id);
  // Reset to crew mode when viewing a crew card
  if (!_isCustomBot && !char.isUser) {
    import('./state.js').then(({ state }) => {
      state.botName  = 'Sky';
      state.botColor = '#00F6D6';
    });
  }
  if (talkBtn && _isCustomBot) {
    talkBtn.style.display    = 'block';
    talkBtn.textContent      = `talk to ${char.name}`;
    talkBtn.style.background = `linear-gradient(135deg,${char.color}33,${char.color}11)`;
    talkBtn.style.border     = `1px solid ${char.color}88`;
    talkBtn.style.color      = char.color;
    talkBtn.style.boxShadow  = `0 0 20px ${char.color}22`;
    talkBtn.onclick          = () => _setPersonaAndChat(char);
  } else if (talkBtn) {
    talkBtn.style.display = 'none'; // hide for crew + user's own sheet
  }

  // Trait bars
  document.getElementById('trait-list').innerHTML = char.traits.map(t => `
    <div class="trait-row">
      <div class="trait-header">
        <span class="trait-label-text">${t.label}</span>
        <span class="trait-val" style="color:${char.color}">${t.val}</span>
      </div>
      <div class="trait-bar-bg">
        <div class="trait-bar-fill"
          style="width:${t.val}%;background:linear-gradient(90deg,${char.color},${char.color}88);
                 box-shadow:0 0 8px ${char.color}88"></div>
      </div>
    </div>
  `).join('');

  // Arc textarea
  document.getElementById('arc-text').value = char.arc || '';

  // Show/hide user-specific fields
  const userCard = document.getElementById('user-sheet-card');
  userCard.style.display = char.isUser ? 'block' : 'none';
  if (char.isUser) {
    document.getElementById('user-handle').value   = char.handle   || '';
    document.getElementById('user-pronouns').value = char.pronouns || '';
    document.getElementById('user-vibe').value     = char.vibe     || '';
    document.getElementById('user-location').value = char.location || '';
    document.getElementById('user-arc').value      = char.arc      || '';
    document.getElementById('user-project').value  = char.project  || '';
    document.getElementById('user-song').value     = char.song     || '';
    document.getElementById('user-pets').value     = char.pets     || '';
    document.getElementById('user-food').value     = char.food     || '';
    document.getElementById('user-comfort').value  = char.comfort  || '';
    document.getElementById('user-hates').value       = char.hates       || '';
    document.getElementById('user-hair').value        = char.hair        || '';
    document.getElementById('user-eyes').value        = char.eyes        || '';
    document.getElementById('user-build').value       = char.build       || '';
    document.getElementById('user-style').value       = char.style       || '';
    document.getElementById('user-marks').value       = char.marks       || '';
    document.getElementById('user-wearing').value     = char.wearing     || '';
    document.getElementById('user-hobbies').value     = char.hobbies     || '';
    document.getElementById('user-obsession').value   = char.obsession   || '';
    document.getElementById('user-job').value         = char.job         || '';
    document.getElementById('user-medium').value      = char.medium      || '';
    document.getElementById('user-people').value      = char.people      || '';
    document.getElementById('user-wins').value        = char.wins        || '';
    document.getElementById('user-stuck').value       = char.stuck       || '';
    document.getElementById('user-influences').value  = char.influences  || '';
    document.getElementById('user-freetext').value = char.freetext || '';
    // Restore work tags
    const workTags = char.workTags || [];
    document.querySelectorAll('#you-work-tags .you-tag').forEach(t => {
      t.classList.toggle('on', workTags.includes(t.dataset.tag));
      t.onclick = () => t.classList.toggle('on');
    });
    // card meta strip
    const cardMetaEl = document.getElementById('you-card-meta');
    if (cardMetaEl) {
      const _xps = (typeof getXPState !== 'undefined') ? getXPState() : null;
      const lv   = (_xps ? _xps.level : null) || char.level || 1;
      cardMetaEl.innerHTML =
        '<span>' + (char.card_id || 'CHR-????-????') + '</span>' +
        '<span>lv ' + lv + '</span>' +
        '<span>v' + (char.card_version || 1) + '</span>';
      cardMetaEl.style.display = 'flex';
    }
    const makeBtn = document.getElementById('make-you-card-btn');
    if (makeBtn) makeBtn.style.display = 'block';
    // Hide print card maker when on You card
    const _mpBtn = document.getElementById('make-print-card-btn');
    if (_mpBtn) _mpBtn.style.display = 'none';
    // Show "gen portrait" button for You card
    let imagineBtn = document.getElementById('you-imagine-btn');
    if (!imagineBtn) {
      imagineBtn = document.createElement('button');
      imagineBtn.id = 'you-imagine-btn';
      imagineBtn.textContent = '✦ gen portrait';
      imagineBtn.style.cssText = [
        'width:100%','padding:11px','margin-top:6px',
        'background:linear-gradient(135deg,var(--purple),var(--teal))',
        'border:none','border-radius:10px','color:#fff',
        'font-family:var(--font-display)','font-weight:700',
        'font-size:0.82rem','cursor:pointer','letter-spacing:0.04em',
      ].join(';');
      imagineBtn.onclick = () => window.imagineYouCard();
      if (makeBtn) makeBtn.parentNode.insertBefore(imagineBtn, makeBtn.nextSibling);
    }
    imagineBtn.style.display = 'block';

    // ── EDIT IN FORGE BUTTON (You card only) ──
    let _ycForgeBtn = document.getElementById('yc-edit-forge-btn');
    if (!_ycForgeBtn) {
      _ycForgeBtn = document.createElement('button');
      _ycForgeBtn.id = 'yc-edit-forge-btn';
      _ycForgeBtn.textContent = 'edit in forge';
      _ycForgeBtn.style.cssText = [
        'width:100%','padding:11px','margin-top:6px',
        'background:var(--surface2)','border:1px solid var(--teal)',
        'border-radius:10px','color:var(--teal)',
        'font-family:var(--font-ui)','font-size:0.78rem',
        'cursor:pointer','letter-spacing:0.06em','transition:all 0.2s',
      ].join(';');
      _ycForgeBtn.addEventListener('click', async () => {
        const { initForgeView } = await import('./views/forge.js');
        initForgeView();
        if (window.loadYouCardIntoForge) await window.loadYouCardIntoForge();
        if (window.switchView) window.switchView('forge');
      });
      imagineBtn.parentNode.insertBefore(_ycForgeBtn, imagineBtn.nextSibling);
    }
    _ycForgeBtn.style.display = 'block';
  }

  // Save+summarize button color
  const btn = document.getElementById('save-summarize-btn');
  btn.style.background = `linear-gradient(135deg,${char.color}22,${char.color}11)`;
  btn.style.border     = `1px solid ${char.color}66`;
  btn.style.color      = char.color;
  btn.style.boxShadow  = `0 0 20px ${char.color}22`;

  // Hide edit/delete — archetypes (crew + you) are not editable
  const actionRow = document.getElementById('print-action-row');
  if (actionRow) actionRow.style.display = 'none';
  // Hide You card meta strip for non-user chars (crew chips)
  const _czMeta = document.getElementById('you-card-meta');
  if (_czMeta) _czMeta.style.display = 'none';
  const _czMakeBtn = document.getElementById('make-you-card-btn');
  if (_czMakeBtn && !char.isUser) _czMakeBtn.style.display = 'none';
  const _czImagineBtn = document.getElementById('you-imagine-btn');
  if (_czImagineBtn && !char.isUser) _czImagineBtn.style.display = 'none';
  const _czPrintBtn = document.getElementById('make-print-card-btn');
  if (_czPrintBtn) _czPrintBtn.style.display = 'none';
}

// ── SAVE + SUMMARIZE ──────────────────────────────────────────
// Saves sheet to IndexedDB, then optionally calls AI to extract
// traits from the current chat thread and merges them back
export async function saveSummarize() {
  // ── DOWNLOAD FIRES IMMEDIATELY — before any early-return checks ──
  // This way the user always gets their backup regardless of chat state
  const _youChar = CHARACTERS['you'];
  if (_youChar) _downloadYouCard(_youChar);
  const id   = state.activeChar;
  const char = CHARACTERS[id];
  if (!char) return;

  // sync level from XP engine
  if (typeof getXPState !== 'undefined') {
    const _xps = getXPState();
    if (_xps) char.level = _xps.level || 1;
  }
  // ensure card_id exists (generated once, never overwritten)
  if (!char.card_id) {
    const s1 = Math.random().toString(36).substring(2,6).toUpperCase();
    const s2 = Math.random().toString(36).substring(2,6).toUpperCase();
    char.card_id = 'CHR-' + s1 + '-' + s2;
  }
  // bump version on every save
  char.card_version = (char.card_version || 1) + 1;

  // Read arc text from whichever field is active
  char.arc = document.getElementById('arc-text').value;

  // If user's own sheet, also read extra profile fields
  if (char.isUser) {
    char.handle   = document.getElementById('user-handle').value;
    window._youHandle = char.handle || window._youHandle;
    char.pronouns = document.getElementById('user-pronouns').value;
    char.vibe     = document.getElementById('user-vibe').value;
    char.location = document.getElementById('user-location').value;
    char.arc      = document.getElementById('user-arc').value;
    char.project  = document.getElementById('user-project').value;
    char.song     = document.getElementById('user-song').value;
    char.pets     = document.getElementById('user-pets').value;
    char.food     = document.getElementById('user-food').value;
    char.comfort  = document.getElementById('user-comfort').value;
    char.hates       = document.getElementById('user-hates').value;
    char.hair        = document.getElementById('user-hair').value;
    char.eyes        = document.getElementById('user-eyes').value;
    char.build       = document.getElementById('user-build').value;
    char.style       = document.getElementById('user-style').value;
    char.marks       = document.getElementById('user-marks').value;
    char.wearing     = document.getElementById('user-wearing').value;
    char.hobbies     = document.getElementById('user-hobbies').value;
    char.obsession   = document.getElementById('user-obsession').value;
    char.job         = document.getElementById('user-job').value;
    char.medium      = document.getElementById('user-medium').value;
    char.people      = document.getElementById('user-people').value;
    char.wins        = document.getElementById('user-wins').value;
    char.stuck       = document.getElementById('user-stuck').value;
    char.influences  = document.getElementById('user-influences').value;
    char.freetext = document.getElementById('user-freetext').value;
    char.workTags = Array.from(document.querySelectorAll('#you-work-tags .you-tag.on')).map(t => t.dataset.tag);
  }

  // Persist to IndexedDB
  syncSave('you_card', Object.assign({}, char, {id:'you'})).catch(()=>{});
  await dbSet('sheets', {
    id,
    arc:             char.arc,
    traits:          char.traits,
    handle:          char.handle,
    pronouns:        char.pronouns  || null,
    vibe:            char.vibe      || null,
    location:        char.location  || null,
    project:         char.project   || null,
    song:            char.song      || null,
    pets:            char.pets      || null,
    food:            char.food      || null,
    comfort:         char.comfort   || null,
    hates:           char.hates       || null,
    hair:            char.hair        || null,
    eyes:            char.eyes        || null,
    build:           char.build       || null,
    style:           char.style       || null,
    marks:           char.marks       || null,
    wearing:         char.wearing     || null,
    hobbies:         char.hobbies     || null,
    obsession:       char.obsession   || null,
    job:             char.job         || null,
    medium:          char.medium      || null,
    people:          char.people      || null,
    wins:            char.wins        || null,
    stuck:           char.stuck       || null,
    influences:      char.influences  || null,
    freetext:        char.freetext  || null,
    workTags:        char.workTags  || [],
    portrait_base64: char.portrait_base64 || null,
    card_id:         char.card_id      || null,
    card_version:    char.card_version || 1,
    level:           char.level        || 1,
  });

  // Keep you_card print in IDB in sync with latest You card data
  try {
    const { dbSet: _dbs } = await import('./db.js');
    await _dbs('prints', {
      id:              'you_card',
      card_id:         char.card_id || 'you_card',
      card_version:    char.card_version || 1,
      level:           char.level || 1,
      portrait_base64: char.portrait_base64 || null,
      identity: {
        name:          char.handle || 'You',
        title:         char.trait  || 'the one who showed up',
        identity_line: char.vibe   || '',
        vibe:          char.vibe   || '',
        tone_tags:     char.workTags || [],
      },
      stats: {
        curiosity:   { value: char.traits?.[0]?.val || 50, max: 100 },
        creativity:  { value: char.traits?.[1]?.val || 50, max: 100 },
        chaos_level: { value: char.traits?.[2]?.val || 50, max: 100 },
        trust:       { value: char.traits?.[3]?.val || 50, max: 100 },
      },
      metadata: { owner_id:'you', creator_name: char.handle||'you', is_archetype:false, is_you:true },
      display:   { accent_color:'#7B5FFF' },
      lifecycle: {},
    });
  } catch(e) { console.warn('you_card sync:', e); }

  // Button feedback
  const btn  = document.getElementById('save-summarize-btn');
  const orig = btn.textContent;
  btn.textContent = '✓ saved to device';
  setTimeout(() => { btn.textContent = orig; }, 2000);

  // Only call AI summarize if there's a real thread to summarize
  const messages = getChatMsgs();
  if (!messages || messages.length <= 2) return;

  try {
    const token = await getToken();
    if (!token) return;

    // Flatten thread to plain text
    const thread = Array.from(messages).filter(m => m && m.querySelector).map(m => {
      const bubble = m.querySelector('.msg-bubble');
      const role   = m.classList.contains('user') ? 'user' : 'bot';
      return `${role}: ${bubble?.textContent?.trim() || ''}`;
    }).join('\n');

    const r = await fetch(`${RAIL}/sheet`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({
        message:       thread,
        system_prompt: JSON.stringify(char),
        vault_context: '',
      }),
    });

    const data = await r.json();
    if (!data.sheet) return;

    const parsed = JSON.parse(data.sheet.replace(/```json|```/g, '').trim());
    if (parsed.traits) {
      // Merge AI-extracted scores back into existing trait labels
      char.traits = parsed.traits.map((t, i) => ({
        label: t.label || char.traits[i]?.label,
        val:   t.score || t.val || 50,
      }));
      if (parsed.summary) char.arc = parsed.summary;

      // Save merged result
      // Merge into full existing record — never overwrite fields we did not touch
      const { dbGet: _dbGet2 } = await import('./db.js');
      const _existing = await _dbGet2('sheets', id) || {};
      await dbSet('sheets', { ..._existing, id, arc: char.arc, traits: char.traits });

      // Re-render with new data
      renderActiveChar(id);
      // Auto-download a backup of everything they filled out
      // download already fired at top of saveSummarize
    }
  } catch(e) {
    console.warn('saveSummarize AI step:', e);
  }
}

// ── AUTO-DOWNLOAD You card as JSON on every save+summarize ────
// Belt-and-suspenders: even if cloud sync fails, user has a local copy
function _downloadYouCard(char) {
  try {
    const exportObj = {
      spiralside_you_card: true,
      exported_at: new Date().toISOString(),
      version: '1.0',
      data: {
        handle:        char.handle        || '',
        vibe:          char.vibe          || '',
        arc:           char.arc           || '',
        song:          char.song          || '',
        traits:        char.traits        || [],
        chips:         char.chips         || [],
        hobbies:       char.hobbies       || '',
        obsession:     char.obsession     || '',
        job:           char.job           || '',
        medium:        char.medium        || '',
        people:        char.people        || '',
        wins:          char.wins          || '',
        stuck:         char.stuck         || '',
        influences:    char.influences    || '',
        tell_sky:      char.tell_sky      || char.sky_note || '',
        appearance:    char.appearance    || {},
        portrait_b64:  char.portrait_base64 ? '[portrait included]' : null,
      }
    };
    const blob = new Blob(
      [JSON.stringify(exportObj, null, 2)],
      { type: 'application/json' }
    );
    // Open in new tab — Edge blocks silent downloads but always allows window.open
    // User can then Ctrl+S to save, or just keep it as a tab for reference
    // Toast with inline download -- iOS Safari gets data URI, others get blob
    const _fname = 'spiralside-you-' + new Date().toISOString().slice(0,10) + '.json';
    const _isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const _isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const _toast = document.createElement('div');
    _toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--surface);border:2px solid var(--accent);border-radius:12px;padding:14px 20px;z-index:9999;display:flex;align-items:center;gap:14px;font-family:var(--font-ui);font-size:0.78rem;color:var(--text);box-shadow:0 4px 24px rgba(0,0,0,0.5);';
    if (_isIOS || _isSafari) {
      // iOS: convert to data URI, open in new tab
      const _reader = new FileReader();
      _reader.onload = function() {
        const _datauri = _reader.result;
        _toast.innerHTML = '<span style="color:var(--accent3)">&#10003; saved to cloud</span>'
          + '<a href="' + _datauri + '" download="' + _fname + '" style="color:#fff;background:var(--accent);text-decoration:none;border-radius:20px;padding:6px 14px;font-size:0.75rem;" onclick="window.open(this.href);return false;">&#8595; backup json</a>'
          + '<span style="color:var(--subtext);cursor:pointer;font-size:1.1rem;line-height:1;" onclick="this.parentNode.remove()">&#215;</span>';
        document.body.appendChild(_toast);
        setTimeout(function(){ if(_toast.parentNode) _toast.parentNode.removeChild(_toast); }, 15000);
      };
      _reader.readAsDataURL(blob);
    } else {
      const _burl = URL.createObjectURL(blob);
      _toast.innerHTML = '<span style="color:var(--accent3)">&#10003; saved to cloud</span>'
        + '<a href="' + _burl + '" download="' + _fname + '" style="color:#fff;background:var(--accent);text-decoration:none;border-radius:20px;padding:6px 14px;font-size:0.75rem;">&#8595; backup json</a>'
        + '<span style="color:var(--subtext);cursor:pointer;font-size:1.1rem;line-height:1;" onclick="this.parentNode.remove()">&#215;</span>';
      document.body.appendChild(_toast);
      setTimeout(function(){ if(_toast.parentNode) _toast.parentNode.removeChild(_toast); URL.revokeObjectURL(_burl); }, 15000);
    }
  } catch(e) {
    console.warn('[sheet] export failed:', e);
  }
}

// ── LOAD SAVED SHEETS FROM IDB ────────────────────────────────
// Called in onAppReady — overlays IDB data onto CHARACTERS defaults
export async function loadSavedSheets(dbGet) {
  for (const id of Object.keys(CHARACTERS)) {
    const saved = await dbGet('sheets', id);
    if (!saved) continue;
    if (saved.arc)    CHARACTERS[id].arc    = saved.arc;
    if (saved.traits) CHARACTERS[id].traits = saved.traits;
    // User-specific fields — restore all You card fields from IDB
    if (id === 'you') {
      if (saved.handle)   CHARACTERS.you.handle   = saved.handle;
      window._youHandle = saved.handle;
      if (saved.pronouns) CHARACTERS.you.pronouns = saved.pronouns;
      if (saved.vibe)     CHARACTERS.you.vibe     = saved.vibe;
      if (saved.location) CHARACTERS.you.location = saved.location;
      if (saved.project)  CHARACTERS.you.project  = saved.project;
      if (saved.song)     CHARACTERS.you.song     = saved.song;
      if (saved.pets)     CHARACTERS.you.pets     = saved.pets;
      if (saved.food)     CHARACTERS.you.food     = saved.food;
      if (saved.comfort)  CHARACTERS.you.comfort  = saved.comfort;
      if (saved.hates)       CHARACTERS.you.hates       = saved.hates;
      if (saved.hair)        CHARACTERS.you.hair        = saved.hair;
      if (saved.eyes)        CHARACTERS.you.eyes        = saved.eyes;
      if (saved.build)       CHARACTERS.you.build       = saved.build;
      if (saved.style)       CHARACTERS.you.style       = saved.style;
      if (saved.marks)       CHARACTERS.you.marks       = saved.marks;
      if (saved.wearing)     CHARACTERS.you.wearing     = saved.wearing;
      if (saved.hobbies)     CHARACTERS.you.hobbies     = saved.hobbies;
      if (saved.obsession)   CHARACTERS.you.obsession   = saved.obsession;
      if (saved.job)         CHARACTERS.you.job         = saved.job;
      if (saved.medium)      CHARACTERS.you.medium      = saved.medium;
      if (saved.people)      CHARACTERS.you.people      = saved.people;
      if (saved.wins)        CHARACTERS.you.wins        = saved.wins;
      if (saved.stuck)       CHARACTERS.you.stuck       = saved.stuck;
      if (saved.influences)  CHARACTERS.you.influences  = saved.influences;
      if (saved.freetext) CHARACTERS.you.freetext = saved.freetext;
      if (saved.workTags) CHARACTERS.you.workTags = saved.workTags;
      // FIX: restore portrait so You card shows photo after refresh
      if (saved.portrait_base64) CHARACTERS.you.portrait_base64 = saved.portrait_base64;
      if (saved.card_id)      CHARACTERS.you.card_id      = saved.card_id;
      if (saved.card_version) CHARACTERS.you.card_version = saved.card_version;
      if (saved.level)        CHARACTERS.you.level        = saved.level;
    }
  }
}

// ── RENDER A USER PRINT CARD ─────────────────────────────────
// Called when a user-created print chip is tapped
// Populates the card face from soul print JSON
function renderPrintCard(print) {
  window._activePrint = print; // store for edit/delete buttons
  const id   = print.identity || {};
  const char = {
    name:         id.name         || 'unknown',
    title:        id.title        || '',
    identityLine: id.identity_line|| '',
    vibe:         id.vibe         || '',
    firstWords:   id.first_words  || "Hey. I'm here.",
    mood:         id.tone_tags?.[0] || 'unknown',
    color:        '#00F6D6',
    initial:      (id.name?.[0] || '?').toUpperCase(),
    trait:        id.title        || '',
    traits:       Object.entries(print.stats || {}).slice(0,4).map(([k,v]) => ({
      label: k.replace(/_/g,' '), val: v.value || 50
    })),
    arc:          print.story?.current_arc || '',
    isUser:       false,
  };

  // Update chip highlights — deselect archetypes
  Object.keys(CHARACTERS).forEach(cid => {
    const chip = document.getElementById(`chip-${cid}`);
    if (chip) _styleChip(chip, cid, false);
  });

  // Populate card face — reuse same DOM elements
  document.getElementById('card-accent').style.background =
    `linear-gradient(90deg,${char.color},transparent)`;
  document.getElementById('arc-accent').style.background =
    `linear-gradient(90deg,${char.color},transparent)`;

  const av = document.getElementById('sheet-avatar-lg');
  if (print.portrait_base64) {
    // Show portrait image as avatar
    av.style.backgroundImage = `url(${print.portrait_base64})`;
    av.style.backgroundSize  = 'cover';
    av.style.backgroundPosition = 'center';
    av.textContent = '';
    av.style.border    = `3px solid ${char.color}`;
    av.style.boxShadow = `0 0 32px ${char.color}66`;
    av.style.color     = 'transparent';
    // Make avatar bigger for portrait cards
    av.style.width  = '96px';
    av.style.height = '96px';
    av.style.borderRadius = '12px';
  } else {
    av.style.backgroundImage = '';
    av.style.width  = '72px';
    av.style.height = '72px';
    av.style.borderRadius = '50%';
    av.textContent = char.initial;
    av.style.color = char.color;
    av.style.background = `linear-gradient(135deg,${char.color}33,${char.color}11)`;
    av.style.border = `2px solid ${char.color}66`;
    av.style.boxShadow = `0 0 24px ${char.color}44`;
  }

  document.getElementById('sheet-char-name').textContent  = char.name;
  document.getElementById('sheet-char-name').style.textShadow = `0 0 20px ${char.color}66`;
  document.getElementById('sheet-char-trait').textContent = char.trait;
  document.getElementById('sheet-char-trait').style.color = char.color;

  const mood = document.getElementById('sheet-char-mood');
  mood.textContent      = `⬤ ${char.mood}`;
  mood.style.color      = char.color;
  mood.style.background = char.color + '22';
  mood.style.border     = `1px solid ${char.color}44`;

  const idLine = document.getElementById('sheet-identity-line');
  if (idLine) {
    idLine.textContent   = char.identityLine;
    idLine.style.color   = char.color + 'cc';
    idLine.style.display = char.identityLine ? 'block' : 'none';
  }
  const vibeEl = document.getElementById('sheet-vibe');
  if (vibeEl) {
    vibeEl.textContent   = char.vibe ? `"${char.vibe}"` : '';
    vibeEl.style.display = char.vibe ? 'block' : 'none';
  }

  // Build traits — use custom stats if available, fall back to S.H.E.S
  const rawStats = print.stats || {};
  const statEntries = Object.entries(rawStats).slice(0, 4);
  const displayTraits = statEntries.length > 0
    ? statEntries.map(([k, v]) => ({
        label: k.replace(/_/g, ' '),
        val: v.value || v || 50
      }))
    : [
        { label: 'Signal',      val: 50 },
        { label: 'History',     val: 50 },
        { label: 'Exploration', val: 50 },
        { label: 'Style',       val: 50 },
      ];

  document.getElementById('trait-list').innerHTML = displayTraits.map(t => `
    <div class="trait-row">
      <div class="trait-header">
        <span class="trait-label-text">${t.label}</span>
        <span class="trait-val" style="color:${char.color}">${t.val}</span>
      </div>
      <div class="trait-bar-bg">
        <div class="trait-bar-fill"
          style="width:${t.val}%;background:linear-gradient(90deg,${char.color},${char.color}88);
                 box-shadow:0 0 8px ${char.color}88"></div>
      </div>
    </div>
  `).join('');

  document.getElementById('arc-text').value = char.arc;
  document.getElementById('user-sheet-card').style.display = 'none';

  const talkBtn = document.getElementById('talk-to-btn');
  if (talkBtn) {
    talkBtn.style.display    = 'block';
    talkBtn.textContent      = `talk to ${char.name}`;
    talkBtn.style.background = `linear-gradient(135deg,${char.color}33,${char.color}11)`;
    talkBtn.style.border     = `1px solid ${char.color}88`;
    talkBtn.style.color      = char.color;
    talkBtn.onclick          = () => _setPersonaAndChat(char);
  }

  const btn = document.getElementById('save-summarize-btn');
  btn.style.background = `linear-gradient(135deg,${char.color}22,${char.color}11)`;
  btn.style.border     = `1px solid ${char.color}66`;
  btn.style.color      = char.color;

  // Show edit/delete action row for user-made prints
  var _printActionRow = document.getElementById('print-action-row');
  if (_printActionRow) {
    _printActionRow.style.display = 'flex';
    _printActionRow.style.gap = '8px';
    _printActionRow.style.marginBottom = '8px';
    _printActionRow.innerHTML = '';
    var _editBtn = document.createElement('button');
    _editBtn.textContent = 'edit in forge';
    _editBtn.style.cssText = 'flex:1;padding:10px;background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--subtext);font-family:var(--font-ui);font-size:0.72rem;cursor:pointer;letter-spacing:0.06em;transition:all 0.2s';
    _editBtn.onclick = function() { window.editPrint(print.id); };
    var _delBtn = document.createElement('button');
    _delBtn.textContent = 'delete';
    _delBtn.style.cssText = 'flex:1;padding:10px;background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--subtext);font-family:var(--font-ui);font-size:0.72rem;cursor:pointer;letter-spacing:0.06em;transition:all 0.2s';
    var _printName = (print.identity && print.identity.name) ? print.identity.name : 'this card';
    _delBtn.onclick = function() { window.deletePrint(print.id, _printName); };
    _printActionRow.appendChild(_editBtn);
    _printActionRow.appendChild(_delBtn);
  }

  // Hide You-only buttons AND You card meta when viewing a print card
  const _cardMetaEl = document.getElementById('you-card-meta');
  if (_cardMetaEl) _cardMetaEl.style.display = 'none';
  const _makeYouBtn = document.getElementById('make-you-card-btn');
  if (_makeYouBtn) _makeYouBtn.style.display = 'none';
  const _imagineYouBtn = document.getElementById('you-imagine-btn');
  if (_imagineYouBtn) _imagineYouBtn.style.display = 'none';

  // Show/create a print-specific card maker button
  let _makePrintBtn = document.getElementById('make-print-card-btn');
  if (!_makePrintBtn) {
    _makePrintBtn = document.createElement('button');
    _makePrintBtn.id = 'make-print-card-btn';
    _makePrintBtn.style.cssText = [
      'width:100%','padding:11px','margin-top:6px',
      'background:linear-gradient(135deg,var(--teal),var(--purple))',
      'border:none','border-radius:10px','color:#fff',
      'font-family:var(--font-display)','font-weight:700',
      'font-size:0.82rem','cursor:pointer','letter-spacing:0.04em',
    ].join(';');
    // Insert after save-summarize-btn
    const _ssBtn = document.getElementById('save-summarize-btn');
    if (_ssBtn) _ssBtn.parentNode.insertBefore(_makePrintBtn, _ssBtn.nextSibling);
  }
  _makePrintBtn.style.display = 'block';
  _makePrintBtn.textContent = '\u2736 make my card';

  // ── EDIT IN FORGE BUTTON (you card only) ──
  const _ycEditBtn = document.createElement('button');
  _ycEditBtn.textContent = 'edit in forge';
  _ycEditBtn.style.cssText = 'width:100%;margin-top:8px;padding:11px;background:var(--surface2);border:1px solid var(--teal);border-radius:10px;color:var(--teal);font-family:var(--font-ui);font-size:0.78rem;cursor:pointer;letter-spacing:0.06em;transition:all 0.2s';
  _ycEditBtn.addEventListener('click', async () => {
    const { initForgeView } = await import('./views/forge.js');
    initForgeView();
    if (window.loadYouCardIntoForge) await window.loadYouCardIntoForge();
    if (window.switchView) window.switchView('forge');
  });
  // Insert after make my card button
  _makePrintBtn.parentNode.insertBefore(_ycEditBtn, _makePrintBtn.nextSibling);
  _makePrintBtn.onclick = () => window.makePrintCard(print);
}

// -- MAKE PRINT CARD -----------------------------------------
window.makePrintCard = async function(print) {
  var card = await import('./card.js');
  var renderCard = card.renderCard;
  var generateCardId = card.generateCardId;
  var calcRarity = card.calcRarity;
  if (!print) return;
  if (!print.card_id) print.card_id = generateCardId('companion');
  if (!print.display) print.display = {
    accent_color: (print.metadata && print.metadata.color) || '#00F6D6',
    rarity: calcRarity(print.lifecycle || {}),
  };
  var artImage = null;
  if (typeof print.portrait_base64 === 'string' && print.portrait_base64.startsWith('data:')) {
    artImage = print.portrait_base64;
  } else if (window.opfsRead) {
    try {
      var opfsKey = 'prints/' + (print.id || print.card_id) + '_portrait.png';
      var opfsData = await window.opfsRead(opfsKey);
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
  dlBtn.textContent = '↓ download png';
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
  var canvas = await renderCard(print, artImage);
  canvas.style.cssText = 'width:100%;border-radius:10px;display:block;box-shadow:0 0 40px rgba(0,246,214,0.3)';
  window._youCardCanvas = canvas;
  wrap.innerHTML = '';
  wrap.appendChild(canvas);
};


// -- BUILD YOU CONTEXT ---------------------------------------
export function buildYouContext() {
  var you = CHARACTERS.you;
  if (!you) return '';
  var parts = [];
  if (you.handle)   parts.push("The user's name is " + you.handle + ".");
  if (you.pronouns) parts.push("Pronouns: " + you.pronouns + ".");
  if (you.vibe)     parts.push("Their vibe: " + you.vibe + ".");
  if (you.location) parts.push("They are based in: " + you.location + ".");
  if (you.arc)      parts.push("What they are going through: " + you.arc);
  if (you.project)  parts.push("Currently working on: " + you.project + ".");
  if (you.song)     parts.push("Theme song: " + you.song + ".");
  if (you.pets)     parts.push("Pets: " + you.pets + ".");
  if (you.food)     parts.push("Fav food/drink: " + you.food + ".");
  if (you.comfort)  parts.push("Comfort show/game: " + you.comfort + ".");
  if (you.hates)    parts.push("Things they dislike: " + you.hates + ".");
  if (you.workTags && you.workTags.length) parts.push("How they work: " + you.workTags.join(', ') + ".");
  if (you.hair)       parts.push("Their hair: " + you.hair + ".");
  if (you.eyes)       parts.push("Their eyes: " + you.eyes + ".");
  if (you.build)      parts.push("Height/build: " + you.build + ".");
  if (you.style)      parts.push("Their style: " + you.style + ".");
  if (you.marks)      parts.push("Distinguishing features: " + you.marks + ".");
  if (you.wearing)    parts.push("Usually wearing: " + you.wearing + ".");
  if (you.hobbies)    parts.push("Hobbies: " + you.hobbies + ".");
  if (you.obsession)  parts.push("Currently obsessed with: " + you.obsession + ".");
  if (you.job)        parts.push("Job/role: " + you.job + ".");
  if (you.medium)     parts.push("Creative medium: " + you.medium + ".");
  if (you.people)     parts.push("People who matter: " + you.people + ".");
  if (you.wins)       parts.push("Recent wins: " + you.wins + ".");
  if (you.stuck)      parts.push("Currently stuck on: " + you.stuck + ".");
  if (you.influences) parts.push("Influences: " + you.influences + ".");
  if (you.freetext)   parts.push(you.freetext);
  if (!parts.length) return '';
  return "About the person you are talking to:\n" + parts.join(' ') + "\n\n";
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
  if (!confirm('Delete "' + name + '" from your Codex?\n\nThis cannot be undone.')) return;
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
    dlBtn2.textContent = '↓ download png';
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

// -- SET PERSONA AND SWITCH TO CHAT
function _setPersonaAndChat(char) {
  import("./state.js").then(function(m) {
    m.state.botName        = char.name        || "companion";
    m.state.botPersonality = char.personality || char.firstWords || "";
    m.state.botGreeting    = char.firstWords  || "Hey. I am here.";
    m.state.botColor       = char.color       || "#00F6D6";
  });
  import("./ui.js").then(function(m) { m.switchView("chat"); });
}
