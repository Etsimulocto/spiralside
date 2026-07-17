-- ============================================================
-- SPIRALSIDE — BLOOM SLOTS MIGRATION
-- Purpose: make the 10 BloomStudio save slots cloud-backed,
--          and add the entitlement column the engine already reads.
-- Author:  Nimbis — July 17 2026
-- Target:  Supabase project qfawusrelwthxabfbglg
--
-- WHY THIS EXISTS
--   ENGINE 2.2.1 stores each save file as its own localStorage key
--   (bloomstudio.v1:proj:<n>, n = 1..10). Only the autosave key
--   (bloomstudio.v1) is cloud-backed today. A browser storage wipe —
--   the exact Edge clear-on-close event that started the July 15-16
--   hunt — destroys all 10 slots with no cloud copy to restore from.
--   This migration gives every slot its own row.
--
-- DESIGN NOTES
--   slot 0      = the autosave (bloomstudio.v1). Invisible plumbing.
--                 ALWAYS syncs, for free and paid alike. Never capped.
--                 The existing single row becomes slot 0 automatically
--                 via the DEFAULT, so nothing moves and nothing is lost.
--   slot 1..10  = the named save files the user actually sees in the
--                 projSlots UI. These are what the $5 buys.
--
--   Free  = 1 named slot  (+ slot 0 autosave, always)
--   Paid  = 10 named slots (+ slot 0 autosave, always)
--
--   Slots are the ONLY server-enforceable limit in this design.
--   Rooms and sprite size live in the engine, in the user's browser,
--   and are therefore soft by nature. That is accepted, not a defect.
--
-- SAFETY
--   Every statement is additive or a constraint swap. No DROP of any
--   column, row, or table. The existing cloud row survives untouched.
--   Archive, never delete.
-- ============================================================


-- ── 1. ENTITLEMENT COLUMN ────────────────────────────────────
-- ENGINE 2.2.1's initEntitlement() already reads
-- user_usage.bloomstudio_paid — but the column does not exist.
-- The gate is currently live against a phantom column and
-- window.bloomstudioUnlock() has nothing to write to.
--
-- Name matches the SHIPPED ENGINE EXACTLY. Do not rename to
-- bloom_paid or anything tidier — the engine is the source of truth
-- here and it is already in the wild as build 70.
alter table public.user_usage
  add column if not exists bloomstudio_paid boolean not null default false;

-- Human-readable note for whoever reads this schema in six months.
comment on column public.user_usage.bloomstudio_paid is
  '$5 one-time lifetime BloomStudio unlock. Read by ENGINE initEntitlement(). '
  'Deliberately separate from is_paid (chat credits) and storage_plan '
  '(subscription, expires). This one NEVER expires — same pattern as forge_credits.';


-- ── 2. SLOT COLUMN ───────────────────────────────────────────
-- DEFAULT 0 is what makes this migration safe: the one existing row
-- silently becomes slot 0 (the autosave), which is exactly what it
-- already contains. Verified July 17 — that row's top-level keys are
-- a flat project snapshot (rooms, sprites, saveSlot...), with no
-- proj:1..10 container anywhere in it.
alter table public.bloom_projects
  add column if not exists slot smallint not null default 0;

-- Range guard. 0 = autosave, 1..10 = the named slots the engine offers.
-- If Design ever ships more than 10 slots, this constraint is the
-- single place that needs to change.
alter table public.bloom_projects
  drop constraint if exists bloom_projects_slot_range;

alter table public.bloom_projects
  add constraint bloom_projects_slot_range
  check (slot >= 0 and slot <= 10);

comment on column public.bloom_projects.slot is
  '0 = autosave (bloomstudio.v1), always synced, never counted against the cap. '
  '1..10 = named save files (bloomstudio.v1:proj:<n>) shown in the projSlots UI.';


-- ── 3. PRIMARY KEY SWAP ──────────────────────────────────────
-- Verified live before writing this:
--   bloom_projects_pkey          PRIMARY KEY (user_id)
--   bloom_projects_user_id_fkey  FOREIGN KEY (user_id) -> auth.users ON DELETE CASCADE
-- The FK is a SEPARATE constraint, so dropping the PK does not touch
-- the cascade. Confirmed via pg_constraint, not assumed.
alter table public.bloom_projects
  drop constraint bloom_projects_pkey;

-- One row per user per slot. This is what turns "10 slots" from a
-- client-side courtesy into a real, countable, server-side fact.
alter table public.bloom_projects
  add constraint bloom_projects_pkey primary key (user_id, slot);


-- ── 4. ENGINE VERSION BACKFILL ───────────────────────────────
-- The live row has engine_version = null because the cloud hooks never
-- pass it. Design confirmed the omission is on the Spiralside side.
-- Stamp the existing row so save provenance starts somewhere honest.
-- Only touches rows that are currently null — never overwrites a real value.
update public.bloom_projects
   set engine_version = '2.2.1-backfill'
 where engine_version is null;


-- ── 5. SLOT CAP TRIGGER ──────────────────────────────────────
-- The one genuinely un-spoofable limit in the whole tier design.
-- A user can open devtools and give themselves 100 rooms; they cannot
-- give themselves an eleventh row in this table.
create or replace function public.bloom_enforce_slot_cap()
returns trigger
language plpgsql
security definer          -- needs to read user_usage past that table's RLS
set search_path = public  -- pin search_path: security definer without this is a known footgun
as $$
declare
  v_paid boolean;  -- does this user own the $5 lifetime unlock
  v_cap  int;      -- how many named slots they are entitled to
  v_used int;      -- how many named slots they already occupy
begin
  -- Slot 0 is the autosave. It is the safety net that shipped on
  -- July 16 and it must ALWAYS sync, for everyone, forever.
  -- Never capped, never counted, no exceptions.
  if new.slot = 0 then
    return new;
  end if;

  -- Read the entitlement. coalesce twice on purpose: the user_usage
  -- row may not exist yet for a brand-new account, and the column
  -- itself could be null on a row created before this migration.
  select coalesce(u.bloomstudio_paid, false)
    into v_paid
    from public.user_usage u
   where u.user_id = new.user_id;

  v_cap := case when coalesce(v_paid, false) then 10 else 1 end;

  -- Count OTHER occupied named slots. Excluding new.slot is what makes
  -- re-saving an existing slot work: Supabase upsert is
  -- INSERT ... ON CONFLICT DO UPDATE, and the BEFORE INSERT trigger
  -- fires even when the statement resolves to an UPDATE. Without the
  -- exclusion, a free user could never overwrite their own slot 1.
  select count(*)
    into v_used
    from public.bloom_projects b
   where b.user_id = new.user_id
     and b.slot >= 1
     and b.slot <> new.slot;

  if v_used >= v_cap then
    -- Message is parsed by the engine to decide between the upgrade
    -- modal and a generic error. Keep the 'bloom_slot_cap' token stable.
    raise exception 'bloom_slot_cap: % of % named slots used', v_used, v_cap
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists bloom_slot_cap_trg on public.bloom_projects;

-- BEFORE INSERT only. Deliberately NOT before update: an existing slot
-- must always be re-savable even if the cap later shrinks. Additive-only
-- enforcement — we block new slots, we never orphan work already there.
create trigger bloom_slot_cap_trg
  before insert on public.bloom_projects
  for each row
  execute function public.bloom_enforce_slot_cap();


-- ── 6. VERIFICATION ──────────────────────────────────────────
-- Run these by hand after applying. Expected results in comments.
--
-- Existing row survived and became slot 0:
--   select user_id, slot, engine_version, pg_column_size(project_json)
--     from bloom_projects;
--   -> one row, slot = 0, engine_version = '2.2.1-backfill', ~15525 bytes
--
-- New PK is composite:
--   select pg_get_constraintdef(oid) from pg_constraint
--    where conname = 'bloom_projects_pkey';
--   -> PRIMARY KEY (user_id, slot)
--
-- FK cascade untouched:
--   select pg_get_constraintdef(oid) from pg_constraint
--    where conname = 'bloom_projects_user_id_fkey';
--   -> FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
--
-- Entitlement column exists and defaults false:
--   select column_name, data_type, column_default
--     from information_schema.columns
--    where table_name = 'user_usage' and column_name = 'bloomstudio_paid';
--
-- NOTE ON RLS: the four existing owner-only policies on bloom_projects
-- all key off user_id, which is still present and still the leading
-- column of the PK. They keep working unchanged. Verify anyway:
--   select policyname, cmd, qual from pg_policies
--    where tablename = 'bloom_projects';
-- ============================================================
