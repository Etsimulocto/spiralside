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

