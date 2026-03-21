#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — fix_stt2.py
# Fixes STT by creating a fresh SpeechRecognition instance
# each time the mic button is pressed instead of reusing stale one
# Nimbis anchor: fix_stt2.py
# ============================================================

import subprocess, sys

PATH = 'js/app/models.js'

with open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

# ── VERIFY ANCHOR ─────────────────────────────────────────────
print('=== ANCHOR CHECK ===')
anchor = 'function _initSTT(){'
print(repr(anchor))
print('IN FILE:', anchor in src)
print()

if anchor not in src:
    print('Full file snippet:')
    idx = src.find('initSTT')
    print(repr(src[max(0,idx-20):idx+200]))
    sys.exit('Anchor not found')

# ── OLD _initSTT + toggleMic ──────────────────────────────────
# Current pattern: creates recognition once on init, reuses it
# Problem: stale object, bad state on second+ press
OLD = (
    'function _initSTT(){'
    'const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;'
    'recognition=new SR();recognition.continuous=false;recognition.interimResults=false;recognition.lang=\'en-US\';'
    '  recognition.onresult=e=>{const t=e.results[0][0].transcript;const inp=document.getElementById(\'msg-input\');if(inp){inp.value=t;inp.style.height=\'auto\';inp.style.height=Math.min(inp.scrollHeight,100)+\'px\';if(typeof window._sendMessage===\'function\'){setTimeout(window._sendMessage,120);}}'
    '};'
    '  recognition.onend=()=>{isRecording=false;_updateMic()};recognition.onerror=()=>{isRecording=false;_updateMic()};}'
    'export function toggleMic(){if(!sttEnabled)return;if(!recognition)_initSTT();if(!recognition)return;if(isRecording){recognition.stop();isRecording=false;}else{recognition.start();isRecording=true;}_updateMic();}'
)

print('OLD anchor in file:', OLD in src)

if OLD not in src:
    # Try to find the actual content
    idx = src.find('function _initSTT')
    print('Found at idx:', idx)
    print(repr(src[idx:idx+600]))
    sys.exit('Old anchor not matched exactly — inspect above')

# ── NEW: create fresh recognition on every start ──────────────
NEW = (
    # _initSTT now just checks SR availability, does NOT create instance
    'function _initSTT(){'
    'return !!(window.SpeechRecognition||window.webkitSpeechRecognition);'
    '}'
    # toggleMic creates a fresh instance every time recording starts
    'export function toggleMic(){'
    'if(!sttEnabled)return;'
    'const SR=window.SpeechRecognition||window.webkitSpeechRecognition;'
    'if(!SR){console.warn(\'[stt] SpeechRecognition not supported\');return;}'
    # If already recording, stop it
    'if(isRecording&&recognition){'
    'recognition.stop();isRecording=false;_updateMic();return;'
    '}'
    # Create fresh instance each time
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
    'if(typeof window._sendMessage===\'function\'){setTimeout(window._sendMessage,120);}'
    '}'
    '};'
    'recognition.onend=()=>{isRecording=false;_updateMic();};'
    'recognition.onerror=e=>{'
    'console.warn(\'[stt] error:\',e.error);'
    'isRecording=false;_updateMic();'
    '};'
    'try{'
    'recognition.start();isRecording=true;'
    '}catch(e){'
    'console.warn(\'[stt] start() threw:\',e);'
    'isRecording=false;'
    '}'
    '_updateMic();'
    '}'
)

patched = src.replace(OLD, NEW, 1)
if patched == src:
    sys.exit('Replace had no effect')

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(patched)
print('models.js patched ✓')

# ── GIT ───────────────────────────────────────────────────────
print('\n=== COMMITTING ===')
subprocess.run(['git', 'add', 'js/app/models.js'], check=True)
subprocess.run(['git', 'commit', '-m', 'fix: fresh SpeechRecognition instance per mic press, log errors'], check=True)
subprocess.run(['git', 'push', '--force', 'origin', 'main'], check=True)
print('\n✅ Done! v deploys in ~30s')
print('Open browser console when testing — errors will now log as [stt] error: ...')
