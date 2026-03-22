// ============================================================
// SPIRALSIDE — SHEET v1.1
// Character sheet: selector chips, card render, save+summarize
// Reads CHARACTERS from state, persists to IndexedDB
// Adds: identity line, vibe, talk-to button from soul prints
// Nimbis anchor: js/app/sheet.js
// ============================================================

import { state, CHARACTERS, RAIL } from './state.js';
import { dbSet, dbGetAll }          from './db.js';
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
      if (print.portrait_base64) {
        chip.style.backgroundImage    = `url(${print.portrait_base64})`;
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
  if (talkBtn && !char.isUser) {
    talkBtn.style.display    = 'block';
    talkBtn.textContent      = `talk to ${char.name}`;
    talkBtn.style.background = `linear-gradient(135deg,${char.color}33,${char.color}11)`;
    talkBtn.style.border     = `1px solid ${char.color}88`;
    talkBtn.style.color      = char.color;
    talkBtn.style.boxShadow  = `0 0 20px ${char.color}22`;
    talkBtn.onclick          = () => _setPersonaAndChat(char);
  } else if (talkBtn) {
    talkBtn.style.display = 'none'; // hide for user's own sheet
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
    document.getElementById('user-hates').value    = char.hates    || '';
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
  }

  // Save+summarize button color
  const btn = document.getElementById('save-summarize-btn');
  btn.style.background = `linear-gradient(135deg,${char.color}22,${char.color}11)`;
  btn.style.border     = `1px solid ${char.color}66`;
  btn.style.color      = char.color;
  btn.style.boxShadow  = `0 0 20px ${char.color}22`;

  // Hide edit/delete — archetypes are not editable
  const actionRow = document.getElementById('print-action-row');
  if (actionRow) actionRow.style.display = 'none';
}

// ── SAVE + SUMMARIZE ──────────────────────────────────────────
// Saves sheet to IndexedDB, then optionally calls AI to extract
// traits from the current chat thread and merges them back
export async function saveSummarize() {
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
    char.hates    = document.getElementById('user-hates').value;
    char.freetext = document.getElementById('user-freetext').value;
    char.workTags = Array.from(document.querySelectorAll('#you-work-tags .you-tag.on')).map(t => t.dataset.tag);
  }

  // Persist to IndexedDB
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
    hates:           char.hates     || null,
    freetext:        char.freetext  || null,
    workTags:        char.workTags  || [],
    portrait_base64: char.portrait_base64 || null,
    card_id:         char.card_id      || null,
    card_version:    char.card_version || 1,
    level:           char.level        || 1,
  });

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
    const thread = Array.from(messages).map(m => {
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
      await dbSet('sheets', { id, arc: char.arc, traits: char.traits });

      // Re-render with new data
      renderActiveChar(id);
    }
  } catch(e) {
    console.warn('saveSummarize AI step:', e);
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
      if (saved.hates)    CHARACTERS.you.hates    = saved.hates;
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

  // ── edit + delete buttons — only for user prints ──
  let actionRow = document.getElementById('print-action-row');
  if (!print || !print.id) {
    if (actionRow) actionRow.style.display = 'none';
    return;
  }
  if (actionRow) actionRow.style.display = 'flex';
  if (!actionRow) {
    actionRow = document.createElement('div');
    actionRow.id = 'print-action-row';
    actionRow.style.cssText = 'display:flex;gap:8px;margin-top:8px';
    btn.parentNode.insertBefore(actionRow, btn);
  }
  actionRow.innerHTML = `
    <button onclick="editPrint('${print.id}')" style="
      flex:1;padding:11px;background:var(--surface2);
      border:1px solid var(--border);border-radius:10px;
      color:var(--subtext);font-family:var(--font-ui);
      font-size:var(--font-size-base);cursor:pointer;letter-spacing:0.06em;
      transition:all 0.2s">✏ edit</button>
    <button onclick="deletePrint('${print.id}','${char.name}')" style="
      flex:1;padding:11px;background:var(--surface2);
      border:1px solid var(--border);border-radius:10px;
      color:var(--subtext);font-family:var(--font-ui);
      font-size:var(--font-size-base);cursor:pointer;letter-spacing:0.06em;
      transition:all 0.2s">🗑 delete</button>
  `;
}

// ── BUILD YOU CONTEXT ────────────────────────────────────────
// Serializes the You card into a compact system prompt prefix
// Called by chat.js to inject into every message's system prompt
export function buildYouContext() {
  const you = CHARACTERS.you;
  if (!you) return '';
  const parts = [];
  if (you.handle)   parts.push(`The user's name is ${you.handle}.`);
  if (you.pronouns) parts.push(`Pronouns: ${you.pronouns}.`);
  if (you.vibe)     parts.push(`Their vibe: ${you.vibe}.`);
  if (you.location) parts.push(`They're based around: ${you.location}.`);
  if (you.arc)      parts.push(`What they're going through right now: ${you.arc}`);
  if (you.project)  parts.push(`Currently working on: ${you.project}.`);
  if (you.song)     parts.push(`Theme song right now: ${you.song}.`);
  if (you.pets)     parts.push(`Pets: ${you.pets}.`);
  if (you.food)     parts.push(`Fav food/drink: ${you.food}.`);
  if (you.comfort)  parts.push(`Comfort show/game: ${you.comfort}.`);
  if (you.hates)    parts.push(`Things they dislike: ${you.hates}.`);
  if (you.workTags?.length) parts.push(`How they work: ${you.workTags.join(', ')}.`);
  if (you.freetext) parts.push(you.freetext);
  if (!parts.length) return '';
  return 'About the person you are talking to:\n' + parts.join(' ') + '\n\n';
}

// ── PRIVATE: SET PERSONA AND SWITCH TO CHAT ──────────────────
// Sets state.botName/botPersonality/botGreeting/botColor
// then navigates to chat — same effect as build.js handleSave
// but triggered from a card tap, no form needed
function _setPersonaAndChat(char) {
  import('./ui.js').then(({ switchView }) => {
    import('./chat.js').then(({ addMessage, getChatMsgs }) => {
      import('./state.js').then(({ state }) => {
        import('./db.js').then(({ dbSet }) => {
        state.botName        = char.name;
        state.botPersonality = '';
        state.botGreeting    = char.firstWords || "Hey. I'm here.";
        state.botColor       = char.color;

        const chatMsgs = getChatMsgs();
        if (chatMsgs) chatMsgs.innerHTML = '';
        addMessage(state.botGreeting, 'bot', char.name, char.color);
        dbSet('config',{key:'bot',name:char.name,personality:'',greeting:state.botGreeting,tone:[],color:char.color});
          switchView('chat');
        });
      });
    });
  });
}

// ── GLOBAL: EDIT PRINT ───────────────────────────────────────
// Loads print into Forge for editing
window.editPrint = function(printId) {
  import('./state.js').then(({ state }) => {
    state.activePrintId = printId;
    import('./ui.js').then(({ switchView }) => switchView('forge'));
  });
};

// ── GLOBAL: DELETE PRINT ──────────────────────────────────────
// Confirms then removes print from IDB and rebuilds chip row
window.deletePrint = function(printId, name) {
  if (!confirm(`Delete "${name}" from your Codex?

This cannot be undone.`)) return;
  import('./db.js').then(({ dbDelete }) => {
    dbDelete('prints', printId).then(() => {
      buildCharSelector();
      // show sky by default after delete
      renderActiveChar('sky');
    });
  });
};

// ── MAKE YOU CARD ─────────────────────────────────────────────
// Builds a soul print from You card fields and renders it as a card
window.makeYouCard = async function() {
  const { renderCard, generateCardId, calcRarity } = await import('./card.js');
  const you = (await import('./state.js')).CHARACTERS.you;
  if (!you) return;

  // Build a soul print from You card data
  const print = {
    card_id:         you.card_id || generateCardId('character'),
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
      curiosity:   { value: you.traits?.[0]?.val || 50, max: 100 },
      creativity:  { value: you.traits?.[1]?.val || 50, max: 100 },
      chaos_level: { value: you.traits?.[2]?.val || 50, max: 100 },
      trust:       { value: you.traits?.[3]?.val || 50, max: 100 },
    },
    metadata: {
      owner_id:     'you',
      creator_name: you.handle || 'you',
      is_archetype: false,
    },
    display: {
      accent_color: '#7B5FFF',
      rarity:       calcRarity({}),
    },
    lifecycle: {},
  };

  // Build overlay
  let overlay = document.getElementById('you-card-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'you-card-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;';
    overlay.innerHTML = `
      <div id="you-card-wrap" style="width:100%;max-width:360px;padding:0 20px"></div>
      <div style="display:flex;gap:10px">
        <button onclick="downloadYouCard()" style="padding:11px 20px;background:linear-gradient(135deg,var(--purple),var(--teal));border:none;border-radius:10px;color:#fff;font-family:var(--font-ui);font-size:0.78rem;cursor:pointer;letter-spacing:0.06em">↓ download png</button>
        <button onclick="document.getElementById('you-card-overlay').remove()" style="padding:11px 20px;background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--subtext);font-family:var(--font-ui);font-size:0.78rem;cursor:pointer">close</button>
      </div>
    `;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  const wrap = document.getElementById('you-card-wrap');
  wrap.innerHTML = '<div style="color:var(--subtext);font-size:0.75rem;padding:20px;text-align:center">rendering...</div>';
  overlay.style.display = 'flex';

  const canvas = await renderCard(print, print.portrait_base64 || null);
  canvas.style.cssText = 'width:100%;border-radius:10px;display:block;box-shadow:0 0 40px rgba(123,95,255,0.3)';
  window._youCardCanvas = canvas;
  wrap.innerHTML = '';
  wrap.appendChild(canvas);
};

window.downloadYouCard = function() {
  if (!window._youCardCanvas) return;
  const you = window.CHARACTERS?.you;
  const id  = you?.card_id || 'you-card';
  const a   = document.createElement('a');
  a.download = id + '.png';
  a.href     = window._youCardCanvas.toDataURL('image/png');
  a.click();
};

// ── EXPORT CODEX ─────────────────────────────────────────────
// Downloads all user prints as a single codex.json file
export async function exportCodex() {
  const { dbGetAll } = await import('./db.js');
  const prints = await dbGetAll('prints').catch(() => []);
  if (!prints.length) { alert('No cards to export!'); return; }
  const data = {
    schema_version: 'spiralside_codex_v1',
    exported_at:    new Date().toISOString(),
    card_count:     prints.length,
    prints,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `spiralside-codex-${Date.now()}.json`;
  a.click();
}

// ── IMPORT CODEX ─────────────────────────────────────────────
// Uploads a codex.json and merges prints into IDB
export async function importCodex(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.prints?.length) { alert('No cards found in file.'); return; }
    const { dbSet } = await import('./db.js');
    let count = 0;
    for (const print of data.prints) {
      if (!print.id && print.card_id) print.id = print.card_id;
      if (!print.id) continue;
      await dbSet('prints', print);
      count++;
    }
    buildCharSelector();
    alert(`✓ Imported ${count} card${count !== 1 ? 's' : ''} into your Codex!`);
  } catch(e) {
    alert('Import failed — invalid file.');
    console.error(e);
  }
}

// ── PRIVATE: STYLE CHIP ───────────────────────────────────────
function _styleChip(chip, id, active) {
  const c = CHARACTERS[id].color;
  chip.classList.toggle('active', active);
  chip.style.color       = active ? c        : 'var(--subtext)';
  chip.style.borderColor = active ? c + '88' : 'var(--border)';
  chip.style.boxShadow   = active ? `0 0 16px ${c}44` : 'none';
  chip.style.background  = active ? c + '11' : 'var(--surface2)';
}
