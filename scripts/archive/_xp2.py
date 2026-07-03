
f = open('C:/Users/quart/spiralside/js/app/views/quest.js','r',encoding='utf-8')
s = f.read(); f.close()

OLD_CSS = '    .quest-xp-bar-fill {\n      height: 100%; background: #FFD93D; border-radius: 2px;\n      transition: width 0.6s ease;\n    }'
NEW_CSS = """    .quest-xp-bar-fill {
      height: 100%; background: #FFD93D; border-radius: 2px;
      transition: width 0.6s ease;
    }
    .quest-xp-panel {
      display: flex; flex-direction: column; gap: 6px;
      padding: 10px 16px 12px; border-bottom: 1px solid var(--border);
      background: var(--surface);
    }
    .quest-xp-row { display: flex; align-items: center; justify-content: space-between; }
    .quest-xp-label { font-size: 0.6rem; letter-spacing: 0.1em; color: var(--subtext); text-transform: uppercase; }
    .quest-xp-nums  { font-size: 0.7rem; color: #FFD93D; letter-spacing: 0.06em; }
    .quest-xp-full  { height: 6px; background: var(--muted); border-radius: 3px; overflow: hidden; }
    .quest-xp-full-fill { height: 100%; background: linear-gradient(90deg,#FFD93D,#FF4BCB); border-radius: 3px; transition: width 0.6s ease; }
    .quest-xp-meta  { display: flex; gap: 12px; }
    .quest-xp-chip  { font-size: 0.58rem; color: var(--subtext); letter-spacing: 0.06em; }
    .quest-xp-chip span { color: #FFD93D; }"""

if 'quest-xp-panel' in s:
    print('SKIP css: already exists')
elif OLD_CSS not in s:
    print('ERR: css anchor not found')
    import sys; sys.exit(1)
else:
    s = s.replace(OLD_CSS, NEW_CSS, 1)
    print('OK css')

OLD_HTML = '    <!-- MII PANEL -->'
NEW_HTML = """    <!-- XP PANEL -->
    <div class="quest-xp-panel">
      <div class="quest-xp-row">
        <div class="quest-xp-label">experience</div>
        <div class="quest-xp-nums">${_xpCur} / ${_xpNxt} xp</div>
      </div>
      <div class="quest-xp-full">
        <div class="quest-xp-full-fill" style="width:${xpPct}%"></div>
      </div>
      <div class="quest-xp-meta">
        <div class="quest-xp-chip">daily <span>${_xps ? _xps.dailyXP : 0}/${_xps ? _xps.dailyCap : 10}</span></div>
        <div class="quest-xp-chip">streak <span>${_xps ? _xps.streakDays : 1}d</span></div>
        <div class="quest-xp-chip">total <span>${_xps ? _xps.totalXP : 0}</span></div>
      </div>
    </div>

    <!-- MII PANEL -->"""

if 'quest-xp-panel' in s and OLD_HTML not in s:
    print('SKIP html: already injected')
elif OLD_HTML not in s:
    print('ERR: html anchor not found')
    import sys; sys.exit(1)
else:
    s = s.replace(OLD_HTML, NEW_HTML, 1)
    print('OK html panel injected')

open('C:/Users/quart/spiralside/js/app/views/quest.js','w',encoding='utf-8').write(s)
print('done')
