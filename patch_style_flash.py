import pathlib
f = pathlib.Path('C:/Users/quart/spiralside/js/app/main.js')
src = f.read_text(encoding='utf-8').replace('\r\n', '\n')

old = """  // ── Style prefs ──────────────────────────────────────────
  try {
    const cloudStyle = await syncLoad('style_prefs');
    if (cloudStyle) {
      const { setPendingStyle, applyStyleVars } = await import('./style.js');
      setPendingStyle(cloudStyle);
      applyStyleVars(cloudStyle);
      localStorage.setItem('ss_style', JSON.stringify(cloudStyle));
      console.log('[sync] style_prefs hydrated from cloud');
    }
  } catch(e) { console.warn('[sync] style hydration failed:', e); }"""

new = """  // ── Style prefs ──────────────────────────────────────────
  // Only hydrate if localStorage has nothing — loadSavedStyle() already
  // applied local style before onAppReady ran, so re-applying here causes flash
  try {
    const _hasLocalStyle = localStorage.getItem('ss_style');
    if (!_hasLocalStyle) {
      const cloudStyle = await syncLoad('style_prefs');
      if (cloudStyle) {
        const { setPendingStyle, applyStyleVars } = await import('./style.js');
        setPendingStyle(cloudStyle);
        applyStyleVars(cloudStyle);
        localStorage.setItem('ss_style', JSON.stringify(cloudStyle));
        console.log('[sync] style_prefs hydrated from cloud');
      }
    }
  } catch(e) { console.warn('[sync] style hydration failed:', e); }"""

if old not in src:
    print('NOT FOUND')
else:
    f.write_text(src.replace(old, new, 1), encoding='utf-8')
    print('FIXED')
