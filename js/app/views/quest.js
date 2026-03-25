// ============================================================
// SPIRALSIDE — QUEST VIEW v1.0
// Idle DnD companion game seeded from calendar events
// Mii-style avatar + quest board + weekly calendar strip
// Nimbis anchor: js/app/views/quest.js
import { syncSave, syncLoad } from '../sync.js';
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


    /* ── LOOT DROP ── */
    .quest-loot-toast {
      position: fixed; bottom: calc(86px + var(--safe-bot,0px)); left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: var(--surface); border: 1px solid #FFD93D;
      color: #FFD93D; font-family: var(--font-ui);
      font-size: 0.7rem; letter-spacing: 0.06em;
      padding: 8px 16px; border-radius: 20px;
      opacity: 0; pointer-events: none; z-index: 9999;
      transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
      white-space: nowrap;
    }
    .quest-loot-toast.visible {
      opacity: 1; transform: translateX(-50%) translateY(0);
    }
        /* ── SHOP ── */
    .quest-shop-wrap { padding: 0 0 8px; }
    .quest-shop-label { font-size: 0.58rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--subtext); padding: 12px 16px 8px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
    .quest-shop-gold { font-size: 0.7rem; color: #FFD93D; }
    .quest-shop-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; padding: 10px 16px 4px; }
    .quest-shop-item { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 10px 8px; text-align: center; cursor: pointer; transition: all 0.15s; position: relative; }
    .quest-shop-item:hover { border-color: #FFD93D55; transform: translateY(-1px); }
    .quest-shop-item:active { transform: scale(0.97); }
    .quest-shop-item.cant-afford { opacity: 0.4; pointer-events: none; }
    .quest-shop-icon { font-size: 1.3rem; margin-bottom: 4px; }
    .quest-shop-name { font-size: 0.58rem; color: var(--text); letter-spacing: 0.04em; margin-bottom: 3px; line-height: 1.3; }
    .quest-shop-price { font-size: 0.62rem; color: #FFD93D; }
    .quest-shop-effect { font-size: 0.55rem; color: var(--subtext); margin-top: 2px; }
    /* ── INVENTORY ── */
    .quest-inv-wrap { padding: 8px 16px 12px; display: flex; gap: 8px; flex-wrap: wrap; min-height: 32px; }
    .quest-inv-item { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 4px 10px 4px 6px; font-size: 0.65rem; color: var(--subtext); display: flex; align-items: center; gap: 5px; cursor: pointer; transition: border-color 0.15s; }
    .quest-inv-item:hover { border-color: var(--accent2); }
    .quest-inv-empty { font-size: 0.62rem; color: var(--subtext); opacity: 0.5; padding: 4px 0; }
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
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7);
      z-index: 9000; display: none;
      align-items: center; justify-content: center;
      padding: 20px;
    }
    .quest-modal-overlay.open { display: flex; }
    .quest-modal {
      width: 100%; max-width: 400px;
      background: var(--bg); border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px 20px;
      max-height: 90dvh; overflow-y: auto;
    }
    .quest-modal-handle {
      display: none;
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
    .quest-launch-btn{display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:8px 14px;background:transparent;border:1px solid #00F6D655;border-radius:8px;color:#00F6D6;font-family:var(--font-ui);font-size:0.68rem;letter-spacing:0.08em;cursor:pointer;transition:all 0.2s;text-decoration:none;}
    .quest-launch-btn:hover{background:#00F6D615;border-color:#00F6D6;}
  `;
  document.head.appendChild(s);
}

// ── SHOP CATALOG ─────────────────────────────────────────────
// 7 items — 3 shown per day, rotated by date seed
const SHOP_CATALOG = [
  { id:'health_pot',  icon:'🧪', name:'Health Potion',  price:5,  effect:'+5 HP',        stat:null,  bonus:0,  duration:0 },
  { id:'rusty_sword', icon:'⚔️',  name:'Rusty Sword',   price:8,  effect:'+1 ATK 24h',   stat:'atk', bonus:1,  duration:86400000 },
  { id:'crk_shield',  icon:'🛡️',  name:'Cracked Shield',price:8,  effect:'+1 DEF 24h',   stat:'def', bonus:1,  duration:86400000 },
  { id:'tome',        icon:'📖', name:'Candle & Tome',  price:6,  effect:'+1 WIT 1 quest',stat:'wit', bonus:1,  duration:0 },
  { id:'mystery',     icon:'🎲', name:'Mystery Sack',   price:3,  effect:'1-3g inside',   stat:null,  bonus:0,  duration:0 },
  { id:'coin_charm',  icon:'🍀', name:'Coin Charm',     price:12, effect:'+1g quests tmr',stat:null,  bonus:0,  duration:86400000 },
  { id:'ward_stone',  icon:'💀', name:'Ward Stone',     price:20, effect:'prevent 1 fail', stat:null, bonus:0,  duration:0 },
];

// Returns 3 items for today based on date seed
function getDailyShop() {
  const seed = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const n = parseInt(seed) % SHOP_CATALOG.length;
  return [
    SHOP_CATALOG[n % SHOP_CATALOG.length],
    SHOP_CATALOG[(n+2) % SHOP_CATALOG.length],
    SHOP_CATALOG[(n+4) % SHOP_CATALOG.length],
  ];
}

// ── QUEST SEED LOGIC ─────────────────────────────────────────
// Turns a calendar event title into a quest name + flavour text
const QUEST_TEMPLATES = [
  { keywords: ['dentist','doctor','appointment','clinic','hospital'],
    name: e => `The Healer\'s Lair`,
    lore: e => `A summons from the White Coats. Your companion steels themself.`,
    icon: '🏥', xp: 80, gold: 1 },
  { keywords: ['meeting','standup','sync','call','zoom','team'],
    name: e => `Council of Endless Words`,
    lore: e => `The Verbose Elders gather. Survive ${e.title} without falling asleep.`,
    icon: '🧙', xp: 40, gold: 1 },
  { keywords: ['gym','workout','run','jog','exercise','yoga','crossfit'],
    name: e => `The Iron Trial`,
    lore: e => `The body is a dungeon. Enter it willingly.`,
    icon: '⚔', xp: 120, gold: 2 },
  { keywords: ['birthday','party','dinner','celebration','wedding'],
    name: e => `The Grand Feast`,
    lore: e => `All the townsfolk gather. Bring gifts, bring charm.`,
    icon: '🎉', xp: 60, gold: 2 },
  { keywords: ['work','office','deadline','project','presentation'],
    name: e => `The Grind Dungeon`,
    lore: e => `The tower never sleeps. Floor by floor, you climb.`,
    icon: '🗼', xp: 100, gold: 1 },
  { keywords: ['travel','flight','drive','trip','vacation'],
    name: e => `Journey to Unknown Lands`,
    lore: e => `Beyond the edge of the map lies ${e.title}. Pack light.`,
    icon: '🗺', xp: 150, gold: 2 },
  { keywords: ['school','class','study','exam','lecture','homework'],
    name: e => `The Scholar\'s Gauntlet`,
    lore: e => `Knowledge is power. The tome won\'t read itself.`,
    icon: '📚', xp: 70, gold: 1 },
];

const WILD_QUEST = { name: () => 'The Empty Expanse', lore: () => 'A rare day with no summons. Seek the Wilderness Cache.', icon: '🏔', xp: 200, gold: 3 };

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
    time: ev.time || '',
    status: statusForDate(ev.date), // 'active'|'idle'|'locked'|'done'
    progress: 0,
    sourceEvent: ev.title,
  };
}

function formatQuestDate(dateStr, timeStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const day = d.getDate();
  const mon = months[d.getMonth()];
  let out = mon + ' ' + day;
  if (timeStr) {
    const parts = timeStr.split(':');
    const h = parseInt(parts[0]); const m = parseInt(parts[1]);
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12  = h % 12 || 12;
    out += ' · ' + h12 + ':' + String(m).padStart(2,'0') + ampm;
  }
  return out;
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
  syncSave('quest_char', c).catch(()=>{});
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
  const resolved = loadResolved();
  const quests = events.map(seedQuestFromEvent).filter(q => !resolved.includes(q.id)).sort((a, b) => {
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
          ${formatQuestDate(q.date,q.time) ? '<div class="quest-card-date">⏰ ' + formatQuestDate(q.date,q.time) + '</div>' : ''}
          <div class="quest-card-sub">${q.lore}</div>
          <div class="quest-card-source">from: ${q.sourceEvent}</div>
          <div class="quest-card-meta">
            <div class="quest-tag tag-${q.status}">${q.status}</div>
            <div class="quest-reward">🪙 +${q.gold}g</div>
          </div>
          ${q.status === 'active' ? '<div class="quest-prog-wrap"><div class="quest-prog-fill" style="width:45%"></div></div>' : ''}
          ${q.link ? `<button class="quest-launch-btn" onclick="window.open('${q.link}','_blank','noopener,noreferrer')">${q.linkLabel || "open link"}</button>` : ``}
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
        <div class="quest-xp-chip" style="margin-left:auto;color:#FFD93D">🪙 <span>${_xps ? (_xps.gold || 0) : 0}g</span></div>
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
    <!-- SHOP -->
    <div class="quest-section-label" style="display:flex;align-items:center;justify-content:space-between;"><span>wandering merchant</span><span style="font-size:0.62rem;color:#FFD93D;text-transform:none">rotates daily</span></div>
    <div class="quest-shop-wrap">
      <div class="quest-shop-grid" id="quest-shop-grid">
        ${getDailyShop().map(function(item){
          var g = _xps ? (_xps.gold||0) : 0;
          var ca = g < item.price ? " cant-afford" : "";
          return "<div class=\"quest-shop-item"+ca+"\" onclick=\"window._questBuyItem('"+item.id+"')\">" +
            "<div class=\"quest-shop-icon\">"+item.icon+"</div>" +
            "<div class=\"quest-shop-name\">"+item.name+"</div>" +
            "<div class=\"quest-shop-price\">"+item.price+"g</div>" +
            "<div class=\"quest-shop-effect\">"+item.effect+"</div></div>";
        }).join("")}
      </div>
    </div>
    <div class="quest-section-label">inventory</div>
    <div class="quest-inv-wrap" id="quest-inv-wrap">
      ${(_xps&&_xps.items&&_xps.items.length) ? _xps.items.map(function(i){return "<div class=\"quest-inv-item\" onclick=\"window._questUseItem('"+i.id+"')\">" +i.icon+" "+i.name+"</div>";}).join("") : "<div class=\"quest-inv-empty\">no items yet</div>"}
    </div>

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
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <div class="quest-field" style="flex:1;margin-bottom:0"><label>time (opt)</label><input type="time" id="quest-ev-time" style="width:100%;color-scheme:dark;" /></div>
        </div>
                <div class="quest-field">
          <label>launch link (opt)</label>
          <input type="url" id="quest-ev-link" placeholder="https://..." style="width:100%;" />
        </div>
        <div class="quest-field">
          <label>button label (opt)</label>
          <input type="text" id="quest-ev-link-label" placeholder="e.g. Pay Bill, Play Song" style="width:100%;" />
        </div>
        <div class="quest-modal-btns">
          <button class="quest-modal-cancel" id="quest-modal-cancel">cancel</button>
          <button class="quest-modal-save" id="quest-modal-save">add quest</button>
        </div>
      </div>
    </div>
  `;

  // ── SHOP HANDLERS ────────────────────────────────────────────
  window._questBuyItem = async (itemId) => {
    const item = SHOP_CATALOG.find(i => i.id === itemId);
    if (!item || !window.spendGold) return;
    const result = await window.spendGold(item.price);
    if (!result.success) {
      // Flash "not enough gold"
      const grid = document.getElementById('quest-shop-grid');
      if (grid) { grid.style.opacity='0.5'; setTimeout(()=>grid.style.opacity='1',400); }
      return;
    }
    // Mystery sack — award random gold
    if (itemId === 'mystery') {
      const bonus = Math.floor(Math.random() * 3) + 1;
      if (window.awardGold) await window.awardGold(bonus);
      if (window.showXPGain) window.showXPGain(bonus, 'mystery');
    } else {
      // Add to inventory
      if (window.addItem) await window.addItem({
        id: item.id + '_' + Date.now(),
        name: item.name, icon: item.icon,
        stat: item.stat, bonus: item.bonus,
        expiresAt: item.duration ? Date.now() + item.duration : null,
      });
    }
    // Re-render to show updated gold + inventory
    const el2 = document.getElementById('view-quest');
    if (el2) { const c2 = await loadCharacter(); const e2 = loadEvents(); renderQuest(el2, c2, e2); }
  };

  window._questUseItem = async (itemId) => {
    if (!window.consumeItem) return;
    // Find item for use_text before consuming
    const xps = window.getXPState ? window.getXPState() : null;
    const item = xps && xps.items ? xps.items.find(i => i.id === itemId) : null;
    await window.consumeItem(itemId);
    // Show use_text as toast if loot item
    if (item && item.isLoot && item.use_text) {
      showLootToast(item.icon + ' ' + item.use_text);
    }
    const el2 = document.getElementById('view-quest');
    if (el2) { const c2 = await loadCharacter(); const e2 = loadEvents(); renderQuest(el2, c2, e2); }
  };

  // Move modal to body — escapes overflow:hidden
  const _mo = document.getElementById('quest-modal-overlay');
  if (_mo && _mo.parentElement !== document.body) document.body.appendChild(_mo);

  // Wire modal
  document.getElementById('quest-add-btn').onclick = () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('quest-ev-date').value = today;
    document.getElementById('quest-ev-title').value = '';
    document.getElementById('quest-modal-overlay').classList.add('open');
  };
  document.getElementById('quest-modal-cancel').onclick = () => {
    document.getElementById('quest-modal-overlay').classList.remove('open');
    const _lf=document.getElementById('quest-ev-link'); if(_lf)_lf.value='';
    const _llf=document.getElementById('quest-ev-link-label'); if(_llf)_llf.value='';
  };
  document.getElementById('quest-modal-overlay').onclick = (e) => {
    if (e.target === document.getElementById('quest-modal-overlay'))
      document.getElementById('quest-modal-overlay').classList.remove('open');
  };
  document.getElementById('quest-modal-save').onclick = () => {
    const title = document.getElementById('quest-ev-title').value.trim();
    const date  = document.getElementById('quest-ev-date').value;
    const time  = (document.getElementById('quest-ev-time') || {}).value || '';
    if (!title || !date) return;
    const evs = loadEvents();
    const link=(document.getElementById('quest-ev-link')||{}).value.trim()||'';
    const linkLabel=(document.getElementById('quest-ev-link-label')||{}).value.trim()||'';
    evs.push({ id: Date.now().toString(), title, date, time, link, linkLabel });
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
// ── LOOT DROP ────────────────────────────────────────────────
// Calls Railway to generate a random junk item via AI
// Fires every time quest tab opens — pure flavor, zero game impact
function dropRandomLoot() {
  const L = [
    {i:'rock',n:'suspicious rock',u:'you inspect it. nothing happens.'},
    {i:'sock',n:'one sock',u:'warm for a moment. then gone.'},
    {i:'spoon',n:'bent spoon',u:'you bend it further. it snaps.'},
    {i:'scroll',n:'illegible scroll',u:'ancient wisdom. probably.'},
    {i:'jar',n:'empty jar',u:'smells like adventure.'},
    {i:'card',n:'worn playing card',u:'the image is faded. was it you?'},
    {i:'button',n:'mystery button',u:'does not belong to anything here.'},
    {i:'die',n:'a single die',u:'rolled a 1. always.'},
    {i:'note',n:'crumpled note',u:'reads: you were here.'},
    {i:'bone',n:'small bone',u:'not yours. probably.'},
    {i:'marble',n:'blue marble',u:'perfectly round. perfectly useless.'},
    {i:'key',n:'unlabeled key',u:'fits nothing you own.'},
    {i:'cork',n:'a cork',u:'from a bottle of something forgotten.'},
    {i:'feather',n:'black feather',u:'from no bird you know.'},
    {i:'coin',n:'coin from nowhere',u:'currency of a place that does not exist.'},
    {i:'nail',n:'iron nail',u:'slightly bent. slightly judging you.'},
    {i:'chalk',n:'piece of chalk',u:'writes one word before it crumbles.'},
    {i:'tooth',n:'a tooth',u:'not yours. you hope.'},
    {i:'candle',n:'used candle',u:'burned down to the message.'},
    {i:'hat',n:'very small hat',u:'fits no one you know.'},
  ];
  const p = L[Math.floor(Math.random() * L.length)];
  const icons = {rock:'chr128299',sock:'chr129510',spoon:'chr129364',scroll:'chr128220',jar:'chr129529',card:'chr127183',button:'chr128280',die:'chr127922',note:'chr128221',bone:'chr129462',marble:'chr128302',key:'chr128505',cork:'chr127870',feather:'chr129718',coin:'chr129689',nail:'chr128296',chalk:'chr128397',tooth:'chr129463',candle:'chr129457',hat:'chr127913'};
  const icon = String.fromCodePoint(parseInt(icons[p.i].replace('chr',''))) || p.i;
  const lootItem = {id:'loot_'+Date.now(),name:p.n,icon:icon,use_text:p.u,stat:null,bonus:0,expiresAt:null,isLoot:true};
  showLootCard(lootItem);
}

function showLootCard(item) {
  // Inject styles
  if (!document.getElementById('loot-card-styles')) {
    const st = document.createElement('style');
    st.id = 'loot-card-styles';
    st.textContent = [
      '.loot-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;}',
      '.loot-card{background:#111118;border:1px solid #FFD93D55;border-radius:16px;padding:20px;width:100%;max-width:300px;position:relative;font-family:var(--font-ui);}',
      '.loot-found-badge{position:absolute;top:-10px;left:16px;background:#FFD93D;color:#08080d;font-size:0.55rem;letter-spacing:0.1em;padding:2px 10px;border-radius:20px;font-weight:700;text-transform:uppercase;}',
      '.loot-header{display:flex;align-items:center;gap:12px;margin-bottom:14px;}',
      '.loot-icon-wrap{width:52px;height:52px;background:#FFD93D14;border:1px solid #FFD93D33;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;}',
      '.loot-name{font-size:0.88rem;color:#F0F0FF;font-weight:600;margin-bottom:3px;}',
      '.loot-rarity{font-size:0.58rem;letter-spacing:0.14em;text-transform:uppercase;color:#FFD93D;}',
      '.loot-divider{height:1px;background:#FFD93D22;margin:0 0 12px;}',
      '.loot-use{font-size:0.72rem;color:#7070a0;line-height:1.6;margin-bottom:14px;font-style:italic;}',
      '.loot-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;}',
      '.loot-stat{background:#0f0f18;border:1px solid #1e1e35;border-radius:8px;padding:8px;text-align:center;}',
      '.loot-stat-val{font-size:0.88rem;font-weight:700;}',
      '.loot-stat-lbl{font-size:0.55rem;letter-spacing:0.1em;text-transform:uppercase;color:#4040a0;margin-top:2px;}',
      '.loot-btns{display:flex;gap:8px;}',
      '.loot-btn-use{flex:1;padding:10px;background:#FFD93D18;border:1px solid #FFD93D44;border-radius:8px;color:#FFD93D;font-family:var(--font-ui);font-size:0.68rem;letter-spacing:0.06em;cursor:pointer;text-align:center;}',
      '.loot-btn-toss{padding:10px 14px;background:transparent;border:1px solid #1e1e35;border-radius:8px;color:#4040a0;font-family:var(--font-ui);font-size:0.68rem;cursor:pointer;}',
    ].join('');
    document.head.appendChild(st);
  }

  // Get live stats
  const xps = window.getXPState ? window.getXPState() : null;
  const gold = xps ? (xps.gold || 0) : 0;
  const streak = xps ? (xps.streakDays || 1) : 1;
  const level = xps ? (xps.level || 1) : 1;

  // Rarity flavor based on item name length (pure nonsense but fun)
  const rarities = ['common junk','strange find','odd relic','cursed object','forgotten thing'];
  const rarity = rarities[item.name.length % rarities.length];

  // Build overlay
  const overlay = document.createElement('div');
  overlay.className = 'loot-overlay';
  overlay.id = 'loot-overlay';

  overlay.innerHTML =
    '<div class="loot-card">' +
      '<div class="loot-found-badge">item found</div>' +
      '<div class="loot-header">' +
        '<div class="loot-icon-wrap"><span style="font-size:24px">' + item.icon + '</span></div>' +
        '<div><div class="loot-name">' + item.name + '</div>' +
        '<div class="loot-rarity">' + rarity + '</div></div>' +
      '</div>' +
      '<div class="loot-divider"></div>' +
      '<div class="loot-use">"' + item.use_text + '"</div>' +
      '<div class="loot-stats">' +
        '<div class="loot-stat"><div class="loot-stat-val" style="color:#FFD93D">' + gold + 'g</div><div class="loot-stat-lbl">gold</div></div>' +
        '<div class="loot-stat"><div class="loot-stat-val" style="color:#00F6D6">' + streak + 'd</div><div class="loot-stat-lbl">streak</div></div>' +
        '<div class="loot-stat"><div class="loot-stat-val" style="color:#FF4BCB">lv ' + level + '</div><div class="loot-stat-lbl">level</div></div>' +
      '</div>' +
      '<div class="loot-btns">' +
        '<div class="loot-btn-use" id="loot-use-btn">use item</div>' +
        '<div class="loot-btn-toss" id="loot-toss-btn">toss</div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s';
    setTimeout(() => overlay.remove(), 200);
  };

  // Use button — show use_text as toast then close
  overlay.querySelector('#loot-use-btn').onclick = async (e) => {
    e.stopPropagation();
    // Keep item in inventory — user manually uses from inventory panel
    close();
    // Flash use text briefly
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;top:calc(54px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);background:#111118;border:1px solid #FFD93D;color:#FFD93D;font-family:var(--font-ui);font-size:.7rem;padding:8px 16px;border-radius:20px;z-index:9999;white-space:nowrap;';
    flash.textContent = item.icon + ' ' + item.use_text;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 3000);
  };

  // Toss button — consume and close
  overlay.querySelector('#loot-toss-btn').onclick = async (e) => {
    e.stopPropagation();
    if (window.consumeItem && item.id) await window.consumeItem(item.id);
    close();
  };

  // Click outside closes
  overlay.onclick = close;
  overlay.querySelector('.loot-card').onclick = e => e.stopPropagation();
}

function showLootToast(msg) {
  // Inject toast styles into head if not already there
  if (!document.getElementById('loot-toast-style-inj ')) {
    const _ls = document.createElement('style'); _ls.id = 'loot-toast-style-inj';
    _ls.textContent = '.quest-loot-toast{position:fixed;top:calc(54px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%) translateY(-10px);background:#111118;border:1px solid #FFD93D;color:#FFD93D;font-family:var(--font-ui);font-size:.7rem;letter-spacing:.06em;padding:8px 16px;border-radius:20px;opacity:0;pointer-events:none;z-index:9999;transition:all .4s cubic-bezier(.34,1.56,.64,1);white-space:nowrap;}.quest-loot-toast.visible{opacity:1;transform:translateX(-50%) translateY(0);}';
    document.head.appendChild(_ls);
  }
  let toast = document.getElementById('quest-loot-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'quest-loot-toast';
    toast.className = 'quest-loot-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('visible'));
  });
  // Click anywhere on toast to dismiss
  toast.style.pointerEvents = 'all';
  toast.style.cursor = 'pointer';
  const _dismiss = () => {
    toast.classList.remove('visible');
    setTimeout(() => { toast.remove(); }, 400);
    toast.removeEventListener('click', _dismiss);
  };
  toast.addEventListener('click', _dismiss);
  // Also auto-dismiss after 8 seconds
  setTimeout(_dismiss, 8000);
}

// ── IDLE RESOLVE ─────────────────────────────────────────────
// Checks all events on tab open — if date passed and not yet claimed,
// awards gold and marks as resolved in localStorage
function loadResolved() {
  try { return JSON.parse(localStorage.getItem('ss_quest_resolved') || '[]'); }
  catch { return []; }
}
function markResolved(id) {
  const r = loadResolved();
  if (!r.includes(id)) { r.push(id); localStorage.setItem('ss_quest_resolved', JSON.stringify(r)); }
}

async function resolveCompletedQuests() {
  const events = loadEvents();
  const resolved = loadResolved();
  const today = new Date(); today.setHours(0,0,0,0);

  const now = new Date();
  const toResolve = events.filter(ev => {
    if (resolved.includes(ev.id)) return false;
    const d = new Date(ev.date + 'T00:00:00');
    if (ev.time) {
      const [h, m] = ev.time.split(':').map(Number);
      const evDateTime = new Date(ev.date + 'T00:00:00');
      evDateTime.setHours(h, m, 0, 0);
      return now > evDateTime;
    }
    return d < today;
  });

  if (!toResolve.length) return;

  for (const ev of toResolve) {
    // Find template to get gold amount
    const t = (ev.title || '').toLowerCase();
    const tmpl = QUEST_TEMPLATES.find(tmpl => tmpl.keywords.some(k => t.includes(k)));
    const gold = tmpl ? tmpl.gold : 1;
    markResolved(ev.id);
    if (window.awardGold) await window.awardGold(gold);
    // Show completion card
    showQuestCompleteCard(ev, gold);
    // Only resolve one at a time per visit to not spam
    break;
  }
}

function showQuestCompleteCard(ev, gold) {
  if (!document.getElementById('qc-styles')) {
    const st = document.createElement('style');
    st.id = 'qc-styles';
    st.textContent = [
      '.qc-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.75);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;}',
      '.qc-card{background:#111118;border:1px solid #00F6D655;border-radius:16px;padding:20px;width:100%;max-width:300px;font-family:var(--font-ui);}',
      '.qc-badge{display:inline-block;background:#00F6D6;color:#08080d;font-size:0.55rem;letter-spacing:0.1em;padding:2px 10px;border-radius:20px;font-weight:700;text-transform:uppercase;margin-bottom:12px;}',
      '.qc-title{font-size:0.9rem;color:#F0F0FF;font-weight:600;margin-bottom:4px;}',
      '.qc-sub{font-size:0.7rem;color:#7070a0;margin-bottom:14px;}',
      '.qc-reward{display:flex;align-items:center;gap:8px;background:#FFD93D14;border:1px solid #FFD93D33;border-radius:10px;padding:12px;margin-bottom:14px;}',
      '.qc-gold{font-size:1.4rem;font-weight:700;color:#FFD93D;}',
      '.qc-reward-text{font-size:0.7rem;color:#7070a0;line-height:1.5;}',
      '.qc-btn{width:100%;padding:10px;background:#00F6D618;border:1px solid #00F6D644;border-radius:8px;color:#00F6D6;font-family:var(--font-ui);font-size:0.72rem;letter-spacing:0.06em;cursor:pointer;text-align:center;}',
    ].join('');
    document.head.appendChild(st);
  }

  const tmpl = QUEST_TEMPLATES.find(t => t.keywords.some(k => (ev.title||'').toLowerCase().includes(k)));
  const questTitle = tmpl ? tmpl.name(ev) : ev.title;

  const overlay = document.createElement('div');
  overlay.className = 'qc-overlay';
  overlay.innerHTML =
    '<div class="qc-card">' +
      '<div class="qc-badge">quest complete</div>' +
      '<div class="qc-title">' + questTitle + '</div>' +
      '<div class="qc-sub">from: ' + ev.title + (ev.time ? ' · ' + ev.time : '') + '</div>' +
      '<div class="qc-reward">' +
        '<div class="qc-gold">+' + gold + 'g</div>' +
        '<div class="qc-reward-text">gold added to your pouch<br>well done, adventurer</div>' +
      '</div>' +
      '<div class="qc-btn" id="qc-close-btn">collect reward</div>' +
    '</div>';

  document.body.appendChild(overlay);
  overlay.querySelector('#qc-close-btn').onclick = async () => {
    overlay.remove();
    // Re-render quest view so gold + resolved quests update
    const el2 = document.getElementById('view-quest');
    if (el2) {
      const c2 = await loadCharacter();
      const e2 = loadEvents();
      renderQuest(el2, c2, e2);
    }
  };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

export async function initQuestView() {
  dropRandomLoot();
  setTimeout(resolveCompletedQuests, 800);
  // Re-render quest char when cloud hydration lands (may bring You card data)
  window.addEventListener('cloud:hydrated', async () => {
    const fresh = await loadCharacter();
    if (fresh) {
      // Re-render the mii + stats without reiniting the whole view
      const { renderChar } = await import('./quest.js').catch(() => ({}));
      // Fallback: just re-call the render portion directly
      try {
        const miiEl = document.getElementById('quest-mii');
        const nameEl = document.getElementById('quest-char-name');
        const classEl = document.getElementById('quest-char-class');
        if (nameEl) nameEl.textContent = fresh.name || 'Wanderer';
        if (classEl) classEl.textContent = fresh.class || '';
        if (miiEl && fresh.portrait_base64) {
          miiEl.innerHTML = '<img src="' + fresh.portrait_base64 + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
        }
        // Update stat badges
        ['atk','def','wit','luk'].forEach(stat => {
          const el = document.getElementById('quest-stat-' + stat);
          if (el) el.textContent = fresh[stat] || 0;
        });
      } catch(e) { console.warn('[quest] re-render failed:', e); }
    }
  }, { once: true });

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
