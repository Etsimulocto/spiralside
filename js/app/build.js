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

// ── CLEAR FORGE FORM ─────────────────────────────────────────
// Resets all fields to empty/placeholder state
function clearForgeForm() {
  const fields = [
    'bot-name','forge-title','forge-identity-line','forge-vibe',
    'bot-greeting','forge-pronouns','forge-species','forge-age',
    'forge-alignment','forge-origin','forge-occupation',
    'bot-personality','forge-temperament','forge-strengths',
    'forge-weaknesses','forge-fears','forge-motivations',
    'forge-backstory','forge-arc','forge-affiliations',
    'forge-theme-song','forge-catchphrase','forge-motto','forge-hobbies'
  ];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  // Clear tone chips
  document.querySelectorAll('.tone-chip').forEach(c => c.classList.remove('selected'));
  state.botTone = [];
  // Clear stats
  const statList = document.getElementById('forge-stat-list');
  if (statList) statList.innerHTML = '';
}
export { clearForgeForm };

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
  // Register onForgeOpen — called every time forge tab is opened
  window.onForgeOpen = () => {
    if (state.activePrintId) {
      loadPrintIntoForm();
    } else {
      clearForgeForm();
    }
  };

  // If editing an existing print — load it. Otherwise clear the form.
  if (state.activePrintId) {
    loadPrintIntoForm();
  } else {
    clearForgeForm();
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

  // Wire create card button
  const cardBtn = document.getElementById('create-card-btn');
  if (cardBtn) cardBtn.addEventListener('click', handleCreateCard);

  // Wire download button
  const dlBtn = document.getElementById('forge-download-card-btn');
  if (dlBtn) dlBtn.addEventListener('click', handleDownloadCard);

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

// ── CREATE CARD ───────────────────────────────────────────────
// Generates card visual from current form data + shows preview
let _lastCardPrint = null;

async function handleCreateCard() {
  const { generateCardId, renderCard, calcRarity } = await import('./card.js');

  // Read current form into a print object
  const print = readPrint();

  // Generate card ID if not set
  if (!print.card_id || print.card_id.startsWith('print_')) {
    print.card_id = generateCardId('companion');
  }

  // Set version
  print.version = print.version || 'v1';

  // Set display block for rarity/accent
  print.display = {
    accent_color: state.botColor || '#00F6D6',
    rarity:       calcRarity(print.lifecycle || {}),
  };

  _lastCardPrint = print;

  // Show preview
  const wrap = document.getElementById('forge-card-canvas-wrap');
  const preview = document.getElementById('forge-card-preview');
  if (!wrap || !preview) return;

  preview.style.display = 'block';
  wrap.innerHTML = '<div style="color:var(--subtext);font-size:0.75rem;padding:20px">rendering...</div>';

  // Check if there's an art image in vault/imagine
  let artImage = null;
  const imgEl = document.querySelector('#library-last-image');
  if (imgEl) artImage = imgEl;

  const canvas = await renderCard(print, artImage);
  canvas.style.cssText = 'width:100%;max-width:360px;border-radius:8px;display:block;margin:0 auto;box-shadow:0 0 32px rgba(0,246,214,0.2)';
  wrap.innerHTML = '';
  wrap.appendChild(canvas);

  // Scroll to preview
  preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Update button
  const btn = document.getElementById('create-card-btn');
  if (btn) {
    btn.textContent = '✓ card rendered — download below';
    setTimeout(() => { btn.textContent = '✦ create card'; }, 3000);
  }
}

async function handleDownloadCard() {
  if (!_lastCardPrint) {
    alert('Create a card first!');
    return;
  }
  const { downloadCard } = await import('./card.js');
  await downloadCard(_lastCardPrint);
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

  // Clear activePrintId and reset form for next new print
  state.activePrintId = null;
  clearForgeForm();

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
