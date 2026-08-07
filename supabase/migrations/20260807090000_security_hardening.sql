-- Security hardening — findings from the Sprint 10 whole-project security
-- review (decisions.md ADR-038). Two real RLS gaps and one missing DB
-- backstop, all in the same family: an UPDATE policy correctly checks *who
-- owns the row being touched* but never constrains *which identity/
-- foreign-key columns that row is allowed to end up pointing at* after the
-- write. This mirrors the exact problem `prevent_self_role_change()`
-- (auth_foundation.sql) already solved for `profiles.role` and
-- `enforce_verification_authority()` (property_discovery.sql, widened
-- agent_dashboard.sql) already solved for `properties.verification_status`
-- — RLS is row-level only, so a column that must stay fixed across an
-- otherwise-legitimate UPDATE needs a trigger backstop, not a tighter RLS
-- clause. Forward-only (database.md §13) — every object below is new,
-- nothing from an earlier migration is edited.
--
-- Scope:
--   1. `agents.agency_id` (and every other non-self-service column) is now
--      immutable via a trigger — closes an agent-role account's ability to
--      PATCH their own `agents` row to reassign themselves into any other
--      agency, taking over its properties/images/storage/profile. Narrows
--      self-service UPDATE to exactly what database.md §9's Policy Summary
--      already documented as the intended scope (`bio`, `job_title`) —
--      the RLS policy had simply never enforced that documented limit.
--   2. `viewing_requests.customer_id`/`property_id`/`agent_id` are now
--      immutable via a trigger — closes an agent-role account's ability to
--      rewrite `customer_id` on a viewing request they control and use the
--      resulting row to read an arbitrary profile (including admin/
--      moderator) via `profiles_select_own_customers_by_agent`
--      (agent_dashboard.sql).
--   3. `viewing_requests.status` now follows an explicit forward-only state
--      machine via a trigger, matching exactly the transition set the
--      Repository layer already enforces (viewing-request.repository.ts:
--      confirm/reschedule/cancel/complete/no-show) — previously RLS placed
--      no restriction at all on the agent-side status transition, so this
--      was a Repository/Service-layer-only rule with no DB backstop,
--      contrary to this project's own "RLS is the sole authority, a
--      Service-layer check is never the real boundary" model
--      (CLAUDE.md §12). Also closes the specific gap that let an agent
--      flip a request straight to 'completed' with no `confirmed` step.
--      Deliberately does NOT also gate on `requested_date`/`requested_time`
--      having passed — that would additionally require disallowing a
--      same-day `requested_time` already in the past at booking time to be
--      airtight, a real behavior change to the booking flow outside a
--      security migration's scope. See decisions.md ADR-038's Consequences
--      section for the acknowledged residual review-fraud risk this leaves
--      open (rated Low, self-serving fraud bounded to an agent's own data,
--      not a cross-tenant breach).

-- ── 1. agents: lock every column except bio/job_title on self-update ────────
-- database.md §9's Policy Summary already documented the agent's own-row
-- UPDATE as scoped to `bio`/`job_title` — this trigger is the first thing
-- to actually enforce that scope; `agents_update_own_agent`
-- (property_discovery.sql) never did.

create function public.prevent_agent_self_update_overreach() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.profile_id is distinct from old.profile_id
     or new.agency_id is distinct from old.agency_id
     or new.is_active is distinct from old.is_active
     or new.deleted_at is distinct from old.deleted_at then
    raise exception 'An agent may only update their own bio and job title.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger prevent_agent_self_update_overreach_trigger
  before update on public.agents
  for each row execute function public.prevent_agent_self_update_overreach();

-- ── 2. viewing_requests: lock identity columns on every UPDATE ──────────────
-- Neither `viewing_requests_cancel_own_customer` nor
-- `viewing_requests_update_own_agent` (customer_experience.sql) ever needed
-- to change who/what a viewing request is about — only `status` and its
-- timestamp/notes/date/time fields legitimately change after INSERT.

create function public.prevent_viewing_request_identity_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.customer_id is distinct from old.customer_id
     or new.property_id is distinct from old.property_id
     or new.agent_id is distinct from old.agent_id then
    raise exception 'A viewing request''s customer, property, and agent cannot be changed.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger prevent_viewing_request_identity_change_trigger
  before update on public.viewing_requests
  for each row execute function public.prevent_viewing_request_identity_change();

-- ── 3. viewing_requests: forward-only status state machine ──────────────────
-- Exactly the transition set viewing-request.repository.ts already enforces
-- client-side (confirm: pending→confirmed; cancel: pending/confirmed→
-- cancelled; complete: confirmed→completed; markNoShow: confirmed→
-- no_show) — codified here as the real backstop. `new.status = old.status`
-- is always allowed (covers reschedule, notes, and any other non-status
-- update).

create function public.enforce_viewing_request_status_transition() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role' or new.status = old.status then
    return new;
  end if;

  if (old.status, new.status) not in (
    ('pending', 'confirmed'),
    ('pending', 'cancelled'),
    ('confirmed', 'cancelled'),
    ('confirmed', 'completed'),
    ('confirmed', 'no_show')
  ) then
    raise exception 'Invalid viewing request status transition: % -> %.', old.status, new.status
      using errcode = 'RH004';
  end if;

  return new;
end;
$$;

create trigger enforce_viewing_request_status_transition_trigger
  before update on public.viewing_requests
  for each row execute function public.enforce_viewing_request_status_transition();
