
import sys

TARGET = 'js/app/views/quest.js'

with open(TARGET, 'r', encoding='utf-8') as f:
    src = f.read().replace('\r\n', '\n')

# Fix 1: sessionStorage key — use date+hour so it re-checks every hour
# Also resolveCompletedQuests should run on every tab open if any quests are overdue
OLD1 = """  const _sessionKey = 'ss_quest_session_' + new Date().toISOString().slice(0,10);
  const _alreadyRan = sessionStorage.getItem(_sessionKey);
  if (!_alreadyRan) {
    sessionStorage.setItem(_sessionKey, '1');
    dropRandomLoot();
    setTimeout(resolveCompletedQuests, 800);
  }"""

NEW1 = """  // Loot drop: once per day per tab session
  const _dayKey = 'ss_quest_loot_' + new Date().toISOString().slice(0,10);
  if (!sessionStorage.getItem(_dayKey)) {
    sessionStorage.setItem(_dayKey, '1');
    dropRandomLoot();
  }
  // Idle resolve: run every time quest tab opens — checks if any timed quests are now past due
  // sessionStorage key resets every hour so overdue quests get caught within 60min max
  const _hourKey = 'ss_quest_resolve_' + new Date().toISOString().slice(0,13);
  if (!sessionStorage.getItem(_hourKey)) {
    sessionStorage.setItem(_hourKey, '1');
    setTimeout(resolveCompletedQuests, 800);
  } else {
    // Even within the hour — check immediately for any newly-past-due timed quests
    setTimeout(resolveCompletedQuests, 800);
  }"""

# Fix 2: resolveCompletedQuests should handle ALL overdue quests, not just first one
OLD2 = """  if (!toResolve.length) return;
  const ev = toResolve[0];
  const t2 = (ev.title||'').toLowerCase();
  const tmpl = QUEST_TEMPLATES.find(tmpl => tmpl.keywords.some(k => t2.includes(k)));
  const gold2 = tmpl ? tmpl.gold : 1;
  markResolved(ev.id);
  if (window.awardGold) await window.awardGold(gold2);
  showQuestCompleteCard(ev, gold2);"""

NEW2 = """  if (!toResolve.length) return;
  // Resolve all overdue quests, show card for the first one only
  let shownCard = false;
  for (const ev of toResolve) {
    const t2 = (ev.title||'').toLowerCase();
    const tmpl = QUEST_TEMPLATES.find(tmpl => tmpl.keywords.some(k => t2.includes(k)));
    const gold2 = tmpl ? tmpl.gold : 1;
    markResolved(ev.id);
    if (window.awardGold) await window.awardGold(gold2);
    if (!shownCard) { showQuestCompleteCard(ev, gold2); shownCard = true; }
  }"""

c1 = src.count(OLD1)
c2 = src.count(OLD2)
print(f"Anchors: session_guard={c1}, resolve_loop={c2}")
if c1 != 1 or c2 != 1:
    print("ANCHOR MISMATCH — aborting")
    sys.exit(1)

src = src.replace(OLD1, NEW1, 1)
src = src.replace(OLD2, NEW2, 1)

with open(TARGET, 'w', encoding='utf-8') as f:
    f.write(src)

print("quest.js patched — resolve runs every tab open, hourly sessionStorage reset, all overdue quests resolved")
