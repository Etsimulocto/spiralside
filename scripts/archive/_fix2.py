import pathlib
f = pathlib.Path('js/app/card.js')
src = f.read_text(encoding='utf-8').replace('\r\n', '\n')
OLD = """  const creator  = (print.metadata && (print.metadata.creator_name || print.metadata.handle))
                 || (print.metadata && print.metadata.owner_id === 'platform' ? 'Spiralside' : null)
                 || print.identity?.name || 'unknown';"""
NEW = """  const creator  = (print.metadata && (print.metadata.creator_name || print.metadata.handle))
                 || (print.metadata && print.metadata.owner_id === 'platform' ? 'Spiralside' : null)
                 || (typeof CHARACTERS !== 'undefined' && CHARACTERS.you?.handle)
                 || 'you';"""
if OLD in src:
    f.write_text(src.replace(OLD, NEW, 1), encoding='utf-8')
    print('OK: card.js creator fallback fixed')
else:
    print('NOT FOUND')
    idx = src.find('const creator')
    print(repr(src[idx:idx+200]))
