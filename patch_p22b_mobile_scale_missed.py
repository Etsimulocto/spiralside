#!/usr/bin/env python3
# patch_p22b_mobile_scale_missed.py — apply the 13 patches from p22 that missed
# Run: cd ~/spiralside && python patch_p22b_mobile_scale_missed.py

import sys, os, re
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

def read(p):
    with open(p,'r',encoding='utf-8') as f: return f.read().replace('\r\n','\n')
def write(p,c):
    with open(p,'w',encoding='utf-8') as f: f.write(c)

LIB = 'js/app/library.js'
src = read(LIB)

replacements = [
    # frame strip padding
    (
        "    /* FRAME track (top) — compact for mobile */\n    .tl-track.track-frame .tl-strip-wrap {\n      padding:3px 12px 3px;\n    }",
        "    /* FRAME track */\n    .tl-track.track-frame .tl-strip-wrap {\n      padding:4px 14px 4px;\n    }"
    ),
    # scene strip padding
    (
        "    /* SCENE track (bottom) */\n    .tl-track.track-scene .tl-strip-wrap {\n      padding:3px 12px 8px;\n    }",
        "    /* SCENE track */\n    .tl-track.track-scene .tl-strip-wrap {\n      padding:4px 14px 10px;\n    }"
    ),
    # strip gap
    (
        "      display:flex; gap:8px;\n      scrollbar-width:thin; scrollbar-color:var(--teal) var(--surface);\n      -webkit-overflow-scrolling:touch;\n    }",
        "      display:flex; gap:10px;\n      scrollbar-width:thin; scrollbar-color:var(--teal) var(--surface);\n      -webkit-overflow-scrolling:touch;\n    }"
    ),
    # track labels
    (
        "    .tl-track-label {\n      font-size:0.46rem; letter-spacing:0.12em; text-transform:uppercase;\n      color:var(--subtext); padding:3px 12px 1px; flex-shrink:0;\n    }",
        "    .tl-track-label {\n      font-size:0.52rem; letter-spacing:0.12em; text-transform:uppercase;\n      color:var(--subtext); padding:4px 14px 2px; flex-shrink:0;\n    }"
    ),
    # se-preview-wrap
    (
        "    .se-preview-wrap {\n      width:70px; height:93px; flex-shrink:0; border-radius:8px;\n      overflow:hidden; border:1px solid var(--border); background:var(--surface);\n      display:flex; align-items:center; justify-content:center; cursor:pointer;\n    }",
        "    .se-preview-wrap {\n      width:88px; height:117px; flex-shrink:0; border-radius:8px;\n      overflow:hidden; border:1px solid var(--border); background:var(--surface);\n      display:flex; align-items:center; justify-content:center; cursor:pointer;\n    }"
    ),
    # se-chips scrollable
    (
        "    .se-chips { display:flex; gap:5px; flex-wrap:wrap; }",
        "    .se-chips {\n      display:flex; gap:6px; flex-wrap:wrap;\n      overflow-x:auto; -webkit-overflow-scrolling:touch;\n      scrollbar-width:none; padding-bottom:2px;\n    }\n    .se-chips::-webkit-scrollbar { display:none; }"
    ),
    # se-chip bigger
    (
        "    .se-chip {\n      padding:5px 10px; background:var(--surface2); border:1px solid var(--border);\n      border-radius:20px; font-size:0.65rem; cursor:pointer; color:var(--subtext);\n      font-family:var(--font-ui); transition:all 0.15s;\n    }",
        "    .se-chip {\n      padding:7px 13px; background:var(--surface2); border:1px solid var(--border);\n      border-radius:20px; font-size:0.72rem; cursor:pointer; color:var(--subtext);\n      font-family:var(--font-ui); transition:all 0.15s; flex-shrink:0;\n    }"
    ),
    # se-label
    (
        "    .se-label { font-size:0.58rem; color:var(--subtext); letter-spacing:0.1em; text-transform:uppercase; margin-bottom:5px; }",
        "    .se-label { font-size:0.64rem; color:var(--subtext); letter-spacing:0.1em; text-transform:uppercase; margin-bottom:6px; }"
    ),
    # se-input
    (
        "    .se-input {\n      width:100%; background:var(--surface2); border:1px solid var(--border);\n      border-radius:8px; padding:9px 11px; color:var(--text);\n      font-size:0.78rem; outline:none; font-family:var(--font-ui);\n      transition:border-color 0.2s; resize:none;\n    }",
        "    .se-input {\n      width:100%; background:var(--surface2); border:1px solid var(--border);\n      border-radius:8px; padding:11px 13px; color:var(--text);\n      font-size:0.84rem; outline:none; font-family:var(--font-ui);\n      transition:border-color 0.2s; resize:none;\n    }"
    ),
    # tb-mini-chip
    (
        "    .tb-mini-chip {\n      padding:3px 6px; border-radius:4px; font-size:0.52rem;\n      border:1px solid var(--border); background:var(--surface2);\n      color:var(--subtext); cursor:pointer; font-family:var(--font-ui);\n      transition:all 0.12s; white-space:nowrap;\n    }",
        "    .tb-mini-chip {\n      padding:6px 10px; border-radius:6px; font-size:0.66rem;\n      border:1px solid var(--border); background:var(--surface2);\n      color:var(--subtext); cursor:pointer; font-family:var(--font-ui);\n      transition:all 0.12s; white-space:nowrap;\n    }"
    ),
    # tb-style-chip
    (
        "    .tb-style-chip {\n      padding:3px 8px; border-radius:20px; font-size:0.58rem;\n      border:1px solid var(--border); background:var(--surface2);\n      color:var(--subtext); cursor:pointer; font-family:var(--font-ui);\n      letter-spacing:0.04em; transition:all 0.15s;\n    }",
        "    .tb-style-chip {\n      padding:6px 12px; border-radius:20px; font-size:0.68rem;\n      border:1px solid var(--border); background:var(--surface2);\n      color:var(--subtext); cursor:pointer; font-family:var(--font-ui);\n      letter-spacing:0.04em; transition:all 0.15s;\n    }"
    ),
    # tb-speaker-input
    (
        "    .tb-speaker-input {\n      flex:1; background:transparent; border:none; border-bottom:1px solid var(--border);\n      color:var(--text); font-family:var(--font-ui); font-size:0.72rem;\n      outline:none; padding:2px 0; min-width:0;\n    }",
        "    .tb-speaker-input {\n      flex:1; background:transparent; border:none; border-bottom:1px solid var(--border);\n      color:var(--text); font-family:var(--font-ui); font-size:0.82rem;\n      outline:none; padding:4px 0; min-width:0;\n    }"
    ),
    # tb-text-input
    (
        "    .tb-text-input {\n      width:100%; background:var(--bg); border:1px solid var(--border);\n      border-radius:6px; padding:8px 10px; color:var(--text);\n      font-family:var(--font-ui); font-size:0.78rem; resize:none;\n      outline:none; line-height:1.5; min-height:44px;\n    }",
        "    .tb-text-input {\n      width:100%; background:var(--bg); border:1px solid var(--border);\n      border-radius:6px; padding:10px 12px; color:var(--text);\n      font-family:var(--font-ui); font-size:0.86rem; resize:none;\n      outline:none; line-height:1.55; min-height:54px;\n    }"
    ),
    # pos grid cells
    (
        "    .tb-pos-grid {\n      display:grid; grid-template-columns:repeat(3,16px); gap:2px;\n    }\n    .tb-pos-cell {\n      width:16px; height:12px; border-radius:2px;\n      background:var(--border); cursor:pointer; border:none;\n      transition:background 0.15s;\n    }",
        "    .tb-pos-grid {\n      display:grid; grid-template-columns:repeat(3,22px); gap:3px;\n    }\n    .tb-pos-cell {\n      width:22px; height:17px; border-radius:3px;\n      background:var(--border); cursor:pointer; border:none;\n      transition:background 0.15s;\n    }"
    ),
    # tb-swatch
    (
        "    .tb-swatch {\n      width:24px; height:24px; border-radius:6px; border:2px solid var(--border);\n      cursor:pointer; overflow:hidden; position:relative; flex-shrink:0;\n    }",
        "    .tb-swatch {\n      width:32px; height:32px; border-radius:7px; border:2px solid var(--border);\n      cursor:pointer; overflow:hidden; position:relative; flex-shrink:0;\n    }"
    ),
    # opacity label
    (
        "    .tb-opacity-label { font-size:0.5rem; color:var(--subtext); letter-spacing:0.08em; white-space:nowrap; }",
        "    .tb-opacity-label { font-size:0.6rem; color:var(--subtext); letter-spacing:0.08em; white-space:nowrap; }"
    ),
    # tb-item padding
    (
        "    .tb-item {\n      background:var(--surface2); border:1px solid var(--border);\n      border-radius:10px; padding:9px 10px;\n      display:flex; flex-direction:column; gap:7px;\n      position:relative;\n    }",
        "    .tb-item {\n      background:var(--surface2); border:1px solid var(--border);\n      border-radius:12px; padding:12px 13px;\n      display:flex; flex-direction:column; gap:10px;\n      position:relative;\n    }"
    ),
    # tb-add-btn
    (
        "    .tb-add-btn {\n      width:100%; padding:10px; background:transparent;\n      border:1px dashed var(--border); border-radius:10px;\n      color:var(--subtext); font-family:var(--font-ui); font-size:0.72rem;\n      cursor:pointer; letter-spacing:0.06em; transition:all 0.2s;\n      margin-top:4px;\n    }",
        "    .tb-add-btn {\n      width:100%; padding:14px; background:transparent;\n      border:1px dashed var(--border); border-radius:10px;\n      color:var(--subtext); font-family:var(--font-ui); font-size:0.8rem;\n      cursor:pointer; letter-spacing:0.06em; transition:all 0.2s;\n      margin-top:6px;\n    }"
    ),
    # se-del-btn
    (
        "    .se-del-btn {\n      padding:12px 16px; background:transparent; border:1px solid var(--border);\n      border-radius:10px; color:var(--subtext); font-family:var(--font-ui);\n      font-size:0.78rem; cursor:pointer; transition:all 0.2s;\n    }",
        "    .se-del-btn {\n      padding:14px 18px; background:transparent; border:1px solid var(--border);\n      border-radius:10px; color:var(--subtext); font-family:var(--font-ui);\n      font-size:0.82rem; cursor:pointer; transition:all 0.2s;\n    }"
    ),
    # tl-title-input
    (
        "    .tl-title-input {\n      flex:1; background:transparent; border:none; border-bottom:1px solid transparent;\n      color:var(--text); font-family:var(--font-ui); font-size:0.84rem; font-weight:700;\n      outline:none; min-width:0; transition:border-color 0.2s;\n    }",
        "    .tl-title-input {\n      flex:1; background:transparent; border:none; border-bottom:1px solid transparent;\n      color:var(--text); font-family:var(--font-ui); font-size:0.96rem; font-weight:700;\n      outline:none; min-width:0; transition:border-color 0.2s;\n    }"
    ),
    # play btn
    (
        "    .tl-play-btn {\n      padding:6px 14px; background:var(--teal); border:none; border-radius:20px;\n      color:#0a0a0f; font-size:0.65rem; font-weight:700; cursor:pointer;\n      letter-spacing:0.06em; white-space:nowrap; font-family:var(--font-ui); flex-shrink:0;\n    }",
        "    .tl-play-btn {\n      padding:8px 18px; background:var(--teal); border:none; border-radius:20px;\n      color:#0a0a0f; font-size:0.72rem; font-weight:700; cursor:pointer;\n      letter-spacing:0.06em; white-space:nowrap; font-family:var(--font-ui); flex-shrink:0;\n    }"
    ),
    # intro btn
    (
        "    .tl-intro-btn {\n      padding:5px 10px; background:transparent; border:1px solid var(--border);\n      border-radius:20px; color:var(--subtext); font-size:0.58rem; font-family:var(--font-ui);\n      letter-spacing:0.06em; cursor:pointer; white-space:nowrap; transition:all 0.2s; flex-shrink:0;\n    }",
        "    .tl-intro-btn {\n      padding:7px 14px; background:transparent; border:1px solid var(--border);\n      border-radius:20px; color:var(--subtext); font-size:0.68rem; font-family:var(--font-ui);\n      letter-spacing:0.06em; cursor:pointer; white-space:nowrap; transition:all 0.2s; flex-shrink:0;\n    }"
    ),
    # export btn
    (
        "    .tl-export-btn {\n      padding:5px 10px; background:transparent; border:1px solid var(--border);\n      border-radius:20px; color:var(--subtext); font-size:0.58rem; font-family:var(--font-ui);\n      letter-spacing:0.06em; cursor:pointer; white-space:nowrap; transition:all 0.2s; flex-shrink:0;\n    }",
        "    .tl-export-btn {\n      padding:7px 14px; background:transparent; border:1px solid var(--border);\n      border-radius:20px; color:var(--subtext); font-size:0.68rem; font-family:var(--font-ui);\n      letter-spacing:0.06em; cursor:pointer; white-space:nowrap; transition:all 0.2s; flex-shrink:0;\n    }"
    ),
]

ok = 0
miss = 0
for old, new in replacements:
    old = old.replace('\r\n','\n')
    new = new.replace('\r\n','\n')
    if old not in src:
        print(f'[MISS] {repr(old[:50])}')
        miss += 1
    elif src.count(old) > 1:
        print(f'[DUPE] {repr(old[:50])}')
        miss += 1
    else:
        src = src.replace(old, new)
        ok += 1

write(LIB, src)
print(f'\n[DONE] {ok} applied, {miss} missed')
print('\nDeploy:')
print('  git add js/app/library.js')
print('  git commit -m "ux: mobile scale-up — bigger slots, chips, controls, text"')
print('  git push --force origin main')
