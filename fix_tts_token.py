#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — fix_tts_token.py
# speakReply was reading window.state?.session which doesn't exist
# Fix: import state from state.js (already in the module scope)
# ============================================================

import subprocess, sys

PATH = 'js/app/models.js'

with open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

# Check state is imported
print('state imported:', "from './state.js'" in src)

# The bad token line
OLD = "const token=window.state?.session?.access_token;"
NEW = "const token=state?.session?.access_token;"

print('OLD anchor found:', OLD in src)

if OLD not in src:
    idx = src.find('speakReply')
    print(repr(src[idx:idx+400]))
    sys.exit('Anchor not found')

patched = src.replace(OLD, NEW, 1)
if patched == src:
    sys.exit('No change')

# Also make sure state is imported at top of file
if "import { state }" not in patched and "from './state.js'" not in patched:
    # Add import after first line
    patched = patched.replace(
        "export let selectedModel",
        "import { state } from './state.js';\nexport let selectedModel",
        1
    )
    print('state import added ✓')
else:
    print('state already imported ✓')

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(patched)
print('models.js patched ✓')

subprocess.run(['git', 'add', 'js/app/models.js'], check=True)
subprocess.run(['git', 'commit', '-m', 'fix: speakReply reads token from state module not window.state'], check=True)
subprocess.run(['git', 'push', '--force', 'origin', 'main'], check=True)
print('\n✅ Done! Test TTS after Vercel deploys (~30s)')
