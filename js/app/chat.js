// ============================================================
// SPIRALSIDE — CHAT v1.0
// Handles all message sending, rendering, and typewriter display
// Checks demo.js FIRST — scripted replies cost zero tokens
// Falls through to Railway API only when demo returns null
// Nimbis anchor: js/app/chat.js
// ============================================================

import { state }           from './state.js';
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
}

// ── ADD MESSAGE TO DOM ────────────────────────────────────
// role: 'user' | 'bot'
// Returns the bubble element so callers can stream into it
export function addMessage(text, role) {
  const wrap = document.createElement('div');
  wrap.className = `msg ${role}`;

  // Avatar initial — bot uses first letter of bot name, user uses email initial
  const initial = role === 'bot'
    ? (state.botName?.[0] || 'S').toUpperCase()
    : (state.user?.email?.[0] || 'U').toUpperCase();

  wrap.innerHTML = `
    <div class="msg-avatar">${initial}</div>
    <div class="msg-bubble">${text}</div>
  `;

  msgList.appendChild(wrap);
  msgList.scrollTop = msgList.scrollHeight;

  // Return bubble element in case caller wants to update it (streaming etc)
  return wrap.querySelector('.msg-bubble');
}

// ── TYPING INDICATOR ──────────────────────────────────────
function showTyping() {
  const wrap = document.createElement('div');
  wrap.className = 'msg bot';
  wrap.id = 'typing-indicator';
  wrap.innerHTML = `
    <div class="msg-avatar">${(state.botName?.[0] || 'S').toUpperCase()}</div>
    <div class="msg-bubble">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  msgList.appendChild(wrap);
  msgList.scrollTop = msgList.scrollHeight;
}

function hideTyping() {
  document.getElementById('typing-indicator')?.remove();
}

// ── SEND MESSAGE ──────────────────────────────────────────
// Main entry point — called by button click and Enter key
export async function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;

  // Clear input immediately
  msgInput.value = '';
  msgInput.style.height = 'auto';

  // Show user bubble
  addMessage(text, 'user');
  state.messageCount = (state.messageCount || 0) + 1;

  // Show typing dots while we figure out the reply
  showTyping();

  // ── DEMO CHECK ────────────────────────────────────────
  // getDemoResponse returns a string or null
  // null means "no scripted match — hit the API"
  // The third argument is the nudge callback — opens store panel
  const demoReply = getDemoResponse(
    text,
    state.botName,
    () => state._openPanel('store'), state.isPaid
  );

  if (demoReply !== null) {
    // Scripted reply — no API call, no credit deduction
    hideTyping();
    addMessage(demoReply, 'bot');
    return;
  }

  // ── API CALL ──────────────────────────────────────────
  // Fall through to Railway backend
  try {
    // Refresh token if needed
    let token = state.session?.access_token;
    if (!token) {
      const { createClient } = supabase;
      const sb = createClient(
        'https://qfawusrelwthxabfbglg.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYXd1c3JlbHd0aHhhYmZiZ2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzc5NzUsImV4cCI6MjA4ODc1Mzk3NX0.XkeFmWq-rOH2whgfkeMylyG7Ct_0u80fMkoJlEQ5K8E'
      );
      const { data } = await sb.auth.getSession();
      token = data?.session?.access_token;
      if (token) state.session = data.session;
    }

    if (!token) {
      hideTyping();
      addMessage('Please sign in to chat.', 'bot');
      return;
    }

    // Build vault context from any loaded files
    const vault = (state.vaultFiles || [])
      .map(f => `[file:${f.name}]\n${f.content}`)
      .join('\n\n');

    // Build system prompt from bot config
    let sys = `You are ${state.botName}.`;
    if (state.botPersonality) sys += ` ${state.botPersonality}`;
    if (state.botTone?.length)  sys += ` Tone: ${state.botTone.join(', ')}.`;
    sys += ' Be genuine and concise. Never break character.';

    const resp = await fetch(`${RAIL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: window.selectedModel || 'haiku',
        message:       text,
        system_prompt: sys,
        vault_context: vault,
        bot_name:      state.botName,
      }),
    });

    const data = await resp.json();
    hideTyping();

    if (!resp.ok) {
      // 429 = lifetime free limit hit — open store
      if (resp.status === 429) {
        addMessage(data.detail || 'Free messages used up. Add credits to keep going.', 'bot');
        setTimeout(() => state._openPanel('store'), 800);
        return;
      }
      addMessage(`\u26A0\uFE0F ${data.detail || 'Something went wrong.'}`, 'bot');
      return;
    }

    addMessage(data.reply, 'bot');

    // Update credit/usage display if main.js exposed updateCreditDisplay globally
    if (data.usage && typeof updateCreditDisplay === 'function') {
      const u = data.usage;
      state.totalMessages  = u.total_messages  ?? state.totalMessages;
      state.credits        = u.credits_remaining ?? state.credits;
      state.isPaid         = u.is_paid ?? state.isPaid;
      updateCreditDisplay();
    }

    // Update character sheet every 5 messages
    if (state.messageCount % 5 === 0 && typeof updateSheet === 'function') {
      updateSheet(text, data.reply);
    }

  } catch (err) {
    hideTyping();
    addMessage('Connection issue. Try again.', 'bot');
    console.error('[chat] fetch error:', err);
  }
}

// ── GET CHAT MESSAGES ────────────────────────────────────────
// Returns array of {role, text} from current DOM — used by sheet.js
// to summarize the conversation for character sheet updates
export function getChatMsgs() {
  if (!msgList) return [];
  return [...msgList.querySelectorAll('.msg')].map(el => ({
    role: el.classList.contains('user') ? 'user' : 'bot',
    text: el.querySelector('.msg-bubble')?.textContent || '',
  }));
}

// ── CLEAR CHAT ────────────────────────────────────────────
// Called from build.js when companion is saved / changed
export function clearChat(greetingText) {
  if (!msgList) return;
  msgList.innerHTML = '';
  addMessage(greetingText || "Hey. I'm here.", 'bot');
}
