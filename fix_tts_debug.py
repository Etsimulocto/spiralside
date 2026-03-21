#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — fix_tts_debug.py
# Adds console logging to speakReply to diagnose silent failure
# ============================================================

import subprocess, sys

PATH = 'js/app/models.js'

with open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

OLD = (
    'const r=await fetch(\'https://web-production-4e6f3.up.railway.app/tts\','
    '{\'method\':\'POST\','
)

# Try simpler anchor
idx = src.find('web-production-4e6f3.up.railway.app/tts')
if idx == -1:
    sys.exit('TTS URL not found in models.js')

print('Found TTS URL at idx:', idx)
print(repr(src[idx-50:idx+300]))

# Find the full speakReply function and replace it wholesale
idx_start = src.find('export async function speakReply(')
idx_end   = src.find('export function toggleSTT(')

if idx_start == -1 or idx_end == -1:
    print('idx_start:', idx_start, 'idx_end:', idx_end)
    sys.exit('speakReply bounds not found')

OLD_BLOCK = src[idx_start:idx_end]
print('\n=== OLD speakReply ===')
print(repr(OLD_BLOCK[:200]))

NEW_BLOCK = (
    'export async function speakReply(text){'
    'if(!ttsEnabled)return;'
    'const botName=(state?.botName||\'sky\').toLowerCase();'
    'const characterVoices=[\'sky\',\'cold\',\'monday\',\'grit\'];'
    'if(characterVoices.includes(botName)){'
    'try{'
    'const token=state?.session?.access_token;'
    'console.log(\'[tts] token:\',token?\'ok\':\'MISSING\');'
    'if(!token)throw new Error(\'no token\');'
    'console.log(\'[tts] calling Railway /tts for:\',botName);'
    'const r=await fetch(\'https://web-production-4e6f3.up.railway.app/tts\',{'
    'method:\'POST\','
    'headers:{\'Content-Type\':\'application/json\',\'Authorization\':\'Bearer \'+token},'
    'body:JSON.stringify({text,character:botName})'
    '});'
    'console.log(\'[tts] response status:\',r.status);'
    'if(!r.ok)throw new Error(\'tts fetch failed: \'+r.status);'
    'const d=await r.json();'
    'console.log(\'[tts] got audio, length:\',d.audio?.length);'
    'const bytes=atob(d.audio);'
    'const buf=new Uint8Array(bytes.length);'
    'for(let i=0;i<bytes.length;i++)buf[i]=bytes.charCodeAt(i);'
    'const blob=new Blob([buf],{type:\'audio/mpeg\'});'
    'const url=URL.createObjectURL(blob);'
    'const audio=new Audio(url);'
    'audio.onended=()=>URL.revokeObjectURL(url);'
    'audio.onerror=e=>console.warn(\'[tts] audio play error:\',e);'
    'console.log(\'[tts] playing audio...\');'
    'await audio.play();'
    'console.log(\'[tts] playing!\');'
    'return;'
    '}catch(e){'
    'console.warn(\'[tts] ElevenLabs failed, falling back to browser:\',e);'
    '}'
    '}'
    'if(!(\'speechSynthesis\'in window))return;'
    'window.speechSynthesis.cancel();'
    'const u=new SpeechSynthesisUtterance(text);'
    'u.rate=0.95;u.pitch=1.0;'
    'window.speechSynthesis.speak(u);'
    '}'
)

patched = src[:idx_start] + NEW_BLOCK + src[idx_end:]
if patched == src:
    sys.exit('No change')

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(patched)
print('\nmodels.js patched ✓')

subprocess.run(['git', 'add', 'js/app/models.js'], check=True)
subprocess.run(['git', 'commit', '-m', 'debug: add TTS logging to diagnose silent failure'], check=True)
subprocess.run(['git', 'push', '--force', 'origin', 'main'], check=True)
print('\n✅ Done! Open console and send Sky a message — look for [tts] logs')
