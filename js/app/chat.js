// ============================================================
// SPIRALSIDE — CHAT v1.0
// Handles all message sending, rendering, and typewriter display
// Checks demo.js FIRST — scripted replies cost zero tokens
// Falls through to Railway API only when demo returns null
// Nimbis anchor: js/app/chat.js
// ============================================================

import { state }           from './state.js';
import { buildYouContext }  from './sheet.js';
import { speakReply }          from './models.js';
import { getDemoResponse, loadDemoResponses } from './demo.js';

// ── DOM REFS ──────────────────────────────────────────────
// Grabbed once on initChat — never queried again after that
let msgList  = null;  // #chat-messages scroll container
let msgInput = null;  // #msg-input textarea
let sendBtn  = null;  // #send-btn button

// ── RAIL URL ──────────────────────────────────────────────
// Imported from state.js so it stays in one place
// If state.js not wired yet, fallback inline
const RAIL = 'https://web-production-4e6f3.up.railway.app';

// ── INIT ──────────────────────────────────────────────────
// Called once from main.js after DOM is ready
// Wires textarea auto-resize, Enter key, send button
export function initChat(openPanelFn) {
  // Load Sky's response library from HF into IDB cache
  // Runs async in background  ready well before first message
  loadDemoResponses();
  msgList  = document.getElementById('chat-messages');
  msgInput = document.getElementById('msg-input');
  sendBtn  = document.getElementById('send-btn');

  // Store openPanel reference so nudge callback can open the store
  // openPanelFn is passed in from main.js / ui.js
  state._openPanel = (tab) => window.switchView && window.switchView(tab);

  // Auto-resize textarea as user types
  msgInput.addEventListener('input', () => {
    msgInput.style.height = 'auto';
    msgInput.style.height = Math.min(msgInput.scrollHeight, 100) + 'px';
  });

  // Enter sends, Shift+Enter adds newline
  msgInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);
  // Expose sendMessage for STT auto-send in models.js
  window._sendMessage = sendMessage;
}

// ── ADD MESSAGE TO DOM ────────────────────────────────────
// role: 'user' | 'bot'
// Returns the bubble element so callers can stream into it
// -- CREW VOICE COLORS --
const _CREW_COLORS = { SKY: '#00F6D6', COLD: '#4DA3FF', MONDAY: '#FF4BCB', GRIT: '#FFD93D' };

function _parseCrewVoices(text) {
  const names = Object.keys(_CREW_COLORS);
  if (!names.some(n => text.includes(n + ':'))) return null;
  const parts = text.split(/((?:SKY|COLD|MONDAY|GRIT):)/);
  let out = '', current = null;
  parts.forEach(p => {
    const m = p.match(/^(SKY|COLD|MONDAY|GRIT):$/);
    if (m) { current = m[1]; return; }
    if (current) {
      const col = _CREW_COLORS[current];
      out += '<span class="crew-line" style="display:block;margin-bottom:10px;">' +
        '<span style="font-size:0.58rem;letter-spacing:0.12em;color:' + col + ';opacity:0.85;display:block;margin-bottom:3px;">' + current + '</span>' +
        '<span>' + p.trim() + '</span></span>';
      current = null;
    } else if (p.trim()) {
      out += '<span style="display:block;">' + p.trim() + '</span>';
    }
  });
  return out || null;
}

export function addMessage(text, role) {
  const wrap = document.createElement('div');
  wrap.className = `msg ${role}`;

  // Avatar initial — bot uses first letter of bot name, user uses email initial
  const initial = role === 'bot'
    ? (state.botName?.[0] || 'S').toUpperCase()
    : (state.user?.email?.[0] || 'U').toUpperCase();

  const _crewHTML = (role === 'bot') ? _parseCrewVoices(text) : null;
  wrap.innerHTML = `
    <div class="msg-avatar">${initial}</div>
    <div class="msg-bubble">${_crewHTML || text}</div>
  `;

  const bubble = wrap.querySelector('.msg-bubble');
  bubble.style.cursor = 'pointer';
  // â”€â”€ BUBBLE CONTEXT MENU â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  bubble.addEventListener('click', (e) => {
    document.querySelectorAll('.bubble-menu').forEach(m => m.remove());
    const menu = document.createElement('div');
    menu.className = 'bubble-menu';
    menu.style.cssText = 'position:absolute;z-index:9999;background:#111118;border:1px solid #2a2a3e;border-radius:10px;padding:4px;display:flex;gap:4px;box-shadow:0 4px 20px rgba(0,0,0,0.5);bottom:calc(100% + 4px);left:40px;';
    [
      ['copy',   '📋', () => { const t = bubble.innerText||bubble.textContent; navigator.clipboard.writeText(t).then(()=>{ const p=bubble.style.outline; bubble.style.outline='2px solid var(--teal)'; setTimeout(()=>{bubble.style.outline=p;},600); }).catch(()=>{}); }],
      ['crew',   '↩',    () => { import('./state.js').then(({state})=>{state.botName='Sky';state.botColor='#00F6D6';});import('./chat.js').then(({clearChat})=>clearChat()); }],
      ['cannon', '🔖', () => { import('./ui.js').then(({switchView})=>switchView('cannon')); }],
      ['cut',    '✂️',  () => { import('./ui.js').then(({switchView})=>switchView('cut')); }],
      ['speak',  '🔊', () => { const t=bubble.innerText||bubble.textContent; import('./models.js').then(({speakReply})=>speakReply(t)); }],
    ].forEach(([label,icon,action]) => {
      const btn = document.createElement('button');
      btn.title=label; btn.textContent=icon;
      btn.style.cssText='background:none;border:none;cursor:pointer;font-size:1rem;padding:4px 6px;border-radius:6px;color:#e8e8f0;transition:background 0.15s;';
      btn.onmouseenter=()=>btn.style.background='#2a2a3e';
      btn.onmouseleave=()=>btn.style.background='none';
      btn.onclick=(ev)=>{ev.stopPropagation();menu.remove();action();};
      menu.appendChild(btn);
    });
    wrap.style.position='relative';
    wrap.appendChild(menu);
    setTimeout(()=>document.addEventListener('click',()=>menu.remove(),{once:true}),0);
  });


    // Remove any existing menu
    document.querySelectorAll('.bubble-menu').forEach(m => m.remove());
    const menu = document.createElement('div');
    menu.className = 'bubble-menu';
    menu.style.cssText = 'position:absolute;z-index:9999;background:#111118;border:1px solid #2a2a3e;border-radius:10px;padding:4px;display:flex;gap:4px;box-shadow:0 4px 20px rgba(0,0,0,0.5);';
    const items = [
