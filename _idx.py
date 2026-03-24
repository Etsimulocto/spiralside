import pathlib
f = pathlib.Path('index.html')
src = f.read_text(encoding='utf-8').replace('\r\n', '\n')
OLD = 'save-summarize-btn" id="save-summarize-btn" onclick="saveSummarize()">'
NEW = 'you-card-meta" style="display:none;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font-size:0.6rem;letter-spacing:0.1em;color:var(--subtext);margin-bottom:8px;font-family:var(--font-ui)"></div>\n<button class="save-summarize-btn" id="save-summarize-btn" onclick="saveSummarize()">'
if OLD in src:
    f.write_text(src.replace(OLD, NEW, 1), encoding='utf-8')
    print('OK: index.html you-card-meta strip')
else:
    print('NOT FOUND')
