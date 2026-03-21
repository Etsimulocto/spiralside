#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — fix_tts_edge.py
# Edge requires AudioContext.resume() before it will play
# Also adds a shared AudioContext instead of creating per-reply
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
    # Shared AudioContext — created once, reused
    'let _audioCtx=null;'
    'function _getAudioCtx(){'
    'if(!_audioCtx)_audioCtx=new(window.AudioContext||window.webkitAudioContext)();'
    # Edge requires resume() if context was suspended
    'if(_audioCtx.state===\'suspended\')_audioCtx.resume();'
    'return _audioCtx;'
    '}'

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
    'const bytes=atob(d.audio);'
    'const buf=new Uint8Array(bytes.length);'
    'for(let i=0;i<bytes.length;i++)buf[i]=bytes.charCodeAt(i);'
    'const ctx=_getAudioCtx();'
    # Resume in case Edge suspended it
    'await ctx.resume();'
    'const audioBuf=await ctx.decodeAudioData(buf.buffer.slice(0));'
    'const source=ctx.createBufferSource();'
    'source.buffer=audioBuf;'
    'source.connect(ctx.destination);'
    'source.start(0);'
    'return;'
    '}catch(e){'
    'console.warn(\'[tts] ElevenLabs failed, falling back:\',e);'
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
print('models.js patched ✓')

subprocess.run(['git', 'add', 'js/app/models.js'], check=True)
subprocess.run(['git', 'commit', '-m', 'fix: AudioContext resume() for Edge, shared ctx instance'], check=True)
subprocess.run(['git', 'push', '--force', 'origin', 'main'], check=True)
print('\n✅ Done! Test in Edge after ~30s')
