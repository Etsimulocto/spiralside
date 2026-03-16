// ============================================================
// SPIRALSIDE — SHEET v1.0
// Character sheet: selector chips, card render, save+summarize
// Reads CHARACTERS from state, persists to IndexedDB
// Nimbis anchor: js/app/sheet.js
// ============================================================

import { state, CHARACTERS, RAIL } from './state.js';
import { dbSet }                    from './db.js';
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

  // "+" chip for adding custom characters (future feature)
  const addChip       = document.createElement('div');
  addChip.className   = 'char-add-chip';
  addChip.textContent = '+ new';
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
  av.textContent   = char.initial;
  av.style.color   = char.color;
  av.style.background = `linear-gradient(135deg,${char.color}33,${char.color}11)`;
  av.style.border  = `2px solid ${char.color}66`;
  av.style.boxShadow = `0 0 24px ${char.color}44`;

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
    idLine.textContent = char.identityLine || '';
    idLine.style.color = char.color + 'cc';
    idLine.style.display = char.identityLine ? 'block' : 'none';
  }
  const vibeEl = document.getElementById('sheet-vibe');
  if (vibeEl) {
    vibeEl.textContent = char.vibe ? `"${char.vibe}"` : '';
    vibeEl.style.display = char.vibe ? 'block' : 'none';
  }

  // ── talk-to button — sets persona and switches to chat ──
  const talkBtn = document.getElementById('talk-to-btn');
  if (talkBtn && !char.isUser) {
    talkBtn.style.display     = 'block';
    talkBtn.textContent       = `talk to ${char.name}`;
    talkBtn.style.background  = `linear-gradient(135deg,${char.color}33,${char.color}11)`;
    talkBtn.style.border      = `1px solid ${char.color}88`;
    talkBtn.style.color       = char.color;
    talkBtn.style.boxShadow   = `0 0 20px ${char.color}22`;
    // Wire click — sets active persona and navigates to chat
    talkBtn.onclick = () => _setPersonaAndChat(char);
  } else if (talkBtn) {
    talkBtn.style.display = 'none'; // hide for user's own sheet
  }

  const vibeEl = document.getElementById('sheet-vibe');
  if (vibeEl) {
    vibeEl.textContent = char.vibe ? `"${char.vibe}"` : '';
    vibeEl.style.display = char.vibe ? 'block' : 'none';
  }

  // ── talk-to button — sets persona and switches to chat ──
  const talkBtn = document.getElementById('talk-to-btn');
  if (talkBtn && !char.isUser) {
    talkBtn.style.display     = 'block';
    talkBtn.textContent       = `talk to ${char.name}`;
    talkBtn.style.background  = `linear-gradient(135deg,${char.color}33,${char.color}11)`;
    talkBtn.style.border      = `1px solid ${char.color}88`;
    talkBtn.style.color       = char.color;
    talkBtn.style.boxShadow   = `0 0 20px ${char.color}22`;
    // Wire click — sets active persona and navigates to chat
    talkBtn.onclick = () => _setPersonaAndChat(char);
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
    document.getElementById('user-handle').value = char.handle || '';
    document.getElementById('user-vibe').value   = char.vibe   || '';
    document.getElementById('user-arc').value    = char.arc    || '';
    document.getElementById('user-song').value   = char.song   || '';
  }

  // Save+summarize button color
  const btn = document.getElementById('save-summarize-btn');
  btn.style.background = `linear-gradient(135deg,${char.color}22,${char.color}11)`;
  btn.style.border     = `1px solid ${char.color}66`;
  btn.style.color      = char.color;
  btn.style.boxShadow  = `0 0 20px ${char.color}22`;
}

// ── SAVE + SUMMARIZE ──────────────────────────────────────────
// Saves sheet to IndexedDB, then optionally calls AI to extract
// traits from the current chat thread and merges them back
export async function saveSummarize() {
  const id   = state.activeChar;
  const char = CHARACTERS[id];
  if (!char) return;

  // Read arc text from whichever field is active
  char.arc = document.getElementById('arc-text').value;

  // If user's own sheet, also read extra profile fields
  if (char.isUser) {
    char.handle = document.getElementById('user-handle').value;
    char.vibe   = document.getElementById('user-vibe').value;
    char.arc    = document.getElementById('user-arc').value;
    char.song   = document.getElementById('user-song').value;
  }

  // Persist to IndexedDB
  await dbSet('sheets', {
    id,
    arc:    char.arc,
    traits: char.traits,
    handle: char.handle,
    vibe:   char.vibe,
    song:   char.song,
  });

  // Button feedback
  const btn  = document.getElementById('save-summarize-btn');
  const orig = btn.textContent;
  btn.textContent = '✓ saved to device';
  setTimeout(() => { btn.textContent = orig; }, 2000);

  // Only call AI summarize if there's a real thread to summarize
  const chatMsgs = getChatMsgs();
  const messages = chatMsgs?.querySelectorAll('.msg');
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
    // User-specific fields
    if (id === 'you') {
      if (saved.handle) CHARACTERS.you.handle = saved.handle;
      if (saved.vibe)   CHARACTERS.you.vibe   = saved.vibe;
      if (saved.song)   CHARACTERS.you.song   = saved.song;
    }
  }
}

// ── PRIVATE: SET PERSONA AND SWITCH TO CHAT ──────────────────
// Sets state.botName/botPersonality/botGreeting/botColor
// then navigates to chat — same effect as build.js handleSave
// but triggered from a card tap, no form needed
function _setPersonaAndChat(char) {
  // Lazy import to avoid circular deps — ui.js and chat.js
  import('./ui.js').then(({ switchView }) => {
    import('./chat.js').then(({ addMessage, getChatMsgs }) => {
      import('./state.js').then(({ state }) => {
        // Set active persona in state
        state.botName        = char.name;
        state.botPersonality = '';   // archetype — personality lives in HF .txt
        state.botGreeting    = char.firstWords || `Hey. I'm here.`;
        state.botColor       = char.color;

        // Reset chat with new greeting
        const chatMsgs = getChatMsgs();
        if (chatMsgs) chatMsgs.innerHTML = '';
        addMessage(state.botGreeting, 'bot', char.name, char.color);

        // Navigate to chat
        switchView('chat');
      });
    });
  });
}

// ── PRIVATE: SET PERSONA AND SWITCH TO CHAT ──────────────────
// Sets state.botName/botPersonality/botGreeting/botColor
// then navigates to chat — same effect as build.js handleSave
// but triggered from a card tap, no form needed
function _setPersonaAndChat(char) {
  // Lazy import to avoid circular deps — ui.js and chat.js
  import('./ui.js').then(({ switchView }) => {
    import('./chat.js').then(({ addMessage, getChatMsgs }) => {
      import('./state.js').then(({ state }) => {
        // Set active persona in state
        state.botName        = char.name;
        state.botPersonality = '';   // archetype — personality lives in HF .txt
        state.botGreeting    = char.firstWords || `Hey. I'm here.`;
        state.botColor       = char.color;

        // Reset chat with new greeting
        const chatMsgs = getChatMsgs();
        if (chatMsgs) chatMsgs.innerHTML = '';
        addMessage(state.botGreeting, 'bot', char.name, char.color);

        // Navigate to chat
        switchView('chat');
      });
    });
  });
}

// ── PRIVATE: STYLE CHIP ───────────────────────────────────────
function _styleChip(chip, id, active) {
  const c = CHARACTERS[id].color;
  chip.classList.toggle('active', active);
  chip.style.color       = active ? c            : 'var(--subtext)';
  chip.style.borderColor = active ? c + '88'     : 'var(--border)';
  chip.style.boxShadow   = active ? `0 0 16px ${c}44` : 'none';
  chip.style.background  = active ? c + '11'     : 'var(--surface2)';
}

