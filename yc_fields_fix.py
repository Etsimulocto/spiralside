"""
YOU CARD FIELD NAME FIX
========================
Fixes field name mismatch between forge build.js and sheet.js canonical names.

sheet.js canonical: char.arc, char.song, char.hobbies, char.obsession,
  char.job, char.medium, char.people, char.wins, char.stuck, char.chips[],
  char.handle, char.vibe

forge was saving: theme_song, creative_medium, who_matters, stuck_on,
  how_you_work[], working_on, current_arc, life_now, fav_food,
  comfort_show, hates, pets, tell_sky, build, marks, influences

Run from: ~/spiralside
Command:  /c/Users/quart/AppData/Local/Programs/Python/Python313/python.exe yc_fields_fix.py
"""

import sys
ROOT = 'C:/Users/quart/spiralside'

def patch(filepath, old, new, label):
    full = ROOT + '/' + filepath
    with open(full, 'r', encoding='utf-8') as f:
        src = f.read()
    src = src.replace('\r\n', '\n')
    count = src.count(old)
    if count == 0:
        print(f'[MISS] {label}')
        idx = src.find('yc-hair')
        if idx >= 0:
            print('  context:', repr(src[idx:idx+200]))
        sys.exit(1)
    if count > 1:
        print(f'[DUPE] {label} — found {count} times')
        sys.exit(1)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(src.replace(old, new, 1))
    print(f'[OK]   {label}')

# ================================================================
# PATCH 1 — build.js: fix YOU CARD SAVE PATH field names
# Replace the entire updated object with canonical sheet.js names
# ================================================================

OLD_SAVE = """    const updated = Object.assign({}, existing, {
      id:             'you',
      name:           print.identity.name || existing.name,
      first_words:    print.identity.first_words || existing.first_words,
      personality:    print.identity.personality || existing.personality,
      hair:           g('yc-hair'),
      build:          g('yc-build'),
      marks:          g('yc-marks'),
      life_now:       g('yc-life-now'),
      current_arc:    g('yc-current-arc'),
      working_on:     g('yc-working-on'),
      theme_song:     g('yc-theme-song'),
      pets:           g('yc-pets'),
      fav_food:       g('yc-fav-food'),
      comfort_show:   g('yc-comfort-show'),
      hates:          g('yc-hates'),
      hobbies:        g('yc-hobbies'),
      obsession:      g('yc-obsession'),
      job:            g('yc-job'),
      creative_medium:g('yc-creative-medium'),
      who_matters:    g('yc-who-matters'),
      wins:           g('yc-wins'),
      stuck_on:       g('yc-stuck-on'),
      influences:     g('yc-influences'),
      tell_sky:       g('yc-tell-sky'),
      how_you_work:   howYouWork,
      updated_at:     new Date().toISOString(),
    });"""

NEW_SAVE = """    const updated = Object.assign({}, existing, {
      id:          'you',
      // identity fields shared with forge
      handle:      print.identity.name || existing.handle || '',
      name:        print.identity.name || existing.name || '',
      first_words: print.identity.first_words || existing.first_words || '',
      personality: print.identity.personality || existing.personality || '',
      vibe:        g('forge-vibe') || existing.vibe || '',
      // you-specific fields — canonical sheet.js names
      hair:        g('yc-hair'),
      build:       g('yc-build'),
      marks:       g('yc-marks'),
      life_now:    g('yc-life-now'),
      arc:         g('yc-current-arc'),
      working_on:  g('yc-working-on'),
      song:        g('yc-theme-song'),
      pets:        g('yc-pets'),
      fav_food:    g('yc-fav-food'),
      comfort_show:g('yc-comfort-show'),
      hates:       g('yc-hates'),
      hobbies:     g('yc-hobbies'),
      obsession:   g('yc-obsession'),
      job:         g('yc-job'),
      medium:      g('yc-creative-medium'),
      people:      g('yc-who-matters'),
      wins:        g('yc-wins'),
      stuck:       g('yc-stuck-on'),
      influences:  g('yc-influences'),
      tell_sky:    g('yc-tell-sky'),
      chips:       howYouWork,
      updated_at:  new Date().toISOString(),
    });"""

patch('js/app/build.js', OLD_SAVE, NEW_SAVE, 'build.js — save: canonical field names')

# ================================================================
# PATCH 2 — build.js: fix loadYouCardIntoForge field name reads
# Replace the yc() mapping block to use canonical names
# ================================================================

OLD_LOAD = """  // Map you-specific fields into about-you section
  const yc = id => { const el = document.getElementById(id); return (val) => { if (el) el.value = val || ''; }; };
  yc('yc-hair')(char.hair || '');
  yc('yc-build')(char.build || char.height_build || '');
  yc('yc-marks')(char.marks || '');
  yc('yc-life-now')(char.life_now || char.life_right_now || '');
  yc('yc-current-arc')(char.current_arc || '');
  yc('yc-working-on')(char.working_on || '');
  yc('yc-theme-song')(char.theme_song || '');
  yc('yc-pets')(char.pets || char.pet_names || '');
  yc('yc-fav-food')(char.fav_food || '');
  yc('yc-comfort-show')(char.comfort_show || '');
  yc('yc-hates')(char.hates || '');
  yc('yc-hobbies')(char.hobbies || '');
  yc('yc-obsession')(char.obsession || char.current_obsession || '');
  yc('yc-job')(char.job || '');
  yc('yc-creative-medium')(char.creative_medium || '');
  yc('yc-who-matters')(char.who_matters || '');
  yc('yc-wins')(char.wins || char.wins_lately || '');
  yc('yc-stuck-on')(char.stuck_on || '');
  yc('yc-influences')(char.influences || '');
  yc('yc-tell-sky')(char.tell_sky || '');

  // Restore how-you-work chips
  const howYouWork = char.how_you_work || [];
  document.querySelectorAll('[data-yc]').forEach(c => {
    c.classList.toggle('selected', howYouWork.includes(c.dataset.yc));
  });"""

NEW_LOAD = """  // Map you-specific fields — using canonical sheet.js field names
  const yc = id => { const el = document.getElementById(id); return (val) => { if (el) el.value = val || ''; }; };
  // shared identity into forge fields
  s('bot-name')(char.handle || char.name || '');
  s('forge-vibe')(char.vibe || '');
  // you-specific fields — canonical names from sheet.js
  yc('yc-hair')(char.hair || '');
  yc('yc-build')(char.build || '');
  yc('yc-marks')(char.marks || '');
  yc('yc-life-now')(char.life_now || '');
  yc('yc-current-arc')(char.arc || '');
  yc('yc-working-on')(char.working_on || '');
  yc('yc-theme-song')(char.song || '');
  yc('yc-pets')(char.pets || '');
  yc('yc-fav-food')(char.fav_food || '');
  yc('yc-comfort-show')(char.comfort_show || '');
  yc('yc-hates')(char.hates || '');
  yc('yc-hobbies')(char.hobbies || '');
  yc('yc-obsession')(char.obsession || '');
  yc('yc-job')(char.job || '');
  yc('yc-creative-medium')(char.medium || '');
  yc('yc-who-matters')(char.people || '');
  yc('yc-wins')(char.wins || '');
  yc('yc-stuck-on')(char.stuck || '');
  yc('yc-influences')(char.influences || '');
  yc('yc-tell-sky')(char.tell_sky || char.sky_note || '');

  // Restore how-you-work chips — canonical name is char.chips[]
  const howYouWork = char.chips || char.how_you_work || [];
  document.querySelectorAll('[data-yc]').forEach(c => {
    c.classList.toggle('selected', howYouWork.includes(c.dataset.yc));
  });"""

patch('js/app/build.js', OLD_LOAD, NEW_LOAD, 'build.js — load: canonical field names')

print('\nAll patches applied. Now run:')
print('  cd ~/spiralside')
print('  git add js/app/build.js')
print('  git commit -m "fix: you_card forge fields use canonical sheet.js names"')
print('  git push --force origin main')
