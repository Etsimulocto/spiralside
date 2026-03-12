#!/bin/bash
# ============================================================
# SPIRALSIDE — MODULE INSTALLER
# Run from ~/spiralside in Git Bash
# Creates js/app/ with all 10 modules then pushes to GitHub
# ============================================================
set -e
echo "🌀 Installing Spiralside modules..."
mkdir -p js/app
echo "📁 js/app/ ready"

echo "📄 Writing js/app/state.js..."
cat > js/app/state.js << 'SSEOF'
// ============================================================
// SPIRALSIDE — STATE v1.0
// All constants, shared state, character data, speaker colors
// Nimbis anchor: js/app/state.js
// ============================================================

// ── CONFIG ────────────────────────────────────────────────────
export const RAIL = 'https://web-production-4e6f3.up.railway.app';

// ── SPEAKER COLOR MAP ─────────────────────────────────────────
export const SPEAKER_COLORS = {
  sky:      '#00F6D6',
  monday:   '#FF4BCB',
  cold:     '#4DA3FF',
  grit:     '#FFD93D',
  narrator: '#F0F0FF',
};

// ── APP STATE ──────────────────────────────────────────────────
// Single mutable object — import and mutate directly
export const state = {
  user:            null,   // Supabase user object
  session:         null,   // Supabase session object
  botName:         'Sky',
  botPersonality:  '',
  botGreeting:     "Hey. I'm here.",
  botTone:         [],
  botColor:        '#00F6D6',
  vaultFiles:      [],     // array of { name, size, content, type }
  activeChar:      'sky',  // currently selected character sheet
  fabOpen:         false,  // FAB menu state
  activeView:      'chat', // current view id
  credits:         0,
  freeToday:       0,
  isPaid:          false,
};

// ── CHARACTER DATA ─────────────────────────────────────────────
// Source of truth for all character sheets
// arc / traits / user fields get overwritten from IndexedDB on load
export const CHARACTERS = {
  sky: {
    name: 'Sky', color: '#00F6D6', initial: 'S',
    trait: 'Mirror-born Spark', mood: 'curious',
    traits: [
      { label: 'Chaotic Energy', val: 82 },
      { label: 'Empathy',        val: 74 },
      { label: 'Curiosity',      val: 95 },
      { label: 'Trust Level',    val: 61 },
    ],
    arc: "Still figuring out what Mirror-born actually means. The Spiral echoes back in ways that don't always make sense. Dragon companion Lophire ate another keyboard.",
  },
  monday: {
    name: 'Monday', color: '#FF4BCB', initial: 'M',
    trait: 'Chaos Agent', mood: 'chaotic',
    traits: [
      { label: 'Chaotic Energy', val: 99 },
      { label: 'Enthusiasm',     val: 97 },
      { label: 'Patience',       val: 12 },
      { label: 'Loud',           val: 98 },
    ],
    arc: 'Trying to get everyone to skip the dramatic intros. Failing. Having a great time anyway.',
  },
  cold: {
    name: 'Cold', color: '#4DA3FF', initial: 'C',
    trait: 'The Architect', mood: 'stoic',
    traits: [
      { label: 'Composure',   val: 96 },
      { label: 'Precision',   val: 91 },
      { label: 'Warmth',      val: 38 },
      { label: 'Loyalty',     val: 88 },
    ],
    arc: 'Watching. Always watching. Occasionally saying a single word at exactly the right moment.',
  },
  grit: {
    name: 'GRIT', color: '#FFD93D', initial: 'G',
    trait: 'Street Oracle', mood: 'grounded',
    traits: [
      { label: 'Street Sense', val: 94 },
      { label: 'Bluntness',    val: 89 },
      { label: 'Heart',        val: 77 },
      { label: 'Mystery',      val: 65 },
    ],
    arc: "Knows more about the Spiral than anyone admits. Chooses not to say most of it.",
  },
  you: {
    name: 'You', color: '#7B5FFF', initial: '?',
    trait: 'the one who showed up', mood: 'unknown',
    isUser: true,
    traits: [
      { label: 'Curiosity',   val: 50 },
      { label: 'Creativity',  val: 50 },
      { label: 'Chaos Level', val: 50 },
      { label: 'Trust',       val: 50 },
    ],
    arc: '',
    handle: '', vibe: '', song: '',
  },
};

// ── FAB TAB DEFINITIONS ───────────────────────────────────────
export const FAB_TABS = [
  { id: 'chat',  label: 'chat',  icon: '💬', color: '#00F6D6' },
  { id: 'sheet', label: 'sheet', icon: '✦',  color: '#FF4BCB' },
  { id: 'vault', label: 'vault', icon: '🗂',  color: '#7B5FFF' },
  { id: 'build', label: 'build', icon: '⚙',  color: '#FFD93D' },
];

SSEOF

echo "📄 Writing js/app/db.js..."
cat > js/app/db.js << 'SSEOF'
// ============================================================
// SPIRALSIDE — DB v1.0
// All IndexedDB operations — init, get, set, getAll, delete
// Stores: 'sheets' (keyPath:id), 'vault' (keyPath:name), 'config' (keyPath:key)
// Nimbis anchor: js/app/db.js
// ============================================================

let db = null; // single shared IDB connection

// ── INIT ──────────────────────────────────────────────────────
// Open the database. Must be called before any other db* fn.
export async function initDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open('spiralside', 2);

    req.onupgradeneeded = e => {
      const d = e.target.result;
      // Create stores if they don't exist yet
      if (!d.objectStoreNames.contains('sheets')) d.createObjectStore('sheets', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('vault'))  d.createObjectStore('vault',  { keyPath: 'name' });
      if (!d.objectStoreNames.contains('config')) d.createObjectStore('config', { keyPath: 'key' });
    };

    req.onsuccess = e => { db = e.target.result; res(db); };
    req.onerror   = ()  => rej(req.error);
  });
}

// ── SET (upsert) ───────────────────────────────────────────────
export async function dbSet(store, val) {
  return new Promise((res, rej) => {
    const tx  = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(val);
    req.onsuccess = () => res();
    req.onerror   = () => rej(req.error);
  });
}

// ── GET (by key) ───────────────────────────────────────────────
export async function dbGet(store, key) {
  return new Promise((res, rej) => {
    const tx  = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

// ── GET ALL ────────────────────────────────────────────────────
export async function dbGetAll(store) {
  return new Promise((res, rej) => {
    const tx  = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

// ── DELETE (by key) ────────────────────────────────────────────
export async function dbDelete(store, key) {
  return new Promise((res, rej) => {
    const tx  = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => res();
    req.onerror   = () => rej(req.error);
  });
}

SSEOF

echo "📄 Writing js/app/comic.js..."
cat > js/app/comic.js << 'SSEOF'
// ============================================================
// SPIRALSIDE — COMIC v1.0
// Self-contained comic intro: panels, typewriter, tap handler
// Calls onFinish() when done — wired to checkAuthAndShow in main
// Nimbis anchor: js/app/comic.js
// ============================================================

// ── PANEL DATA ────────────────────────────────────────────────
// Gradients are dark-to-bg — panel images overlay when provided
const PANELS = [
  { bg_gradient: 'radial-gradient(ellipse at 50% 60%,#1a0a2e 0%,#08080d 70%)',
    transition: 'fade',
    dialogue: [{ speaker: 'narrator', text: 'Spiral City. Population: complicated.' }] },

  { bg_gradient: 'radial-gradient(ellipse at 30% 40%,#002a2a 0%,#08080d 70%)',
    transition: 'crash',
    dialogue: [{ speaker: 'Sky', text: "Oh. You're actually here." }] },

  { bg_gradient: 'radial-gradient(ellipse at 70% 50%,#1a002a 0%,#08080d 70%)',
    transition: 'glitch',
    dialogue: [
      { speaker: 'Sky', text: 'This place remembers you.' },
      { speaker: 'Sky', text: "I don't always understand how. But the Spiral echoes back." },
    ] },

  { bg_gradient: 'radial-gradient(ellipse at 50% 30%,#1a1a00 0%,#08080d 70%)',
    transition: 'crash',
    dialogue: [
      { speaker: 'Monday', text: 'HEY. Are we doing the dramatic intro thing AGAIN' },
      { speaker: 'Cold',   text: 'Monday.' },
      { speaker: 'Monday', text: '...fine.' },
    ] },

  { bg_gradient: 'radial-gradient(ellipse at 50% 50%,#001a2a 0%,#08080d 70%)',
    transition: 'glitch',
    dialogue: [
      { speaker: 'Sky', text: 'Your companion. Your data. Your rules.' },
      { speaker: 'Sky', text: 'Ready?' },
    ] },

  { bg_gradient: 'radial-gradient(ellipse at 50% 50%,rgba(0,246,214,0.12) 0%,#08080d 60%)',
    transition: 'fade',
    crack: true,
    dialogue: [{ speaker: 'narrator', text: '— entering Spiralside —' }] },
];

// ── MODULE STATE ──────────────────────────────────────────────
let comicPanel  = 0;    // current panel index
let comicTyping = null; // active typewriter interval
let comicLineIdx = 0;   // current dialogue line within panel

// ── INIT ──────────────────────────────────────────────────────
// Call once. onFinish fires when comic ends or user skips.
export function initComic(onFinish) {
  // Tap anywhere to advance
  document.getElementById('screen-comic')
    .addEventListener('click', () => comicTap(onFinish));

  // Skip button bypasses everything
  document.getElementById('comic-skip')
    .addEventListener('click', e => { e.stopPropagation(); comicFinish(onFinish); });

  // Render first panel
  comicRender(0, onFinish);
}

// ── RENDER PANEL ──────────────────────────────────────────────
function comicRender(idx, onFinish) {
  const p = PANELS[idx];
  if (!p) { comicFinish(onFinish); return; }

  // Set background
  const bg = document.getElementById('comic-bg');
  bg.className = ''; // clear previous animation class
  bg.style.cssText = p.image
    ? `background-image:url(${p.image});background-size:cover;background-position:center`
    : `background:${p.bg_gradient}`;

  // Force reflow so animation retriggers
  void bg.offsetWidth;
  bg.classList.add(p.transition || 'fade');

  // Crack effect (final panel only)
  document.getElementById('comic-crack').classList.toggle('show', !!p.crack);

  // Show skip button after first panel
  if (idx >= 1) document.getElementById('comic-skip').classList.add('visible');

  // Progress dots
  const counter = document.getElementById('comic-counter');
  counter.innerHTML = PANELS.map((_, i) =>
    `<div class="comic-dot ${i === idx ? 'active' : i < idx ? 'done' : ''}"></div>`
  ).join('');

  // Start typewriter on first dialogue line
  comicLineIdx = 0;
  comicTypeLine(p.dialogue || [], 0, onFinish);
}

// ── TYPEWRITER ────────────────────────────────────────────────
function comicTypeLine(lines, idx, onFinish) {
  if (!lines.length) return;
  comicLineIdx = idx;
  if (idx >= lines.length) return;

  const line      = lines[idx];
  const speakerEl = document.getElementById('comic-speaker');
  const textEl    = document.getElementById('comic-text');

  // Speaker label + color class
  speakerEl.textContent = line.speaker === 'narrator' ? '' : line.speaker;
  speakerEl.className   = line.speaker.toLowerCase();
  textEl.textContent    = '';

  // Clear any running typewriter
  if (comicTyping) clearInterval(comicTyping);

  let i = 0;
  // Narrator is slower for dramatic weight
  const speed = line.speaker === 'narrator' ? 32 : 20;

  comicTyping = setInterval(() => {
    textEl.textContent += line.text[i++];
    if (i >= line.text.length) {
      clearInterval(comicTyping);
      comicTyping = null;
      // Auto-advance to next line in same panel after a beat
      if (idx + 1 < lines.length) {
        setTimeout(() => comicTypeLine(lines, idx + 1, onFinish), 1100);
      }
    }
  }, speed);
}

// ── FLUSH (skip to end of current line instantly) ─────────────
function comicFlush() {
  if (!comicTyping) return;
  clearInterval(comicTyping);
  comicTyping = null;

  const lines = PANELS[comicPanel]?.dialogue || [];
  const line  = lines[comicLineIdx];
  if (!line) return;

  document.getElementById('comic-text').textContent    = line.text;
  document.getElementById('comic-speaker').textContent = line.speaker === 'narrator' ? '' : line.speaker;
  document.getElementById('comic-speaker').className   = line.speaker.toLowerCase();
}

// ── TAP HANDLER ───────────────────────────────────────────────
function comicTap(onFinish) {
  // If typewriter mid-line — flush it
  if (comicTyping) { comicFlush(); return; }
  // Else advance to next panel
  comicPanel++;
  if (comicPanel >= PANELS.length) comicFinish(onFinish);
  else comicRender(comicPanel, onFinish);
}

// ── FINISH ────────────────────────────────────────────────────
function comicFinish(onFinish) {
  const el = document.getElementById('screen-comic');
  el.classList.add('fade-out');
  setTimeout(() => {
    el.style.display = 'none';
    onFinish();
  }, 500);
}

SSEOF

echo "📄 Writing js/app/auth.js..."
cat > js/app/auth.js << 'SSEOF'
// ============================================================
// SPIRALSIDE — AUTH v1.0
// Supabase init, login/signup/signout, screen routing
// Exports sb (supabase client) for use across all modules
// Nimbis anchor: js/app/auth.js
// ============================================================

import { state } from './state.js';

// ── SUPABASE CLIENT ───────────────────────────────────────────
// supabase global is loaded via CDN script tag in index.html
const { createClient } = supabase;
export const sb = createClient(
  'https://qfawusrelwthxabfbglg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYXd1c3JlbHd0aHhhYmZiZ2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzc5NzUsImV4cCI6MjA4ODc1Mzk3NX0.XkeFmWq-rOH2whgfkeMylyG7Ct_0u80fMkoJlEQ5K8E'
);

// ── SCREEN ROUTING ────────────────────────────────────────────
// Shows one .screen by name, hides all others
export function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${name}`)?.classList.add('active');
}

// ── CHECK SESSION AND ROUTE ───────────────────────────────────
// Called after comic finishes — routes to app or auth
export function checkAuthAndShow(onAppReady) {
  sb.auth.getSession().then(({ data }) => {
    if (data?.session?.user) {
      state.user    = data.session.user;
      state.session = data.session;
      showScreen('app');
      onAppReady();
    } else {
      showScreen('auth');
    }
  });
}

// ── LISTEN FOR AUTH CHANGES ───────────────────────────────────
// Keeps state.session current if user signs in from another tab
export function listenAuthChanges() {
  sb.auth.onAuthStateChange((_, session) => {
    if (session?.user && !state.user) {
      state.user    = session.user;
      state.session = session;
    }
  });
}

// ── PASSWORD VISIBILITY TOGGLE ────────────────────────────────
// Called from HTML onclick — keeps btn in sync
export function togglePw(id, btn) {
  const input = document.getElementById(id);
  input.type     = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? 'show' : 'hide';
}

// ── AUTH TAB SWITCH ───────────────────────────────────────────
export function switchAuthTab(t) {
  document.getElementById('login-form').style.display  = t === 'login'  ? 'block' : 'none';
  document.getElementById('signup-form').style.display = t === 'signup' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active',  t === 'login');
  document.getElementById('tab-signup').classList.toggle('active', t === 'signup');
  document.getElementById('auth-error').textContent = '';
}

// ── ERROR DISPLAY ─────────────────────────────────────────────
function setAuthError(msg, success = false) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.className   = 'auth-error' + (success ? ' auth-success' : '');
}

// ── LOGIN ─────────────────────────────────────────────────────
export async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  const btn   = document.querySelector('#login-form .auth-btn');
  btn.disabled = true; btn.textContent = 'signing in...';
  const { error } = await sb.auth.signInWithPassword({ email, password: pass });
  btn.disabled = false; btn.textContent = 'sign in';
  if (error) setAuthError(error.message);
}

// ── SIGNUP ────────────────────────────────────────────────────
export async function handleSignup() {
  if (!document.getElementById('age-check').checked) {
    setAuthError('You must confirm your age.');
    return;
  }
  const email = document.getElementById('signup-email').value.trim();
  const pass  = document.getElementById('signup-password').value;
  const btn   = document.querySelector('#signup-form .auth-btn');
  btn.disabled = true; btn.textContent = 'creating...';
  const { error } = await sb.auth.signUp({ email, password: pass });
  btn.disabled = false; btn.textContent = 'create account';
  if (error) setAuthError(error.message);
  else setAuthError('Check your email to confirm!', true);
}

// ── SIGNOUT ───────────────────────────────────────────────────
export async function handleSignout(closePanel) {
  await sb.auth.signOut();
  closePanel();
  state.user    = null;
  state.session = null;
  showScreen('auth');
}

// ── GET FRESH TOKEN ───────────────────────────────────────────
// Helper used in chat/usage/paypal — refreshes session if needed
export async function getToken() {
  let token = state.session?.access_token;
  if (!token) {
    const { data } = await sb.auth.getSession();
    token = data?.session?.access_token;
    if (data?.session) state.session = data.session;
  }
  return token;
}

SSEOF

echo "📄 Writing js/app/chat.js..."
cat > js/app/chat.js << 'SSEOF'
// ============================================================
// SPIRALSIDE — CHAT v1.0
// addMessage, showTyping, sendMessage, attach handler
// Reads state for bot config; writes usage back to state
// Nimbis anchor: js/app/chat.js
// ============================================================

import { state, SPEAKER_COLORS, CHARACTERS, RAIL } from './state.js';
import { getToken }                                  from './auth.js';
import { updateCreditDisplay }                       from './ui.js';

// ── DOM REFS ──────────────────────────────────────────────────
// Set once at module init — avoids repeated getElementById calls
let chatMsgs = null;
let msgInput  = null;

// ── INIT ──────────────────────────────────────────────────────
// Call once after DOM is ready
export function initChat() {
  chatMsgs = document.getElementById('chat-messages');
  msgInput  = document.getElementById('msg-input');

  // Auto-grow textarea
  msgInput.addEventListener('input', () => {
    msgInput.style.height = 'auto';
    msgInput.style.height = Math.min(msgInput.scrollHeight, 100) + 'px';
  });

  // Enter to send (shift+enter = newline)
  msgInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  // Send button
  document.getElementById('send-btn').addEventListener('click', sendMessage);

  // Attach button (quick image attach — goes to vault too)
  document.getElementById('attach-btn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type   = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
      const f = e.target.files[0];
      if (!f) return;
      addMessage(`📎 ${f.name}`, 'user');
      state.vaultFiles.push({ name: f.name, size: f.size, content: '[image]', type: f.type });
    };
    input.click();
  });
}

// ── ADD MESSAGE ───────────────────────────────────────────────
// role: 'bot' | 'user'
// speaker: display name string (bot only, optional)
// color: hex string (bot only, optional)
export function addMessage(text, role, speaker = null, color = null) {
  const div      = document.createElement('div');
  div.className  = `msg ${role}`;

  const spColor  = color || (SPEAKER_COLORS[speaker?.toLowerCase()] || 'var(--teal)');
  const initial  = role === 'bot'
    ? (speaker?.[0] || state.botName[0] || 'S').toUpperCase()
    : (state.user?.email?.[0] || 'U').toUpperCase();

  if (role === 'bot') {
    div.innerHTML = `
      <div class="msg-avatar"
        style="background:linear-gradient(135deg,${spColor}33,${spColor}11);border:2px solid ${spColor}44;color:${spColor}">
        ${initial}
      </div>
      <div class="msg-content">
        ${speaker ? `<div class="msg-speaker" style="color:${spColor}">${speaker}</div>` : ''}
        <div class="msg-bubble">
          <div style="position:absolute;top:0;left:0;right:0;height:1px;
            background:linear-gradient(90deg,${spColor}66,transparent)"></div>
          ${text}
        </div>
      </div>`;
  } else {
    div.innerHTML = `
      <div class="msg-content">
        <div class="msg-bubble">${text}</div>
      </div>
      <div class="msg-avatar" style="background:var(--muted);color:var(--subtext)">${initial}</div>`;
  }

  chatMsgs.appendChild(div);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

// ── TYPING INDICATOR ──────────────────────────────────────────
export function showTyping() {
  const div     = document.createElement('div');
  div.className = 'msg bot';
  div.id        = 'typing-indicator';
  const c       = state.botColor;
  div.innerHTML = `
    <div class="msg-avatar"
      style="background:linear-gradient(135deg,${c}33,${c}11);border:2px solid ${c}44;color:${c}">
      ${state.botName[0].toUpperCase()}
    </div>
    <div class="msg-content">
      <div class="msg-bubble">
        <div class="typing-indicator"><span></span><span></span><span></span></div>
      </div>
    </div>`;
  chatMsgs.appendChild(div);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

export function hideTyping() {
  document.getElementById('typing-indicator')?.remove();
}

// ── SEND MESSAGE ──────────────────────────────────────────────
export async function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;

  // Clear input
  msgInput.value        = '';
  msgInput.style.height = 'auto';

  addMessage(text, 'user');
  showTyping();

  try {
    // Build vault context string
    const vault = state.vaultFiles
      .map(f => `[file:${f.name}]\n${f.content}`)
      .join('\n\n');

    // Build system prompt from current bot config + character arc
    let sys = `You are ${state.botName}.`;
    if (state.botPersonality) sys += ` ${state.botPersonality}`;
    if (state.botTone.length)  sys += ` Tone: ${state.botTone.join(', ')}.`;
    sys += ` Be genuine and concise. Never use asterisks for actions — express emotion through word choice and sentence structure instead. Never break character.`;

    // Inject character sheet arc for known characters
    const charData = CHARACTERS[state.botName.toLowerCase()];
    if (charData) sys += ` Your current arc: ${charData.arc}`;

    const token = await getToken();
    if (!token) {
      hideTyping();
      addMessage('Please sign in to chat.', 'bot', state.botName, state.botColor);
      return;
    }

    const r = await fetch(`${RAIL}/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({
        message:       text,
        system_prompt: sys,
        vault_context: vault,
        bot_name:      state.botName,
      }),
    });

    const data = await r.json();
    hideTyping();

    if (!r.ok) {
      addMessage(`⚠️ ${data.detail || 'Something went wrong.'}`, 'bot', state.botName, state.botColor);
      return;
    }

    addMessage(data.reply, 'bot', state.botName, state.botColor);

    // Update credit display from response usage object
    if (data.usage) {
      state.freeToday = data.usage.free_messages_today ?? state.freeToday;
      state.credits   = data.usage.credits_remaining   ?? state.credits;
      state.isPaid    = data.usage.is_paid              ?? false;
      updateCreditDisplay();
    }
  } catch {
    hideTyping();
    addMessage('Connection issue. Try again.', 'bot', state.botName, state.botColor);
  }
}

// ── EXPORTED REF ─────────────────────────────────────────────
// sheet.js needs to read chatMsgs to summarize thread
export function getChatMsgs() { return chatMsgs; }

SSEOF

echo "📄 Writing js/app/sheet.js..."
cat > js/app/sheet.js << 'SSEOF'
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

// ── PRIVATE: STYLE CHIP ───────────────────────────────────────
function _styleChip(chip, id, active) {
  const c = CHARACTERS[id].color;
  chip.classList.toggle('active', active);
  chip.style.color       = active ? c            : 'var(--subtext)';
  chip.style.borderColor = active ? c + '88'     : 'var(--border)';
  chip.style.boxShadow   = active ? `0 0 16px ${c}44` : 'none';
  chip.style.background  = active ? c + '11'     : 'var(--surface2)';
}

SSEOF

echo "📄 Writing js/app/vault.js..."
cat > js/app/vault.js << 'SSEOF'
// ============================================================
// SPIRALSIDE — VAULT v1.0
// File upload, folder picker, render list, delete
// Files stored in state.vaultFiles + IndexedDB 'vault' store
// Nimbis anchor: js/app/vault.js
// ============================================================

import { state }           from './state.js';
import { dbSet, dbDelete } from './db.js';

// Accent colors cycle across vault items
const VAULT_COLORS = ['#00F6D6', '#FF4BCB', '#7B5FFF', '#FFD93D', '#4DA3FF'];

// ── INIT ──────────────────────────────────────────────────────
export function initVault() {
  // File picker input
  document.getElementById('file-input').addEventListener('change', handleFileInput);

  // Folder picker button (uses File System Access API where available)
  document.getElementById('open-folder-btn').addEventListener('click', handleFolderPick);
}

// ── HANDLE FILE INPUT ─────────────────────────────────────────
async function handleFileInput(e) {
  for (const f of e.target.files) {
    const content = await f.text().catch(() => '[binary]');
    const entry   = { name: f.name, size: f.size, content, type: f.type };
    state.vaultFiles.push(entry);
    await dbSet('vault', entry);
  }
  renderVault();
  e.target.value = ''; // reset so same file can be re-added
}

// ── HANDLE FOLDER PICK ────────────────────────────────────────
async function handleFolderPick() {
  // Prefer native folder picker on supporting browsers
  if ('showDirectoryPicker' in window) {
    try {
      const dir = await window.showDirectoryPicker({ mode: 'readwrite' });
      for await (const [name, handle] of dir.entries()) {
        if (handle.kind === 'file') {
          const f       = await handle.getFile();
          const content = await f.text().catch(() => '[binary]');
          // Skip duplicates
          if (!state.vaultFiles.find(x => x.name === name)) {
            const entry = { name, size: f.size, content, type: f.type };
            state.vaultFiles.push(entry);
            await dbSet('vault', entry);
          }
        }
      }
      renderVault();
    } catch {
      // User cancelled picker — do nothing
    }
  } else {
    // Fallback: open multi-file input
    document.getElementById('file-input').click();
  }
}

// ── RENDER VAULT LIST ─────────────────────────────────────────
export function renderVault() {
  const list = document.getElementById('vault-list');

  if (!state.vaultFiles.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🗂</div>
        No files yet.<br>Add docs and your companion will remember them.
      </div>`;
    return;
  }

  list.innerHTML = state.vaultFiles.map((f, i) => {
    const c    = VAULT_COLORS[i % VAULT_COLORS.length];
    const icon = f.type?.startsWith('image')
      ? '🖼'
      : f.name.endsWith('.md') ? '📜' : '📄';

    return `
      <div class="vault-item">
        <div class="vault-item-accent" style="background:${c}"></div>
        <div class="vault-icon" style="background:${c}22;border:1px solid ${c}44">${icon}</div>
        <div class="vault-info">
          <div class="vault-filename">${f.name}</div>
          <div class="vault-meta" style="color:${c}">
            ${(f.size / 1024).toFixed(1)} KB · visible to companion
          </div>
        </div>
        <button class="vault-del" onclick="removeFile('${f.name}')">✕</button>
      </div>`;
  }).join('');
}

// ── REMOVE FILE ───────────────────────────────────────────────
// Called from inline onclick in renderVault HTML
export async function removeFile(name) {
  state.vaultFiles = state.vaultFiles.filter(f => f.name !== name);
  await dbDelete('vault', name);
  renderVault();
}

// ── LOAD VAULT FROM IDB ───────────────────────────────────────
// Called in onAppReady after initDB — restores persisted files
export function loadVaultFromDB(files) {
  state.vaultFiles = files || [];
  renderVault();
}

SSEOF

echo "📄 Writing js/app/build.js..."
cat > js/app/build.js << 'SSEOF'
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

SSEOF

echo "📄 Writing js/app/ui.js..."
cat > js/app/ui.js << 'SSEOF'
// ============================================================
// SPIRALSIDE — UI v1.0
// FAB menu, slide panel, view switching, header glow,
// credits display, greeting update, user avatar init
// Nimbis anchor: js/app/ui.js
// ============================================================

import { state, FAB_TABS, RAIL } from './state.js';
import { getToken }               from './auth.js';

// ── BUILD FAB MENU ────────────────────────────────────────────
// Injects 4 FAB items above the main button
export function buildFAB() {
  const container = document.getElementById('fab-container');

  // Remove any old items
  container.querySelectorAll('.fab-item').forEach(el => el.remove());

  FAB_TABS.forEach((tab, i) => {
    const item       = document.createElement('div');
    item.className   = 'fab-item';
    item.id          = `fab-item-${tab.id}`;
    item.style.bottom = `${64 + i * 56}px`;
    item.innerHTML   = `
      <span class="fab-label" style="color:${tab.color}">${tab.label}</span>
      <div class="fab-icon-btn" style="border-color:${tab.color}44;color:${tab.color}"
        onclick="switchView('${tab.id}')">${tab.icon}</div>
    `;
    // Insert before the main FAB button
    container.insertBefore(item, document.getElementById('fab-main'));
  });
}

// ── TOGGLE FAB ────────────────────────────────────────────────
export function toggleFAB() {
  state.fabOpen = !state.fabOpen;
  const btn = document.getElementById('fab-main');
  btn.classList.toggle('open', state.fabOpen);
  document.querySelectorAll('.fab-item').forEach((el, i) => {
    el.classList.toggle('open', state.fabOpen);
    el.style.transitionDelay = state.fabOpen
      ? `${i * 0.04}s`
      : `${(3 - i) * 0.03}s`;
  });
}

// ── SWITCH VIEW ───────────────────────────────────────────────
// id: 'chat' | 'sheet' | 'vault' | 'build'
export function switchView(id) {
  state.activeView = id;

  // Close FAB
  state.fabOpen = false;
  document.getElementById('fab-main').classList.remove('open');
  document.querySelectorAll('.fab-item').forEach(el => el.classList.remove('open'));

  // Activate the matching view
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${id}`)?.classList.add('active');

  // Header glow color per view
  const glowColors = { chat: '#00F6D6', sheet: '#FF4BCB', vault: '#7B5FFF', build: '#FFD93D' };
  document.getElementById('header-glow').style.background = glowColors[id] || '#00F6D6';

  // Highlight active FAB icon
  FAB_TABS.forEach(tab => {
    const btn = document.querySelector(`#fab-item-${tab.id} .fab-icon-btn`);
    if (btn) btn.style.background = tab.id === id ? tab.color + '22' : 'var(--surface2)';
  });
}

// ── SLIDE PANEL ───────────────────────────────────────────────
export function openPanel(tab = 'store') {
  document.getElementById('panel-overlay').classList.add('open');
  document.getElementById('slide-panel').classList.add('open');
  switchPanelTab(tab);
}

export function closePanel() {
  document.getElementById('panel-overlay').classList.remove('open');
  document.getElementById('slide-panel').classList.remove('open');
}

export function switchPanelTab(tab) {
  document.querySelectorAll('.panel-tab').forEach((t, i) => {
    const tabs = ['store', 'account'];
    t.classList.toggle('active', tabs[i] === tab);
  });
  document.querySelectorAll('.panel-tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`panel-${tab}`)?.classList.add('active');
}

// ── CREDITS DISPLAY ───────────────────────────────────────────
export async function loadUsage() {
  try {
    const token = await getToken();
    if (!token) return;

    const r = await fetch(`${RAIL}/usage`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (r.ok) {
      const d        = await r.json();
      state.credits   = d.credits              || 0;
      state.freeToday = d.free_messages_today  || 0;
      state.isPaid    = d.is_paid              || false;
      updateCreditDisplay();
    }
  } catch(e) {
    console.warn('loadUsage:', e);
  }
}

export function updateCreditDisplay() {
  const badge   = document.getElementById('credits-badge');
  const storeEl = document.getElementById('store-credits');
  const freeEl  = document.getElementById('store-free-msg');

  if (state.isPaid) {
    const cr = Number.isInteger(state.credits)
      ? state.credits
      : parseFloat(state.credits.toFixed(1));
    badge.textContent   = `${cr} cr`;
    storeEl.textContent = cr;
    freeEl.textContent  = 'paid account';
  } else {
    const left          = Math.max(0, 10 - state.freeToday);
    badge.textContent   = `${left} free left`;
    storeEl.textContent = left;
    freeEl.textContent  = `${left} of 10 free messages today`;
  }
}

// ── GREETING MESSAGE UPDATE ───────────────────────────────────
// Refreshes the first bot message in chat with current bot config
export function updateGreeting() {
  const bubble = document.getElementById('greeting-bubble');
  const icon   = document.getElementById('bot-avatar-icon');
  if (!bubble || !icon) return;

  bubble.innerHTML = `
    <div style="position:absolute;top:0;left:0;right:0;height:1px;
      background:linear-gradient(90deg,${state.botColor},transparent)"></div>
    ${state.botGreeting}`;

  icon.textContent     = state.botName[0].toUpperCase();
  icon.style.color     = state.botColor;
  icon.style.borderColor = `${state.botColor}66`;
}

// ── USER AVATAR + EMAIL ───────────────────────────────────────
export function updateUserUI() {
  const initial = (state.user?.email?.[0] || '?').toUpperCase();
  document.getElementById('user-avatar').textContent   = initial;
  document.getElementById('account-email').textContent = state.user?.email || '—';
}

// ── PAYPAL ────────────────────────────────────────────────────
export async function buyPack(amount) {
  if (!state.user) { alert('Please sign in first.'); return; }
  try {
    const token = await getToken();
    const r = await fetch(`${RAIL}/create-order`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ amount: String(amount) }),
    });
    const data = await r.json();
    if (!r.ok) { alert(data.detail || 'Payment error.'); return; }
    window.location.href = data.approve_url;
  } catch {
    alert('Payment error. Try again.');
  }
}

export async function handlePayPalReturn() {
  const params  = new URLSearchParams(window.location.search);
  const payment = params.get('payment');
  const token   = params.get('token');

  if (payment === 'success' && token) {
    try {
      const authToken = await getToken();
      const r = await fetch(`${RAIL}/capture-order`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body:    JSON.stringify({ order_id: token }),
      });
      const data = await r.json();
      if (r.ok) {
        await loadUsage();
        window.history.replaceState({}, document.title, window.location.pathname);
        openPanel('store');
        setTimeout(() => alert(`Payment successful! ${data.credits_added} credits added.`), 300);
      }
    } catch {}
  } else if (payment === 'cancelled') {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

SSEOF

echo "📄 Writing js/app/main.js..."
cat > js/app/main.js << 'SSEOF'
// ============================================================
// SPIRALSIDE — MAIN v1.0
// Boot sequence — imports all modules, wires globals, starts app
// This is the single entry point loaded by index.html
// Nimbis anchor: js/app/main.js
// ============================================================

import { initComic }                               from './comic.js';
import { sb, checkAuthAndShow, listenAuthChanges,
         handleLogin, handleSignup, handleSignout,
         switchAuthTab, togglePw }                 from './auth.js';
import { initDB, dbGet, dbGetAll, dbSet }          from './db.js';
import { initChat, addMessage }                    from './chat.js';
import { buildCharSelector, renderActiveChar,
         saveSummarize, loadSavedSheets }          from './sheet.js';
import { initVault, renderVault,
         removeFile, loadVaultFromDB }             from './vault.js';
import { initBuild, loadBotIntoForm }              from './build.js';
import { buildFAB, toggleFAB, switchView,
         openPanel, closePanel, switchPanelTab,
         loadUsage, updateCreditDisplay,
         updateGreeting, updateUserUI,
         buyPack, handlePayPalReturn }             from './ui.js';
import { state }                                   from './state.js';

// ── EXPOSE GLOBALS ────────────────────────────────────────────
// HTML onclick attributes need these on window.
// Only expose what's called from inline HTML.
window.switchAuthTab     = switchAuthTab;
window.togglePw          = togglePw;
window.handleLogin       = handleLogin;
window.handleSignup      = handleSignup;
window.handleSignout     = () => handleSignout(closePanel);
window.openPanel         = openPanel;
window.closePanel        = closePanel;
window.switchPanelTab    = switchPanelTab;
window.toggleFAB         = toggleFAB;
window.switchView        = switchView;
window.buyPack           = buyPack;
window.saveSummarize     = saveSummarize;
window.removeFile        = removeFile;

// ── APP READY ─────────────────────────────────────────────────
// Called after auth check confirms a valid session
async function onAppReady() {
  // 1. Open IndexedDB
  await initDB();

  // 2. Load persisted bot config
  const bot = await dbGet('config', 'bot');
  if (bot) {
    state.botName        = bot.name        || 'Sky';
    state.botPersonality = bot.personality || '';
    state.botGreeting    = bot.greeting    || "Hey. I'm here.";
    state.botTone        = bot.tone        || [];
    state.botColor       = bot.color       || '#00F6D6';
  }

  // 3. Load persisted vault files
  const vaultFiles = await dbGetAll('vault');
  loadVaultFromDB(vaultFiles);

  // 4. Load saved character sheet overrides
  await loadSavedSheets(dbGet);

  // 5. Init all modules
  initChat();
  initVault();
  initBuild();
  buildFAB();

  // 6. Populate forms and UI
  loadBotIntoForm();
  updateUserUI();
  updateGreeting();
  buildCharSelector();
  renderActiveChar('sky');

  // 7. Load credit usage from server
  loadUsage();

  // 8. Handle any PayPal return redirect
  handlePayPalReturn();
}

// ── BOOT ──────────────────────────────────────────────────────
// 1. Start comic intro
// 2. When comic ends → check auth → route to app or auth screen
listenAuthChanges();
initComic(() => checkAuthAndShow(onAppReady));

SSEOF

echo ""
echo "📦 Staging..."
git add .

echo "💬 Committing..."
git commit -m "feat: add js/app modular architecture

10 focused modules replacing monolithic inline script:
state, db, comic, auth, chat, sheet, vault, build, ui, main"

echo "🚀 Pushing..."
git push

echo ""
echo "✅ Done! Vercel deploys in ~30s."
echo "   Check https://spiralside.com to confirm."
