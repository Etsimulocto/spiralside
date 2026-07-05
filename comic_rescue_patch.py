# comic_rescue_patch.py - EMERGENCY: unblock users trapped on the comic screen
import sys

src = open('index.html', encoding='utf-8').read().replace('\r\n', '\n')

# idempotency guard
if 'comic-rescue-js' in src:
    print('SKIP: comic rescue already applied'); sys.exit(0)

# ---- JS injected before </body> ----
JS = '''<script id="comic-rescue-js">
  (function () {
    var KEY = 'spiralside.intro.seen';
    var comic = document.getElementById('screen-comic');
    if (!comic) return;

    // dismiss: fade, remove from flow, remember
    function dismiss() {
      comic.classList.add('fade-out');
      setTimeout(function () { comic.style.display = 'none'; }, 550);
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
    }

    // any click on the comic dismisses it (skip button included)
    comic.addEventListener('click', dismiss, true);

    // Escape key rescue
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && comic.style.display !== 'none') dismiss();
    });

    // returning user: skip instantly
    var seen = '0';
    try { seen = localStorage.getItem(KEY) || '0'; } catch (e) {}
    if (seen === '1') comic.style.display = 'none';

    // existing Supabase session: skip instantly (Cat's case)
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('sb-') === 0 && k.indexOf('-auth-token') !== -1) {
          comic.style.display = 'none';
          try { localStorage.setItem(KEY, '1'); } catch (e) {}
          break;
        }
      }
    } catch (e) {}
  })();
</script>
</body>'''

# anchor check - must be exactly one closing body tag
n = src.count('</body>')
if n != 1:
    print('FAIL: </body> anchor count =', n); sys.exit(1)

src = src.replace('</body>', JS, 1)
open('index.html', 'w', encoding='utf-8').write(src)
print('OK: comic rescue applied')
