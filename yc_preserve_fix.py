import sys
ROOT = 'C:/Users/quart/spiralside'
fp = ROOT + '/js/app/build.js'
with open(fp, 'r', encoding='utf-8') as f:
    src = f.read()
src = src.replace('\r\n', '\n')

OLD = """    const g = id => document.getElementById(id)?.value?.trim() || '';
    const updated = Object.assign({}, existing, {"""

NEW = """    // g() returns typed value, falls back to existing IDB value so blanks don't wipe data
    const g = (id, exKey) => document.getElementById(id)?.value?.trim() || (exKey ? (existing[exKey] || '') : '');
    const updated = Object.assign({}, existing, {"""

count = src.count(OLD)
if count != 1:
    print(f'[MISS] — found {count} times')
    sys.exit(1)
with open(fp, 'w', encoding='utf-8') as f:
    f.write(src.replace(OLD, NEW, 1))
print('[OK] g() now preserves existing values on blank inputs')

fp2 = ROOT + '/js/app/build.js'
with open(fp2, 'r', encoding='utf-8') as f:
    src = f.read()
src = src.replace('\r\n', '\n')

OLD2 = """      arc:         g('yc-current-arc'),
      project:     g('yc-working-on'),
      song:        g('yc-theme-song'),
      pets:        g('yc-pets'),
      food:        g('yc-fav-food'),
      comfort:     g('yc-comfort-show'),
      hates:       g('yc-hates'),
      hair:        g('yc-hair'),
      eyes:        g('yc-eyes'),
      build:       g('yc-build'),
      style:       g('yc-style'),
      marks:       g('yc-marks'),
      wearing:     g('yc-wearing'),
      hobbies:     g('yc-hobbies'),
      obsession:   g('yc-obsession'),
      job:         g('yc-job'),
      medium:      g('yc-creative-medium'),
      people:      g('yc-who-matters'),
      wins:        g('yc-wins'),
      stuck:       g('yc-stuck-on'),
      influences:  g('yc-influences'),
      freetext:    g('yc-tell-sky'),"""

NEW2 = """      arc:         g('yc-current-arc','arc'),
      project:     g('yc-working-on','project'),
      song:        g('yc-theme-song','song'),
      pets:        g('yc-pets','pets'),
      food:        g('yc-fav-food','food'),
      comfort:     g('yc-comfort-show','comfort'),
      hates:       g('yc-hates','hates'),
      hair:        g('yc-hair','hair'),
      eyes:        g('yc-eyes','eyes'),
      build:       g('yc-build','build'),
      style:       g('yc-style','style'),
      marks:       g('yc-marks','marks'),
      wearing:     g('yc-wearing','wearing'),
      hobbies:     g('yc-hobbies','hobbies'),
      obsession:   g('yc-obsession','obsession'),
      job:         g('yc-job','job'),
      medium:      g('yc-creative-medium','medium'),
      people:      g('yc-who-matters','people'),
      wins:        g('yc-wins','wins'),
      stuck:       g('yc-stuck-on','stuck'),
      influences:  g('yc-influences','influences'),
      freetext:    g('yc-tell-sky','freetext'),"""

count = src.count(OLD2)
if count != 1:
    print(f'[MISS2] — found {count} times')
    sys.exit(1)
with open(fp2, 'w', encoding='utf-8') as f:
    f.write(src.replace(OLD2, NEW2, 1))
print('[OK] all fields now fallback to existing IDB values')
print('\nRun:')
print('  cd ~/spiralside && git add js/app/build.js && git commit -m "fix: you_card save preserves existing fields when forge inputs blank" && git push --force origin main')
