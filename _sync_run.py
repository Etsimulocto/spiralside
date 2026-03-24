
BASE = "C:/Users/quart/spiralside"

# ── Write sync.js ──
with open(BASE + "/js/app/sync.js", "w", encoding="utf-8") as f:
    f.write("""\
// ============================================================
// SPIRALSIDE -- SYNC v1.0
// Supabase cloud backup for all user data
// Nimbis anchor: js/app/sync.js
// ============================================================

import { state } from './state.js';

const SUPA_URL = 'https://qfawusrelwthxabfbglg.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYXd1c3JlbHd0aHhhYmZiZ2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzc5NzUsImV4cCI6MjA4ODc1Mzk3NX0.XkeFmWq-rOH2whgfkeMylyG7Ct_0u80fMkoJlEQ5K8E';

export async function syncSave(record_type, data) {
  const token = state.session?.access_token;
  if (!token) return;
  try {
    await fetch(SUPA_URL + '/rest/v1/user_data', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + token,
        'apikey':        SUPA_KEY,
        'Prefer':        'resolution=merge-duplicates',
      },
      body: JSON.stringify({ user_id: state.user.id, record_type, data, updated_at: new Date().toISOString() }),
    });
  } catch(e) { console.warn('[sync] save failed:', record_type, e); }
}

export async function syncLoad(record_type) {
  const token = state.session?.access_token;
  if (!token) return null;
  try {
    const r = await fetch(
      SUPA_URL + '/rest/v1/user_data?user_id=eq.' + state.user.id + '&record_type=eq.' + record_type + '&select=data',
      { headers: { 'Authorization': 'Bearer ' + token, 'apikey': SUPA_KEY } }
    );
    const rows = await r.json();
    return (rows && rows[0]) ? rows[0].data : null;
  } catch(e) { console.warn('[sync] load failed:', record_type, e); return null; }
}

export async function syncLoadAll() {
  const token = state.session?.access_token;
  if (!token) return [];
  try {
    const r = await fetch(
      SUPA_URL + '/rest/v1/user_data?user_id=eq.' + state.user.id + '&select=record_type,data,updated_at',
      { headers: { 'Authorization': 'Bearer ' + token, 'apikey': SUPA_KEY } }
    );
    return await r.json() || [];
  } catch(e) { console.warn('[sync] loadAll failed:', e); return []; }
}
""")
print("OK sync.js")

# ── Patch sheet.js ──
path = BASE + "/js/app/sheet.js"
src = open(path, encoding="utf-8").read()

A1 = "import { dbSet, dbGetAll }          from './db.js';"
B1 = "import { dbSet, dbGetAll }          from './db.js';\nimport { syncSave, syncLoad }         from './sync.js';"

A2 = "  await dbSet('sheets', {"
B2 = "  syncSave('you_card', Object.assign({}, char, {id:'you'})).catch(()=>{});\n  await dbSet('sheets', {"

if A1 not in src:
    print("sheet ANCHOR1 NOT FOUND")
elif A2 not in src:
    print("sheet ANCHOR2 NOT FOUND")
else:
    src = src.replace(A1, B1, 1)
    src = src.replace(A2, B2, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK sheet.js")

# ── Patch quest.js ──
path = BASE + "/js/app/views/quest.js"
src = open(path, encoding="utf-8").read()

A3 = "// Nimbis anchor: js/app/views/quest.js"
B3 = "// Nimbis anchor: js/app/views/quest.js\nimport { syncSave, syncLoad } from '../sync.js';"

A4 = "function saveCharacter(c) {\n  localStorage.setItem('ss_quest_char', JSON.stringify(c));\n}"
B4 = "function saveCharacter(c) {\n  localStorage.setItem('ss_quest_char', JSON.stringify(c));\n  syncSave('quest_char', c).catch(()=>{});\n}"

if A3 not in src:
    print("quest ANCHOR3 NOT FOUND")
elif A4 not in src:
    print("quest ANCHOR4 NOT FOUND")
else:
    src = src.replace(A3, B3, 1)
    src = src.replace(A4, B4, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK quest.js")

# ── Patch account.js ──
path = BASE + "/js/app/views/account.js"
src = open(path, encoding="utf-8").read()

A5 = "// Nimbis anchor: js/app/views/account.js"
B5 = """// Nimbis anchor: js/app/views/account.js
import { syncLoadAll, syncSave } from '../sync.js';

export async function exportUserData() {
  const records = await syncLoadAll();
  if (!records.length) { alert('No cloud data yet. Save your You card and Quest character first.'); return; }
  const blob = new Blob([JSON.stringify({ spiralside_backup: true, exported_at: new Date().toISOString(), records }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'spiralside-backup-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
}

export function importUserData() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = async e => {
    try {
      const parsed = JSON.parse(await e.target.files[0].text());
      if (!parsed.spiralside_backup || !parsed.records?.length) { alert('Invalid backup file.'); return; }
      for (const rec of parsed.records) await syncSave(rec.record_type, rec.data);
      alert('Restored ' + parsed.records.length + ' records. Reload to see your data.');
    } catch(err) { alert('Could not read file: ' + err.message); }
  };
  input.click();
}"""

if A5 not in src:
    print("account ANCHOR5 NOT FOUND")
else:
    src = src.replace(A5, B5, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK account.js")

print("ALL DONE")
