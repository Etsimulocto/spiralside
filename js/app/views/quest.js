// ============================================================
// SPIRALSIDE — QUEST VIEW v1.0
// Idle DnD companion game seeded from calendar events
// Mii-style avatar + quest board + weekly calendar strip
// Nimbis anchor: js/app/views/quest.js
// ============================================================

let _initialized = false;

// ── STYLES ───────────────────────────────────────────────────
function injectQuestStyles() {
  if (document.getElementById('quest-styles')) return;
  const s = document.createElement('style');
  s.id = 'quest-styles';
  s.textContent = `
    /* ── QUEST VIEW ROOT ── */
    #view-quest {
      display: none; flex-direction: column; height: 100%;
      overflow-y: auto; overflow-x: hidden;
      background: var(--bg);
      padding: 0 0 calc(80px + var(--safe-bot,0px)) 0;
      -webkit-overflow-scrolling: touch;
    }
    #view-quest.active { display: flex; }

    /* ── HEADER STRIP ── */
    .quest-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px 10px;
      border-bottom: 1px solid var(--border);
    }
    .quest-title-row { display: flex; flex-direction: column; }
    .quest-view-label {
      font-size: 0.58rem; letter-spacing: 0.14em; text-transform: uppercase;
      color: var(--subtext); margin-bottom: 2px;
    }
    .quest-view-name {
      font-family: var(--font-display); font-weight: 700; font-size: 1rem;
      color: var(--text);
    }
    .quest-xp-wrap {
      display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
    }
    .quest-level {
      font-size: 0.6rem; letter-spacing: 0.1em; color: #FFD93D;
      text-transform: uppercase;
    }
    .quest-xp-bar-bg {
      width: 80px; height: 4px; background: var(--muted);
      border-radius: 2px; overflow: hidden;
    }
    .quest-xp-bar-fill {
      height: 100%; background: #FFD93D; border-radius: 2px;
      transition: width 0.6s ease;
    }
    .quest-xp-panel {
      display: flex; flex-direction: column; gap: 6px;
      padding: 10px 16px 12px; border-bottom: 1px solid var(--border);
      background: var(--surface);
    }
    .quest-xp-row { display: flex; align-items: center; justify-content: space-between; }
    .quest-xp-label { font-size: 0.6rem; letter-spacing: 0.1em; color: var(--subtext); text-transform: uppercase; }
    .quest-xp-nums  { font-size: 0.7rem; color: #FFD93D; letter-spacing: 0.06em; }
    .quest-xp-full  { height: 6px; background: var(--muted); border-radius: 3px; overflow: hidden; }
    .quest-xp-full-fill { height: 100%; background: linear-gradient(90deg,#FFD93D,#FF4BCB); border-radius: 3px; transition: width 0.6s ease; }
    .quest-xp-meta  { display: flex; gap: 12px; }
    .quest-xp-chip  { font-size: 0.58rem; color: var(--subtext); letter-spacing: 0.06em; }
    .quest-xp-chip span { color: #FFD93D; }

    /* ── MII PANEL ── */
    .quest-mii-panel {
      display: flex; align-items: center; gap: 14px;
      padding: 16px 16px 12px;
      border-bottom: 1px solid var(--border);
    }
    .mii-avatar-wrap {
      width: 64px; height: 64px; border-radius: 50%;
      background: var(--surface);
      border: 2px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; position: relative; overflow: visible;
    }
    /* Simple CSS mii face */
    .mii-svg { width: 46px; height: 46px; }
    .quest-mii-info { flex: 1; min-width: 0; }
    .quest-mii-name {
      font-family: var(--font-display); font-weight: 700; font-size: 0.95rem;
      color: var(--text); margin-bottom: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .quest-mii-arc {
      font-size: 0.62rem; color: var(--subtext); line-height: 1.5;
      margin-top: 4px; font-style: italic;
      display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
    }
    .quest-mii-class {
      font-size: 0.65rem; color: var(--subtext);
      letter-spacing: 0.06em; margin-bottom: 8px;
    }
    .quest-stat-row { display: flex; gap: 6px; flex-wrap: wrap; }
    .quest-stat {
      font-size: 0.6rem; padding: 3px 7px; border-radius: 20px;
      border: 1px solid var(--border); color: var(--subtext);
      letter-spacing: 0.06em; text-transform: uppercase;
    }
    .quest-stat.atk { border-color: rgba(255,75,75,0.4); color: #ff6b6b; }
    .quest-stat.def { border-color: rgba(77,163,255,0.4); color: #4DA3FF; }
    .quest-stat.wit { border-color: rgba(124,106,247,0.4); color: #7c6af7; }
    .quest-stat.luk { border-color: rgba(0,246,214,0.4);  color: #00F6D6; }

    /* ── SECTION LABEL ── */
    .quest-section-label {
      font-size: 0.58rem; letter-spacing: 0.14em; text-transform: uppercase;
      color: var(--subtext); padding: 12px 16px 6px;
      border-bottom: 1px solid var(--border);
    }

    /* ── QUEST CARDS ── */
    .quest-list { display: flex; flex-direction: column; }
    .quest-card {
      display: flex; gap: 12px; align-items: flex-start;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;
    }
    .quest-card:active { background: var(--surface); }
    .quest-card-icon {
      width: 42px; height: 42px; border-radius: 10px;
      background: var(--surface); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; flex-shrink: 0;
    }
    .quest-card-body { flex: 1; min-width: 0; }
    .quest-card-title {
      font-size: 0.82rem; font-weight: 600; color: var(--text);
      margin-bottom: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .quest-card-sub {
      font-size: 0.7rem; color: var(--subtext); line-height: 1.45;
      margin-bottom: 7px;
    }
    .quest-card-meta { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .quest-tag {
      font-size: 0.58rem; padding: 2px 8px; border-radius: 20px;
      letter-spacing: 0.06em; text-transform: uppercase;
    }
    .tag-active  { background: rgba(0,246,214,0.12); color: #00F6D6; border: 1px solid rgba(0,246,214,0.3); }
    .tag-idle    { background: var(--surface); color: var(--subtext); border: 1px solid var(--border); }
    .tag-locked  { background: rgba(255,211,61,0.1); color: #FFD93D; border: 1px solid rgba(255,211,61,0.3); }
    .tag-done    { background: rgba(106,247,200,0.1); color: #6af7c8; border: 1px solid rgba(106,247,200,0.3); }
    .quest-reward {
      margin-left: auto; font-size: 0.62rem; color: #7c6af7;
      letter-spacing: 0.04em; flex-shrink: 0;
    }
    .quest-prog-wrap {
      height: 3px; background: var(--muted); border-radius: 2px;
      margin-top: 7px; overflow: hidden;
    }
    .quest-prog-fill {
      height: 100%; border-radius: 2px; background: #00F6D6;
      transition: width 0.5s ease;
    }

    /* ── CALENDAR STRIP ── */
    .quest-cal-wrap {
      padding: 12px 16px 16px;
    }
    .quest-cal-month {
      font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--subtext); margin-bottom: 10px;
    }
    .quest-cal-days {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;
    }
    .quest-cal-day-label {
      font-size: 0.55rem; color: var(--subtext); text-align: center;
      padding-bottom: 4px; letter-spacing: 0.06em;
    }
    .quest-cal-day {
      font-size: 0.7rem; text-align: center; padding: 6px 2px;
      border-radius: 6px; color: var(--subtext); position: relative;
      cursor: pointer; transition: background 0.15s;
    }
    .quest-cal-day:hover { background: var(--surface); }
    .quest-cal-day.today {
      background: #FFD93D22; color: #FFD93D;
      border: 1px solid #FFD93D44; font-weight: 700;
    }
    .quest-cal-day.has-event::after {
      content: ''; position: absolute; bottom: 2px;
      left: 50%; transform: translateX(-50%);
      width: 3px; height: 3px; border-radius: 50%;
      background: #FF4BCB;
    }
    .quest-cal-day.empty { pointer-events: none; }

    /* ── ADD EVENT BUTTON ── */
    .quest-add-btn {
      width: calc(100% - 32px); margin: 0 16px 16px;
      padding: 12px; border-radius: 10px;
      background: transparent;
      border: 1px dashed var(--border);
      color: var(--subtext); font-family: var(--font-ui);
      font-size: 0.72rem; letter-spacing: 0.08em;
      cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .quest-add-btn:hover { border-color: #FFD93D55; color: #FFD93D; }

    /* ── ADD EVENT MODAL ── */
    .quest-modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7);
      z-index: 300; display: none;
      align-items: flex-end; justify-content: center;
    }
    .quest-modal-overlay.open { display: flex; }
    .quest-modal {
      width: 100%; max-width: 480px;
      background: var(--bg); border: 1px solid var(--border);
      border-radius: 20px 20px 0 0;
      padding: 20px 20px calc(20px + var(--safe-bot,0px));
    }
    .quest-modal-handle {
      width: 36px; height: 4px; background: var(--muted);
      border-radius: 2px; margin: 0 auto 16px;
    }
    .quest-modal-title {
      font-family: var(--font-display); font-size: 0.9rem; font-weight: 700;
      color: var(--text); margin-bottom: 16px;
    }
    .quest-field { margin-bottom: 12px; }
    .quest-field label {
      display: block; font-size: 0.6rem; letter-spacing: 0.1em;
      text-transform: uppercase; color: var(--subtext); margin-bottom: 5px;
    }
    .quest-field input, .quest-field select {
      width: 100%; background: var(--surface); border: 1px solid var(--border);
      border-radius: 8px; padding: 10px 12px; color: var(--text);
      font-family: var(--font-ui); font-size: 0.78rem; outline: none;
      transition: border-color 0.2s;
    }
    .quest-field input:focus, .quest-field select:focus { border-color: #FFD93D; }
    .quest-modal-btns { display: flex; gap: 8px; margin-top: 16px; }
    .quest-modal-cancel {
      flex: 1; padding: 11px; background: transparent;
      border: 1px solid var(--border); border-radius: 10px;
      color: var(--subtext); font-family: var(--font-ui); font-size: 0.78rem;
      cursor: pointer; transition: all 0.2s;
    }
    .quest-modal-cancel:hover { border-color: var(--accent2); color: var(--accent2); }
    .quest-modal-save {
      flex: 2; padding: 11px;
      background: linear-gradient(135deg, #FFD93D, #FFa500);
      border: none; border-radius: 10px;
      color: #101014; font-family: var(--font-display);
      font-weight: 700; font-size: 0.82rem; cursor: pointer;
      transition: opacity 0.2s; letter-spacing: 0.04em;
    }
    .quest-modal-save:hover { opacity: 0.88; }
  `;
  document.head.appendChild(s);
}

// ── QUEST SEED LOGIC ─────────────────────────────────────────
// Turns a calendar event title into a quest name + flavour text
const QUEST_TEMPLATES = [
  { keywords: ['dentist','doctor','appointment','clinic','hospital'],
    name: e => `The Healer\'s Lair`,
    lore: e => `A summons from the White Coats. Your companion steels themself.`,
    icon: '🏥', xp: 80, gold: 3 },
  { keywords: ['meeting','standup','sync','call','zoom','team'],
    name: e => `Council of Endless Words`,
    lore: e => `The Verbose Elders gather. Survive ${e.title} without falling asleep.`,
    icon: '🧙', xp: 40, gold: 1 },
  { keywords: ['gym','workout','run','jog','exercise','yoga','crossfit'],
    name: e => `The Iron Trial`,
    lore: e => `The body is a dungeon. Enter it willingly.`,
    icon: '⚔', xp: 120, gold: 5 },
  { keywords: ['birthday','party','dinner','celebration','wedding'],
    name: e => `The Grand Feast`,
    lore: e => `All the townsfolk gather. Bring gifts, bring charm.`,
    icon: '🎉', xp: 60, gold: 8 },
  { keywords: ['work','office','deadline','project','presentation'],
    name: e => `The Grind Dungeon`,
    lore: e => `The tower never sleeps. Floor by floor, you climb.`,
    icon: '🗼', xp: 100, gold: 4 },
  { keywords: ['travel','flight','drive','trip','vacation'],
    name: e => `Journey to Unknown Lands`,
    lore: e => `Beyond the edge of the map lies ${e.title}. Pack light.`,
    icon: '🗺', xp: 150, gold: 10 },
  { keywords: ['school','class','study','exam','lecture','homework'],
    name: e => `The Scholar\'s Gauntlet`,
    lore: e => `Knowledge is power. The tome won\'t read itself.`,
    icon: '📚', xp: 70, gold: 2 },
];

const WILD_QUEST = { name: () => 'The Empty Expanse', lore: () => 'A rare day with no summons. Seek the Wilderness Cache.', icon: '🏔', xp: 200, gold: 12 };

function seedQuestFromEvent(ev) {
  const t = (ev.title || '').toLowerCase();
  const match = QUEST_TEMPLATES.find(tmpl => tmpl.keywords.some(k => t.includes(k)));
  const tmpl = match || { name: () => ev.title, lore: () => 'A mysterious summons arrives.', icon: '❓', xp: 50, gold: 2 };
  return {
    id: ev.id,
    icon: tmpl.icon,
    title: tmpl.name(ev),
    lore: tmpl.lore(ev),
    xp: tmpl.xp,
    gold: tmpl.gold,
    date: ev.date,
    status: statusForDate(ev.date), // 'active'|'idle'|'locked'|'done'
    progress: 0,
    sourceEvent: ev.title,
  };
}

function statusForDate(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr + 'T00:00:00');
  if (d < today) return 'done';
  if (d.toDateString() === today.toDateString()) return 'active';
  const diff = (d - today) / 86400000;
  if (diff <= 2) return 'idle';
  return 'locked';
}

// ── STORAGE ──────────────────────────────────────────────────
function loadEvents() {
  try { return JSON.parse(localStorage.getItem('ss_quest_events') || '[]'); }
  catch { return []; }
}
function saveEvents(evs) {
  localStorage.setItem('ss_quest_events', JSON.stringify(evs));
}
function saveCharacter(c) {
  localStorage.setItem('ss_quest_char', JSON.stringify(c));
}

// Reads codex You card from IDB sheets store, returns promise
// IDB access mirrors the pattern in db.js (same DB name + version range)
function readCodexYou() {
  return new Promise(resolve => {
    try {
      // Open without version bump — read-only, just need existing stores
      const req = indexedDB.open('spiralside');
      req.onerror = () => resolve(null);
      req.onsuccess = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('sheets')) { db.close(); resolve(null); return; }
        const tx = db.transaction('sheets', 'readonly');
        const get = tx.objectStore('sheets').get('you');
        get.onsuccess = () => { db.close(); resolve(get.result || null); };
        get.onerror  = () => { db.close(); resolve(null); };
      };
    } catch { resolve(null); }
  });
}

// Maps codex trait names to quest stats
// Curiosity/Wit → WIT, Energy/Chaos → ATK, Patience/Trust → DEF, Luck/Spark → LUK
function traitsToStats(traits) {
  const stats = { atk: 10, def: 8, wit: 12, luk: 9 };
  if (!traits || !traits.length) return stats;
  traits.forEach(t => {
    const n = (t.label || t.name || '').toLowerCase();
    const v = Math.round((t.score || t.value || 50) / 10); // 0-100 → 0-10, add to base
    if (/curiosity|wit|intellect|clever|smart|knowledge/.test(n)) stats.wit = Math.min(20, 8 + v);
    else if (/energy|chaos|attack|strength|bold|fierce/.test(n)) stats.atk = Math.min(20, 8 + v);
    else if (/patience|trust|defense|calm|steady|loyal/.test(n)) stats.def = Math.min(20, 8 + v);
    else if (/luck|spark|charm|wild|random|creative/.test(n))    stats.luk = Math.min(20, 8 + v);
  });
  return stats;
}

// Load character — codex You card takes priority over quest localStorage
async function loadCharacter() {
  // 1. Try IDB codex You card first
  const you = await readCodexYou();
  if (you && (you.handle || you.vibe)) {
    const stats = traitsToStats(you.traits);
    const base = JSON.parse(localStorage.getItem('ss_quest_char') || 'null') || {};
    return {
      name:            you.handle  || base.name  || 'Wanderer',
      class:           you.vibe    || base.class || 'adventurer · chaotic good',
      arc:             you.arc     || '',
      portrait_base64: you.portrait_base64 || base.portrait_base64 || null,
      atk:             stats.atk,
      def:             stats.def,
      wit:             stats.wit,
      luk:             stats.luk,
      level:           base.level  || 1,
      xp:              base.xp     || 0,
      xpNext:          base.xpNext || 100,
      hairColor:       base.hairColor  || '#5a3a1a',
      skinColor:       base.skinColor  || '#FDDBB4',
      fromCodex:       true,
    };
  }
  // 2. Fall back to quest-local storage
  try { return JSON.parse(localStorage.getItem('ss_quest_char') || 'null'); }
  catch { return null; }
}

// ── DEFAULT CHARACTER ─────────────────────────────────────────
function defaultCharacter(name) {
  return {
    name: name || 'Wanderer',
    class: 'adventurer · chaotic good',
    atk: 10, def: 8, wit: 12, luk: 9,
    level: 1, xp: 0, xpNext: 100,
    hairColor: '#5a3a1a',
    skinColor: '#FDDBB4',
  };
}

// ── BUILD MII SVG ─────────────────────────────────────────────
function buildMiiSvg(char) {
  const skin = char.skinColor || '#FDDBB4';
  const hair = char.hairColor || '#5a3a1a';
  return `
  <svg class="mii-svg" viewBox="0 0 46 46" xmlns="http://www.w3.org/2000/svg">
    <!-- hair back -->
    <ellipse cx="23" cy="14" rx="14" ry="10" fill="${hair}"/>
    <!-- head -->
    <ellipse cx="23" cy="22" rx="13" ry="14" fill="${skin}"/>
    <!-- hair front -->
    <rect x="9" y="8" width="28" height="10" rx="5" fill="${hair}"/>
    <!-- eyes -->
    <ellipse cx="18" cy="20" rx="2.5" ry="3.5" fill="#222"/>
    <ellipse cx="28" cy="20" rx="2.5" ry="3.5" fill="#222"/>
    <!-- eye shine -->
    <circle cx="19" cy="19" r="0.8" fill="#fff"/>
    <circle cx="29" cy="19" r="0.8" fill="#fff"/>
    <!-- mouth -->
    <path d="M18.5 27 Q23 31 27.5 27" fill="none" stroke="#c0705a" stroke-width="1.5" stroke-linecap="round"/>
    <!-- ears -->
    <ellipse cx="10" cy="22" rx="2" ry="2.5" fill="${skin}"/>
    <ellipse cx="36" cy="22" rx="2" ry="2.5" fill="${skin}"/>
  </svg>`;
}

// ── RENDER ────────────────────────────────────────────────────
function renderQuest(el, char, events) {
  const quests = events.map(seedQuestFromEvent).sort((a, b) => {
    const order = { active: 0, idle: 1, locked: 2, done: 3 };
    return (order[a.status] ?? 4) - (order[b.status] ?? 4);
  });

  // Use live XP engine state if available, else fall back to char stub
  const _xps  = (typeof getXPState !== 'undefined' && getXPState()) || null;
  const _xpLv = _xps ? _xps.level  : (char.level  || 1);
  const _xpCur= _xps ? _xps.xp     : (char.xp     || 0);
  const _xpNxt= _xps ? _xps.xpNext : (char.xpNext || 100);
  const xpPct = Math.min(100, Math.round((_xpCur / Math.max(1, _xpNxt)) * 100));

  // Calendar — build this month
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toLowerCase();
  const todayNum = now.getDate();
  const eventDates = new Set(events.filter(e => {
    const d = new Date(e.date + 'T00:00:00');
    return d.getMonth() === month && d.getFullYear() === year;
  }).map(e => new Date(e.date + 'T00:00:00').getDate()));

  // Calendar cells
  const dayLabels = ['s','m','t','w','t','f','s'].map(d => `<div class="quest-cal-day-label">${d}</div>`).join('');
  const emptyCells = Array(firstDay).fill('<div class="quest-cal-day empty"></div>').join('');
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const isToday = d === todayNum;
    const hasEv = eventDates.has(d);
    return `<div class="quest-cal-day${isToday ? ' today' : ''}${hasEv ? ' has-event' : ''}">${d}</div>`;
  }).join('');

  // Quest cards
  const questCards = quests.length
    ? quests.map(q => `
      <div class="quest-card">
        <div class="quest-card-icon">${q.icon}</div>
        <div class="quest-card-body">
          <div class="quest-card-title">${q.title}</div>
          <div class="quest-card-sub">${q.lore}</div>
          <div class="quest-card-meta">
            <div class="quest-tag tag-${q.status}">${q.status}</div>
            <div class="quest-reward">+${q.xp} xp · ${q.gold}g</div>
          </div>
          ${q.status === 'active' ? '<div class="quest-prog-wrap"><div class="quest-prog-fill" style="width:45%"></div></div>' : ''}
        </div>
      </div>`).join('')
    : `<div style="padding:32px 16px;text-align:center;color:var(--subtext);font-size:0.78rem;line-height:1.8">
        No quests yet.<br>Add calendar events and they become adventures.
       </div>`;

  el.innerHTML = `
    <!-- HEADER -->
    <div class="quest-header">
      <div class="quest-title-row">
        <div class="quest-view-label">spiral quest</div>
        <div class="quest-view-name">${char.name}</div>
      </div>
      <div class="quest-xp-wrap">
        <div class="quest-level">lv ${_xpLv}</div>
        <div class="quest-xp-bar-bg">
          <div class="quest-xp-bar-fill" style="width:${xpPct}%"></div>
        </div>
      </div>
    </div>

    <!-- XP PANEL -->
    <div class="quest-xp-panel">
      <div class="quest-xp-row">
        <div class="quest-xp-label">experience</div>
        <div class="quest-xp-nums">${_xpCur} / ${_xpNxt} xp</div>
      </div>
      <div class="quest-xp-full">
        <div class="quest-xp-full-fill" style="width:${xpPct}%"></div>
      </div>
      <div class="quest-xp-meta">
        <div class="quest-xp-chip">daily <span>${_xps ? _xps.dailyXP : 0}/${_xps ? _xps.dailyCap : 10}</span></div>
        <div class="quest-xp-chip">streak <span>${_xps ? _xps.streakDays : 1}d</span></div>
        <div class="quest-xp-chip">total <span>${_xps ? _xps.totalXP : 0}</span></div>
      </div>
    </div>

    <!-- MII PANEL -->
    <div class="quest-mii-panel">
      <div class="mii-avatar-wrap" id="quest-mii-avatar-wrap"
        style="${char.portrait_base64 ? `background-image:url(${char.portrait_base64});background-size:cover;background-position:center top;` : ''}">
        ${char.portrait_base64 ? '' : buildMiiSvg(char)}
      </div>
      <div class="quest-mii-info">
        <div class="quest-mii-name">${char.name}</div>
        <div class="quest-mii-class">${char.class}</div>
        ${char.arc ? `<div class="quest-mii-arc">${char.arc}</div>` : ''}
        <div class="quest-stat-row">
          <div class="quest-stat atk">ATK ${char.atk}</div>
          <div class="quest-stat def">DEF ${char.def}</div>
          <div class="quest-stat wit">WIT ${char.wit}</div>
          <div class="quest-stat luk">LUK ${char.luk}</div>
        </div>
      </div>
    </div>

    <!-- QUESTS -->
    <div class="quest-section-label">active quests</div>
    <div class="quest-list">${questCards}</div>

    <!-- CALENDAR -->
    <div class="quest-section-label">this month</div>
    <div class="quest-cal-wrap">
      <div class="quest-cal-month">${monthName}</div>
      <div class="quest-cal-days">
        ${dayLabels}
        ${emptyCells}
        ${dayCells}
      </div>
    </div>

    <!-- ADD EVENT -->
    <button class="quest-add-btn" id="quest-add-btn">+ add calendar event</button>

    <!-- MODAL -->
    <div class="quest-modal-overlay" id="quest-modal-overlay">
      <div class="quest-modal">
        <div class="quest-modal-handle"></div>
        <div class="quest-modal-title">new event</div>
        <div class="quest-field">
          <label>event title</label>
          <input type="text" id="quest-ev-title" placeholder="e.g. dentist, team meeting, birthday party..." />
        </div>
        <div class="quest-field">
          <label>date</label>
          <input type="date" id="quest-ev-date" />
        </div>
        <div class="quest-modal-btns">
          <button class="quest-modal-cancel" id="quest-modal-cancel">cancel</button>
          <button class="quest-modal-save" id="quest-modal-save">add quest</button>
        </div>
      </div>
    </div>
  `;

  // Wire modal
  document.getElementById('quest-add-btn').onclick = () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('quest-ev-date').value = today;
    document.getElementById('quest-ev-title').value = '';
    document.getElementById('quest-modal-overlay').classList.add('open');
  };
  document.getElementById('quest-modal-cancel').onclick = () => {
    document.getElementById('quest-modal-overlay').classList.remove('open');
  };
  document.getElementById('quest-modal-overlay').onclick = (e) => {
    if (e.target === document.getElementById('quest-modal-overlay'))
      document.getElementById('quest-modal-overlay').classList.remove('open');
  };
  document.getElementById('quest-modal-save').onclick = () => {
    const title = document.getElementById('quest-ev-title').value.trim();
    const date  = document.getElementById('quest-ev-date').value;
    if (!title || !date) return;
    const evs = loadEvents();
    evs.push({ id: Date.now().toString(), title, date });
    saveEvents(evs);
    document.getElementById('quest-modal-overlay').classList.remove('open');
    // Award XP for adding a quest event
    if (window.awardXP) {
      window.awardXP('quest_event_added').then(r => {
        if (r && r.xpAwarded > 0 && window.showXPGain) window.showXPGain(r.xpAwarded, 'quest');
      });
    }
    // Re-render
    renderQuest(el, char, evs);
  };
}

// ── PUBLIC INIT ───────────────────────────────────────────────
export async function initQuestView() {
  const el = document.getElementById('view-quest');
  if (!el) return;
  _initialized = true;

  injectQuestStyles();

  // Load or create character — use Forge bot name if available
  let char = await loadCharacter();
  if (!char) {
    const botName = (typeof state !== 'undefined' && state.botName) ? state.botName : 'Wanderer';
    char = defaultCharacter(botName);
    saveCharacter(char);
  }

  const events = loadEvents();
  renderQuest(el, char, events);
}
