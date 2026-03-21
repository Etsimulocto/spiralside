#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — fix_stt4.py
# Moves _updateMic before toggleMic so it's defined when called
# Adds Edge tracking prevention notice on 'network' error
# ============================================================

import subprocess, sys

PATH = 'js/app/models.js'

with open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

# Find exact slice: from _initSTT through end of toggleMic block
# End boundary = export function speakReply
idx_start = src.find('function _initSTT()')
idx_end   = src.find('export function speakReply(')

if idx_start == -1 or idx_end == -1:
    print('idx_start:', idx_start, 'idx_end:', idx_end)
    sys.exit('Anchors not found')

OLD = src[idx_start:idx_end]
print('=== OLD BLOCK ===')
print(repr(OLD[:200]))
print('...')

# New block: _updateMic FIRST, then _initSTT check, then toggleMic
NEW = (
    # _updateMic defined first so it's available when toggleMic calls it
    'function _updateMic(){'
    'const btn=document.getElementById(\'mic-btn\');'
    'if(!btn)return;'
    'btn.classList.toggle(\'recording\',isRecording);'
    'btn.title=isRecording?\'stop recording\':\'speak\';'
    '}'

    'function _initSTT(){'
    'return !!(window.SpeechRecognition||window.webkitSpeechRecognition);'
    '}'

    'export function toggleMic(){'
    'if(!sttEnabled)return;'
    'const SR=window.SpeechRecognition||window.webkitSpeechRecognition;'
    'if(!SR){'
    'console.warn(\'[stt] SpeechRecognition not supported in this browser\');'
    'return;'
    '}'
    # Stop if already recording
    'if(isRecording&&recognition){'
    'try{recognition.stop();}catch(e){}'
    'isRecording=false;_updateMic();return;'
    '}'
    # Fresh instance every press
    'try{'
    'recognition=new SR();'
    'recognition.continuous=false;'
    'recognition.interimResults=false;'
    'recognition.lang=\'en-US\';'
    'recognition.onresult=e=>{'
    'const t=e.results[0][0].transcript;'
    'const inp=document.getElementById(\'msg-input\');'
    'if(inp){'
    'inp.value=t;'
    'inp.style.height=\'auto\';'
    'inp.style.height=Math.min(inp.scrollHeight,100)+\'px\';'
    'if(typeof window._sendMessage===\'function\'){'
    'setTimeout(window._sendMessage,120);'
    '}'
    '}'
    '};'
    'recognition.onend=()=>{isRecording=false;_updateMic();};'
    'recognition.onerror=e=>{'
    'console.warn(\'[stt] error:\',e.error);'
    'isRecording=false;_updateMic();'
    # Show helpful message for Edge tracking prevention
    'if(e.error===\'network\'){'
    'const inp=document.getElementById(\'msg-input\');'
    'if(inp)inp.placeholder=\'mic blocked — try Chrome or allow spiralside.com in Edge privacy settings\';'
    'setTimeout(()=>{if(inp)inp.placeholder=\'say something...\';},4000);'
    '}'
    '};'
    'recognition.start();'
    'isRecording=true;'
    '}catch(err){'
    'console.warn(\'[stt] start threw:\',err);'
    'isRecording=false;'
    '}'
    '_updateMic();'
    '}'
)

patched = src[:idx_start] + NEW + src[idx_end:]

if patched == src:
    sys.exit('No change')

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(patched)
print('models.js patched ✓')

print('\n=== COMMITTING ===')
subprocess.run(['git', 'add', 'js/app/models.js'], check=True)
subprocess.run(['git', 'commit', '-m', 'fix: _updateMic defined before toggleMic, Edge network error shows helpful msg'], check=True)
subprocess.run(['git', 'push', '--force', 'origin', 'main'], check=True)
print('\n✅ Done!')
print('If mic still shows network error in Edge:')
print('  Edge Settings → Privacy → Exceptions → add spiralside.com')
print('  OR test in Chrome — Web Speech API works better there')
