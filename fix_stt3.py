#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — fix_stt3.py
# Fresh SpeechRecognition per mic press — anchor fixed for real content
# ============================================================

import subprocess, sys

PATH = 'js/app/models.js'

with open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

# Find the real content between _initSTT and end of toggleMic
idx_start = src.find('function _initSTT(){')
idx_toggle = src.find('export function toggleMic(){')
idx_toggle_end = src.find('export function speakReply(')  # function after toggleMic

if idx_start == -1 or idx_toggle == -1 or idx_toggle_end == -1:
    print('idx_start:', idx_start)
    print('idx_toggle:', idx_toggle)
    print('idx_toggle_end:', idx_toggle_end)
    sys.exit('Could not find anchors')

OLD = src[idx_start:idx_toggle_end]
print('=== OLD BLOCK (repr) ===')
print(repr(OLD))
print()

NEW = (
    'function _initSTT(){'
    'return !!(window.SpeechRecognition||window.webkitSpeechRecognition);'
    '}'
    'export function toggleMic(){'
    'if(!sttEnabled)return;'
    'const SR=window.SpeechRecognition||window.webkitSpeechRecognition;'
    'if(!SR){console.warn(\'[stt] not supported\');return;}'
    'if(isRecording&&recognition){recognition.stop();isRecording=false;_updateMic();return;}'
    'recognition=new SR();'
    'recognition.continuous=false;'
    'recognition.interimResults=false;'
    'recognition.lang=\'en-US\';'
    'recognition.onresult=e=>{'
    'const t=e.results[0][0].transcript;'
    'const inp=document.getElementById(\'msg-input\');'
    'if(inp){inp.value=t;inp.style.height=\'auto\';inp.style.height=Math.min(inp.scrollHeight,100)+\'px\';'
    'if(typeof window._sendMessage===\'function\'){setTimeout(window._sendMessage,120);}}'
    '};'
    'recognition.onend=()=>{isRecording=false;_updateMic();};'
    'recognition.onerror=e=>{console.warn(\'[stt] error:\',e.error);isRecording=false;_updateMic();};'
    'try{recognition.start();isRecording=true;}'
    'catch(e){console.warn(\'[stt] start threw:\',e);isRecording=false;}'
    '_updateMic();'
    '}'
)

patched = src[:idx_start] + NEW + src[idx_toggle_end:]

if patched == src:
    sys.exit('No change — something went wrong')

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(patched)
print('models.js patched ✓')

print('\n=== COMMITTING ===')
subprocess.run(['git', 'add', 'js/app/models.js'], check=True)
subprocess.run(['git', 'commit', '-m', 'fix: fresh SpeechRecognition per mic press, try/catch start, error logging'], check=True)
subprocess.run(['git', 'push', '--force', 'origin', 'main'], check=True)
print('\n✅ Done! Check console for [stt] errors if mic still fails')
