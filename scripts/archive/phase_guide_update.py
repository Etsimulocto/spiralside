# phase_guide_update.py
# ============================================================
# SPIRALSIDE - GUIDE REFRESH (Makeover Day content)
# ============================================================
# Data-only patch to js/app/views/guide.js:
#   1. Tutorials: new "Game Maker" card + 3-step overlay tour
#   2. Updates: 5 new entries (game maker, desktop redesign,
#      split 2.0, whats-new panel, new startup)
#   3. Tips: hide-the-sidebar + resize-the-split
#   4. Intro tour: adds a Game Maker stop after Quest
# No engine changes - the guide renders data, we add data.
# Run from ~/spiralside:   python phase_guide_update.py

import sys

PATH = "js/app/views/guide.js"

raw = open(PATH, encoding="utf-8").read()
had_crlf = "\r\n" in raw
src = raw.replace("\r\n", "\n")

# --- guard ------------------------------------------------------------
if "tut_gamemaker" in src:
    print("Already patched. Nothing to do.")
    sys.exit(0)

# ----------------------------------------------------------------------
# PATCH 1: Game Maker tutorial card (alphabetical G slot, after Frames)
# ----------------------------------------------------------------------
FRAMES_TUT = "    { id: 'tut_frames',     title: 'Frames',           desc: 'SVG/PNG frame maker. Comic FX \u2014 halftone, scanlines, speed lines, ripped edges, more.',       icon: '\U0001f5bc',  character: 'cold',   action: 'overlay', overlay: 'frames',     is_new: true  },"
GAMEMAKER_TUT = FRAMES_TUT + """
    // \u2500\u2500 G \u2500\u2500
    { id: 'tut_gamemaker',  title: 'Game Maker',       desc: 'BloomStudio \u2014 a full game engine in a tab. Tile maps, pixel sprites, enemies, dialogue, logic, Run mode.', icon: '\U0001f579', character: 'grit',   action: 'overlay', overlay: 'gamemaker',  is_new: true  },"""

# ----------------------------------------------------------------------
# PATCH 2: Game Maker overlay tour (inserted before the imagine tour)
# ----------------------------------------------------------------------
IMAGINE_OVL = "  imagine: [\n    { target: 'tab-imagine', title: 'Imagine Tab',"
GAMEMAKER_OVL = """  gamemaker: [
    { target: 'tab-bloomstudio', title: 'Game Maker',  text: 'A whole game studio in a tab. Paint tile maps, draw pixel sprites, place enemies, write dialogue.', char: 'grit',   pos: 'bottom' },
    { target: null,              title: 'It Autosaves', text: 'Your project saves locally as you build. Export as .bloom.json from the Export tool when you want it out.', char: 'cold',   pos: 'center' },
    { target: null,              title: 'Run Mode',     text: 'Hit RUN and play it right there. Coins, keys, chests, locked doors, slimes that chase you.',        char: 'monday', pos: 'center' },
  ],
""" + IMAGINE_OVL

# ----------------------------------------------------------------------
# PATCH 3: today's Update entries (prepended - newest first)
# ----------------------------------------------------------------------
UPDATES_OPEN = "  updates: [\n"
NEW_UPDATES = UPDATES_OPEN + """    { id: 'upd_gamemaker',  title: 'Game Maker Tab',   desc: 'BloomStudio ships. Full game engine: maps, sprites, enemies, dialogue, logic, Run mode. Autosaves as you build.', icon: '\U0001f579', character: 'grit',   action: 'none', is_new: true  },
    { id: 'upd_desktop',    title: 'Desktop Redesign', desc: 'Sidebar navigation, fullscreen layout, full-width header. Collapse the sidebar with the tabs button up top.',      icon: '\U0001f5a5', character: 'cold',   action: 'none', is_new: true  },
    { id: 'upd_split2',     title: 'Split Screen 2.0', desc: 'Split lives in the header now. Drag the divider to resize panes, double-click to reset. Your ratio saves.',        icon: '\u29c9',  character: 'monday', action: 'none', is_new: true  },
    { id: 'upd_whatsnew',   title: 'Whats New Panel',  desc: 'Click the version number in the header for release notes and tips. A teal dot means something new landed.',        icon: '\U0001f4f0', character: 'sky',    action: 'none', is_new: true  },
    { id: 'upd_splash',     title: 'New Startup',      desc: 'Clean splash \u2014 logo, version, open. Sky\\'s comic retired from boot; your custom intro books still play.',       icon: '\U0001f300', character: 'sky',    action: 'none', is_new: true  },
"""

# ----------------------------------------------------------------------
# PATCH 4: two new Tips (prepended)
# ----------------------------------------------------------------------
TIPS_OPEN = "  tips: [\n"
NEW_TIPS = TIPS_OPEN + """    { id: 'tip_sidebar',    title: 'Hide the Sidebar',       desc: 'The tabs button in the header collapses the sidebar \u2014 full width for game maker or split screen.', icon: '\u2039',  character: 'cold',   action: 'none', is_new: false },
    { id: 'tip_splitdrag',  title: 'Resize the Split',       desc: 'In split screen, grab the divider and drag. Chat left, game maker right, sized exactly how you like.',  icon: '\u2194',  character: 'monday', action: 'none', is_new: false },
"""

# ----------------------------------------------------------------------
# PATCH 5: Game Maker stop in the intro tour (after the Quest stop)
# ----------------------------------------------------------------------
QUEST_STOP = "    { target: 'tab-quest',    title: 'This is Quest',           text: 'Idle RPG lives here. Earn Gold. Spend it on unlocks across the whole app.',      char: 'grit',   pos: 'bottom' },"
GAMEMAKER_STOP = QUEST_STOP + """
    { target: 'tab-bloomstudio', title: 'This is Game Maker',  text: 'Build actual games. Maps, sprites, enemies. Hit RUN and play what you made.',    char: 'grit',   pos: 'bottom' },"""

for name, anchor in (("frames tutorial", FRAMES_TUT), ("imagine overlay", IMAGINE_OVL),
                     ("updates open", UPDATES_OPEN), ("tips open", TIPS_OPEN),
                     ("intro quest stop", QUEST_STOP)):
    n = src.count(anchor)
    if n != 1:
        print("ANCHOR FAIL [" + name + "]: found", n, "expected 1")
        probe = anchor.splitlines()[0][:50]
        idx = src.find(probe)
        if idx >= 0:
            print("Context:"); print(repr(src[max(0,idx-80):idx+280]))
        sys.exit(1)

src = src.replace(FRAMES_TUT, GAMEMAKER_TUT)
src = src.replace(IMAGINE_OVL, GAMEMAKER_OVL)
src = src.replace(UPDATES_OPEN, NEW_UPDATES)
src = src.replace(TIPS_OPEN, NEW_TIPS)
src = src.replace(QUEST_STOP, GAMEMAKER_STOP)

out = src.replace("\n", "\r\n") if had_crlf else src
open(PATH, "w", encoding="utf-8", newline="").write(out)

check = open(PATH, encoding="utf-8").read()
print("patched OK - gamemaker refs:", check.count("gamemaker"),
      "| new updates:", check.count("upd_gamemaker") + check.count("upd_desktop")
      + check.count("upd_split2") + check.count("upd_whatsnew") + check.count("upd_splash"))
print('Now run: git add . && git commit -m "guide: game maker tutorial + makeover day updates" && git push origin main')
