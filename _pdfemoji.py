
path = "js/app/pdf.js"
src = open(path, encoding="utf-8").read()

OLD = """  const _extras = [
    you.song      ? '\\u266a ' + you.song      : null,
    you.location  ? '\\ud83d\\udccd ' + you.location : null,
    you.job       ? '\\ud83d\\udcbc ' + you.job       : null,
    you.hobbies   ? '\\u2605 ' + you.hobbies   : null,
  ].filter(Boolean);"""

NEW = """  const _extras = [
    you.song      ? 'song: '     + you.song      : null,
    you.location  ? 'location: ' + you.location  : null,
    you.job       ? 'job: '      + you.job        : null,
    you.hobbies   ? 'hobbies: '  + you.hobbies   : null,
    you.obsession ? 'obsession: '+ you.obsession : null,
    you.project   ? 'project: '  + you.project   : null,
  ].filter(Boolean);"""

if OLD not in src:
    print("ANCHOR NOT FOUND")
else:
    src = src.replace(OLD, NEW, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK pdf.js — emoji replaced with plain text labels")
