# phase_splash.py
# ============================================================
# SPIRALSIDE - INTRO SIMPLIFICATION: minimal splash screen
# ============================================================
# Replaces Sky's default 6-panel comic intro at boot with a clean
# splash: spiralside wordmark + version number + one [ open ] button.
#
# What is PRESERVED:
#   - comic.js, intro.json, panel art - all untouched
#   - playCustomComic (books playback) - untouched, comic DOM intact
#   - user-book intros (intro_book_id) - still play if the user set one
# What changes: only the two initComic(_authCallback) boot calls in
# main.js now call _showSplash(_authCallback) instead, and the splash
# function is inserted above the boot block.
# Run from ~/spiralside:   python phase_splash.py

import sys

PATH = "js/app/main.js"

raw = open(PATH, encoding="utf-8").read()
had_crlf = "\r\n" in raw
src = raw.replace("\r\n", "\n")

# --- guards -----------------------------------------------------------
if "_showSplash" in src:
    print("Already patched. Nothing to do.")
    sys.exit(0)

# --- anchor 1: insert the splash function above the boot block --------
BOOT_ANCHOR = "const _authCallback = () => checkAuthAndShow(onAppReady);"

SPLASH_FN = """// -- MINIMAL SPLASH -------------------------------------------
// Replaces Sky's default comic intro at boot: wordmark + version
// + one open button. Rides as an overlay INSIDE #screen-comic so
// the comic DOM stays intact for playCustomComic (books) later.
function _showSplash(onDone) {
  const screen = document.getElementById('screen-comic');
  // no comic screen in DOM - just continue booting
  if (!screen) { onDone(); return; }

  // make sure the comic screen itself is visible (it hosts us)
  screen.classList.remove('fade-out');
  screen.style.display = '';

  // read the live version from the header badge (bumped by the push hook)
  const ver = document.getElementById('version-badge')?.textContent || '';

  // splash overlay - sits on top of the comic elements without touching them
  const s = document.createElement('div');
  s.id = 'splash-screen';
  s.innerHTML = `
    <style>
      #splash-screen {
        position: absolute; inset: 0; z-index: 50;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 14px;
        background: radial-gradient(ellipse at 50% 45%, #101022 0%, var(--bg, #08080d) 70%);
        transition: opacity 0.4s ease;
      }
      #splash-screen.out { opacity: 0; pointer-events: none; }
      #splash-wordmark {
        font-family: var(--font-display, 'Syne', sans-serif);
        font-size: 2.4rem; font-weight: 800; letter-spacing: 0.04em;
        background: linear-gradient(90deg, var(--teal, #00F6D6), var(--purple, #7B5FFF));
        -webkit-background-clip: text; background-clip: text; color: transparent;
        text-shadow: 0 0 40px rgba(0, 246, 214, 0.25);
      }
      #splash-version {
        font-family: var(--font-ui, 'DM Mono', monospace);
        font-size: 0.7rem; letter-spacing: 0.15em;
        color: var(--subtext, #7373B3);
      }
      #splash-open {
        margin-top: 18px; padding: 12px 54px;
        font-family: var(--font-ui, 'DM Mono', monospace);
        font-size: 0.85rem; letter-spacing: 0.2em; text-transform: lowercase;
        color: var(--teal, #00F6D6); background: transparent; cursor: pointer;
        border: 1px solid var(--teal, #00F6D6); border-radius: 24px;
        box-shadow: 0 0 20px rgba(0, 246, 214, 0.15);
        transition: all 0.2s;
      }
      #splash-open:hover {
        background: rgba(0, 246, 214, 0.08);
        box-shadow: 0 0 30px rgba(0, 246, 214, 0.35);
      }
    </style>
    <div id="splash-wordmark">spiralside</div>
    <div id="splash-version">${ver}</div>
    <button id="splash-open">open</button>
  `;
  screen.appendChild(s);

  // one click - fade splash, hide comic screen, continue to auth/app
  document.getElementById('splash-open').onclick = () => {
    s.classList.add('out');
    setTimeout(() => {
      s.remove();                       // clean up the overlay
      screen.style.display = 'none';    // hand the viewport to auth/app
      onDone();                         // -> checkAuthAndShow(onAppReady)
    }, 400);
  };
}

""" + BOOT_ANCHOR

# --- anchor 2: swap both default-intro boot calls -----------------------
OLD_CALL = "initComic(_authCallback);"
NEW_CALL = "_showSplash(_authCallback);"

for name, anchor, expect in (("boot block", BOOT_ANCHOR, 1),
                             ("initComic boot calls", OLD_CALL, 2)):
    n = src.count(anchor)
    if n != expect:
        print("ANCHOR FAIL [" + name + "]: found", n, "expected", expect)
        idx = src.find(anchor[:40])
        if idx >= 0:
            print("Context:"); print(repr(src[max(0,idx-80):idx+240]))
        sys.exit(1)

src = src.replace(BOOT_ANCHOR, SPLASH_FN)
src = src.replace(OLD_CALL, NEW_CALL)

out = src.replace("\n", "\r\n") if had_crlf else src
open(PATH, "w", encoding="utf-8", newline="").write(out)

check = open(PATH, encoding="utf-8").read()
ok1 = check.count("_showSplash(_authCallback);")
ok2 = "initComic(_authCallback)" not in check
print("patched OK - splash calls:", ok1, "| default comic calls removed:", ok2)
print('Now run: git add . && git commit -m "intro: minimal splash (logo + version + open)" && git push origin main')
