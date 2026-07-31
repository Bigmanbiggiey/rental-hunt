-- Sprint 7 (Administration) migration.
--
-- Scope: `property_verifications` (database.md §5.15) and `activity_logs`
-- (database.md §5.14) — the two tables Sprint 6's migration explicitly left
-- for this sprint — plus `set_property_verification()`, the moderator/admin
-- half of AGENT-007 that Sprint 6's `submit_property_for_verification()` was
-- deliberately built narrower than. Also adds the five trigger-based
-- `activity_logs` event types `database.md` §11 already specifies
-- (`property.created`/`updated`/`availability_changed`,
-- `viewing.booked`/`status_changed`, `user.registered`) so the audit log
-- actually has real data to show for this sprint's DoD ("view a basic
-- activity log filtered by entity").
--
-- Deliberately NOT created here (per the approved Sprint 7 plan's Open
-- Questions/Assumptions):
--   1. `agency-logos` Storage bucket/upload UI — the DoD says "create a new
--      agency," not "upload a logo"; `logoUrl` stays a plain optional text
--      field on the admin form.
--   2. A new `RH00N` custom errcode for "reason required when rejecting" —
--      that case already raises a standard `23514` (check_violation), which
--      already maps to VALIDATION_ERROR. `P0002` (no_data_found, a standard
--      PL/pgSQL SQLSTATE) is added to the frontend's error map instead, for
--      `set_property_verification()`'s own "property not found" case.
--   3. Two separate admin/moderator route groups — a single shared `/admin`
--      shell, gated `allowedRoles={['moderator','admin']}`, with per-page
--      role filtering underneath (mirrors ProtectedRoute's existing
--      "RLS is the real boundary" philosophy).
--   4. `user.login` activity-log event — explicitly documented (database.md
--      §11) as an application-layer call from the auth Service, not a DB
--      trigger; a materially different, auth-flow-touching change, deferred
--      as its own follow-up rather than bundled in here.
--   5. Admin RLS on `profiles`/`agencies`/`properties` — already fully
--      implemented in the Sprint 2/3 migrations (verified by reading them
--      directly before writing this file); nothing to add here.

-- ── property_verifications (database.md §5.15) ──────────────────────────────

create table public.property_verifications (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  previous_status public.verification_status,
  new_status public.verification_status not null,
  reviewed_by uuid not null references public.profiles (id) on delete restrict,
  reason text,
  created_at timestamptz not null default now()
);

create index property_verifications_property_id_idx on public.property_verifications (property_id);
create index property_verifications_reviewed_by_idx on public.property_verifications (reviewed_by);
create index property_verifications_created_at_idx on public.property_verifications (created_at);

alter table public.property_verifications enable row level security;

grant select on public.property_verifications to authenticated;
grant select on public.property_verifications to service_role;
-- Deliberately no insert/update/delete grant for any client role, including
-- admin — set_property_verification() below is the sole write path
-- (security definer, runs as the table owner), mirroring
-- property_verifications' own database.md §5.15 write-path note.

create policy "property_verifications_select_agent_own_agency" on public.property_verifications
  for select to authenticated using (
    public.current_role() = 'agent' and exists (
      select 1 from public.properties p
      where p.id = property_verifications.property_id
        and p.agency_id = public.current_agency_id()
    )
  );

create policy "property_verifications_select_moderator_admin" on public.property_verifications
  for select using (public.current_role() in ('moderator', 'admin'));

-- ── activity_logs (database.md §5.14) ────────────────────────────────────────

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_logs_entity_idx on public.activity_logs (entity_type, entity_id);
create index activity_logs_actor_id_idx on public.activity_logs (actor_id);
create index activity_logs_action_idx on public.activity_logs (action);
create index activity_logs_created_at_idx on public.activity_logs (created_at);

alter table public.activity_logs enable row level security;

grant select, delete on public.activity_logs to authenticated;
grant select, insert, delete on public.activity_logs to service_role;
-- No client insert grant — every row is written by a security definer
-- trigger function (below) or the set_property_verification() RPC, never a
-- direct client INSERT.

create policy "activity_logs_select_moderator_admin" on public.activity_logs
  for select using (public.current_role() in ('moderator', 'admin'));

create policy "activity_logs_delete_admin" on public.activity_logs
  for delete using (public.current_role() = 'admin');

-- ── set_property_verification() RPC (database.md §9, api-design.md §6.9) ────
-- The moderator/admin half of AGENT-007. Mirrors
-- submit_property_for_verification()'s conventions exactly: `is distinct
-- from` guards (never `<>`/`=` — current_role() returns NULL outside a real
-- auth context, and a bare `<>` comparison against NULL is itself NULL,
-- which plpgsql's `if` silently treats as false, the fail-open bug Sprint 6
-- already found and fixed once), the same
-- set_config('app.bypass_verification_authority', ...) call immediately
-- before the UPDATE (the trigger's bypass check already covers this GUC —
-- no trigger change needed), `security definer set search_path = public`.

create or replace function public.set_property_verification(
  property_id uuid,
  new_status public.verification_status,
  reason text default null
) returns public.property_verifications
language plpgsql security definer set search_path = public as $$
declare
  v_previous_status public.verification_status;
  v_verification public.property_verifications;
begin
  if public.current_role() is distinct from 'moderator'
     and public.current_role() is distinct from 'admin' then
    raise exception 'You do not have permission to verify properties.' using errcode = '42501';
  end if;

  if new_status = 'rejected' and (reason is null or btrim(reason) = '') then
    raise exception 'A reason is required when rejecting a listing.' using errcode = '23514';
  end if;

  select p.verification_status into v_previous_status
    from public.properties p where p.id = property_id;

  if not found then
    raise exception 'Property not found.' using errcode = 'P0002';
  end if;

  perform set_config('app.bypass_verification_authority', 'true', true);

  -- last_verified_at/verified_by cache "when/by whom was this last
  -- *verified*" (database.md §5.8) — only touched on an actual approval, so
  -- a reject or a moderator resetting a listing back to pending_verification
  -- never clobbers the last real verification's record.
  update public.properties
    set verification_status = new_status,
        verified_by = case when new_status = 'verified' then auth.uid() else verified_by end,
        last_verified_at = case when new_status = 'verified' then now() else last_verified_at end
    where id = property_id;

  -- database.md §11's Tracked Events table is explicit that verification
  -- changes are deliberately NOT also logged as a generic activity_logs row
  -- ("the one MVP event type that bypasses activity_logs entirely, to avoid
  -- maintaining the same fact in two places") — property_verifications
  -- above is already the authoritative, typed record of this event.
  insert into public.property_verifications (property_id, previous_status, new_status, reviewed_by, reason)
  values (property_id, v_previous_status, new_status, auth.uid(), reason)
  returning * into v_verification;

  return v_verification;
end;
$$;

grant execute on function public.set_property_verification(uuid, public.verification_status, text) to authenticated;

-- ── activity_logs population: property/viewing_request/profile triggers ────
-- database.md §11's five trigger-based MVP event types. `auth.uid()` inside
-- an AFTER trigger fired by an ordinary authenticated PostgREST request
-- correctly resolves the acting user; rows inserted by supabase/seed.sql
-- (raw SQL, no JWT context) resolve NULL, which activity_logs.actor_id is
-- nullable specifically to allow (database.md §5.14's own
-- system-generated-event rationale).

create or replace function public.log_property_activity() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
    values (auth.uid(), 'property.created', 'property', new.id, '{}'::jsonb);
    return new;
  end if;

  -- Excludes pure view_count bumps (increment_property_view_count only ever
  -- touches that one column) and verification-column changes (already
  -- logged by set_property_verification()/submit_property_for_verification()
  -- themselves) — guarded on a real field delta, not "any UPDATE happened."
  if new.availability_status is distinct from old.availability_status then
    insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
    values (
      auth.uid(), 'property.availability_changed', 'property', new.id,
      jsonb_build_object('from', old.availability_status, 'to', new.availability_status)
    );
  end if;

  if row(new.title, new.description, new.rent_amount, new.deposit_amount, new.bedrooms, new.bathrooms)
     is distinct from
     row(old.title, old.description, old.rent_amount, old.deposit_amount, old.bedrooms, old.bathrooms) then
    insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
    values (auth.uid(), 'property.updated', 'property', new.id, '{}'::jsonb);
  end if;

  return new;
end;
$$;

create trigger log_property_activity_trigger
  after insert or update on public.properties
  for each row execute function public.log_property_activity();

create or replace function public.log_viewing_request_activity() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
    values (auth.uid(), 'viewing.booked', 'viewing_request', new.id, '{}'::jsonb);
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
    values (
      auth.uid(), 'viewing.status_changed', 'viewing_request', new.id,
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;

  return new;
end;
$$;

create trigger log_viewing_request_activity_trigger
  after insert or update on public.viewing_requests
  for each row execute function public.log_viewing_request_activity();

create or replace function public.log_profile_registration() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
  values (new.id, 'user.registered', 'profile', new.id, '{}'::jsonb);
  return new;
end;
$$;

create trigger log_profile_registration_trigger
  after insert on public.profiles
  for each row execute function public.log_profile_registration();
