
BASE = "C:/Users/quart/spiralside"

path = BASE + "/js/app/sheet.js"
src = open(path, encoding="utf-8").read()

# Find the saveSummarize function button handler and add download after save
# The button calls saveSummarize — we patch the END of saveSummarize to trigger download

OLD = """      renderActiveChar(id);
    }
  } catch(e) {
    console.warn('saveSummarize AI step:', e);
  }
}"""

NEW = """      renderActiveChar(id);
      // Auto-download a backup of everything they filled out
      if (id === 'you') _downloadYouCard(char);
    }
  } catch(e) {
    console.warn('saveSummarize AI step:', e);
  }
}

// ── AUTO-DOWNLOAD You card as JSON on every save+summarize ────
// Belt-and-suspenders: even if cloud sync fails, user has a local copy
function _downloadYouCard(char) {
  try {
    const exportObj = {
      spiralside_you_card: true,
      exported_at: new Date().toISOString(),
      version: '1.0',
      data: {
        handle:        char.handle        || '',
        vibe:          char.vibe          || '',
        arc:           char.arc           || '',
        song:          char.song          || '',
        traits:        char.traits        || [],
        chips:         char.chips         || [],
        hobbies:       char.hobbies       || '',
        obsession:     char.obsession     || '',
        job:           char.job           || '',
        medium:        char.medium        || '',
        people:        char.people        || '',
        wins:          char.wins          || '',
        stuck:         char.stuck         || '',
        influences:    char.influences    || '',
        tell_sky:      char.tell_sky      || char.sky_note || '',
        appearance:    char.appearance    || {},
        portrait_b64:  char.portrait_base64 ? '[portrait included]' : null,
      }
    };
    const blob = new Blob(
      [JSON.stringify(exportObj, null, 2)],
      { type: 'application/json' }
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'spiralside-you-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  } catch(e) {
    console.warn('[sheet] export failed:', e);
  }
}"""

if OLD not in src:
    print("ANCHOR NOT FOUND")
    # Show what's near renderActiveChar to help debug
    import re
    lines = src.split('\n')
    for i, l in enumerate(lines):
        if 'renderActiveChar' in l:
            print(f"  line {i+1}: {l}")
else:
    src = src.replace(OLD, NEW, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK sheet.js — auto-download wired to save+summarize")
