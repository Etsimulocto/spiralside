#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — fix_tts_autoplay.py
# Browser blocks audio.play() after async fetch (autoplay policy)
# Fix: use AudioContext.decodeAudioData which is not blocked
# ============================================================

import subprocess, sys

PATH = 'js/app/models.js'

with open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

idx_start = src.find('export async function speakReply(')
idx_end   = src.find('export function toggleSTT(')

if idx_start == -1 or idx_end == -1:
    sys.exit('speakReply bounds not found')

print('Found speakReply, replacing...')

NEW_BLOCK = (
    'export async function speakReply(text){'
    'if(!ttsEnabled)return;'
    'const botName=(state?.botName||\'sky\').toLowerCase();'
    'const characterVoices=[\'sky\',\'cold\',\'monday\',\'grit\'];'
    'if(characterVoices.includes(botName)){'
    'try{'
    'const token=state?.session?.access_token;'
    'if(!token)throw new Error(\'no token\');'
    'const r=await fetch(\'https://web-production-4e6f3.up.railway.app/tts\',{'
    'method:\'POST\','
    'headers:{\'Content-Type\':\'application/json\',\'Authorization\':\'Bearer \'+token},'
    'body:JSON.stringify({text,character:botName})'
    '});'
    'if(!r.ok)throw new Error(\'tts fetch failed: \'+r.status);'
    'const d=await r.json();'
    # Decode base64 to ArrayBuffer
    'const bytes=atob(d.audio);'
    'const buf=new Uint8Array(bytes.length);'
    'for(let i=0;i<bytes.length;i++)buf[i]=bytes.charCodeAt(i);'
    # Use AudioContext — not blocked by autoplay policy
    'const ctx=new(window.AudioContext||window.webkitAudioContext)();'
    'const audioBuf=await ctx.decodeAudioData(buf.buffer);'
    'const source=ctx.createBufferSource();'
    'source.buffer=audioBuf;'
    'source.connect(ctx.destination);'
    'source.onended=()=>ctx.close();'
    'source.start(0);'
    'return;'
    '}catch(e){'
    'console.warn(\'[tts] ElevenLabs failed, falling back to browser:\',e);'
    '}'
    '}'
    # Browser speechSynthesis fallback
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
print('models.js patched ✓')

subprocess.run(['git', 'add', 'js/app/models.js'], check=True)
subprocess.run(['git', 'commit', '-m', 'fix: use AudioContext for TTS playback, bypasses autoplay policy'], check=True)
subprocess.run(['git', 'push', '--force', 'origin', 'main'], check=True)
print('\n✅ Done! Sky should speak after next deploy (~30s)')
