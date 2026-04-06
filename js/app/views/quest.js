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
    }
    .q-row-icon { width: 34px; height: 34px; background: var(--surface); border: 1px solid var(--border); border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
    .q-row-body { flex: 1; min-width: 0; }
    .q-row-title { font-size: 0.8rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .q-row-sub { font-size: 0.6rem; color: var(--subtext); margin-top: 1px; }
    .q-row-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .q-row-gold { font-size: 0.62rem; color: #7c6af7; }

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
    .q-cal-month { font-size: 0.62rem; color: var(--subtext); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; display:flex; align-items:center; justify-content:space-between; }
    .q-cal-legend { display:flex; gap:8px; }
    .q-cal-leg { font-size:0.5rem; color:var(--subtext); display:flex; align-items:center; gap:3px; letter-spacing:0.06em; }
    .q-cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; }
    .q-cal-dh { font-size: 0.48rem; color: var(--subtext); text-align: center; opacity: 0.4; padding-bottom: 3px; letter-spacing: 0.06em; }
    .q-cal-tile { position:relative; width:100%; aspect-ratio:1/1; border-radius:3px; overflow:hidden; cursor:default; }
    .q-cal-tile svg { width:100%; height:100%; display:block; }
    .q-cal-tile .tile-num { position:absolute; bottom:1px; right:2px; font-size:0.42rem; color:rgba(255,255,255,0.5); letter-spacing:0; line-height:1; pointer-events:none; }
    .q-cal-tile.today .tile-num { color:#FFD93D; font-weight:700; }

    .q-add-btn {
      width: calc(100% - 24px); margin: 0 12px 12px; padding: 11px; border-radius: 8px;
      background: transparent; border: 1px dashed var(--border);
      color: var(--subtext); font-family: var(--font-ui); font-size: 0.68rem; letter-spacing: 0.08em;
      cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .q-add-btn:hover { border-color: rgba(255,211,61,0.4); color: #FFD93D; }

    .q-clear-btn {
      width: calc(100% - 24px); margin: 0 12px 20px; padding: 9px;
      border-radius: 8px; background: transparent;
      border: 1px dashed rgba(255,107,107,0.2);
      color: rgba(255,107,107,0.35); font-family: var(--font-ui);
      font-size: 0.6rem; letter-spacing: 0.1em; cursor: pointer;
      transition: all 0.2s;
    }
    .q-clear-btn:hover { border-color: rgba(255,107,107,0.5); color: #ff6b6b; }

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

    .q-battle-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.88);
      z-index: 9500; display: flex; align-items: center; justify-content: center;
      padding: 20px; cursor: pointer;
    }
    .q-battle-card {
      width: 100%; max-width: 360px; background: #0d0d14;
      border: 1px solid #1e1e2e; border-radius: 14px;
      padding: 20px; cursor: default; font-family: var(--font-ui);
    }
    .q-battle-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .q-battle-title { font-size: 0.6rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--subtext); }
    .q-battle-tap-hint { font-size: 0.55rem; color: #2e2e40; letter-spacing: 0.08em; animation: tapPulseB 2s infinite; }
    @keyframes tapPulseB { 0%,100%{opacity:0.3;} 50%{opacity:0.8;} }
    .q-battle-enemy-name { font-family: var(--font-display); font-size: 0.95rem; font-weight: 700; color: var(--text); text-align: center; margin-bottom: 2px; }
    .q-battle-enemy-lore { font-size: 0.65rem; color: var(--subtext); text-align: center; font-style: italic; margin-bottom: 14px; line-height: 1.5; }
    .q-battle-combatants { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
    .q-combatant { flex: 1; }
    .q-combatant-name { font-size: 0.58rem; color: var(--subtext); letter-spacing: 0.08em; margin-bottom: 5px; text-transform: uppercase; }
    .q-combatant-hp-bar-bg { height: 6px; background: #1e1e2e; border-radius: 3px; overflow: hidden; margin-bottom: 3px; }
    .q-combatant-hp-bar { height: 100%; border-radius: 3px; transition: width 0.35s ease; }
    .q-combatant-hp-bar.you { background: #00F6D6; }
    .q-combatant-hp-bar.enemy { background: #ff6b6b; }
    .q-combatant-hp-val { font-size: 0.58rem; color: var(--subtext); letter-spacing: 0.06em; }
    .q-vs-badge { font-size: 0.6rem; color: #FFD93D; flex-shrink: 0; padding: 0 4px; }
    .q-battle-log { background: #07070c; border: 1px solid #1e1e2e; border-radius: 8px; padding: 10px 12px; height: 110px; overflow-y: auto; display: flex; flex-direction: column; gap: 3px; margin-bottom: 14px; }
    .q-battle-log::-webkit-scrollbar { width: 2px; }
    .q-battle-log::-webkit-scrollbar-thumb { background: #1e1e2e; }
    .q-blog-line { font-size: 0.65rem; line-height: 1.5; color: var(--subtext); }
    .q-blog-line.dmg-you { color: #ff6b6b; }
    .q-blog-line.dmg-enemy { color: #00F6D6; }
    .q-blog-line.system { color: #FFD93D; }
    .q-blog-line.result-win { color: #6af7c8; font-weight: 700; letter-spacing: 0.06em; }
    .q-blog-line.result-loss { color: #ff6b6b; font-weight: 700; letter-spacing: 0.06em; }
    .q-battle-stat-changes { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; min-height: 0; }
    .q-stat-delta { font-size: 0.6rem; padding: 2px 8px; border-radius: 20px; letter-spacing: 0.06em; }
    .q-stat-delta.up { background: rgba(106,247,200,0.12); color: #6af7c8; border: 1px solid rgba(106,247,200,0.3); }
    .q-stat-delta.down { background: rgba(255,107,107,0.1); color: #ff6b6b; border: 1px solid rgba(255,107,107,0.25); }
    .q-battle-close-btn { width: 100%; padding: 10px; background: rgba(124,106,247,0.1); border: 1px solid rgba(124,106,247,0.3); border-radius: 8px; color: #7c6af7; font-family: var(--font-ui); font-size: 0.72rem; letter-spacing: 0.08em; cursor: pointer; transition: background 0.15s; display: none; }
    .q-battle-close-btn.visible { display: block; }
    .q-battle-close-btn:hover { background: rgba(124,106,247,0.2); }

    /* -- DICE ROLLER -- */
    .q-dice-section { padding: 4px 12px 12px; }
    .q-dice-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
    .q-die { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; background: var(--surface); border: 1px solid var(--border); border-radius: 9px; padding: 9px 4px 7px; cursor: pointer; transition: all 0.14s; user-select: none; }
    .q-die:active { transform: scale(0.93); }
    .q-die:hover  { border-color: rgba(124,106,247,0.5); background: rgba(124,106,247,0.07); }
    .q-die.rolling { animation: diceShake 0.35s ease; }
    @keyframes diceShake { 0%,100% { transform: rotate(0deg) scale(1); } 20% { transform: rotate(-8deg) scale(1.08); } 50% { transform: rotate(6deg) scale(1.1); } 80% { transform: rotate(-4deg) scale(1.05); } }
    .q-die-face { font-size: 1.3rem; line-height: 1; }
    .q-die-label { font-size: 0.55rem; color: var(--subtext); letter-spacing: 0.08em; text-transform: uppercase; }
    .q-die[data-die="d4"]   { border-color: rgba(255,107,107,0.25); } .q-die[data-die="d4"]   .q-die-label { color: #ff6b6b; }
    .q-die[data-die="d6"]   { border-color: rgba(255,211,61,0.25);  } .q-die[data-die="d6"]   .q-die-label { color: #FFD93D; }
    .q-die[data-die="d8"]   { border-color: rgba(77,163,255,0.25);  } .q-die[data-die="d8"]   .q-die-label { color: #4DA3FF; }
    .q-die[data-die="d10"]  { border-color: rgba(0,246,214,0.25);   } .q-die[data-die="d10"]  .q-die-label { color: #00F6D6; }
    .q-die[data-die="d12"]  { border-color: rgba(255,75,203,0.25);  } .q-die[data-die="d12"]  .q-die-label { color: #FF4BCB; }
    .q-die[data-die="d20"]  { border-color: rgba(124,106,247,0.4); } .q-die[data-die="d20"] .q-die-label { color: #7c6af7; }
    .q-die[data-die="d100"] { border-color: rgba(106,247,200,0.25); } .q-die[data-die="d100"] .q-die-label { color: #6af7c8; }
    .q-die[data-die="fate"] { border-color: rgba(255,211,61,0.25);  } .q-die[data-die="fate"] .q-die-label { color: #FFD93D; }
    .q-die[data-die="coin"] { border-color: rgba(255,211,61,0.3);   } .q-die[data-die="coin"] .q-die-label { color: #FFD93D; }
    .q-dice-result { background: var(--surface); border: 1px solid var(--border); border-radius: 9px; padding: 11px 14px; display: flex; align-items: center; justify-content: space-between; min-height: 44px; }
    .q-dice-result.flash { animation: resultFlash 0.4s ease; }
    @keyframes resultFlash { 0%,100% { background: var(--surface); } 40% { background: rgba(124,106,247,0.15); border-color: rgba(124,106,247,0.5); } }
    .q-dice-result-main { font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; color: var(--text); line-height: 1; }
    .q-dice-result-label { font-size: 0.6rem; color: var(--subtext); letter-spacing: 0.08em; margin-top: 3px; }
    .q-dice-history { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; }
    .q-dice-hist-chip { font-size: 0.58rem; color: var(--subtext); background: var(--muted); border-radius: 4px; padding: 2px 6px; }
    .q-dice-mod-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .q-dice-mod-label { font-size: 0.6rem; color: var(--subtext); letter-spacing: 0.08em; white-space: nowrap; }
    .q-dice-mod-btns  { display: flex; gap: 4px; }
    .q-dice-mod-btn { width: 26px; height: 26px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; color: var(--subtext); font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.12s; }
    .q-dice-mod-btn:hover { border-color: var(--accent); color: var(--accent); }
    .q-dice-mod-val { font-size: 0.75rem; color: #7c6af7; min-width: 28px; text-align: center; border: 1px solid rgba(124,106,247,0.3); border-radius: 6px; padding: 2px 4px; background: rgba(124,106,247,0.07); }
    .q-dice-result-span { grid-column: 2 / 5; align-self: stretch; }

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
function saveEvents(evs) { localStorage.setItem('ss_quest_events', JSON.stringify(evs)); syncSave('quest_events', evs).catch(()=>{}); }
function saveCharacter(c){ localStorage.setItem('ss_quest_char', JSON.stringify(c)); syncSave('quest_char', c).catch(()=>{}); }
function loadResolved()  { try { return JSON.parse(localStorage.getItem('ss_quest_resolved') || '[]'); } catch { return []; } }
function markResolved(id){ const r=loadResolved(); if(!r.includes(id)){r.push(id);localStorage.setItem('ss_quest_resolved',JSON.stringify(r)); syncSave('quest_resolved', r).catch(()=>{});} }

function loadBattleDeltas()  { try { return JSON.parse(localStorage.getItem('ss_quest_deltas') || '{}'); } catch { return {}; } }
function saveBattleDeltas(d) { localStorage.setItem('ss_quest_deltas', JSON.stringify(d)); syncSave('quest_deltas', d).catch(()=>{}); }

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
    const deltas = loadBattleDeltas();
    return {
      name:you.handle||base.name||'Wanderer', class:you.vibe||base.class||'adventurer',
      arc:you.arc||you.vibe||'', portrait_base64:you.portrait_base64||base.portrait_base64||null,
      atk:  Math.round(Math.max(1, Math.min(20, stats.atk  + (deltas.atk||0))) * 10) / 10,
      def:  Math.round(Math.max(1, Math.min(20, stats.def  + (deltas.def||0))) * 10) / 10,
      wit:  Math.round(Math.max(1, Math.min(20, stats.wit  + (deltas.wit||0))) * 10) / 10,
      luk:  Math.round(Math.max(1, Math.min(20, stats.luk  + (deltas.luk||0))) * 10) / 10,
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

// ── ITEM DECAY ───────────────────────────────────────────────
// Scans inventory for expired timed items, fires end effects, removes them.
// Coin Charm awards +1g on expiry. Others toast and drop silently.
async function expireItems() {
  if (!window.getXPState || !window.consumeItem) return;
  const xps = window.getXPState();
  const items = (xps && xps.items) || [];
  const now = Date.now();
  let anyExpired = false;
  for (const item of [...items]) {
    if (!item.expiresAt || now < item.expiresAt) continue;
    const baseId = (item.id || '').replace(/_\d+$/, '');
    if (baseId === 'coin_charm') {
      if (window.awardGold) await window.awardGold(1);
      showLootToast((item.icon||'') + ' coin charm expired — +1g collected');
    } else {
      showLootToast((item.icon||'') + ' ' + item.name + ' wore off');
    }
    await window.consumeItem(item.id);
    anyExpired = true;
  }
  // If anything dropped, re-render so status effects + inventory update
  if (anyExpired) {
    const el2 = document.getElementById('view-quest');
    if (el2) { const c2 = await loadCharacter(); const e2 = loadEvents(); renderQuest(el2, c2, e2); }
  }
}

// ── RENDER ────────────────────────────────────────────────────
function renderQuest(el, char, events) {
  expireItems(); // async fire-and-forget — re-renders itself if anything expired
  const resolved = loadResolved();
  const allQuests = events.map(seedQuestFromEvent);
  const activeQuests   = allQuests.filter(q => q.status==='active' && !resolved.includes(q.id));
  const upcomingQuests = allQuests.filter(q => q.status!=='done' && q.status!=='active' && !resolved.includes(q.id));

  const _xps   = (typeof getXPState !== 'undefined' && getXPState()) || null;
  const _xpLv  = _xps ? _xps.level   : (char.level||1);
  const _xpCur = _xps ? _xps.xp      : (char.xp||0);
  const _xpNxt = _xps ? _xps.xpNext  : (char.xpNext||100);
  const xpPct  = Math.min(100, Math.round((_xpCur/Math.max(1,_xpNxt))*100));
  const gold   = _xps ? (_xps.gold||0) : 0;
  const streak = _xps ? (_xps.streakDays||0) : 0;

  // HP = flavor: streak * 8 + 50, clamped 10-100
  const _hpBonus = parseInt(localStorage.getItem('ss_quest_hp_bonus') || '0');
  const hp     = Math.min(100, Math.max(10, streak*8+50+_hpBonus));
  const atkPct = Math.round((char.atk||10)/20*100);
  const defPct = Math.round((char.def||8)/20*100);
  const witPct = Math.round((char.wit||12)/20*100);
  const lukPct = Math.round((char.luk||9)/20*100);

  // DnD Map Calendar
  const now2 = new Date();
  const year=now2.getFullYear(), month=now2.getMonth();
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const monthName=now2.toLocaleDateString('en-US',{month:'long',year:'numeric'}).toLowerCase();
  const todayNum=now2.getDate();
  const resolved2=loadResolved();

  // ── POPULATION COUNTER ───────────────────────────────────────
  // Every resolved quest = +1 villager. Milestone titles change map header.
  const totalResolved = resolved2.length;
  const popTitles = [[0,'wilderness'],[3,'outpost'],[8,'hamlet'],[15,'village'],[25,'town'],[40,'city'],[60,'kingdom']];
  const kingdomTitle = [...popTitles].reverse().find(([n])=>totalResolved>=n)?.[1] || 'wilderness';
  const popLabel = 'pop: '+totalResolved;

  // ── THREAT METER ─────────────────────────────────────────────
  // Abandoned quests (in events but not resolved and past due) = threat skulls
  const today0 = new Date(); today0.setHours(0,0,0,0);
  const abandoned = events.filter(ev => {
    if (resolved2.includes(ev.id)) return false;
    const d = new Date(ev.date+'T00:00:00');
    return d < today0;
  });
  const threatLevel = abandoned.length;
  const threatLabel = threatLevel > 0 ? (threatLevel >= 5 ? 'SIEGE!' : threatLevel+' threat') : '';

  // ── WEATHER SYSTEM ────────────────────────────────────────────
  // Deterministic from date seed — same weather all day, changes daily
  const dateSeed = parseInt(now2.toISOString().slice(0,10).replace(/-/g,''));
  const weatherRoll = dateSeed % 7;
  const WEATHERS = [
    { id:'sun',   label:'sunny',   icon:'&#9728;',  atkMod:+1, defMod:0,  desc:'ATK +1 today' },
    { id:'sun',   label:'sunny',   icon:'&#9728;',  atkMod:+1, defMod:0,  desc:'ATK +1 today' },
    { id:'rain',  label:'rainy',   icon:'&#9928;',  atkMod:-1, defMod:0,  desc:'enemy ATK -1' },
    { id:'rain',  label:'rainy',   icon:'&#9928;',  atkMod:-1, defMod:0,  desc:'enemy ATK -1' },
    { id:'cloud', label:'cloudy',  icon:'&#9729;',  atkMod:0,  defMod:0,  desc:'neutral' },
    { id:'snow',  label:'snowing', icon:'&#10052;', atkMod:0,  defMod:+1, desc:'DEF +1, turns slow' },
    { id:'storm', label:'storm',   icon:'&#9928;&#10217;', atkMod:+2, defMod:-1, desc:'wild ATK +2, DEF -1' },
  ];
  const weather = WEATHERS[weatherRoll];
  // Expose weather mod for battle system
  window._questWeather = weather;

  // ── BOSS TILE ────────────────────────────────────────────────
  // Last day of month = boss tile. Boss determined by month name.
  const MONTH_BOSSES = ['Frost Wraith','Storm Leviathan','Bloom Colossus','Rain Specter',
    'Plague Golem','Sun Devourer','Tide Beast','Harvest Fiend',
    'Void Stalker','Iron Titan','Frost Drake','Year's End Lich'];
  const monthBoss = MONTH_BOSSES[month];
  const isBossMonth = todayNum === daysInMonth; // boss day = last day

  // ── TILE TYPE LOGIC ──────────────────────────────────────────
  function getTileType(dayNum) {
    const dateStr = year+'-'+String(month+1).padStart(2,'0')+'-'+String(dayNum).padStart(2,'0');
    const dayEvents = events.filter(e => e.date === dateStr);
    const isToday = dayNum === todayNum;
    const isPast  = dayNum < todayNum;
    const isFuture= dayNum > todayNum;
    const isLastDay = dayNum === daysInMonth;
    if (isLastDay && !isFuture) return 'boss';            // boss tile — past or today
    if (isLastDay && isFuture)  return 'bosscoming';      // boss looming
    if (isToday) return 'campfire';
    if (isFuture && dayEvents.length) return 'forest';
    if (isFuture) return 'water';
    if (!dayEvents.length) {
      // Abandoned = skull tile
      const dayAbandoned = abandoned.some(ev => ev.date === dateStr);
      return dayAbandoned ? 'skull' : 'grass';
    }
    const anyResolved = dayEvents.some(e => resolved2.includes(e.id));
    if (anyResolved) return 'castle';
    return 'path';
  }

  // ── SVG TILE GENERATORS ──────────────────────────────────────
  function tileSVG(type, dayNum) {
    // Weather overlay tint for today
    const wx = (dayNum === todayNum) ? weather.id : null;
    const weatherTint = wx==='rain'?'rgba(30,60,120,0.35)':wx==='snow'?'rgba(200,230,255,0.2)':wx==='storm'?'rgba(60,20,80,0.4)':wx==='sun'?'rgba(255,200,50,0.12)':'';
    const wRect = weatherTint ? '<rect width="20" height="20" fill="'+weatherTint+'" rx="2"/>' : '';
    switch(type) {
      case 'water': return '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">'
        + '<rect width="20" height="20" fill="#0a1628"/>'
        + '<path d="M2 8 Q5 6 8 8 Q11 10 14 8 Q17 6 20 8" fill="none" stroke="#1a3a6a" stroke-width="1.2"/>'
        + '<path d="M0 13 Q4 11 7 13 Q10 15 14 13 Q17 11 20 13" fill="none" stroke="#1a3a6a" stroke-width="1"/>'
        + wRect+'</svg>';
      case 'grass': return '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">'
        + '<rect width="20" height="20" fill="#0d1f0d"/>'
        + '<rect x="3" y="12" width="2" height="5" rx="1" fill="#1a3d1a"/>'
        + '<rect x="7" y="10" width="2" height="7" rx="1" fill="#1a3d1a"/>'
        + '<rect x="12" y="11" width="2" height="6" rx="1" fill="#1a3d1a"/>'
        + '<rect x="16" y="13" width="2" height="4" rx="1" fill="#1a3d1a"/>'
        + wRect+'</svg>';
      case 'skull': return '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">'
        + '<rect width="20" height="20" fill="#180808"/>'
        + '<ellipse cx="10" cy="9" rx="5" ry="5.5" fill="#3a1010"/>'
        + '<rect x="7" y="13" width="6" height="3" rx="1" fill="#3a1010"/>'
        + '<circle cx="8" cy="9" r="1.5" fill="#100404"/>'
        + '<circle cx="12" cy="9" r="1.5" fill="#100404"/>'
        + '<rect x="8.5" y="13.5" width="1" height="2" fill="#100404"/>'
        + '<rect x="10.5" y="13.5" width="1" height="2" fill="#100404"/>'
        + '</svg>';
      case 'path': return '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">'
        + '<rect width="20" height="20" fill="#1a1208"/>'
        + '<path d="M10 2 Q8 7 10 10 Q12 13 10 18" fill="none" stroke="#4a3820" stroke-width="3" stroke-linecap="round"/>'
        + '<circle cx="10" cy="6" r="1" fill="#6a5030"/>'
        + '<circle cx="10" cy="10" r="1" fill="#6a5030"/>'
        + '<circle cx="10" cy="14" r="1" fill="#6a5030"/>'
        + wRect+'</svg>';
      case 'forest': return '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">'
        + '<rect width="20" height="20" fill="#0a180a"/>'
        + '<polygon points="10,2 6,10 14,10" fill="#1a4a1a"/>'
        + '<polygon points="10,6 5,14 15,14" fill="#225522"/>'
        + '<rect x="9" y="14" width="2" height="4" fill="#3a2010"/>'
        + wRect+'</svg>';
      case 'castle': return '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">'
        + '<rect width="20" height="20" fill="#0d0d18"/>'
        + '<rect x="3" y="8" width="14" height="10" fill="#2a2a4a"/>'
        + '<rect x="3" y="5" width="3" height="5" fill="#2a2a4a"/>'
        + '<rect x="8" y="5" width="4" height="5" fill="#2a2a4a"/>'
        + '<rect x="14" y="5" width="3" height="5" fill="#2a2a4a"/>'
        + '<rect x="4" y="5" width="1" height="2" fill="#0d0d18"/>'
        + '<rect x="9" y="5" width="2" height="2" fill="#0d0d18"/>'
        + '<rect x="15" y="5" width="1" height="2" fill="#0d0d18"/>'
        + '<rect x="8" y="13" width="4" height="5" fill="#1a1a30"/>'
        + '<rect x="6" y="11" width="3" height="2" fill="#FFD93D33"/>'
        + '<rect x="11" y="11" width="3" height="2" fill="#FFD93D33"/>'
        + wRect+'</svg>';
      case 'campfire': return '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">'
        + '<rect width="20" height="20" fill="#100808"/>'
        + '<ellipse cx="10" cy="16" rx="5" ry="1.5" fill="#3a2010"/>'
        + '<line x1="7" y1="16" x2="10" y2="11" stroke="#4a3020" stroke-width="1.5" stroke-linecap="round"/>'
        + '<line x1="13" y1="16" x2="10" y2="11" stroke="#4a3020" stroke-width="1.5" stroke-linecap="round"/>'
        + '<ellipse cx="10" cy="11" rx="2.5" ry="3.5" fill="#FF6B00"/>'
        + '<ellipse cx="10" cy="11" rx="1.5" ry="2.5" fill="#FFD93D"/>'
        + '<ellipse cx="10" cy="12" rx="0.8" ry="1.2" fill="#fff8"/>'
        + wRect+'</svg>';
      case 'boss': return '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">'
        + '<rect width="20" height="20" fill="#1a0a00"/>'
        + '<polygon points="10,1 12,7 19,7 13,11 15,18 10,14 5,18 7,11 1,7 8,7" fill="#3a1a00" stroke="#FF4BCB" stroke-width="0.5"/>'
        + '<circle cx="10" cy="10" r="3" fill="#FF4BCB44"/>'
        + '<text x="10" y="13" text-anchor="middle" font-size="6" fill="#FF4BCB">!</text>'
        + '</svg>';
      case 'bosscoming': return '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">'
        + '<rect width="20" height="20" fill="#120808"/>'
        + '<polygon points="10,2 12,8 18,8 13,12 15,18 10,14 5,18 7,12 2,8 8,8" fill="#2a0a0a" stroke="#ff4bcb44" stroke-width="0.5"/>'
        + '</svg>';
      default: return '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="20" fill="#0a0a0f"/></svg>';
    }
  }

  const calDayLabels=['s','m','t','w','t','f','s'].map(d=>'<div class="q-cal-dh">'+d+'</div>').join('');
  const calEmpties=Array(firstDay).fill('<div class="q-cal-tile"></div>').join('');
  const calDays=Array.from({length:daysInMonth},(_,i)=>{
    const d=i+1;
    const type=getTileType(d);
    const isToday=d===todayNum;
    const isBoss=type==='boss'||type==='bosscoming';
    return '<div class="q-cal-tile'+(isToday?' today':'')+(isBoss?' boss-tile':'')+'"'
      + (isBoss?' title="'+monthBoss+'"':'')+'>'
      + tileSVG(type, d)
      + '<span class="tile-num">'+d+'</span>'
      + '</div>';
  }).join('');

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
        <button class="q-play-link" style="background:rgba(255,211,61,0.08);border-color:rgba(255,211,61,0.3);color:#FFD93D;" onclick="event.stopPropagation();window._questFight('${q.id}')">\u2694 fight</button>
      </div>
    </div>`;
  }

  // Compact row for upcoming quests
  function questRow(q) {
    return `<div class="q-row">
      <div class="q-row-icon">${q.icon}</div>
      <div class="q-row-body">
        <div class="q-row-title">${q.title}</div>
        <div class="q-row-sub">from: ${q.sourceEvent}${q.date?' \u00B7 '+formatQuestDate(q.date,q.time):''}</div>
      </div>
      <div class="q-row-right">
        <div class="q-tag tag-${q.status}">${q.status}</div>
        <div class="q-row-gold">+${q.gold}g</div>
      </div>
    </div>`;
  }

  const activeSection = activeQuests.length
    ? activeQuests.map(heroCard).join('')
    : `<div class="q-empty">no active quests today.<br>add calendar events and they become adventures.</div>`;



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

    ${upcomingQuests.length ? `
      <div class="q-rule"><div class="q-rule-line"></div><span class="q-rule-text">upcoming</span><div class="q-rule-line"></div></div>
      <div>${upcomingQuests.map(questRow).join('')}</div>
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

    <div class="q-rule"><div class="q-rule-line"></div><span class="q-rule-text">dice &amp; chance</span><div class="q-rule-line"></div></div>
    <div class="q-dice-section" id="q-dice-section">
      <div class="q-dice-mod-row">
        <span class="q-dice-mod-label">modifier</span>
        <div class="q-dice-mod-btns">
          <button class="q-dice-mod-btn" id="q-mod-down">-</button>
          <div class="q-dice-mod-val" id="q-mod-val">+0</div>
          <button class="q-dice-mod-btn" id="q-mod-up">+</button>
        </div>
      </div>
      <div class="q-dice-grid">
        <div class="q-die" data-die="d4"   data-sides="4"   onclick="window._rollDie(this)"><div class="q-die-face">&#9650;</div><div class="q-die-label">d4</div></div>
        <div class="q-die" data-die="d6"   data-sides="6"   onclick="window._rollDie(this)"><div class="q-die-face">&#127922;</div><div class="q-die-label">d6</div></div>
        <div class="q-die" data-die="d8"   data-sides="8"   onclick="window._rollDie(this)"><div class="q-die-face">&#128142;</div><div class="q-die-label">d8</div></div>
        <div class="q-die" data-die="d10"  data-sides="10"  onclick="window._rollDie(this)"><div class="q-die-face">&#128311;</div><div class="q-die-label">d10</div></div>
        <div class="q-die" data-die="d12"  data-sides="12"  onclick="window._rollDie(this)"><div class="q-die-face">&#127800;</div><div class="q-die-label">d12</div></div>
        <div class="q-die" data-die="d20"  data-sides="20"  onclick="window._rollDie(this)"><div class="q-die-face">&#11039;</div><div class="q-die-label">d20</div></div>
        <div class="q-die" data-die="d100" data-sides="100" onclick="window._rollDie(this)"><div class="q-die-face">&#128175;</div><div class="q-die-label">d%</div></div>
        <div class="q-die" data-die="fate" data-sides="0"   onclick="window._rollDie(this)"><div class="q-die-face">&#10022;</div><div class="q-die-label">fate</div></div>
        <div class="q-die" data-die="coin" data-sides="-1"  onclick="window._rollDie(this)"><div class="q-die-face">&#129689;</div><div class="q-die-label">coin</div></div>
        <div class="q-dice-result q-dice-result-span" id="q-dice-result">
          <div>
            <div class="q-dice-result-main" id="q-dice-main">-</div>
            <div class="q-dice-result-label" id="q-dice-lbl">tap a die to roll</div>
          </div>
          <div class="q-dice-history" id="q-dice-history"></div>
        </div>
      </div>
    </div>

    <div class="q-rule"><div class="q-rule-line"></div><span class="q-rule-text">the map</span><div class="q-rule-line"></div></div>
    <div class="q-cal">
      <div class="q-cal-month">
        <span>${kingdomTitle} <span style="opacity:0.4;font-size:0.55rem">${popLabel}</span></span>
        <span style="display:flex;gap:8px;align-items:center">
          <span style="font-size:0.62rem;color:#FFD93D">${weather.icon} ${weather.label}</span>
          <span style="font-size:0.6rem;color:var(--subtext)">${weather.desc}</span>
          ${threatLabel ? '<span style="font-size:0.6rem;color:#ff6b6b;letter-spacing:0.06em">&#9760; '+threatLabel+'</span>' : ''}
        </span>
      </div>
      ${isBossMonth ? '<div style="font-size:0.62rem;color:#FF4BCB;text-align:center;padding:4px 0;letter-spacing:0.08em">&#9733; boss day: '+monthBoss+' awaits &#9733;</div>' : '<div style="font-size:0.58rem;color:#FF4BCB44;text-align:center;padding:2px 0;letter-spacing:0.06em">'+monthBoss+' stirs at month's end</div>'}
      <div class="q-cal-grid">${calDayLabels}${calEmpties}${calDays}</div>
      <div style="display:flex;gap:10px;margin-top:6px;flex-wrap:wrap">
        <span style="font-size:0.48rem;color:var(--subtext);display:flex;align-items:center;gap:3px"><svg width="10" height="10" viewBox="0 0 20 20"><rect width="20" height="20" fill="#0a1628"/><path d="M2 8 Q5 6 8 8 Q11 10 14 8" fill="none" stroke="#1a3a6a" stroke-width="2"/></svg>unknown</span>
        <span style="font-size:0.48rem;color:var(--subtext);display:flex;align-items:center;gap:3px"><svg width="10" height="10" viewBox="0 0 20 20"><rect width="20" height="20" fill="#0a180a"/><polygon points="10,2 6,10 14,10" fill="#1a4a1a"/></svg>planned</span>
        <span style="font-size:0.48rem;color:var(--subtext);display:flex;align-items:center;gap:3px"><svg width="10" height="10" viewBox="0 0 20 20"><rect width="20" height="20" fill="#0d0d18"/><rect x="4" y="6" width="12" height="10" fill="#2a2a4a"/></svg>settled</span>
        <span style="font-size:0.48rem;color:var(--subtext);display:flex;align-items:center;gap:3px"><svg width="10" height="10" viewBox="0 0 20 20"><rect width="20" height="20" fill="#180808"/><circle cx="10" cy="9" r="5" fill="#3a1010"/></svg>threat</span>
        <span style="font-size:0.48rem;color:#FF4BCB;display:flex;align-items:center;gap:3px"><svg width="10" height="10" viewBox="0 0 20 20"><rect width="20" height="20" fill="#1a0a00"/><polygon points="10,1 12,7 19,7 13,11 15,18 10,14 5,18 7,11 1,7 8,7" fill="#3a1a00" stroke="#FF4BCB" stroke-width="1"/></svg>boss</span>
      </div>
    </div>

    <button class="q-add-btn" id="q-add-btn">+ add calendar event</button>
    <button class="q-clear-btn" id="q-clear-btn">clear all quests</button>

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
    if (!item2) return;

    // ── ITEM EFFECTS ─────────────────────────────────────────
    const baseId = item2.id.replace(/_\d+$/, ''); // strip timestamp suffix

    if (item2.isLoot) {
      // Loot items: flavor toast only, then consume
      showLootToast(item2.icon + ' ' + item2.use_text);

    } else if (baseId === 'health_pot') {
      // Health Potion: +5 HP flavor = +1 streak day equivalent in the delta layer
      // We fake it by boosting HP display via a temporary ss_quest_hp_bonus
      const cur = parseInt(localStorage.getItem('ss_quest_hp_bonus') || '0');
      localStorage.setItem('ss_quest_hp_bonus', String(Math.min(42, cur + 5)));
      showLootToast(item2.icon + ' health potion used — +5 HP');

    } else if (baseId === 'tome') {
      // Candle & Tome: +0.1 WIT one-shot — apply immediately to delta store
      const d = loadBattleDeltas();
      d.wit = Math.round(((d.wit||0) + 0.1) * 10) / 10;
      saveBattleDeltas(d);
      showLootToast(item2.icon + ' tome studied — +0.1 WIT');

    } else if (baseId === 'ward_stone') {
      // Ward Stone: set flag — next battle loss becomes a win
      localStorage.setItem('ss_quest_ward', '1');
      showLootToast(item2.icon + ' ward stone activated — next defeat blocked');

    } else if (baseId === 'coin_charm' || baseId === 'crk_shield' || baseId === 'rusty_sword') {
      // Passive items — explain they are already active
      showLootToast(item2.icon + ' ' + item2.name + ' is passive — already active');
      return; // don't consume

    } else {
      showLootToast(item2.icon + ' ' + (item2.use_text || item2.name + ' used'));
    }

    await window.consumeItem(itemId);
    const el2 = document.getElementById('view-quest');
    if (el2) { const c2 = await loadCharacter(); const e2 = loadEvents(); renderQuest(el2,c2,e2); }
  };

  // Abandon an active quest — marks resolved without awarding gold
  window._questCancel = async (questId) => {
    markResolved(questId);
    const el2 = document.getElementById('view-quest');
    if (el2) { const c2 = await loadCharacter(); const e2 = loadEvents(); renderQuest(el2,c2,e2); }
  };

  // Open battle overlay for an active quest
  window._questFight = (questId) => {
    const evs = loadEvents();
    const ev  = evs.find(e => e.id === questId);
    if (!ev) return;
    const q = seedQuestFromEvent(ev);
    // Boss day override — last day of month gets the month boss
    const now3 = new Date();
    const lastDay = new Date(now3.getFullYear(), now3.getMonth()+1, 0).getDate();
    const MONTH_BOSSES2 = ['Frost Wraith','Storm Leviathan','Bloom Colossus','Rain Specter',
      'Plague Golem','Sun Devourer','Tide Beast','Harvest Fiend',
      'Void Stalker','Iron Titan','Frost Drake','Year's End Lich'];
    if (now3.getDate() === lastDay) {
      q.title = MONTH_BOSSES2[now3.getMonth()];
      q.isBoss = true;
    }
    showBattleOverlay(q, char);
  };

  // Move modal to body so it escapes overflow:hidden.
  // Remove any stale orphaned modal that's ALREADY on body (not the one just rendered inside el).
  const _existing = document.getElementById('q-modal-overlay');
  if (_existing && _existing.parentElement === document.body) _existing.remove();
  const _mo = el.querySelector('#q-modal-overlay');
  if (_mo) document.body.appendChild(_mo);

  // -- DICE ROLLER LOGIC --
  let _diceModifier = 0;
  let _diceHistory  = [];
  const _modValEl = document.getElementById('q-mod-val');
  const _modDown  = document.getElementById('q-mod-down');
  const _modUp    = document.getElementById('q-mod-up');
  function _updateModDisplay() { if (_modValEl) _modValEl.textContent = (_diceModifier >= 0 ? '+' : '') + _diceModifier; }
  if (_modDown) _modDown.onclick = (e) => { e.stopPropagation(); _diceModifier = Math.max(-10, _diceModifier - 1); _updateModDisplay(); };
  if (_modUp)   _modUp.onclick   = (e) => { e.stopPropagation(); _diceModifier = Math.min(10,  _diceModifier + 1); _updateModDisplay(); };

  window._rollDie = (el) => {
    const die   = el.dataset.die;
    const sides = parseInt(el.dataset.sides);
    el.classList.remove('rolling'); void el.offsetWidth; el.classList.add('rolling');
    setTimeout(() => el.classList.remove('rolling'), 400);
    let rawResult, display, label;
    if (die === 'coin') {
      rawResult = Math.random() < 0.5 ? 0 : 1;
      display   = rawResult === 0 ? 'HEADS' : 'TAILS';
      label     = 'coin flip';
    } else if (die === 'fate') {
      const fr = Math.floor(Math.random() * 6);
      rawResult = fr < 2 ? -1 : fr < 4 ? 0 : 1;
      const sym = rawResult === -1 ? '-' : rawResult === 0 ? 'o' : '+';
      const lbl = rawResult === -1 ? 'minus' : rawResult === 0 ? 'blank' : 'plus';
      const mod = rawResult + _diceModifier;
      display = sym + (_diceModifier !== 0 ? ' -> ' + (mod >= 0 ? '+' : '') + mod : '');
      label   = 'fate / ' + lbl + (_diceModifier !== 0 ? ' / mod ' + (_diceModifier > 0 ? '+' : '') + _diceModifier : '');
    } else {
      rawResult = Math.floor(Math.random() * sides) + 1;
      const mod = rawResult + _diceModifier;
      const n1  = rawResult === 1, nM = rawResult === sides;
      let rs = String(mod);
      if (n1)       rs = rawResult + ' (crit fail)' + (_diceModifier !== 0 ? ' -> ' + mod : '');
      else if (nM)  rs = rawResult + ' (CRIT!)' + (_diceModifier !== 0 ? ' -> ' + mod : '');
      else if (_diceModifier !== 0) rs = rawResult + ' -> ' + mod;
      display = rs;
      label   = die + (_diceModifier !== 0 ? ' / mod ' + (_diceModifier > 0 ? '+' : '') + _diceModifier : '') + (n1 ? ' / CRITICAL FAIL' : nM ? ' / CRITICAL HIT' : '');
    }
    const mainEl = document.getElementById('q-dice-main');
    const lblEl  = document.getElementById('q-dice-lbl');
    const resEl  = document.getElementById('q-dice-result');
    const histEl = document.getElementById('q-dice-history');
    if (mainEl) mainEl.textContent = display;
    if (lblEl)  lblEl.textContent  = label;
    if (resEl)  { resEl.classList.remove('flash'); void resEl.offsetWidth; resEl.classList.add('flash'); }
    _diceHistory.unshift({ die, val: String(rawResult) });
    if (_diceHistory.length > 5) _diceHistory.pop();
    if (histEl) histEl.innerHTML = _diceHistory.map(h => '<div class="q-dice-hist-chip">' + h.die + ' ' + h.val + '</div>').join('');
    if (sides > 0 && rawResult === sides && window.awardXP) window.awardXP('dice_nat_max').catch(() => {});
  };

  document.getElementById('q-clear-btn').onclick = () => {
    if (!confirm('clear all quests and history?')) return;
    localStorage.removeItem('ss_quest_events');
    localStorage.removeItem('ss_quest_resolved');
    renderQuest(el, char, []);
  };

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

// ── PRE-BATTLE DICE SYSTEM ───────────────────────────────────
const BATTLE_DICE = [
  { die:'d4',  face:'&#9650;',   label:'d4',   sides:4,   desc:'+1 ATK this fight',              cost:0 },
  { die:'d6',  face:'&#127922;', label:'d6',   sides:6,   desc:'+1 DEF this fight',              cost:0 },
  { die:'d8',  face:'&#128142;', label:'d8',   sides:8,   desc:'+1 random stat',                 cost:0 },
  { die:'d10', face:'&#128311;', label:'d10',  sides:10,  desc:'+5 HP this fight',               cost:0 },
  { die:'d12', face:'&#127800;', label:'d12',  sides:12,  desc:'+2 ATK (costs 1g)',              cost:1 },
  { die:'d20', face:'&#11039;',  label:'d20',  sides:20,  desc:'20=crit first turn / 1=curse',   cost:0 },
  { die:'d100',face:'&#128175;', label:'d%',   sides:100, desc:'every 10pts = +1 stat',          cost:0 },
  { die:'fate',face:'&#10022;',  label:'fate', sides:0,   desc:'+buff / blank / -debuff',        cost:0 },
  { die:'coin',face:'&#129689;', label:'coin', sides:-1,  desc:'heads=first / tails=enemy+2ATK', cost:0 },
];

function rollBattleDie(dieObj) {
  const mod = { atkBonus:0,defBonus:0,witBonus:0,hpBonus:0,critFirst:false,goFirst:true,enemyAtkBonus:0,desc:'' };
  if (dieObj.die === 'coin') {
    const heads = Math.random() < 0.5;
    mod.goFirst = heads; mod.enemyAtkBonus = heads ? 0 : 2;
    mod.desc = heads ? 'coin: heads — you strike first!' : 'coin: tails — enemy surges (+2 ATK)';
  } else if (dieObj.die === 'fate') {
    const r = Math.floor(Math.random()*6);
    if (r < 2)      { mod.atkBonus=1; mod.defBonus=1; mod.desc='fate: plus — +1 ATK +1 DEF'; }
    else if (r < 4) { mod.desc='fate: blank — the spiral is silent'; }
    else            { mod.atkBonus=-1; mod.desc='fate: minus — -1 ATK'; }
  } else if (dieObj.die === 'd4')  { mod.atkBonus=1; mod.desc='d4: +1 ATK'; }
  else if (dieObj.die === 'd6')    { mod.defBonus=1; mod.desc='d6: +1 DEF'; }
  else if (dieObj.die === 'd8')    {
    const picks=['atkBonus','defBonus','witBonus'];
    const pick=picks[Math.floor(Math.random()*3)];
    mod[pick]=1;
    const lbl=pick==='atkBonus'?'ATK':pick==='defBonus'?'DEF':'WIT';
    mod.desc='d8: +1 '+lbl+' (random)';
  } else if (dieObj.die === 'd10') { mod.hpBonus=5; mod.desc='d10: +5 HP'; }
  else if (dieObj.die === 'd12')   { mod.atkBonus=2; mod.desc='d12: +2 ATK'; }
  else if (dieObj.die === 'd20')   {
    const roll=Math.floor(Math.random()*20)+1;
    if (roll===20)     { mod.critFirst=true; mod.desc='d20: NAT 20 — CRIT FIRST TURN!'; }
    else if (roll===1) { mod.goFirst=false; mod.desc='d20: nat 1 — cursed, enemy strikes first'; }
    else               { const b=Math.floor(roll/5); mod.atkBonus=b; mod.desc='d20: rolled '+roll+' (+'+b+' ATK)'; }
  } else if (dieObj.die === 'd100') {
    const roll=Math.floor(Math.random()*100)+1;
    const b=Math.floor(roll/10);
    const picks=['atkBonus','defBonus','witBonus','hpBonus'];
    const pick=picks[Math.floor(Math.random()*picks.length)];
    mod[pick]=b;
    const lbl=pick==='atkBonus'?'ATK':pick==='defBonus'?'DEF':pick==='witBonus'?'WIT':'HP';
    mod.desc='d%: rolled '+roll+' (+'+b+' '+lbl+')';
  }
  return mod;
}

function showPreBattleDice(enemyDef, gold, onReady) {
  const nullMod = { atkBonus:0,defBonus:0,witBonus:0,hpBonus:0,critFirst:false,goFirst:true,enemyAtkBonus:0,desc:'' };
  const overlay = document.createElement('div');
  overlay.className = 'q-battle-overlay';
  overlay.style.zIndex = '9600';
  const gridHTML = BATTLE_DICE.map((d,idx) => {
    const cant = d.cost > 0 && gold < d.cost;
    return '<button class="pb-die-btn" data-idx="'+idx+'" style="background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:8px 4px;cursor:pointer;text-align:center;font-family:var(--font-ui);transition:all 0.14s;'+(cant?'opacity:0.3;pointer-events:none;':'')+'">'
      + '<div style="font-size:1.3rem;line-height:1">'+d.face+'</div>'
      + '<div style="font-size:0.52rem;color:var(--subtext);letter-spacing:0.08em;margin-top:3px">'+d.label+(d.cost>0?' ('+d.cost+'g)':'')+'</div>'
      + '</button>';
  }).join('');
  overlay.innerHTML = '<div class="q-battle-card" style="max-width:400px">'
    + '<div class="q-battle-header"><span class="q-battle-title">pre-battle</span>'
    + '<span class="q-battle-tap-hint" style="color:#FFD93D">'+enemyDef.name+' awaits</span></div>'
    + '<div style="font-size:0.75rem;color:var(--subtext);text-align:center;margin-bottom:12px">roll a die for a bonus — or skip</div>'
    + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">'+gridHTML+'</div>'
    + '<div id="pb-result" style="min-height:32px;font-size:0.72rem;color:#FFD93D;text-align:center;padding:7px;background:rgba(255,211,61,0.06);border:1px solid rgba(255,211,61,0.12);border-radius:8px;margin-bottom:12px;display:none"></div>'
    + '<div style="display:flex;gap:8px">'
    + '<button id="pb-skip" style="flex:1;padding:10px;background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--subtext);font-family:var(--font-ui);font-size:0.72rem;cursor:pointer">skip</button>'
    + '<button id="pb-fight" style="flex:2;padding:10px;background:rgba(0,246,214,0.08);border:1px solid rgba(0,246,214,0.2);border-radius:8px;color:#00F6D6;font-family:var(--font-ui);font-size:0.72rem;cursor:pointer" disabled>fight!</button>'
    + '</div></div>';
  document.body.appendChild(overlay);

  const resultEl = overlay.querySelector('#pb-result');
  const fightBtn = overlay.querySelector('#pb-fight');
  let chosenMod = null;

  overlay.querySelectorAll('.pb-die-btn').forEach(btn => {
    btn.onclick = async () => {
      const dieObj = BATTLE_DICE[parseInt(btn.dataset.idx)];
      if (dieObj.cost > 0 && window.spendGold) {
        const r = await window.spendGold(dieObj.cost);
        if (!r.success) { resultEl.textContent='not enough gold'; resultEl.style.display='block'; return; }
      }
      overlay.querySelectorAll('.pb-die-btn').forEach(b => { b.style.opacity='0.3'; b.style.pointerEvents='none'; });
      btn.style.opacity='1'; btn.style.borderColor='#FFD93D'; btn.style.background='rgba(255,211,61,0.1)';
      chosenMod = rollBattleDie(dieObj);
      resultEl.textContent = chosenMod.desc; resultEl.style.display='block';
      fightBtn.disabled=false; fightBtn.style.background='rgba(0,246,214,0.18)'; fightBtn.style.borderColor='rgba(0,246,214,0.4)';
    };
  });

  const proceed = (mod) => { overlay.remove(); onReady(mod || nullMod); };
  overlay.querySelector('#pb-skip').onclick = () => proceed(null);
  fightBtn.onclick = () => proceed(chosenMod);
}

// ── BATTLE SYSTEM ────────────────────────────────────────────
const ENEMY_ROSTER = {
  'The Grind Dungeon':      { name:'Deadline Wraith',    lore:'feeds on unfinished tasks',         atk:4, hp:22 },
  'The Iron Trial':         { name:'Iron Golem',         lore:'forged from skipped rest days',      atk:5, hp:26 },
  "The Scholar's Gauntlet": { name:'Exam Specter',       lore:'knows everything you forgot',        atk:3, hp:20 },
  "The Healer's Lair":      { name:'Waiting Room Demon', lore:'has been here since 9am',            atk:3, hp:18 },
  'The Grand Feast':        { name:'Cake Elemental',     lore:'surprisingly hostile',               atk:3, hp:20 },
  'The Leisure Realm':      { name:'Couch Wisp',         lore:'resists all movement',               atk:2, hp:16 },
  'The Tavern Run':         { name:'Hungry Ghost',       lore:'will not be satisfied',              atk:3, hp:18 },
  'Council of Endless Words':{ name:'Meeting Phantom',   lore:'could have been an email',           atk:2, hp:16 },
  'Journey to Unknown Lands':{ name:'Road Troll',        lore:'lives under every detour',           atk:4, hp:24 },
};
const DEFAULT_ENEMY = { name:'Shadow', lore:'origin unknown', atk:3, hp:20 };
// Month bosses — injected dynamically by _questFight on last day of month
const BOSS_ROSTER = {
  'Frost Wraith':     { name:'Frost Wraith',     lore:'born from January's longest night', atk:7, hp:45 },
  'Storm Leviathan':  { name:'Storm Leviathan',  lore:'older than the calendar itself',     atk:8, hp:50 },
  'Bloom Colossus':   { name:'Bloom Colossus',   lore:'grows stronger with each petal',     atk:6, hp:42 },
  'Rain Specter':     { name:'Rain Specter',      lore:'you have seen it before. in the drain.', atk:6, hp:40 },
  'Plague Golem':     { name:'Plague Golem',      lore:'assembled from skipped appointments', atk:7, hp:44 },
  'Sun Devourer':     { name:'Sun Devourer',      lore:'it was there at the solstice',       atk:8, hp:48 },
  'Tide Beast':       { name:'Tide Beast',         lore:'pulls everything toward the deep',   atk:7, hp:46 },
  'Harvest Fiend':    { name:'Harvest Fiend',      lore:'came with the first cold morning',   atk:7, hp:43 },
  'Void Stalker':     { name:'Void Stalker',       lore:'followed you here from September',   atk:8, hp:50 },
  'Iron Titan':       { name:'Iron Titan',          lore:'forged from every missed deadline',  atk:9, hp:55 },
  'Frost Drake':      { name:'Frost Drake',         lore:'descended when the clocks changed',  atk:8, hp:52 },
  'Year's End Lich': { name:'Year's End Lich',    lore:'remembers everything you didn't do',atk:10,hp:60},
};

function showBattleOverlay(quest, char) {
  const enemyDef = BOSS_ROSTER[quest.title] || ENEMY_ROSTER[quest.title] || DEFAULT_ENEMY;
  const xps = window.getXPState ? window.getXPState() : null;
  const gold = xps ? (xps.gold||0) : 0;
  const streak = xps ? (xps.streakDays||0) : 0;
  showPreBattleDice(enemyDef, gold, (diceMod) => { _startBattle(quest, char, enemyDef, streak, diceMod); });
}

function _startBattle(quest, char, enemyDef, streak, diceMod) {
  const dm = diceMod || { atkBonus:0,defBonus:0,witBonus:0,hpBonus:0,critFirst:false,goFirst:true,enemyAtkBonus:0,desc:'' };

  // HP — base + potion bonus + dice bonus
  const _hpBonusBattle = parseInt(localStorage.getItem('ss_quest_hp_bonus') || '0');
  let yourHP    = Math.min(100, Math.max(10, streak*8+50+_hpBonusBattle+dm.hpBonus));
  let yourMaxHP = yourHP;
  let enemyHP   = enemyDef.hp + Math.floor(Math.random()*8);
  let enemyMaxHP= enemyHP;

  // Stats — char includes battle deltas + item buffs + dice modifier
  const _invItems = (window.getXPState ? window.getXPState() : null)?.items || [];
  const _atkBuff = _invItems.filter(i => i.stat === 'atk' && (!i.expiresAt || Date.now() < i.expiresAt)).reduce((a,i) => a+(i.bonus||0), 0);
  const _defBuff = _invItems.filter(i => i.stat === 'def' && (!i.expiresAt || Date.now() < i.expiresAt)).reduce((a,i) => a+(i.bonus||0), 0);
  const _witBuff = _invItems.filter(i => i.stat === 'wit' && (!i.expiresAt || Date.now() < i.expiresAt)).reduce((a,i) => a+(i.bonus||0), 0);

  // Weather modifier
  const _wx = window._questWeather || { atkMod:0, defMod:0, label:'', desc:'' };
  const yourAtk = (char.atk || 10) + _atkBuff + dm.atkBonus + _wx.atkMod;
  const yourDef = (char.def || 8)  + _defBuff + dm.defBonus + _wx.defMod;
  const yourWit = (char.wit || 12) + _witBuff + dm.witBonus;
  const enemyAtkTotal = enemyDef.atk + (dm.enemyAtkBonus||0) + (_wx.id==='rain'||_wx.id==='snow' ? -1 : 0);

  const _buffLines = [];
  if (dm.desc) _buffLines.push(dm.desc);
  if (_wx.label) _buffLines.push(_wx.label+': '+_wx.desc);
  if (_atkBuff > 0) _buffLines.push('+' + _atkBuff + ' ATK (item)');
  if (_defBuff > 0) _buffLines.push('+' + _defBuff + ' DEF (item)');
  if (_hpBonusBattle > 0) _buffLines.push('+' + _hpBonusBattle + ' HP (potion)');
  if (localStorage.getItem('ss_quest_ward') === '1') _buffLines.push('ward stone ready');

  let done = false;
  let won  = false;
  let turnTimer = null;
  let statDeltas = {};

  // Build overlay DOM
  const overlay = document.createElement('div');
  overlay.className = 'q-battle-overlay';
  overlay.innerHTML = `
    <div class="q-battle-card" id="q-bcard">
      <div class="q-battle-header">
        <span class="q-battle-title">\u2694 battle</span>
        <span class="q-battle-tap-hint">tap to skip</span>
      </div>
      <div class="q-battle-enemy-name">${enemyDef.name}</div>
      <div class="q-battle-enemy-lore">${enemyDef.lore}</div>
      <div class="q-battle-combatants">
        <div class="q-combatant">
          <div class="q-combatant-name">${char.name||'you'}</div>
          <div class="q-combatant-hp-bar-bg"><div class="q-combatant-hp-bar you" id="qb-your-bar" style="width:100%"></div></div>
          <div class="q-combatant-hp-val" id="qb-your-val">${yourHP} hp</div>
        </div>
        <div class="q-vs-badge">vs</div>
        <div class="q-combatant" style="text-align:right">
          <div class="q-combatant-name">${enemyDef.name}</div>
          <div class="q-combatant-hp-bar-bg"><div class="q-combatant-hp-bar enemy" id="qb-enemy-bar" style="width:100%"></div></div>
          <div class="q-combatant-hp-val" id="qb-enemy-val">${enemyHP} hp</div>
        </div>
      </div>
      <div class="q-battle-log" id="qb-log"></div>
      <div class="q-battle-stat-changes" id="qb-deltas"></div>
      <button class="q-battle-close-btn" id="qb-close">continue</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const log      = overlay.querySelector('#qb-log');
  const yourBar  = overlay.querySelector('#qb-your-bar');
  const enemyBar = overlay.querySelector('#qb-enemy-bar');
  const yourVal  = overlay.querySelector('#qb-your-val');
  const enemyVal = overlay.querySelector('#qb-enemy-val');
  const closeBtn = overlay.querySelector('#qb-close');
  const deltasEl = overlay.querySelector('#qb-deltas');

  function addLog(text, cls) {
    const d = document.createElement('div');
    d.className = 'q-blog-line' + (cls ? ' '+cls : '');
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }

  function updateBars() {
    const yPct = Math.max(0, Math.round(yourHP/yourMaxHP*100));
    const ePct = Math.max(0, Math.round(enemyHP/enemyMaxHP*100));
    yourBar.style.width  = yPct+'%';
    enemyBar.style.width = ePct+'%';
    yourVal.textContent  = Math.max(0,yourHP)+' hp';
    enemyVal.textContent = Math.max(0,enemyHP)+' hp';
  }

  function applyStatDeltas(didWin) {
    const STATS = ['atk','def','wit','luk'];
    const stored = loadBattleDeltas();
    STATS.forEach(s => {
      const roll = Math.random();
      let delta = 0;
      if (didWin) {
        delta = roll < 0.50 ? 0.1 : roll < 0.70 ? -0.1 : 0;
      } else {
        delta = roll < 0.20 ? 0.1 : roll < 0.70 ? -0.1 : 0;
      }
      if (delta !== 0) {
        statDeltas[s] = delta;
        stored[s] = Math.round(((stored[s]||0) + delta) * 10) / 10;
      }
    });
    saveBattleDeltas(stored);
    // Render delta chips
    Object.entries(statDeltas).forEach(([s, d]) => {
      const chip = document.createElement('div');
      chip.className = 'q-stat-delta ' + (d > 0 ? 'up' : 'down');
      chip.textContent = (d > 0 ? '+' : '') + d.toFixed(1) + ' ' + ({atk:'ATK',def:'DEF',wit:'WIT',luk:'LUK'}[s]);
      deltasEl.appendChild(chip);
    });
  }

  function finish(didWin) {
    // Ward Stone: consume to block a defeat
    if (!didWin && localStorage.getItem('ss_quest_ward') === '1') {
      localStorage.removeItem('ss_quest_ward');
      didWin = true;
      addLog('\u26E8 ward stone shatters — defeat blocked!', 'system');
    }
    done = true; won = didWin;
    if (turnTimer) { clearTimeout(turnTimer); turnTimer = null; }
    if (didWin) {
      addLog('\u2728 victory! the enemy dissolves.', 'result-win');
    } else {
      addLog('\u{1F480} defeated. you retreat into the fog.', 'result-loss');
    }
    applyStatDeltas(didWin);
    closeBtn.classList.add('visible');
    // Re-render quest view so stat bars update
    setTimeout(async () => {
      const el2 = document.getElementById('view-quest');
      if (el2) { const c2 = await loadCharacter(); const e2 = loadEvents(); renderQuest(el2, c2, e2); }
    }, 300);
  }

  function runTurn() {
    if (done) return;

    // Your attack
    const yourDmg = Math.floor(yourAtk/4) + Math.floor(Math.random()*3);
    enemyHP = Math.max(0, enemyHP - yourDmg);
    addLog('you strike for ' + yourDmg + ' dmg', 'dmg-enemy');
    updateBars();

    if (enemyHP <= 0) { finish(true); return; }

    // Enemy attack — reduced by def; WIT gives small dodge chance (~wit/200)
    const defMit  = Math.floor(yourDef/8);
    if (Math.random() < (yourWit / 200)) {
      addLog('you read the attack — dodged!', 'dmg-enemy');
      updateBars();
    } else {
      const rawDmg  = Math.floor(enemyAtkTotal/2) + Math.floor(Math.random()*3);
      const enemyDmg = Math.max(1, rawDmg - defMit);
      yourHP = Math.max(0, yourHP - enemyDmg);
      addLog(enemyDef.name + ' hits for ' + enemyDmg, 'dmg-you');
      updateBars();
      if (yourHP <= 0) { finish(false); return; }
    }

    turnTimer = setTimeout(runTurn, 900);
  }

  function skipToEnd() {
    if (done) return;
    // Simulate remaining turns instantly
    if (turnTimer) { clearTimeout(turnTimer); turnTimer = null; }
    let safetyMax = 40;
    while (!done && safetyMax-- > 0) {
      const yd = Math.floor(yourAtk/4) + Math.floor(Math.random()*3);
      enemyHP = Math.max(0, enemyHP - yd);
      if (enemyHP <= 0) { updateBars(); finish(true); return; }
      const defMit = Math.floor(yourDef/8);
      const ed = Math.max(1, Math.floor(enemyAtkTotal/2) + Math.floor(Math.random()*3) - defMit);
      yourHP = Math.max(0, yourHP - ed);
      if (yourHP <= 0) { updateBars(); finish(false); return; }
    }
    // Tiebreak — whoever has more HP %
    updateBars();
    finish(yourHP/yourMaxHP >= enemyHP/enemyMaxHP);
  }

  // Tap overlay = skip; tap card = ignore
  overlay.addEventListener('click', () => { if (!done) skipToEnd(); });
  overlay.querySelector('#q-bcard').addEventListener('click', e => e.stopPropagation());

  closeBtn.onclick = () => { overlay.remove(); };

  // Kick off first turn after a short breath
  addLog('the battle begins...', 'system');
  if (_buffLines.length) addLog('buffs: ' + _buffLines.join(' / '), 'system');
  if (!dm.goFirst) {
    addLog(enemyDef.name + ' seizes initiative!', 'dmg-you');
    const ed0 = Math.max(1, Math.floor(enemyAtkTotal/2)+Math.floor(Math.random()*3)-Math.floor(yourDef/8));
    yourHP = Math.max(0, yourHP - ed0);
    addLog(enemyDef.name + ' strikes for ' + ed0, 'dmg-you');
    updateBars();
    if (yourHP <= 0) { finish(false); return; }
  }
  let _critUsed = false;
  turnTimer = setTimeout(() => {
    if (dm.critFirst && !_critUsed) {
      _critUsed = true;
      const critDmg = Math.floor(yourAtk/2)*2 + Math.floor(Math.random()*3);
      enemyHP = Math.max(0, enemyHP - critDmg);
      addLog('CRIT! you strike for ' + critDmg + ' dmg', 'dmg-enemy');
      updateBars();
      if (enemyHP <= 0) { finish(true); return; }
      turnTimer = setTimeout(runTurn, 900);
    } else { runTurn(); }
  }, 600);
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
  if (_initialized) {
    // Re-render only — skip loot drop and idle resolve on revisit
    const el = document.getElementById('view-quest');
    if (el) { const c = await loadCharacter(); const e = loadEvents(); renderQuest(el, c, e); }
    return;
  }
  // sessionStorage guard — survives Ctrl+R within same tab session
  // Only drop loot and resolve idle quests once per browser session, not per module load
  const _sessionKey = 'ss_quest_session_' + new Date().toISOString().slice(0,10);
  const _alreadyRan = sessionStorage.getItem(_sessionKey);
  if (!_alreadyRan) {
    sessionStorage.setItem(_sessionKey, '1');
    dropRandomLoot();
    setTimeout(resolveCompletedQuests, 800);
  }

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

  // Pull cloud-saved events and resolved list, merge with local
  try {
    const [cloudEvs, cloudRes] = await Promise.all([
      syncLoad('quest_events'),
      syncLoad('quest_resolved'),
    ]);
    if (Array.isArray(cloudEvs) && cloudEvs.length > 0) {
      // Merge: union by id, cloud wins on conflict
      const local = loadEvents();
      const merged = [...cloudEvs];
      local.forEach(ev => { if (!merged.find(c => c.id === ev.id)) merged.push(ev); });
      localStorage.setItem('ss_quest_events', JSON.stringify(merged));
    }
    if (Array.isArray(cloudRes) && cloudRes.length > 0) {
      const localRes = loadResolved();
      const mergedRes = [...new Set([...cloudRes, ...localRes])];
      localStorage.setItem('ss_quest_resolved', JSON.stringify(mergedRes));
    }
  } catch(e) { console.warn('[quest] cloud merge failed:', e); }

  const events = loadEvents();
  renderQuest(el, char, events);
}
