// ============================================================
// SPIRALSIDE — BUILD v1.0
// Companion builder: tone chip selection, save, reset chat
// Nimbis anchor: js/app/build.js
// ============================================================

import { state, SPEAKER_COLORS }    from './state.js';
import { dbSet }                    from './db.js';
import { addMessage, getChatMsgs }  from './chat.js';
import { updateGreeting, switchView } from './ui.js';

// ── INIT ──────────────────────────────────────────────────────
export function initBuild() {
  // Wire tone chips — toggle selected state + update state.botTone
  document.querySelectorAll('.tone-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      const t = chip.dataset.tone;
      state.botTone = chip.classList.contains('selected')
        ? [...state.botTone, t]
        : state.botTone.filter(x => x !== t);
    });
  });

  // Save button
  document.getElementById('save-bot-btn').addEventListener('click', handleSave);
}

// ── SAVE COMPANION ────────────────────────────────────────────
async function handleSave() {
  state.botName        = document.getElementById('bot-name').value.trim()        || 'companion';
  state.botPersonality = document.getElementById('bot-personality').value.trim();
  state.botGreeting    = document.getElementById('bot-greeting').value.trim()    || "Hey. I'm here.";

  // Pick accent color from known speakers or default teal
  state.botColor = SPEAKER_COLORS[state.botName.toLowerCase()] || '#00F6D6';

  // Persist config to IndexedDB
  await dbSet('config', {
    key:         'bot',
    name:        state.botName,
    personality: state.botPersonality,
    greeting:    state.botGreeting,
    tone:        state.botTone,
    color:       state.botColor,
  });

  // Reset chat with new greeting
  const chatMsgs = getChatMsgs();
  if (chatMsgs) chatMsgs.innerHTML = '';
  addMessage(state.botGreeting, 'bot', state.botName, state.botColor);

  // Update header greeting message
  updateGreeting();

  // Switch back to chat view
  switchView('chat');
}

// ── LOAD SAVED BOT CONFIG INTO FORM ──────────────────────────
// Called after initDB in onAppReady
export function loadBotIntoForm() {
  document.getElementById('bot-name').value        = state.botName;
  document.getElementById('bot-personality').value = state.botPersonality;
  document.getElementById('bot-greeting').value    = state.botGreeting;

  // Re-select saved tone chips
  state.botTone.forEach(t => {
    document.querySelector(`[data-tone="${t}"]`)?.classList.add('selected');
  });
}

