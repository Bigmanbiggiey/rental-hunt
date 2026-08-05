-- Epic 12 (Agency Marketplace) migration — user-stories.md Epic 12,
-- roadmap.md's new Sprint 9 (renumbering Production Launch to Sprint 10).
--
-- Built ahead of FUT-002 ("self-service agency onboarding")/FUT-004's
-- originally-deferred placement (database.md §15, ui-guidelines.md §23), by
-- explicit developer decision (see decisions.md ADR-035) — the project was
-- otherwise paused between Sprint 8 (closed) and the old Sprint 9
-- (Production Launch, not started).
--
-- Scope:
--   1. `agencies` gains `social_links`, `onboarding_status`, `applied_by`,
--      `rejection_reason` — a self-registered agency starts
--      `onboarding_status = 'pending_review'`/`is_active = false`; existing
--      admin-created agencies backfill to `onboarding_status = 'approved'`
--      via the column default, unchanged otherwise.
--   2. `agencies_insert_self` RLS policy + `enforce_agency_onboarding_status()`
--      trigger — a customer may INSERT a new agency row for themselves, but
--      the trigger (not the client) decides the actual onboarding/visibility
--      values, mirroring `enforce_verification_authority()`'s "the trigger
--      is the real backstop" precedent (database.md §9).
--   3. `approve_agency_application()` / `reject_agency_application()` —
--      admin-only (matching every other `agencies_*_admin` policy already
--      being admin-only, not moderator — Agencies has never been part of
--      the moderator route group). Approve atomically flips the applicant's
--      `profiles.role` to 'agent' and inserts their `agents` row — closing a
--      real, pre-existing gap: no path anywhere in this codebase creates an
--      `agents` row today, `agents_insert_admin` is the only insert policy
--      and nothing has ever called it from the frontend.
--   4. `reviews` (promotes database.md §15's long-deferred sketch) — one
--      review per completed `viewing_request`, `agency_id`/`agent_id`/
--      `property_id` all *trigger-derived*, never client-supplied, per this
--      project's own "any agent-facing/trust-facing query needs an explicit
--      backstop, RLS/client input alone isn't reliably sufficient" lesson
--      (database.md §9, lines ~795 and ~814).
--   5. `agency_rating_summary`/`agent_rating_summary` views — plain
--      (`security_invoker`) aggregates over the now-public `reviews` table;
--      no elevated access needed, unlike `agent_directory`.
--
-- Deliberately NOT done here: a moderator-facing agency-application queue —
-- Agencies management has always been admin-only in this codebase (the
-- moderator dashboard route group has never included it), so the new
-- application review UI is folded into the existing admin-only Agencies
-- page rather than opening a new moderator surface.

-- ── agencies: self-service onboarding columns ────────────────────────────────

create type public.agency_onboarding_status as enum ('pending_review', 'approved', 'rejected');

alter table public.agencies
  add column social_links jsonb not null default '{}'::jsonb,
  add column onboarding_status public.agency_onboarding_status not null default 'approved',
  add column applied_by uuid references public.profiles (id) on delete set null,
  add column rejection_reason text;

create index agencies_onboarding_status_idx on public.agencies (onboarding_status);

-- Self-service INSERT: table-level grant already exists
-- (`grant insert, update, delete on public.agencies to authenticated`, Sprint
-- 3 migration) — narrowed per-policy, same as every other agencies policy.
create policy "agencies_insert_self" on public.agencies
  for insert to authenticated with check (
    public.current_role() = 'customer' and applied_by = auth.uid()
  );

-- An applicant needs to see their own application regardless of
-- is_active/onboarding_status (to show "pending review"/"rejected: reason"
-- on their own status page) — and, found via real integration testing
-- against the local stack, this is also load-bearing for the INSERT itself:
-- PostgREST's `.insert().select()` compiles to `INSERT ... RETURNING`, and
-- Postgres additionally enforces the table's SELECT policies against a
-- RETURNING projection, not just the INSERT policy's WITH CHECK — without
-- this policy, a self-service insert-with-.select() call fails RLS even
-- though the plain INSERT (no RETURNING) would have succeeded.
create policy "agencies_select_own_applicant" on public.agencies
  for select to authenticated using (applied_by = auth.uid());

-- The trigger, not the client, decides what a self-service application
-- actually starts as — a malicious client could otherwise INSERT with
-- onboarding_status='approved'/is_active=true directly. Admin's own existing
-- create flow (AdminAgencyFormDialog) passes straight through unchanged, and
-- so does any raw-SQL/no-auth-context insert (supabase/seed.sql, migrations)
-- — current_role() reads NULL there (no auth.uid() session), which is
-- deliberately treated as "leave it alone," not forced into the self-service
-- path; only a real, authenticated 'customer' session is narrowed. (Found
-- during local `db reset` verification: an earlier draft bypassed only for
-- 'admin'/service_role and force-narrowed everything else, which silently
-- flipped every seeded agency to pending_review/is_active=false — this
-- explicit customer-only check is the fix.)
create function public.enforce_agency_onboarding_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.current_role() is distinct from 'customer' then
    return new;
  end if;

  new.onboarding_status := 'pending_review';
  new.is_active := false;
  new.applied_by := auth.uid();
  return new;
end;
$$;

create trigger enforce_agency_onboarding_status_trigger
  before insert on public.agencies
  for each row execute function public.enforce_agency_onboarding_status();

-- ── approve/reject agency applications (admin only) ──────────────────────────
-- Mirrors set_property_verification()'s conventions: `is distinct from`
-- guards, security definer, a required reason on reject mapped to the
-- existing 23514 -> VALIDATION_ERROR path (no new errcode needed for that
-- case, same call Sprint 7 already made), RH002 (INVALID_STATE_TRANSITION)
-- reused for "this application isn't pending anymore" rather than minting a
-- new code for an identical shape of error.

create function public.approve_agency_application(p_agency_id uuid) returns public.agencies
language plpgsql security definer set search_path = public as $$
declare
  v_agency public.agencies;
begin
  if public.current_role() is distinct from 'admin' then
    raise exception 'You do not have permission to approve agency applications.' using errcode = '42501';
  end if;

  update public.agencies
    set onboarding_status = 'approved', is_active = true
    where id = p_agency_id and onboarding_status = 'pending_review'
    returning * into v_agency;

  if not found then
    raise exception 'This application is not pending review.' using errcode = 'RH002';
  end if;

  -- Only promotes if still a customer — a no-op guard, not expected to
  -- matter in practice, but avoids clobbering a role that changed for some
  -- other reason between application and review.
  update public.profiles set role = 'agent' where id = v_agency.applied_by and role = 'customer';

  insert into public.agents (profile_id, agency_id)
  values (v_agency.applied_by, p_agency_id)
  on conflict (profile_id) do nothing;

  insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'agency.application_approved', 'agency', p_agency_id, jsonb_build_object('applicant_id', v_agency.applied_by));

  return v_agency;
end;
$$;

grant execute on function public.approve_agency_application(uuid) to authenticated;

create function public.reject_agency_application(p_agency_id uuid, p_reason text default null) returns public.agencies
language plpgsql security definer set search_path = public as $$
declare
  v_agency public.agencies;
begin
  if public.current_role() is distinct from 'admin' then
    raise exception 'You do not have permission to reject agency applications.' using errcode = '42501';
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'A reason is required when rejecting an application.' using errcode = '23514';
  end if;

  update public.agencies
    set onboarding_status = 'rejected', rejection_reason = p_reason
    where id = p_agency_id and onboarding_status = 'pending_review'
    returning * into v_agency;

  if not found then
    raise exception 'This application is not pending review.' using errcode = 'RH002';
  end if;

  insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'agency.application_rejected', 'agency', p_agency_id, jsonb_build_object('reason', p_reason));

  return v_agency;
end;
$$;

grant execute on function public.reject_agency_application(uuid, text) to authenticated;

-- ── reviews (database.md §15's long-deferred sketch, now built) ─────────────

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  viewing_request_id uuid not null references public.viewing_requests (id) on delete cascade,
  -- agency_id/agent_id/property_id are trigger-derived below, never
  -- client-supplied — see enforce_review_eligibility().
  agency_id uuid not null references public.agencies (id) on delete cascade,
  agent_id uuid references public.agents (id) on delete set null,
  property_id uuid references public.properties (id) on delete set null,
  rating smallint not null,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint reviews_viewing_request_id_key unique (viewing_request_id),
  constraint reviews_rating_check check (rating between 1 and 5)
);

create index reviews_agency_id_idx on public.reviews (agency_id) where deleted_at is null;
create index reviews_agent_id_idx on public.reviews (agent_id) where deleted_at is null;
create index reviews_customer_id_idx on public.reviews (customer_id);

create trigger set_reviews_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- The real eligibility gate: a review may only be created/kept pointed at a
-- viewing_request that (a) belongs to the reviewing customer and (b) is
-- 'completed' — enforced here, not just in the Service layer, per this
-- project's own documented lesson that a trigger backstop is needed
-- wherever a write's correctness can't be guaranteed by RLS/client input
-- alone (database.md §9, prevent_booking_unavailable_property() precedent).
-- Also derives agency_id/agent_id/property_id server-side so a client only
-- ever needs to submit { viewing_request_id, rating, comment } — nothing
-- trust-relevant is client-suppliable.
create function public.enforce_review_eligibility() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_vr public.viewing_requests%rowtype;
begin
  if tg_op = 'UPDATE' and (
    new.viewing_request_id is distinct from old.viewing_request_id
    or new.customer_id is distinct from old.customer_id
  ) then
    raise exception 'A review''s viewing request and author cannot be changed.' using errcode = '42501';
  end if;

  select * into v_vr from public.viewing_requests where id = new.viewing_request_id;

  if not found then
    raise exception 'Viewing request not found.' using errcode = 'P0002';
  end if;

  if v_vr.customer_id is distinct from new.customer_id then
    raise exception 'You can only review your own viewing requests.' using errcode = '42501';
  end if;

  if v_vr.status is distinct from 'completed' then
    raise exception 'You can only review a completed viewing.' using errcode = 'RH003';
  end if;

  new.agency_id := (select agency_id from public.properties where id = v_vr.property_id);
  new.agent_id := v_vr.agent_id;
  new.property_id := v_vr.property_id;

  return new;
end;
$$;

create trigger enforce_review_eligibility_trigger
  before insert or update on public.reviews
  for each row execute function public.enforce_review_eligibility();

alter table public.reviews enable row level security;

grant select on public.reviews to anon, authenticated;
grant insert, update on public.reviews to authenticated; -- narrowed per-policy; no delete grant anywhere — moderation is a soft-delete (admin UPDATE), matching this schema's soft-delete principle (database.md §2)
grant select, insert, update, delete on public.reviews to service_role;

-- reviews: public trust signal — every non-deleted review is guest-visible,
-- same visibility shape as verified properties.
create policy "reviews_select_all" on public.reviews
  for select using (deleted_at is null);

create policy "reviews_select_admin" on public.reviews
  for select using (public.current_role() = 'admin');

create policy "reviews_insert_own_customer" on public.reviews
  for insert to authenticated with check (
    public.current_role() = 'customer' and customer_id = auth.uid()
  );

create policy "reviews_update_own_customer" on public.reviews
  for update to authenticated
  using (public.current_role() = 'customer' and customer_id = auth.uid())
  with check (public.current_role() = 'customer' and customer_id = auth.uid());

create policy "reviews_update_admin" on public.reviews
  for update using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- ── rating summary views ─────────────────────────────────────────────────────
-- Plain (security_invoker) aggregates — unlike agent_directory, reviews is
-- already fully public-readable, so no elevated access is needed here.

create view public.agency_rating_summary
  with (security_invoker = true) as
  select agency_id, avg(rating)::numeric(3, 2) as average_rating, count(*) as review_count
  from public.reviews
  where deleted_at is null
  group by agency_id;

create view public.agent_rating_summary
  with (security_invoker = true) as
  select agent_id, avg(rating)::numeric(3, 2) as average_rating, count(*) as review_count
  from public.reviews
  where deleted_at is null and agent_id is not null
  group by agent_id;

grant select on public.agency_rating_summary to anon, authenticated;
grant select on public.agent_rating_summary to anon, authenticated;
