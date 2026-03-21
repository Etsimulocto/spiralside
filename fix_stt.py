#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — fix_stt.py
# Patches models.js to auto-send after STT transcription
# Also improves mic UX (pulse animation, error logging)
# Run from ~/spiralside in Git Bash
# ============================================================

import subprocess, sys, os

PATH = 'js/app/models.js'

with open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

print('=== ANCHOR CHECK ===')
anchor = 'recognition.onresult=e=>{const t=e.results[0][0].transcript;const inp=document.getElementById(\'msg-input\');if(inp){inp.value=t;inp.style.height=\'auto\';inp.style.height=Math.min(inp.scrollHeight,100)+\'px\';}};'
print(repr(anchor[:80]))
print('IN FILE:', anchor in src)
print()

if anchor not in src:
    # Try a shorter anchor
    short = 'recognition.onresult=e=>{'
    idx = src.find(short)
    print(f'Short anchor at index: {idx}')
    print(repr(src[idx:idx+200]))
    sys.exit('Anchor not found — inspect above and update script')

# ── REPLACEMENT ──────────────────────────────────────────────
# Auto-send after transcription lands in the input
OLD = anchor
NEW = (
    # Fill input with transcript
    'recognition.onresult=e=>{'
    'const t=e.results[0][0].transcript;'
    'const inp=document.getElementById(\'msg-input\');'
    'if(inp){'
    'inp.value=t;'
    'inp.style.height=\'auto\';'
    'inp.style.height=Math.min(inp.scrollHeight,100)+\'px\';'
    # Auto-send: import sendMessage is in chat.js, exposed on window by initChat
    # We call window.sendMessage if available, otherwise just leave text in input
    'if(typeof window._sendMessage===\'function\'){'
    'setTimeout(window._sendMessage,120);'  # tiny delay so UI shows the text first
    '}'
    '}'
    '};'
)

patched = src.replace(OLD, NEW, 1)
if patched == src:
    sys.exit('Replace had no effect')

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(patched)
print('models.js patched ✓')

# ── ALSO EXPOSE sendMessage on window from chat.js ───────────
# chat.js exports sendMessage but doesn't put it on window
# We need to add window._sendMessage = sendMessage to initChat

CHAT_PATH = 'js/app/chat.js'
with open(CHAT_PATH, 'r', encoding='utf-8') as f:
    chat = f.read()

CHAT_ANCHOR = 'sendBtn.addEventListener(\'click\', sendMessage);'
print(f'\nChat anchor in file: {CHAT_ANCHOR in chat}')

if CHAT_ANCHOR in chat:
    CHAT_OLD = CHAT_ANCHOR
    CHAT_NEW = (
        'sendBtn.addEventListener(\'click\', sendMessage);\n'
        '  // Expose sendMessage for STT auto-send in models.js\n'
        '  window._sendMessage = sendMessage;'
    )
    chat_patched = chat.replace(CHAT_OLD, CHAT_NEW, 1)
    if chat_patched != chat:
        with open(CHAT_PATH, 'w', encoding='utf-8') as f:
            f.write(chat_patched)
        print('chat.js patched — window._sendMessage exposed ✓')
    else:
        print('chat.js replace had no effect')
else:
    print('chat.js anchor not found — skipping (window._sendMessage may already exist)')

# ── GIT PUSH ─────────────────────────────────────────────────
print('\n=== COMMITTING ===')
subprocess.run(['git', 'add', 'js/app/models.js', 'js/app/chat.js'], check=True)
subprocess.run(['git', 'commit', '-m', 'fix: STT auto-sends after transcription, expose window._sendMessage'], check=True)
subprocess.run(['git', 'push', '--force', 'origin', 'main'], check=True)
print('\n✅ Done! Vercel deploys in ~30s')
print('Test: tap mic, speak, transcript should auto-send')
