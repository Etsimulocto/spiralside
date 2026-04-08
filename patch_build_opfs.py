import sys
FILE = r"C:/Users/quart/spiralside/js/app/build.js"

with open(FILE, encoding="utf-8") as f:
    src = f.read().replace('\r\n', '\n')

# Add OPFS portrait save after IDB save in handleSave
OLD = """  // Save full soul print to IDB
  await dbSet('prints', { id: printToSave.card_id, ...printToSave });
  // Cloud backup — keyed by card_id so each print is its own record
  syncSave('print_' + printToSave.card_id, { id: printToSave.card_id, ...printToSave }).catch(() => {});"""

NEW = """  // Save full soul print to IDB
  await dbSet('prints', { id: printToSave.card_id, ...printToSave });
  // Save portrait to OPFS keyed by card_id — survives cloud hydration
  if (printToSave.portrait_base64 && window.opfsWrite) {
    try {
      const _res  = await fetch(printToSave.portrait_base64);
      const _blob = await _res.blob();
      await window.opfsWrite('prints/' + printToSave.card_id + '_portrait.png', _blob);
      console.log('[build] portrait saved to OPFS for', printToSave.card_id);
    } catch(_e) { console.warn('[build] OPFS portrait save failed:', _e); }
  }
  // Cloud backup — keyed by card_id so each print is its own record
  syncSave('print_' + printToSave.card_id, { id: printToSave.card_id, ...printToSave }).catch(() => {});"""

if OLD not in src:
    print("MISS: handleSave IDB write")
    idx = src.find('Save full soul print to IDB')
    print(repr(src[max(0,idx-20):idx+200]))
    sys.exit(1)

src = src.replace(OLD, NEW)
print("OK: OPFS portrait save added in handleSave")

# Also restore portrait from OPFS when loading print into form
OLD_LOAD = """  // Restore portrait if saved
  if (print.portrait_base64) {
    _portraitBase64 = print.portrait_base64;"""

NEW_LOAD = """  // Restore portrait if saved — check OPFS fallback if stripped
  if (!print.portrait_base64 && (print._has_portrait_base64) && window.opfsRead) {
    try {
      const _key = 'prints/' + (print.id || print.card_id) + '_portrait.png';
      const _data = await window.opfsRead(_key);
      if (_data) print.portrait_base64 = _data;
    } catch(_e) {}
  }
  if (print.portrait_base64) {
    _portraitBase64 = print.portrait_base64;"""

if OLD_LOAD not in src:
    print("MISS: portrait restore in _loadPrintDataIntoForm")
else:
    src = src.replace(OLD_LOAD, NEW_LOAD)
    print("OK: OPFS portrait fallback in form loader")

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(src)
print("DONE")
