// ============================================================
// SPIRALSIDE — QUEST VIEW v2.0
// RPG character sheet redesign — stat bars, arc panel,
// status effects, hero quest card, compact upcoming rows.
// Nimbis anchor: js/app/views/quest.js
// ============================================================

import { syncSave, syncLoad } from '../sync.js';

let _initialized = false;

function injectQuestStyles() {
  if (document.getElementById('quest-styles')) return;
  const s = document.createElement('style');
  s.id = 'quest-styles';
  s.textContent = `
    #view-quest {
      display: none; flex-direction: column; height: 100%;
      overflow-y: auto; overflow-x: hidden;
      background: var(--bg);
      padding: 0 0 calc(80px + var(--safe-bot,0px)) 0;
      -webkit-overflow-scrolling: touch;
    }
    #view-quest.active { display: flex; }

    .q-status-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px 8px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }
    .q-char-name {
      font-family: var(--font-display); font-weight: 700; font-size: 1rem;
      color: var(--text); line-height: 1;
    }
    .q-char-class { font-size: 0.6rem; color: var(--subtext); letter-spacing: 0.06em; margin-top: 2px; }
    .q-lv-badge { font-size: 0.65rem; color: #FFD93D; letter-spacing: 0.1em; text-transform: uppercase; }

    .q-sheet-row { display: flex; gap: 0; border-bottom: 1px solid var(--border); }
    .q-portrait {
      width: 80px; min-height: 96px; background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; position: relative; overflow: hidden;
    }
    .q-portrait img { width: 100%; height: 100%; object-fit: cover; object-position: center top; }
    .q-lv-pip {
      position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%);
      background: rgba(10,10,15,0.85); border: 1px solid #FFD93D55;
      border-radius: 4px; font-size: 0.55rem; color: #FFD93D;
      padding: 1px 6px; letter-spacing: 0.08em; white-space: nowrap;
    }
    .q-stats-col {
      flex: 1; padding: 10px 14px; display: flex; flex-direction: column;
      justify-content: space-between; gap: 4px;
    }
    .q-stat-row { display: flex; align-items: center; gap: 0; }
    .q-stat-label { font-size: 0.6rem; color: var(--subtext); letter-spacing: 0.1em; text-transform: uppercase; width: 28px; flex-shrink: 0; }
    .q-stat-bar-bg { flex: 1; height: 3px; background: var(--muted); border-radius: 2px; overflow: hidden; margin: 0 8px; }
    .q-stat-bar { height: 100%; border-radius: 2px; }
    .q-stat-val { font-size: 0.65rem; width: 18px; text-align: right; letter-spacing: 0.04em; }
    .q-stat-atk .q-stat-bar { background: #ff6b6b; } .q-stat-atk .q-stat-val { color: #ff6b6b; }
    .q-stat-def .q-stat-bar { background: #4DA3FF; } .q-stat-def .q-stat-val { color: #4DA3FF; }
    .q-stat-wit .q-stat-bar { background: #7c6af7; } .q-stat-wit .q-stat-val { color: #7c6af7; }
    .q-stat-luk .q-stat-bar { background: #00F6D6; } .q-stat-luk .q-stat-val { color: #00F6D6; }
    .q-hp-row {
      display: flex; align-items: center; gap: 0; margin-top: 2px;
      padding-top: 6px; border-top: 1px solid var(--border);
    }
    .q-hp-label { font-size: 0.6rem; color: var(--subtext); letter-spacing: 0.1em; text-transform: uppercase; width: 28px; flex-shrink: 0; }
    .q-hp-bar-bg { flex: 1; height: 5px; background: var(--muted); border-radius: 2px; overflow: hidden; margin: 0 8px; }
    .q-hp-bar { height: 100%; background: #ff6b6b; border-radius: 2px; transition: width 0.6s ease; }
    .q-hp-val { font-size: 0.65rem; color: #ff6b6b; width: 46px; text-align: right; letter-spacing: 0.04em; }

    .q-xp-strip { background: var(--surface); border-bottom: 1px solid var(--border); padding: 8px 16px; }
    .q-xp-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .q-xp-lbl { font-size: 0.6rem; color: var(--subtext); letter-spacing: 0.1em; text-transform: uppercase; }
    .q-xp-nums { font-size: 0.65rem; color: #FFD93D; letter-spacing: 0.06em; }
    .q-xp-bar-bg { height: 4px; background: var(--muted); border-radius: 2px; overflow: hidden; }
    .q-xp-bar { height: 100%; background: linear-gradient(90deg,#FFD93D,#FF4BCB); border-radius: 2px; transition: width 0.6s ease; }
    .q-xp-meta { display: flex; gap: 12px; margin-top: 5px; }
    .q-xp-chip { font-size: 0.58rem; color: var(--subtext); letter-spacing: 0.06em; }
    .q-xp-chip span { color: #FFD93D; }

    .q-rule { display: flex; align-items: center; padding: 10px 16px 4px; gap: 8px; }
    .q-rule-line { flex: 1; height: 1px; background: var(--border); }
    .q-rule-text { font-size: 0.58rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--subtext); white-space: nowrap; }
    .q-rule-right { font-size: 0.58rem; color: var(--subtext); white-space: nowrap; margin-left: 6px; }

    .q-arc-panel {
      margin: 4px 12px 8px; background: var(--surface);
      border: 1px solid rgba(124,106,247,0.25); border-radius: 8px; padding: 10px 12px;
    }
    .q-arc-lbl { font-size: 0.58rem; color: #7c6af7; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 4px; }
    .q-arc-text { font-size: 0.78rem; color: var(--subtext); font-style: italic; line-height: 1.55; }

    .q-buffs { display: flex; gap: 6px; padding: 2px 12px 10px; flex-wrap: wrap; }
    .q-buff {
      display: inline-flex; align-items: center; gap: 4px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 20px; padding: 3px 10px 3px 8px;
      font-size: 0.62rem; color: var(--subtext); white-space: nowrap;
    }
    .q-buff.pos { border-color: rgba(0,246,214,0.35); color: #00F6D6; }
    .q-buff.neg { border-color: rgba(255,107,107,0.35); color: #ff6b6b; }

    .q-hero-card {
      margin: 4px 12px 8px; background: var(--surface);
      border: 1px solid rgba(0,246,214,0.25); border-radius: 10px; padding: 14px;
    }
    .q-hero-top { display: flex; gap: 12px; align-items: flex-start; }
    .q-hero-icon { font-size: 1.6rem; flex-shrink: 0; line-height: 1; }
    .q-hero-body { flex: 1; min-width: 0; }
    .q-hero-title { font-size: 0.88rem; font-weight: 700; color: var(--text); margin-bottom: 2px; font-family: var(--font-display); }
    .q-hero-date { font-size: 0.62rem; color: #00F6D6; letter-spacing: 0.06em; margin-bottom: 5px; }
    .q-hero-source { font-size: 0.6rem; color: var(--subtext); letter-spacing: 0.04em; margin-bottom: 4px; }
    .q-hero-lore { font-size: 0.75rem; color: var(--subtext); line-height: 1.55; font-style: italic; margin-bottom: 8px; }
    .q-hero-footer { display: flex; align-items: center; gap: 8px; }
    .q-tag { font-size: 0.58rem; padding: 2px 8px; border-radius: 20px; letter-spacing: 0.06em; text-transform: uppercase; }
    .tag-active { background: rgba(0,246,214,0.12); color: #00F6D6; border: 1px solid rgba(0,246,214,0.3); }
    .tag-idle   { background: var(--surface); color: var(--subtext); border: 1px solid var(--border); }
    .tag-locked { background: rgba(255,211,61,0.1); color: #FFD93D; border: 1px solid rgba(255,211,61,0.3); }
    .tag-done   { background: rgba(106,247,200,0.1); color: #6af7c8; border: 1px solid rgba(106,247,200,0.3); }
    .q-hero-reward { margin-left: auto; font-size: 0.65rem; color: #7c6af7; }
    .q-prog-bg { height: 4px; background: var(--muted); border-radius: 2px; overflow: hidden; margin-top: 10px; }
    .q-prog { height: 100%; background: #00F6D6; border-radius: 2px; transition: width 0.5s ease; }
    .q-play-link {
      display: inline-flex; align-items: center; gap: 6px;
      margin-top: 10px; padding: 7px 14px;
      background: rgba(0,246,214,0.08); border: 1px solid rgba(0,246,214,0.3);
      border-radius: 7px; font-size: 0.68rem; color: #00F6D6;
      letter-spacing: 0.08em; text-decoration: none; cursor: pointer;
      font-family: var(--font-ui); transition: background 0.15s;
    }
    .q-play-link:hover { background: rgba(0,246,214,0.15); }

    .q-row {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 16px; border-bottom: 1px solid var(--border);
      transition: background 0.15s;
    }
    .q-row:active { background: var(--surface); }
    .q-row-icon { width: 34px; height: 34px; background: var(--surface); border: 1px solid var(--border); border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
    .q-row-body { flex: 1; min-width: 0; }
    .q-row-title { font-size: 0.8rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .q-row-sub { font-size: 0.6rem; color: var(--subtext); margin-top: 1px; }
    .q-row-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .q-row-gold { font-size: 0.62rem; color: #7c6af7; }
    .q-row-done { opacity: 0.45; }

    .q-empty { padding: 28px 16px; text-align: center; color: var(--subtext); font-size: 0.75rem; line-height: 1.8; }

    .q-shop-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; padding: 6px 12px 8px; }
    .q-shop-item { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 10px 6px; text-align: center; cursor: pointer; transition: all 0.15s; }
    .q-shop-item:hover { border-color: rgba(255,211,61,0.4); transform: translateY(-1px); }
    .q-shop-item:active { transform: scale(0.97); }
    .q-shop-item.cant-afford { opacity: 0.35; pointer-events: none; }
    .q-shop-icon { font-size: 1.3rem; margin-bottom: 4px; }
    .q-shop-name { font-size: 0.58rem; color: var(--text); letter-spacing: 0.04em; margin-bottom: 3px; line-height: 1.3; }
    .q-shop-price { font-size: 0.65rem; color: #FFD93D; }
    .q-shop-effect { font-size: 0.55rem; color: var(--subtext); margin-top: 2px; }

    .q-inv { display: flex; gap: 6px; flex-wrap: wrap; padding: 4px 12px 10px; min-height: 28px; }
    .q-inv-item { background: var(--surface); border: 1px solid var(--border); border-radius: 7px; padding: 3px 9px 3px 7px; font-size: 0.65rem; color: var(--subtext); display: flex; align-items: center; gap: 5px; cursor: pointer; transition: border-color 0.15s; }
    .q-inv-item:hover { border-color: var(--accent2); }
    .q-inv-empty { font-size: 0.62rem; color: var(--subtext); opacity: 0.4; padding: 4px 0; }

    .q-cal { padding: 8px 12px 12px; }
    .q-cal-month { font-size: 0.62rem; color: var(--subtext); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
    .q-cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px; }
    .q-cal-dh { font-size: 0.55rem; color: var(--subtext); text-align: center; opacity: 0.4; padding-bottom: 3px; letter-spacing: 0.06em; }
    .q-cal-d { font-size: 0.7rem; text-align: center; padding: 5px 2px; border-radius: 5px; color: var(--subtext); opacity: 0.3; }
    .q-cal-d.live { opacity: 0.7; }
    .q-cal-d.has-ev { color: #FF4BCB; background: rgba(255,75,203,0.1); opacity: 1; }
    .q-cal-d.today { background: rgba(255,211,61,0.15); color: #FFD93D; border: 1px solid rgba(255,211,61,0.3); font-weight: 700; opacity: 1; }

    .q-add-btn {
      width: calc(100% - 24px); margin: 0 12px 12px; padding: 11px; border-radius: 8px;
      background: transparent; border: 1px dashed var(--border);
      color: var(--subtext); font-family: var(--font-ui); font-size: 0.68rem; letter-spacing: 0.08em;
      cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .q-add-btn:hover { border-color: rgba(255,211,61,0.4); color: #FFD93D; }

    .q-modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.75);
      z-index: 9000; display: none; align-items: center; justify-content: center; padding: 20px;
    }
    .q-modal-overlay.open { display: flex; }
    .q-modal { width: 100%; max-width: 400px; background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 22px 18px; max-height: 90dvh; overflow-y: auto; }
    .q-modal-title { font-family: var(--font-display); font-size: 0.9rem; font-weight: 700; color: var(--text); margin-bottom: 14px; }
    .q-field { margin-bottom: 12px; }
    .q-field label { display: block; font-size: 0.58rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--subtext); margin-bottom: 5px; }
    .q-field input { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; color: var(--text); font-family: var(--font-ui); font-size: 0.78rem; outline: none; transition: border-color 0.2s; }
    .q-field input:focus { border-color: #FFD93D; }
    .q-modal-btns { display: flex; gap: 8px; margin-top: 14px; }
    .q-modal-cancel { flex: 1; padding: 10px; background: transparent; border: 1px solid var(--border); border-radius: 8px; color: var(--subtext); font-family: var(--font-ui); font-size: 0.75rem; cursor: pointer; transition: all 0.2s; }
    .q-modal-cancel:hover { border-color: var(--accent2); color: var(--accent2); }
    .q-modal-save { flex: 2; padding: 10px; background: linear-gradient(135deg,#FFD93D,#FFa500); border: none; border-radius: 8px; color: #101014; font-family: var(--font-display); font-weight: 700; font-size: 0.82rem; cursor: pointer; letter-spacing: 0.04em; }

    .q-cancel-btn {
      padding: 7px 12px; background: transparent;
      border: 1px solid rgba(255,107,107,0.3); border-radius: 7px;
      font-size: 0.65rem; color: rgba(255,107,107,0.6);
      letter-spacing: 0.08em; cursor: pointer;
      font-family: var(--font-ui); transition: all 0.15s;
    }
    .q-cancel-btn:hover { border-color: #ff6b6b; color: #ff6b6b; background: rgba(255,107,107,0.08); }

    .quest-loot-toast { position:fixed;top:calc(54px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%) translateY(-10px);background:#111118;border:1px solid #FFD93D;color:#FFD93D;font-family:var(--font-ui);font-size:.7rem;letter-spacing:.06em;padding:8px 16px;border-radius:20px;opacity:0;pointer-events:none;z-index:9999;transition:all .4s cubic-bezier(.34,1.56,.64,1);white-space:nowrap; }
    .quest-loot-toast.visible { opacity:1;transform:translateX(-50%) translateY(0); }
  `;
  document.head.appendChild(s);
}

// ── SHOP CATALOG ─────────────────────────────────────────────
const SHOP_CATALOG = [
  { id:'health_pot',  icon:'\u{1F9EA}', name:'Health Potion',  price:5,  effect:'+5 HP',        stat:null,  bonus:0,  duration:0 },
  { id:'rusty_sword', icon:'\u2694\uFE0F',  name:'Rusty Sword',   price:8,  effect:'+1 ATK 24h',   stat:'atk', bonus:1,  duration:86400000 },
  { id:'crk_shield',  icon:'\u{1F6E1}\uFE0F',  name:'Cracked Shield',price:8,  effect:'+1 DEF 24h',   stat:'def', bonus:1,  duration:86400000 },
  { id:'tome',        icon:'\u{1F4D6}', name:'Candle & Tome',  price:6,  effect:'+1 WIT 1 quest',stat:'wit', bonus:1,  duration:0 },
  { id:'mystery',     icon:'\u{1F3B2}', name:'Mystery Sack',   price:3,  effect:'1-3g inside',   stat:null,  bonus:0,  duration:0 },
  { id:'coin_charm',  icon:'\u{1F340}', name:'Coin Charm',     price:12, effect:'+1g quests tmr',stat:null,  bonus:0,  duration:86400000 },
  { id:'ward_stone',  icon:'\u{1F480}', name:'Ward Stone',     price:20, effect:'prevent 1 fail', stat:null, bonus:0,  duration:0 },
];

function getDailyShop() {
  const seed = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const n = parseInt(seed) % SHOP_CATALOG.length;
  return [SHOP_CATALOG[n%SHOP_CATALOG.length],SHOP_CATALOG[(n+2)%SHOP_CATALOG.length],SHOP_CATALOG[(n+4)%SHOP_CATALOG.length]];
}

// ── QUEST TEMPLATES ──────────────────────────────────────────
const QUEST_TEMPLATES = [
  { keywords: ['dentist','doctor','appointment','clinic','hospital'],
    name: e => `The Healer's Lair`, lore: e => `A summons from the White Coats. Your companion steels themself.`, icon: '\u{1F3E5}', xp: 80, gold: 1 },
  { keywords: ['meeting','standup','sync','call','zoom','team'],
    name: e => `Council of Endless Words`, lore: e => `The Verbose Elders gather. Survive ${e.title} without falling asleep.`, icon: '\u{1F9D9}', xp: 40, gold: 1 },
  { keywords: ['gym','workout','run','jog','exercise','yoga','crossfit'],
    name: e => `The Iron Trial`, lore: e => `The body is a dungeon. Enter it willingly.`, icon: '\u2694', xp: 120, gold: 2 },
  { keywords: ['birthday','party','dinner','celebration','wedding'],
    name: e => `The Grand Feast`, lore: e => `All the townsfolk gather. Bring gifts, bring charm.`, icon: '\u{1F389}', xp: 60, gold: 2 },
  { keywords: ['work','office','deadline','project','presentation','build','code','deploy','launch'],
    name: e => `The Grind Dungeon`, lore: e => `The tower never sleeps. Floor by floor, you climb.`, icon: '\u{1F5FC}', xp: 100, gold: 1 },
  { keywords: ['travel','flight','drive','trip','vacation'],
    name: e => `Journey to Unknown Lands`, lore: e => `Beyond the edge of the map lies ${e.title}. Pack light.`, icon: '\u{1F5FA}', xp: 150, gold: 2 },
  { keywords: ['school','class','study','exam','lecture','homework'],
    name: e => `The Scholar's Gauntlet`, lore: e => `Knowledge is power. The tome won't read itself.`, icon: '\u{1F4DA}', xp: 70, gold: 1 },
  { keywords: ['game','play','stream','fun','chill','hang','rest','relax'],
    name: e => `The Leisure Realm`, lore: e => `Even adventurers need a campfire. Recharge.`, icon: '\u{1F3D5}', xp: 30, gold: 1 },
  { keywords: ['eat','lunch','breakfast','food','cook','meal','dinner'],
    name: e => `The Tavern Run`, lore: e => `Sustenance. The quest demands it.`, icon: '\u{1F356}', xp: 20, gold: 1 },
];

function seedQuestFromEvent(ev) {
  const t = (ev.title || '').toLowerCase();
  const match = QUEST_TEMPLATES.find(tmpl => tmpl.keywords.some(k => t.includes(k)));
  const tmpl = match || { name: () => ev.title, lore: () => 'A mysterious summons arrives.', icon: '\u2753', xp: 50, gold: 2 };
  return {
    id:ev.id, icon:tmpl.icon, title:tmpl.name(ev), lore:tmpl.lore(ev),
    xp:tmpl.xp, gold:tmpl.gold, date:ev.date, time:ev.time||'',
    status:statusForDate(ev.date), progress:0,
    sourceEvent:ev.title, link:ev.link||'', linkLabel:ev.linkLabel||'',
  };
}

function formatQuestDate(dateStr, timeStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  let out = months[d.getMonth()] + ' ' + d.getDate();
  if (timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    out += ' \u00B7 ' + (h%12||12) + ':' + String(m).padStart(2,'0') + (h>=12?'pm':'am');
  }
  return out;
}

function statusForDate(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr + 'T00:00:00');
  if (d < today) return 'done';
  if (d.toDateString() === today.toDateString()) return 'active';
  return (d - today) / 86400000 <= 2 ? 'idle' : 'locked';
}

function loadEvents()    { try { return JSON.parse(localStorage.getItem('ss_quest_events') || '[]'); } catch { return []; } }
function saveEvents(evs) { localStorage.setItem('ss_quest_events', JSON.stringify(evs)); }
function saveCharacter(c){ localStorage.setItem('ss_quest_char', JSON.stringify(c)); syncSave('quest_char', c).catch(()=>{}); }
function loadResolved()  { try { return JSON.parse(localStorage.getItem('ss_quest_resolved') || '[]'); } catch { return []; } }
function markResolved(id){ const r=loadResolved(); if(!r.includes(id)){r.push(id);localStorage.setItem('ss_quest_resolved',JSON.stringify(r));} }

function readCodexYou() {
  return new Promise(resolve => {
    try {
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

function traitsToStats(traits) {
  const stats = { atk:10, def:8, wit:12, luk:9 };
  if (!traits || !traits.length) return stats;
  traits.forEach(t => {
    const n = (t.label||t.name||'').toLowerCase();
    const v = Math.round((t.score||t.value||50)/10);
    if (/curiosity|wit|intellect|clever|smart|knowledge/.test(n)) stats.wit = Math.min(20,8+v);
    else if (/energy|chaos|attack|strength|bold|fierce/.test(n)) stats.atk = Math.min(20,8+v);
    else if (/patience|trust|defense|calm|steady|loyal/.test(n)) stats.def = Math.min(20,8+v);
    else if (/luck|spark|charm|wild|random|creative/.test(n))    stats.luk = Math.min(20,8+v);
  });
  return stats;
}

async function loadCharacter() {
  const you = await readCodexYou();
  if (you && (you.handle || you.vibe)) {
    const stats = traitsToStats(you.traits);
    const base = JSON.parse(localStorage.getItem('ss_quest_char') || 'null') || {};
    return {
      name:you.handle||base.name||'Wanderer', class:you.vibe||base.class||'adventurer',
      arc:you.arc||you.vibe||'', portrait_base64:you.portrait_base64||base.portrait_base64||null,
      atk:stats.atk, def:stats.def, wit:stats.wit, luk:stats.luk,
      level:base.level||1, xp:base.xp||0, xpNext:base.xpNext||100,
      hairColor:base.hairColor||'#5a3a1a', skinColor:base.skinColor||'#FDDBB4', fromCodex:true,
    };
  }
  try { return JSON.parse(localStorage.getItem('ss_quest_char') || 'null'); } catch { return null; }
}

function defaultCharacter(name) {
  return { name:name||'Wanderer', class:'adventurer', arc:'', atk:10, def:8, wit:12, luk:9, level:1, xp:0, xpNext:100, hairColor:'#5a3a1a', skinColor:'#FDDBB4' };
}

function buildMiiSvg(char) {
  const skin=char.skinColor||'#FDDBB4', hair=char.hairColor||'#5a3a1a';
  return `<svg viewBox="0 0 46 46" xmlns="http://www.w3.org/2000/svg" style="width:52px;height:52px"><ellipse cx="23" cy="14" rx="14" ry="10" fill="${hair}"/><ellipse cx="23" cy="22" rx="13" ry="14" fill="${skin}"/><rect x="9" y="8" width="28" height="10" rx="5" fill="${hair}"/><ellipse cx="18" cy="20" rx="2.5" ry="3.5" fill="#222"/><ellipse cx="28" cy="20" rx="2.5" ry="3.5" fill="#222"/><circle cx="19" cy="19" r="0.8" fill="#fff"/><circle cx="29" cy="19" r="0.8" fill="#fff"/><path d="M18.5 27 Q23 31 27.5 27" fill="none" stroke="#c0705a" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="10" cy="22" rx="2" ry="2.5" fill="${skin}"/><ellipse cx="36" cy="22" rx="2" ry="2.5" fill="${skin}"/></svg>`;
}

// ── RENDER ────────────────────────────────────────────────────
function renderQuest(el, char, events) {
  const resolved = loadResolved();
  const allQuests = events.map(seedQuestFromEvent);
  const activeQuests   = allQuests.filter(q => q.status==='active' && !resolved.includes(q.id));
  const upcomingQuests = allQuests.filter(q => q.status!=='done' && q.status!=='active' && !resolved.includes(q.id));
  const doneQuests     = allQuests.filter(q => q.status==='done' || resolved.includes(q.id)).slice(0,3);

  const _xps   = (typeof getXPState !== 'undefined' && getXPState()) || null;
  const _xpLv  = _xps ? _xps.level   : (char.level||1);
  const _xpCur = _xps ? _xps.xp      : (char.xp||0);
  const _xpNxt = _xps ? _xps.xpNext  : (char.xpNext||100);
  const xpPct  = Math.min(100, Math.round((_xpCur/Math.max(1,_xpNxt))*100));
  const gold   = _xps ? (_xps.gold||0) : 0;
  const streak = _xps ? (_xps.streakDays||0) : 0;

  // HP = flavor: streak * 8 + 50, clamped 10-100
  const hp     = Math.min(100, Math.max(10, streak*8+50));
  const atkPct = Math.round((char.atk||10)/20*100);
  const defPct = Math.round((char.def||8)/20*100);
  const witPct = Math.round((char.wit||12)/20*100);
  const lukPct = Math.round((char.luk||9)/20*100);

  // Calendar
  const now2 = new Date();
  const year=now2.getFullYear(), month=now2.getMonth();
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const monthName=now2.toLocaleDateString('en-US',{month:'long',year:'numeric'}).toLowerCase();
  const todayNum=now2.getDate();
  const eventDates=new Set(events.filter(e=>{const d=new Date(e.date+'T00:00:00');return d.getMonth()===month&&d.getFullYear()===year;}).map(e=>new Date(e.date+'T00:00:00').getDate()));
  const calDayLabels=['s','m','t','w','t','f','s'].map(d=>`<div class="q-cal-dh">${d}</div>`).join('');
  const calEmpties=Array(firstDay).fill('<div class="q-cal-d"></div>').join('');
  const calDays=Array.from({length:daysInMonth},(_,i)=>{const d=i+1,isToday=d===todayNum,hasEv=eventDates.has(d);return `<div class="q-cal-d${isToday?' today':hasEv?' has-ev':' live'}">${d}</div>`;}).join('');

  const portraitHTML = char.portrait_base64
    ? `<img src="${char.portrait_base64}" />`
    : buildMiiSvg(char);

  const arcText = char.arc || '';
  const items   = (_xps && _xps.items) || [];

  // Status effects from inventory items + HP debuff
  const buffChips = items.filter(i => i.stat || (i.name && !i.isLoot)).map(i =>
    `<div class="q-buff pos">${i.icon||'\u2736'} ${i.name}</div>`
  ).join('');
  const hpDebuff = hp < 60 ? `<div class="q-buff neg">\u26A0 rest needed</div>` : '';
  const allBuffs = buffChips + hpDebuff;

  // Hero card for an active quest
  function heroCard(q) {
    const dateStr = formatQuestDate(q.date, q.time);
    // Time-based progress: percent of day elapsed toward event time
    let prog = 0;
    if (q.time) {
      const [h,m] = q.time.split(':').map(Number);
      const evTime = new Date(q.date+'T00:00:00'); evTime.setHours(h,m,0,0);
      const startOfDay = new Date(q.date+'T00:00:00');
      prog = Math.min(100, Math.max(0, Math.round((Date.now()-startOfDay.getTime())/(evTime.getTime()-startOfDay.getTime())*100)));
    }
    // Play button — <a> tag fires link directly, no JS onclick needed
    const playBtn = q.link
      ? `<a class="q-play-link" href="${q.link}" target="_blank" rel="noopener noreferrer">\u25B6 play</a>`
      : `<a class="q-play-link" style="opacity:0.4;pointer-events:none;cursor:default">\u25B6 play</a>`;
    return `<div class="q-hero-card">
      <div class="q-hero-top">
        <div class="q-hero-icon">${q.icon}</div>
        <div class="q-hero-body">
          <div class="q-hero-title">${q.title}</div>
          ${dateStr ? `<div class="q-hero-date">\u23F0 ${dateStr}</div>` : ''}
          <div class="q-hero-source">from: ${q.sourceEvent}</div>
          <div class="q-hero-lore">${q.lore}</div>
          <div class="q-hero-footer">
            <div class="q-tag tag-active">active</div>
            <div class="q-hero-reward">\u{1FA99} +${q.gold}g</div>
          </div>
        </div>
      </div>
      <div class="q-prog-bg"><div class="q-prog" style="width:${prog}%"></div></div>
      <div style="display:flex;gap:8px;align-items:center;">
        ${playBtn}
        <button class="q-cancel-btn" onclick="window._questCancel('${q.id}')">abandon</button>
      </div>
    </div>`;
  }

  // Compact row for upcoming / done quests
  function questRow(q) {
    const isDone = q.status==='done' || resolved.includes(q.id);
    return `<div class="q-row${isDone?' q-row-done':''}">
      <div class="q-row-icon">${q.icon}</div>
      <div class="q-row-body">
        <div class="q-row-title">${q.title}</div>
        <div class="q-row-sub">from: ${q.sourceEvent}${q.date?' \u00B7 '+formatQuestDate(q.date,q.time):''}</div>
      </div>
      <div class="q-row-right">
        <div class="q-tag tag-${isDone?'done':q.status}">${isDone?'done':q.status}</div>
        <div class="q-row-gold">+${q.gold}g</div>
      </div>
    </div>`;
  }

  const activeSection = activeQuests.length
    ? activeQuests.map(heroCard).join('')
    : `<div class="q-empty">no active quests today.<br>add calendar events and they become adventures.</div>`;

  const upcomingSection = [...upcomingQuests, ...doneQuests].length
    ? [...upcomingQuests, ...doneQuests].map(questRow).join('')
    : '';

  el.innerHTML = `
    <div class="q-status-bar">
      <div><div class="q-char-name">${char.name}</div><div class="q-char-class">${char.class}</div></div>
      <div class="q-lv-badge">LV ${_xpLv}</div>
    </div>

    <div class="q-sheet-row">
      <div class="q-portrait">${portraitHTML}<div class="q-lv-pip">lv ${_xpLv}</div></div>
      <div class="q-stats-col">
        <div class="q-stat-row q-stat-atk"><span class="q-stat-label">ATK</span><div class="q-stat-bar-bg"><div class="q-stat-bar" style="width:${atkPct}%"></div></div><span class="q-stat-val">${char.atk||10}</span></div>
        <div class="q-stat-row q-stat-def"><span class="q-stat-label">DEF</span><div class="q-stat-bar-bg"><div class="q-stat-bar" style="width:${defPct}%"></div></div><span class="q-stat-val">${char.def||8}</span></div>
        <div class="q-stat-row q-stat-wit"><span class="q-stat-label">WIT</span><div class="q-stat-bar-bg"><div class="q-stat-bar" style="width:${witPct}%"></div></div><span class="q-stat-val">${char.wit||12}</span></div>
        <div class="q-stat-row q-stat-luk"><span class="q-stat-label">LUK</span><div class="q-stat-bar-bg"><div class="q-stat-bar" style="width:${lukPct}%"></div></div><span class="q-stat-val">${char.luk||9}</span></div>
        <div class="q-hp-row"><span class="q-hp-label">HP</span><div class="q-hp-bar-bg"><div class="q-hp-bar" style="width:${hp}%"></div></div><span class="q-hp-val">${hp}/100</span></div>
      </div>
    </div>

    <div class="q-xp-strip">
      <div class="q-xp-top"><span class="q-xp-lbl">EXPERIENCE</span><span class="q-xp-nums">${_xpCur} / ${_xpNxt} xp</span></div>
      <div class="q-xp-bar-bg"><div class="q-xp-bar" style="width:${xpPct}%"></div></div>
      <div class="q-xp-meta">
        <span class="q-xp-chip">daily <span>${_xps?_xps.dailyXP:0}/${_xps?_xps.dailyCap:10}</span></span>
        <span class="q-xp-chip">streak <span>${streak}d</span></span>
        <span class="q-xp-chip">total <span>${_xps?_xps.totalXP:0}</span></span>
        <span class="q-xp-chip" style="margin-left:auto;color:#FFD93D">\u{1FA99} <span>${gold}g</span></span>
      </div>
    </div>

    ${arcText ? `
      <div class="q-rule"><div class="q-rule-line"></div><span class="q-rule-text">current arc</span><div class="q-rule-line"></div></div>
      <div class="q-arc-panel"><div class="q-arc-lbl">active story thread</div><div class="q-arc-text">${arcText}</div></div>
    ` : ''}

    ${allBuffs ? `
      <div class="q-rule"><div class="q-rule-line"></div><span class="q-rule-text">status effects</span><div class="q-rule-line"></div></div>
      <div class="q-buffs">${allBuffs}</div>
    ` : ''}

    <div class="q-rule"><div class="q-rule-line"></div><span class="q-rule-text">active quests</span><div class="q-rule-line"></div></div>
    ${activeSection}

    ${upcomingSection ? `
      <div class="q-rule"><div class="q-rule-line"></div><span class="q-rule-text">upcoming</span><div class="q-rule-line"></div></div>
      <div>${upcomingSection}</div>
    ` : ''}

    <div class="q-rule"><div class="q-rule-line"></div><span class="q-rule-text">wandering merchant</span><span class="q-rule-right">rotates daily</span></div>
    <div class="q-shop-grid" id="q-shop-grid">
      ${getDailyShop().map(item => {
        const ca = gold < item.price ? ' cant-afford' : '';
        return `<div class="q-shop-item${ca}" onclick="window._questBuyItem('${item.id}')">
          <div class="q-shop-icon">${item.icon}</div>
          <div class="q-shop-name">${item.name}</div>
          <div class="q-shop-price">${item.price}g</div>
          <div class="q-shop-effect">${item.effect}</div>
        </div>`;
      }).join('')}
    </div>

    <div class="q-rule"><div class="q-rule-line"></div><span class="q-rule-text">inventory</span><div class="q-rule-line"></div></div>
    <div class="q-inv" id="q-inv-wrap">
      ${items.length
        ? items.map(i => `<div class="q-inv-item" onclick="window._questUseItem('${i.id}')">${i.icon||''} ${i.name}</div>`).join('')
        : '<div class="q-inv-empty">no items yet</div>'}
    </div>

    <div class="q-rule"><div class="q-rule-line"></div><span class="q-rule-text">this month</span><div class="q-rule-line"></div></div>
    <div class="q-cal">
      <div class="q-cal-month">${monthName}</div>
      <div class="q-cal-grid">${calDayLabels}${calEmpties}${calDays}</div>
    </div>

    <button class="q-add-btn" id="q-add-btn">+ add calendar event</button>

    <div class="q-modal-overlay" id="q-modal-overlay">
      <div class="q-modal">
        <div class="q-modal-title">new event</div>
        <div class="q-field"><label>event title</label><input type="text" id="q-ev-title" placeholder="e.g. dentist, team meeting, gym..." /></div>
        <div class="q-field"><label>date</label><input type="date" id="q-ev-date" /></div>
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <div class="q-field" style="flex:1;margin:0"><label>time (opt)</label><input type="time" id="q-ev-time" style="color-scheme:dark;" /></div>
        </div>
        <div class="q-field"><label>launch link (opt)</label><input type="url" id="q-ev-link" placeholder="https://..." /></div>
        <div class="q-field"><label>button label (opt)</label><input type="text" id="q-ev-linklabel" placeholder="e.g. Pay Bill, Open Map" /></div>
        <div class="q-modal-btns">
          <button class="q-modal-cancel" id="q-modal-cancel">cancel</button>
          <button class="q-modal-save" id="q-modal-save">add quest</button>
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
      const grid = document.getElementById('q-shop-grid');
      if (grid) { grid.style.opacity='0.5'; setTimeout(()=>grid.style.opacity='1',400); }
      return;
    }
    if (itemId === 'mystery') {
      const bonus = Math.floor(Math.random()*3)+1;
      if (window.awardGold) await window.awardGold(bonus);
      if (window.showXPGain) window.showXPGain(bonus, 'mystery');
    } else {
      if (window.addItem) await window.addItem({
        id: item.id+'_'+Date.now(), name:item.name, icon:item.icon,
        stat:item.stat, bonus:item.bonus, expiresAt:item.duration?Date.now()+item.duration:null,
      });
    }
    const el2 = document.getElementById('view-quest');
    if (el2) { const c2 = await loadCharacter(); const e2 = loadEvents(); renderQuest(el2,c2,e2); }
  };

  window._questUseItem = async (itemId) => {
    if (!window.consumeItem) return;
    const xps2 = window.getXPState ? window.getXPState() : null;
    const item2 = xps2 && xps2.items ? xps2.items.find(i => i.id===itemId) : null;
    await window.consumeItem(itemId);
    if (item2 && item2.isLoot && item2.use_text) showLootToast(item2.icon+' '+item2.use_text);
    const el2 = document.getElementById('view-quest');
    if (el2) { const c2 = await loadCharacter(); const e2 = loadEvents(); renderQuest(el2,c2,e2); }
  };

  // Abandon an active quest — marks resolved without awarding gold
  window._questCancel = async (questId) => {
    markResolved(questId);
    const el2 = document.getElementById('view-quest');
    if (el2) { const c2 = await loadCharacter(); const e2 = loadEvents(); renderQuest(el2,c2,e2); }
  };

  // Move modal to body so it escapes overflow:hidden
  const _mo = document.getElementById('q-modal-overlay');
  if (_mo && _mo.parentElement !== document.body) document.body.appendChild(_mo);

  document.getElementById('q-add-btn').onclick = () => {
    document.getElementById('q-ev-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('q-ev-title').value = '';
    document.getElementById('q-modal-overlay').classList.add('open');
  };
  document.getElementById('q-modal-cancel').onclick = () =>
    document.getElementById('q-modal-overlay').classList.remove('open');
  document.getElementById('q-modal-overlay').onclick = (e) => {
    if (e.target === document.getElementById('q-modal-overlay'))
      document.getElementById('q-modal-overlay').classList.remove('open');
  };
  document.getElementById('q-modal-save').onclick = () => {
    const title = document.getElementById('q-ev-title').value.trim();
    const date  = document.getElementById('q-ev-date').value;
    const time  = (document.getElementById('q-ev-time')||{}).value||'';
    if (!title || !date) return;
    const link      = (document.getElementById('q-ev-link')||{}).value.trim()||'';
    const linkLabel = (document.getElementById('q-ev-linklabel')||{}).value.trim()||'';
    const evs = loadEvents();
    evs.push({id:Date.now().toString(), title, date, time, link, linkLabel});
    saveEvents(evs);
    document.getElementById('q-modal-overlay').classList.remove('open');
    if (window.awardXP) window.awardXP('quest_event_added').then(r => {
      if (r && r.xpAwarded > 0 && window.showXPGain) window.showXPGain(r.xpAwarded, 'quest');
    });
    renderQuest(el, char, evs);
  };
}

// ── LOOT DROP ────────────────────────────────────────────────
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
    {i:'key',n:'unlabeled key',u:"fits nothing you own."},
    {i:'cork',n:'a cork',u:'from a bottle of something forgotten.'},
    {i:'feather',n:'black feather',u:'from no bird you know.'},
    {i:'coin',n:'coin from nowhere',u:'currency of a place that does not exist.'},
    {i:'nail',n:'iron nail',u:'slightly bent. slightly judging you.'},
    {i:'chalk',n:'piece of chalk',u:'writes one word before it crumbles.'},
    {i:'tooth',n:'a tooth',u:'not yours. you hope.'},
    {i:'candle',n:'used candle',u:'burned down to the message.'},
    {i:'hat',n:'very small hat',u:'fits no one you know.'},
  ];
  const p = L[Math.floor(Math.random()*L.length)];
  const icons = {rock:128299,sock:129510,spoon:129364,scroll:128220,jar:129529,card:127183,button:128280,die:127922,note:128221,bone:129462,marble:128302,key:128505,cork:127870,feather:129718,coin:129689,nail:128296,chalk:128397,tooth:129463,candle:129457,hat:127913};
  const icon = String.fromCodePoint(icons[p.i]||128280);
  showLootCard({id:'loot_'+Date.now(), name:p.n, icon, use_text:p.u, stat:null, bonus:0, expiresAt:null, isLoot:true});
}

function showLootCard(item) {
  if (!document.getElementById('loot-card-styles')) {
    const st = document.createElement('style'); st.id = 'loot-card-styles';
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
  const xps=window.getXPState?window.getXPState():null;
  const gold=xps?(xps.gold||0):0, streak=xps?(xps.streakDays||1):1, level=xps?(xps.level||1):1;
  const rarities=['common junk','strange find','odd relic','cursed object','forgotten thing'];
  const rarity = rarities[item.name.length % rarities.length];
  const overlay = document.createElement('div'); overlay.className='loot-overlay'; overlay.id='loot-overlay';
  overlay.innerHTML = '<div class="loot-card"><div class="loot-found-badge">item found</div><div class="loot-header"><div class="loot-icon-wrap"><span style="font-size:24px">'+item.icon+'</span></div><div><div class="loot-name">'+item.name+'</div><div class="loot-rarity">'+rarity+'</div></div></div><div class="loot-divider"></div><div class="loot-use">"'+item.use_text+'"</div><div class="loot-stats"><div class="loot-stat"><div class="loot-stat-val" style="color:#FFD93D">'+gold+'g</div><div class="loot-stat-lbl">gold</div></div><div class="loot-stat"><div class="loot-stat-val" style="color:#00F6D6">'+streak+'d</div><div class="loot-stat-lbl">streak</div></div><div class="loot-stat"><div class="loot-stat-val" style="color:#FF4BCB">lv '+level+'</div><div class="loot-stat-lbl">level</div></div></div><div class="loot-btns"><div class="loot-btn-use" id="loot-use-btn">use item</div><div class="loot-btn-toss" id="loot-toss-btn">toss</div></div></div>';
  document.body.appendChild(overlay);
  const close = () => { overlay.style.opacity='0'; overlay.style.transition='opacity 0.2s'; setTimeout(()=>overlay.remove(),200); };
  overlay.querySelector('#loot-use-btn').onclick = async (e) => {
    e.stopPropagation(); close();
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;top:calc(54px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);background:#111118;border:1px solid #FFD93D;color:#FFD93D;font-family:var(--font-ui);font-size:.7rem;padding:8px 16px;border-radius:20px;z-index:9999;white-space:nowrap;';
    flash.textContent = item.icon+' '+item.use_text;
    document.body.appendChild(flash); setTimeout(()=>flash.remove(),3000);
  };
  overlay.querySelector('#loot-toss-btn').onclick = async (e) => {
    e.stopPropagation(); if(window.consumeItem&&item.id)await window.consumeItem(item.id); close();
  };
  overlay.onclick = close;
  overlay.querySelector('.loot-card').onclick = e => e.stopPropagation();
}

function showLootToast(msg) {
  let toast = document.getElementById('quest-loot-toast');
  if (!toast) { toast=document.createElement('div'); toast.id='quest-loot-toast'; toast.className='quest-loot-toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  requestAnimationFrame(()=>requestAnimationFrame(()=>toast.classList.add('visible')));
  toast.style.pointerEvents='all'; toast.style.cursor='pointer';
  const _d = () => { toast.classList.remove('visible'); setTimeout(()=>toast.remove(),400); toast.removeEventListener('click',_d); };
  toast.addEventListener('click', _d); setTimeout(_d, 8000);
}

// ── IDLE RESOLVE ─────────────────────────────────────────────
async function resolveCompletedQuests() {
  const events = loadEvents(), resolved = loadResolved();
  const today = new Date(); today.setHours(0,0,0,0);
  const now3 = new Date();
  const toResolve = events.filter(ev => {
    if (resolved.includes(ev.id)) return false;
    const d = new Date(ev.date+'T00:00:00');
    if (ev.time) {
      const [h,m] = ev.time.split(':').map(Number);
      const dt = new Date(ev.date+'T00:00:00'); dt.setHours(h,m,0,0);
      return now3 > dt;
    }
    return d < today;
  });
  if (!toResolve.length) return;
  const ev = toResolve[0];
  const t2 = (ev.title||'').toLowerCase();
  const tmpl = QUEST_TEMPLATES.find(tmpl => tmpl.keywords.some(k => t2.includes(k)));
  const gold2 = tmpl ? tmpl.gold : 1;
  markResolved(ev.id);
  if (window.awardGold) await window.awardGold(gold2);
  showQuestCompleteCard(ev, gold2);
}

function showQuestCompleteCard(ev, gold) {
  if (!document.getElementById('qc-styles')) {
    const st = document.createElement('style'); st.id='qc-styles';
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
  const tmpl2 = QUEST_TEMPLATES.find(t => t.keywords.some(k => (ev.title||'').toLowerCase().includes(k)));
  const questTitle = tmpl2 ? tmpl2.name(ev) : ev.title;
  const overlay = document.createElement('div'); overlay.className='qc-overlay';
  overlay.innerHTML = '<div class="qc-card"><div class="qc-badge">quest complete</div><div class="qc-title">'+questTitle+'</div><div class="qc-sub">from: '+ev.title+(ev.time?' \u00B7 '+ev.time:'')+'</div><div class="qc-reward"><div class="qc-gold">+'+gold+'g</div><div class="qc-reward-text">gold added to your pouch<br>well done, adventurer</div></div><div class="qc-btn" id="qc-close-btn">collect reward</div></div>';
  document.body.appendChild(overlay);
  overlay.querySelector('#qc-close-btn').onclick = async () => {
    overlay.remove();
    const el2 = document.getElementById('view-quest');
    if (el2) { const c2 = await loadCharacter(); const e2 = loadEvents(); renderQuest(el2,c2,e2); }
  };
  overlay.onclick = (e) => { if (e.target===overlay) overlay.remove(); };
}

// ── PUBLIC INIT ───────────────────────────────────────────────
export async function initQuestView() {
  dropRandomLoot();
  setTimeout(resolveCompletedQuests, 800);

  // Re-render when cloud hydration brings fresh You card data
  window.addEventListener('cloud:hydrated', async () => {
    const el = document.getElementById('view-quest');
    if (!el || !_initialized) return;
    const fresh = await loadCharacter();
    const evs   = loadEvents();
    if (fresh) renderQuest(el, fresh, evs);
  }, { once: true });

  const el = document.getElementById('view-quest');
  if (!el) return;
  _initialized = true;

  injectQuestStyles();

  let char = await loadCharacter();
  if (!char) {
    const botName = (typeof state !== 'undefined' && state.botName) ? state.botName : 'Wanderer';
    char = defaultCharacter(botName);
    saveCharacter(char);
  }

  const events = loadEvents();
  renderQuest(el, char, events);
}
