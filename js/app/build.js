// ============================================================
// SPIRALSIDE — FORGE v1.0
// Soul print builder — sectioned form, saves to IDB
// Keeps existing chat persona logic from v1.0
// Nimbis anchor: js/app/build.js
// ============================================================

import { state, SPEAKER_COLORS }      from './state.js';
import { dbSet, dbGet }               from './db.js';
import { addMessage, getChatMsgs }    from './chat.js';
import { updateGreeting, switchView } from './ui.js';

// ── SECTION TOGGLE ────────────────────────────────────────────
// Collapses/expands a forge section by id
function toggleSection(id) {
  const body = document.getElementById(`forge-body-${id}`);
  const icon = document.getElementById(`forge-icon-${id}`);
  if (!body) return;
  const open = body.style.display !== 'none';
  body.style.display = open ? 'none' : 'block';
  if (icon) icon.textContent = open ? '▸' : '▾';
}
window.toggleForgeSection = toggleSection;

// ── INIT ──────────────────────────────────────────────────────
export function initBuild() {
  // If opened from Codex edit button — load that print
  if (state.activePrintId) {
    loadPrintIntoForm();
  }

  // Wire tone chips
  document.querySelectorAll('.tone-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      const t = chip.dataset.tone;
      state.botTone = chip.classList.contains('selected')
        ? [...state.botTone, t]
        : state.botTone.filter(x => x !== t);
    });
  });

  // Wire stat add button
  const addStatBtn = document.getElementById('forge-add-stat');
  if (addStatBtn) addStatBtn.addEventListener('click', addStatRow);

  // Wire save button
  const saveBtn = document.getElementById('save-bot-btn');
  if (saveBtn) saveBtn.addEventListener('click', handleSave);

  // Load saved print into form
  loadPrintIntoForm();
}

// ── ADD STAT ROW ──────────────────────────────────────────────
let statCount = 0;
function addStatRow(label = '', value = 50) {
  const list = document.getElementById('forge-stat-list');
  if (!list) return;
  if (statCount >= 10) return; // max 10 stats
  statCount++;
  const id = `stat-${statCount}`;
  const row = document.createElement('div');
  row.className = 'forge-stat-row';
  row.id = `forge-stat-row-${statCount}`;
  row.innerHTML = `
    <input class="forge-input forge-stat-label" placeholder="stat name"
      id="${id}-label" value="${label}" style="width:38%;margin-right:8px" />
    <input type="range" min="0" max="100" value="${value}"
      id="${id}-val" style="flex:1;accent-color:var(--teal)"
      oninput="document.getElementById('${id}-display').textContent=this.value" />
    <span id="${id}-display" style="width:28px;text-align:right;
      font-size:0.75rem;color:var(--teal);margin-left:8px">${value}</span>
    <button onclick="removeStatRow(${statCount})" style="
      background:none;border:none;color:var(--subtext);cursor:pointer;
      margin-left:8px;font-size:0.9rem;line-height:1">✕</button>
  `;
  list.appendChild(row);
}
window.removeStatRow = function(n) {
  document.getElementById(`forge-stat-row-${n}`)?.remove();
  statCount = Math.max(0, statCount - 1);
};

// ── READ STATS FROM DOM ───────────────────────────────────────
function readStats() {
  const stats = {};
  for (let i = 1; i <= 10; i++) {
    const label = document.getElementById(`stat-${i}-label`)?.value?.trim();
    const val   = document.getElementById(`stat-${i}-val`)?.value;
    if (label) stats[label.toLowerCase().replace(/\s+/g, '_')] = {
      value: parseInt(val || 50), max: 100, description: ''
    };
  }
  return stats;
}

// ── READ FORM → SOUL PRINT JSON ───────────────────────────────
function readPrint() {
  const g = id => document.getElementById(id)?.value?.trim() || '';
  return {
    schema_version: 'spiralside_print_v1',
    card_id: state.activePrintId || `print_${Date.now()}`,
    template_type: 'companion',
    identity: {
      name:          g('bot-name'),
      title:         g('forge-title'),
      identity_line: g('forge-identity-line'),
      personality:   g('bot-personality'),
      first_words:   g('bot-greeting'),
      tone_tags:     [...state.botTone],
      vibe:          g('forge-vibe'),
      pronouns:      g('forge-pronouns'),
      species:       g('forge-species'),
      age:           g('forge-age'),
      origin:        g('forge-origin'),
      alignment:     g('forge-alignment'),
      occupation:    g('forge-occupation'),
    },
    personality: {
      temperament: g('forge-temperament'),
      strengths:   g('forge-strengths'),
      weaknesses:  g('forge-weaknesses'),
      fears:       g('forge-fears'),
      motivations: g('forge-motivations'),
    },
    story: {
      backstory:    g('forge-backstory'),
      current_arc:  g('forge-arc'),
      affiliations: g('forge-affiliations'),
      theme_song:   g('forge-theme-song'),
    },
    stats:  readStats(),
    flavor: {
      catchphrase:    g('forge-catchphrase'),
      motto:          g('forge-motto'),
      hobbies:        g('forge-hobbies'),
    },
    custom_fields: [],
    blocks: [],
    metadata: {
      owner_id:     state.user?.id || 'local',
      visibility:   'private',
      is_archetype: false,
      echo_of:      null,
      created_at:   state.activePrintCreated || new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    }
  };
}

// ── SAVE ──────────────────────────────────────────────────────
async function handleSave() {
  const print = readPrint();

  // Keep state in sync for chat persona
  state.botName        = print.identity.name        || 'companion';
  state.botPersonality = print.identity.personality || '';
  state.botGreeting    = print.identity.first_words  || "Hey. I'm here.";
  state.botColor       = SPEAKER_COLORS[state.botName.toLowerCase()] || '#00F6D6';
  state.activePrintId  = print.card_id;

  // Save full soul print to IDB
  await dbSet('prints', { id: print.card_id, ...print });

  // Also save legacy config key so existing chat logic still works
  await dbSet('config', {
    key:         'bot',
    name:        state.botName,
    personality: state.botPersonality,
    greeting:    state.botGreeting,
    tone:        state.botTone,
    color:       state.botColor,
  });

  // Enforce 16 print cap + no duplicates
  const { dbGetAll, dbDelete } = await import('./db.js');
  const allPrints = await dbGetAll('prints').catch(() => []);
  // Only overwrite if we're explicitly editing (activePrintId set from edit button)
  // Never overwrite by name match — each save is its own print unless editing
  if (allPrints.length >= 16 && !state.activePrintId) {
    alert('Codex is full — 16 prints max. Remove one before adding another.');
    return;
  }

  // Clear activePrintId so next save creates a new print not overwrite
  state.activePrintId = null;

  // Button feedback
  const btn = document.getElementById('save-bot-btn');
  const orig = btn.textContent;
  btn.textContent = '✓ saved';
  setTimeout(() => { btn.textContent = orig; }, 1800);

  // Reset chat with new greeting
  const chatMsgs = getChatMsgs();
  if (chatMsgs) chatMsgs.innerHTML = '';
  addMessage(state.botGreeting, 'bot', state.botName, state.botColor);
  updateGreeting();

  // Refresh codex chip row so new print appears immediately
  import('./sheet.js').then(({ buildCharSelector }) => buildCharSelector());

  switchView('chat');
}

// ── LOAD SAVED PRINT INTO FORM ────────────────────────────────
export async function loadBotIntoForm() { await loadPrintIntoForm(); }

async function loadPrintIntoForm() {
  // Try loading from legacy config first
  const s = id => {
    const el = document.getElementById(id);
    return (val) => { if (el) el.value = val; };
  };

  s('bot-name')(state.botName);
  s('bot-personality')(state.botPersonality);
  s('bot-greeting')(state.botGreeting);

  // Re-select saved tone chips
  state.botTone.forEach(t => {
    document.querySelector(`[data-tone="${t}"]`)?.classList.add('selected');
  });

  // Load full print from IDB if exists
  if (state.activePrintId) {
    const print = await dbGet('prints', state.activePrintId);
    if (!print) return;
    const id = print.identity || {};
    const p  = print.personality || {};
    const st = print.story || {};
    const fl = print.flavor || {};

    s('forge-title')(id.title || '');
    s('forge-identity-line')(id.identity_line || '');
    s('forge-vibe')(id.vibe || '');
    s('forge-pronouns')(id.pronouns || '');
    s('forge-species')(id.species || '');
    s('forge-age')(id.age || '');
    s('forge-origin')(id.origin || '');
    s('forge-alignment')(id.alignment || '');
    s('forge-occupation')(id.occupation || '');
    s('forge-temperament')(p.temperament || '');
    s('forge-strengths')(p.strengths || '');
    s('forge-weaknesses')(p.weaknesses || '');
    s('forge-fears')(p.fears || '');
    s('forge-motivations')(p.motivations || '');
    s('forge-backstory')(st.backstory || '');
    s('forge-arc')(st.current_arc || '');
    s('forge-affiliations')(st.affiliations || '');
    s('forge-theme-song')(st.theme_song || '');
    s('forge-catchphrase')(fl.catchphrase || '');
    s('forge-motto')(fl.motto || '');
    s('forge-hobbies')(fl.hobbies || '');

    // Reload stats
    if (print.stats) {
      statCount = 0;
      document.getElementById('forge-stat-list').innerHTML = '';
      Object.entries(print.stats).forEach(([key, stat]) => {
        addStatRow(key.replace(/_/g, ' '), stat.value);
      });
    }
  }
}
