
import sys

def award_snippet(source):
    return f"\n  if (window.awardXP) window.awardXP('{source}').then(r => {{ if (r && r.xpAwarded > 0 && window.showXPGain) window.showXPGain(r.xpAwarded, '{source}'); }});"

# ── 1. codex.js — saveSceneCard + saveWorldCard ───────────────
path = 'C:/Users/quart/spiralside/js/app/codex.js'
f = open(path,'r',encoding='utf-8'); s = f.read(); f.close()

OLD_SCENE = "async function saveSceneCard() {"
NEW_SCENE = "async function saveSceneCard() {\n  if (window.awardXP) window.awardXP('codex_card_created').then(r => { if (r && r.xpAwarded > 0 && window.showXPGain) window.showXPGain(r.xpAwarded, 'codex'); });"

OLD_WORLD = "async function saveWorldCard() {"
NEW_WORLD = "async function saveWorldCard() {\n  if (window.awardXP) window.awardXP('codex_card_created').then(r => { if (r && r.xpAwarded > 0 && window.showXPGain) window.showXPGain(r.xpAwarded, 'codex'); });"

if 'codex_card_created' in s:
    print('SKIP codex.js: already wired')
elif OLD_SCENE not in s:
    print('ERR codex.js: saveSceneCard anchor not found')
else:
    s = s.replace(OLD_SCENE, NEW_SCENE, 1)
    s = s.replace(OLD_WORLD, NEW_WORLD, 1)
    open(path,'w',encoding='utf-8').write(s)
    print('OK codex.js: scene + world card XP')

# ── 2. build.js — bot configured (save-bot-btn click) ────────
path = 'C:/Users/quart/spiralside/js/app/build.js'
f = open(path,'r',encoding='utf-8'); s = f.read(); f.close()

OLD_BOT = "  btn.textContent = '✓ saved';\n  setTimeout(() => { btn.textContent = orig; }, 1800);"
NEW_BOT = "  btn.textContent = '✓ saved';\n  setTimeout(() => { btn.textContent = orig; }, 1800);\n  if (window.awardXP) window.awardXP('bot_configured').then(r => { if (r && r.xpAwarded > 0 && window.showXPGain) window.showXPGain(r.xpAwarded, 'forge'); });"

if 'bot_configured' in s:
    print('SKIP build.js: already wired')
elif OLD_BOT not in s:
    print('ERR build.js: save-bot anchor not found')
    idx = s.find('textContent = ')
    print(repr(s[idx:idx+120]))
else:
    s = s.replace(OLD_BOT, NEW_BOT, 1)
    open(path,'w',encoding='utf-8').write(s)
    print('OK build.js: bot_configured XP')

# ── 3. imagine2.js — image generated ─────────────────────────
path = 'C:/Users/quart/spiralside/js/app/imagine2.js'
f = open(path,'r',encoding='utf-8'); s = f.read(); f.close()

# Wire after the img src line that confirms generation success
OLD_IMG = '<img class="im-result-img" src="${url}" alt="generated" />'
NEW_IMG = '<img class="im-result-img" src="${url}" alt="generated" />'

# Find the JS context around the img render — award after successful generate
OLD_GEN = "      <img class=\"im-result-img\" src=\"${url}\" alt=\"generated\" />"
if 'image_generated' in s:
    print('SKIP imagine2.js: already wired')
else:
    # Find post-generate success block — look for saveImageToLibrary call
    OLD_SAVE = "await window.saveImageToLibrary(url, 'generated-' + Date.now() + '.png');"
    NEW_SAVE = "await window.saveImageToLibrary(url, 'generated-' + Date.now() + '.png');\n        if (window.awardXP) window.awardXP('image_generated').then(r => { if (r && r.xpAwarded > 0 && window.showXPGain) window.showXPGain(r.xpAwarded, 'imagine'); });"
    if OLD_SAVE not in s:
        print('WARN imagine2.js: saveImageToLibrary anchor not found — searching...')
        for candidate in ['saveImageToLibrary', 'im-result-img', 'generated']:
            idx = s.find(candidate)
            if idx >= 0:
                print(f'  {candidate} at {idx}: {repr(s[max(0,idx-20):idx+80])}')
                break
    else:
        s = s.replace(OLD_SAVE, NEW_SAVE, 1)
        open(path,'w',encoding='utf-8').write(s)
        print('OK imagine2.js: image_generated XP')

# ── 4. vault.js — file uploaded ───────────────────────────────
path = 'C:/Users/quart/spiralside/js/app/views/vault.js'
f = open(path,'r',encoding='utf-8'); s = f.read(); f.close()

if 'vault_file_uploaded' in s:
    print('SKIP vault.js: already wired')
else:
    # Find add-file-btn click handler or file processing success
    # Look for where files get added to vault state/IDB
    for candidate in ['addFileToVault', 'vault.*push', 'dbSet.*vault', 'file.*saved', 'renderVault']:
        import re
        matches = [(m.start(), m.group()) for m in re.finditer(candidate, s)]
        if matches:
            idx = matches[0][0]
            print(f'VAULT candidate "{candidate}" at {idx}: {repr(s[max(0,idx-30):idx+100])}')
            break
    # Try to find the file reader onload success
    OLD_VAULT = "renderVault();"
    if s.count(OLD_VAULT) >= 1:
        # Insert after first renderVault call (file add success)
        NEW_VAULT = "renderVault();\n    if (window.awardXP) window.awardXP('vault_file_uploaded').then(r => { if (r && r.xpAwarded > 0 && window.showXPGain) window.showXPGain(r.xpAwarded, 'vault'); });"
        s = s.replace(OLD_VAULT, NEW_VAULT, 1)
        open(path,'w',encoding='utf-8').write(s)
        print('OK vault.js: vault_file_uploaded XP')
    else:
        print('WARN vault.js: renderVault anchor not found')

print('\n=== DONE ===')
print('git add js/app/codex.js js/app/build.js js/app/imagine2.js js/app/views/vault.js')
print('git commit -m "feat: XP wired to imagine, codex, forge, vault"')
print('git push origin main --force')
