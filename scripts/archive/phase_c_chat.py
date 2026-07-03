# phase_c_chat.py
# ============================================================
# SPIRALSIDE - PHASE C (target 1): CHAT DESKTOP READING COLUMN
# ============================================================
# The fullscreen shell (A.2) stretched chat wall-to-wall. This adds
# ONE additive media block (>=900px) that:
#   - centers the message stream in a ~860px column
#     (padding trick keeps the scrollbar at the view edge)
#   - centers the input bar on the same column
#   - makes the options popup (models/tools/voice) match the input
#     column instead of spanning the full view
#   - caps bubbles at 680px while still respecting the user's
#     style-panel --bubble-max-width setting
# Mobile (<900px) untouched. No existing rules modified.
# Run from ~/spiralside:   python phase_c_chat.py

import sys

PATH = "index.html"

raw = open(PATH, encoding="utf-8").read()
had_crlf = "\r\n" in raw
src = raw.replace("\r\n", "\n")

# --- guards ---------------------------------------------------------------
if "PHASE C: CHAT DESKTOP" in src:
    print("Already patched. Nothing to do.")
    sys.exit(0)
if "DESKTOP SHELL" not in src:
    print("FAIL: Phase A shell not found - wrong base file?")
    sys.exit(1)

# --- anchor: the A.2 marker comment (end of the desktop shell CSS) --------
ANCHOR = "    /* 1200px / 1600px caps removed \u2014 desktop shell is fullscreen */"

NEW = ANCHOR + """

    /* \u2500\u2500 PHASE C: CHAT DESKTOP (>=900px) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
       Fullscreen shell stretched chat wall-to-wall; this pulls
       messages + input into a centered reading column while the
       scrollbar stays at the view edge. Mobile untouched.      */
    @media (min-width: 900px) {
      /* center the message stream in an 860px column via side padding -
         #chat-messages stays full width so its scrollbar hugs the edge */
      #chat-messages {
        padding-left:  max(24px, calc((100% - 860px) / 2));
        padding-right: max(24px, calc((100% - 860px) / 2));
      }
      /* input bar rides the same column */
      .chat-input-area {
        padding-left:  max(16px, calc((100% - 860px) / 2));
        padding-right: max(16px, calc((100% - 860px) / 2));
      }
      /* options popup (models / tools / voice) aligns to the input
         column instead of spanning the whole view width */
      .chat-input-area .options-panel {
        left:  max(16px, calc((100% - 860px) / 2));
        right: max(16px, calc((100% - 860px) / 2));
      }
      /* readable bubbles: honor the style-panel setting, cap at 680px */
      .msg-content { max-width: min(680px, var(--bubble-max-width, 92%)); }
    }"""

n = src.count(ANCHOR)
if n != 1:
    print("ANCHOR FAIL: A.2 marker comment found", n, "times (need 1).")
    idx = src.find("caps removed")
    if idx >= 0:
        print("Context:"); print(repr(src[max(0,idx-100):idx+160]))
    sys.exit(1)

src = src.replace(ANCHOR, NEW)
out = src.replace("\n", "\r\n") if had_crlf else src
open(PATH, "w", encoding="utf-8", newline="").write(out)

check = open(PATH, encoding="utf-8").read()
print("patched OK - PHASE C chat block:", check.count("PHASE C: CHAT DESKTOP"),
      "| bytes:", len(check.encode("utf-8")))
print('Now run: git add . && git commit -m "phase C: chat desktop reading column" && git push origin main')
