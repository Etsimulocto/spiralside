import sys
ROOT = 'C:/Users/quart/spiralside'

def patch(fp, old, new, label):
    full = ROOT + '/' + fp
    with open(full, 'r', encoding='utf-8') as f:
        src = f.read()
    src = src.replace('\r\n', '\n')
    count = src.count(old)
    if count != 1:
        print(f'[MISS] {label} — found {count} times')
        sys.exit(1)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(src.replace(old, new, 1))
    print(f'[OK]   {label}')

# ── PATCH 1: build.js save — fix all field names to canonical ──
patch('js/app/build.js',
"""      life_now:    g('yc-life-now'),
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
      chips:       howYouWork,""",
"""      arc:         g('yc-current-arc'),
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
      freetext:    g('yc-tell-sky'),
      workTags:    howYouWork,""",
'build.js — save: all canonical field names')

# ── PATCH 2: build.js load — fix all field name reads ──
patch('js/app/build.js',
"""  yc('yc-hair')(char.hair || '');
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
  });""",
"""  yc('yc-hair')(char.hair || '');
  yc('yc-eyes')(char.eyes || '');
  yc('yc-build')(char.build || '');
  yc('yc-style')(char.style || '');
  yc('yc-marks')(char.marks || '');
  yc('yc-wearing')(char.wearing || '');
  yc('yc-current-arc')(char.arc || '');
  yc('yc-working-on')(char.project || '');
  yc('yc-theme-song')(char.song || '');
  yc('yc-pets')(char.pets || '');
  yc('yc-fav-food')(char.food || '');
  yc('yc-comfort-show')(char.comfort || '');
  yc('yc-hates')(char.hates || '');
  yc('yc-hobbies')(char.hobbies || '');
  yc('yc-obsession')(char.obsession || '');
  yc('yc-job')(char.job || '');
  yc('yc-creative-medium')(char.medium || '');
  yc('yc-who-matters')(char.people || '');
  yc('yc-wins')(char.wins || '');
  yc('yc-stuck-on')(char.stuck || '');
  yc('yc-influences')(char.influences || '');
  yc('yc-tell-sky')(char.freetext || char.tell_sky || '');

  // Restore how-you-work chips — canonical name is char.workTags[]
  const howYouWork = char.workTags || char.chips || [];
  document.querySelectorAll('[data-yc]').forEach(c => {
    c.classList.toggle('selected', howYouWork.includes(c.dataset.yc));
  });""",
'build.js — load: all canonical field names')

# ── PATCH 3: forge.js — add missing eyes/style/wearing fields to about-you section ──
patch('js/app/views/forge.js',
"""        <div class="forge-row">
          <div class="forge-field forge-half"><label class="forge-label">hair</label>
            <input class="forge-input" id="yc-hair" placeholder="samurai cut..." /></div>
          <div class="forge-field forge-half"><label class="forge-label">height / build</label>
            <input class="forge-input" id="yc-build" placeholder="5\'9 skinny..." /></div>
        </div>
        <div class="forge-field"><label class="forge-label">marks / features</label>
          <input class="forge-input" id="yc-marks" placeholder="distinctive stuff..." /></div>""",
"""        <div class="forge-row">
          <div class="forge-field forge-half"><label class="forge-label">hair</label>
            <input class="forge-input" id="yc-hair" placeholder="samurai cut..." /></div>
          <div class="forge-field forge-half"><label class="forge-label">eyes</label>
            <input class="forge-input" id="yc-eyes" placeholder="gold..." /></div>
        </div>
        <div class="forge-row">
          <div class="forge-field forge-half"><label class="forge-label">height / build</label>
            <input class="forge-input" id="yc-build" placeholder="5\'9 skinny..." /></div>
          <div class="forge-field forge-half"><label class="forge-label">style / aesthetic</label>
            <input class="forge-input" id="yc-style" placeholder="simple, techwear..." /></div>
        </div>
        <div class="forge-row">
          <div class="forge-field forge-half"><label class="forge-label">marks / features</label>
            <input class="forge-input" id="yc-marks" placeholder="distinctive stuff..." /></div>
          <div class="forge-field forge-half"><label class="forge-label">usually wearing</label>
            <input class="forge-input" id="yc-wearing" placeholder="silver beanie, grey hoodie..." /></div>
        </div>""",
'forge.js — about you: add eyes, style, wearing fields')

print('\nAll 3 patches applied. Run:')
print('  cd ~/spiralside')
print('  git add js/app/build.js js/app/views/forge.js')
print('  git commit -m "fix: you_card forge fields fully canonical — eyes/style/wearing added"')
print('  git push --force origin main')
