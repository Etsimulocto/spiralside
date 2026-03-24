#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — FIX: ui.js viewInits (regex-safe version)
# Run from ~/spiralside:
#   /c/Users/quart/AppData/Local/Programs/Python/Python313/python.exe fix_ui.py
# ============================================================

import subprocess

with open('js/app/ui.js', 'r', encoding='utf-8') as f:
    src = f.read()

start_marker = 'const viewInits = {'
end_marker   = '\n  };'

start_idx = src.find(start_marker)
if start_idx == -1:
    print('X could not find viewInits block'); exit(1)

end_idx = src.find(end_marker, start_idx)
if end_idx == -1:
    print('X could not find closing };'); exit(1)

old_block = src[start_idx : end_idx + len(end_marker)]
print('Found block (first 120 chars):')
print(repr(old_block[:120]))

GOOD_BLOCK = """const viewInits = {
    store:     () => { window.initStoreView  && window.initStoreView();  updateCreditDisplay(); },
    studio:    () => window.initStudioView   && window.initStudioView(),
    spiralcut: () => window.initCutView      && window.initCutView(),
    quest:     () => window.initQuestView    && window.initQuestView(),
    style:     () => { window.initStylePanel && window.initStylePanel(); setTimeout(() => window.initColorSketches && window.initColorSketches(), 400); },
    account:   () => window.initAccountView  && window.initAccountView(),
    imagine:   () => window.initImagine      && window.initImagine(),
    music:     () => window.initMusicView    && window.initMusicView(),
    library:   () => window.initLibrary      && window.initLibrary(),
    code:      () => window.initCodeView     && window.initCodeView(),
    guide:     () => window.initGuideView    && window.initGuideView(),
    forge:     () => window.initForgeView    && window.initForgeView(),
    vault:     () => window.initVaultView    && window.initVaultView(),
    pi:        () => window.initPiView       && window.initPiView(),
  }"""

new_src = src[:start_idx] + GOOD_BLOCK + '\n  };' + src[end_idx + len(end_marker):]

# Sanity check
assert 'const viewInits = {' in new_src
assert "spiralcut: () => window.initCutView" in new_src
assert "'spiralcut': () => window.initCutView?.()," not in new_src
print('Sanity checks passed')

with open('js/app/ui.js', 'w', encoding='utf-8') as f:
    f.write(new_src)
print('wrote js/app/ui.js')

subprocess.run(['git', 'add', 'js/app/ui.js'], check=True)
subprocess.run(['git', 'commit', '-m', 'fix: clean viewInits in ui.js, wire initCutView'], check=True)
subprocess.run(['git', 'push', '--force', 'origin', 'main'], check=True)
print('Done — Vercel deploys in ~30s.')
