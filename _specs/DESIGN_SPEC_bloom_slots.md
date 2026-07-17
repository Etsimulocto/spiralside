# BLOOMSTUDIO — BUILD SPEC: SLOT-AWARE CLOUD SAVE

**For:** Design
**From:** Nimbis / Architect
**Date:** July 17 2026
**Against:** ENGINE 2.2.1 (Downloads build 70)

---

## CONTEXT — WHY

Your cloud hooks work. They shipped July 16 and survived a real overnight
browser exit, which is the test that had been failing for four months.

But they only cover **one** project — the autosave key `bloomstudio.v1`.
Confirmed from the live Supabase row: it's a flat snapshot (`rooms`,
`sprites`, `saveSlot`...) with no `proj:1..10` container in it.

The 10 named slots (`bloomstudio.v1:proj:<n>`) have **no cloud copy at all.**

That matters because the bug we fixed was *browser storage being wiped on
exit* — Edge's "clear cookies and site data on close." That wipe takes every
`bloomstudio.*` key. Cloud hands back the autosave. All ten save files are
gone permanently.

Architect is about to sell 10 slots as a $5 lifetime unlock. We're not
selling the one thing that isn't protected. So: every slot gets a row.

---

## WHAT CHANGED SERVER-SIDE (already done, no action needed from you)

`bloom_projects` is now keyed `(user_id, slot)`:

- `slot 0` — the autosave. Always syncs, free and paid, never capped.
- `slot 1..10` — the named save files in the projSlots UI.

`user_usage.bloomstudio_paid` **now exists.** It didn't before — your
`initEntitlement()` was reading a phantom column, and
`window.bloomstudioUnlock()` had nothing to write to. That's fixed. Name kept
exactly as you shipped it.

A `BEFORE INSERT` trigger enforces the cap: **free = 1 named slot, paid = 10.**
Slot 0 is exempt.

---

## WHAT WE NEED FROM YOU

### 1. Slot-aware cloud calls

Hooks take an optional slot argument. Resolve them the same way you already
do — `cloudHook(name)`, frame first then parent, try/catch both, resolved at
call time. **Don't change that pattern.** It's correct and it's why there's no
injection race.

```js
// Save. slot omitted/0 = autosave (current behaviour, unchanged).
await cloudHook('bloomstudioCloudSave')?.(projectJson, slot, BloomStudio.ENGINE);

// Load a specific slot.
const proj = await cloudHook('bloomstudioCloudLoad')?.(slot);
```

The parent side defaults `slot` to `0` when it's undefined, so **build 70 keeps
working untouched** until this ships. No flag day.

Call sites:
- `saveProjSlot(n)` → `cloudSave(json, n, ENGINE)`
- `loadProjSlot(n)` → cloud fallback when the local key is missing
- autosave path → unchanged, slot 0

### 2. Pass `ENGINE` through

`engine_version` is null on the live row because nothing passes it. You
confirmed the omission is on our side of the hooks — but the value has to
originate from you. Third arg, `BloomStudio.ENGINE`. Trivial, but it's how
we'll know which engine wrote a save when something looks wrong in six months.

### 3. Handle the cap error

When a free user saves to a second named slot, the insert throws. The message
contains the stable token `bloom_slot_cap`:

```
bloom_slot_cap: 1 of 1 named slots used
```

On that token → show the existing upgrade modal (the one `addRoom()` already
uses at room 4). **The local save must still succeed.** Cloud backup is denied;
the user's work is not. Never let a cap failure eat a save.

Any other error → the existing storage notice. Don't invent new UI.

### 4. Keep cloudLoad's guardrail

`cloudLoad` only firing when there's no local save is **correct** and it's why
it can't clobber good work. Keep that for slot 0.

For named slots, loading is an explicit user action, so it's allowed to
overwrite — but confirm first if the target local slot is non-empty. Same
principle, different trigger.

---

## SEPARATE, SHIP FIRST — THE IMPORT BUTTON

Independent of everything above. Don't bundle it, don't wait on it.

**Add IMPORT next to EXPORT on the always-visible Project card.**

Take option B, not the section exemption. Exempting the whole READABLE FILES
section from `bloomLocked()` would drag **WIPE** out from behind the gate as a
side effect, and nothing today needs a destructive button promoted. Option B
moves exactly one button.

It's also the better model: that card's tooltip already says it's the only save
that survives storage resets. Backup out and restore in belong in the same
place, ungated, matching the IMPORT the storage-reset banner already offers.

Right now: backup out is free, restore in is mostly paid. That's backwards, and
it's a bug, not a tier decision.

---

## EXPLICITLY NOT DOING

- **No `bloomstudioGetTier()`.** I floated it; it's redundant.
  `initEntitlement()` already does this job and "no session → fully unlocked"
  is exactly right. One tier system, yours.
- **No standalone build.** Parked. Big sprites in a downloaded HTML file
  wouldn't escape the ~5MB localStorage cap anyway — that's a Tauri promise,
  not a download promise.
- **No new storage popup.** `storageNotice` already exists and already points
  at EXPORT rather than SAVE, which is correct. Don't build a second one.
- **No sprite cap or storage meter yet.** Agreed at 64×64 and a meter for
  everyone, but they come after slots are safe. Next spec.

---

## OPEN QUESTION FOR YOU

Free = 1 named slot, but the engine ships 10 and existing filled slots keep
loading regardless (your word: fencing). So a free user with 4 slots already
filled locally keeps all 4 working, and gets exactly 1 backed up.

**Which one?** Options: lowest-numbered, most-recently-saved, or let them pick.
Whichever is least surgery in `projSlots`. If you have a strong read, take it —
you know that UI and we don't.

---

## THE FRAME

This isn't "$5 for more room." It's:

> **Free: 1 slot, backed up. Paid: 10 slots, all backed up.**

$5 buys *your work is safe*, which is true, and it's the thing two days of
July 15-16 proved people actually need. Free users are still strictly better
off than today, where nobody's slots are backed up at all.
