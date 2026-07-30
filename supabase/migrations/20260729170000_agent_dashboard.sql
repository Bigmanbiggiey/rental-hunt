-- Sprint 6 (Agent Dashboard) migration.
--
-- Scope: the `property-images` Storage bucket + policies (AGENT-005), the
-- submit_property_for_verification() RPC (AGENT-007's agent-facing half —
-- the moderator/admin approve/reject action and set_property_verification()
-- itself remain Sprint 7 scope, untouched here), the
-- increment_property_view_count() RPC (AGENT-008, deferred twice already in
-- Sprints 3/4), and one new customer-visibility policy on `profiles` so an
-- agent's booking queue can actually show who booked (BOOK-001).
--
-- Deliberately NOT created here: `agency-logos`/`avatars` buckets,
-- `entities/agency`-backing schema, `property_verifications` (Sprint 7),
-- any property-reassignment mechanism.

-- ── AGENT-005: property-images Storage bucket ────────────────────────────────
-- database.md §10. Public read (listings must be guest-visible); write
-- restricted to the agent whose agency owns the property at the {property_id}
-- path segment, or an admin.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images', 'property-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "property_images_storage_select_public" on storage.objects
  for select using (bucket_id = 'property-images');

create policy "property_images_storage_insert_agent_own_agency" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'property-images'
    and public.current_role() = 'agent'
    and exists (
      select 1 from public.properties p
      where p.id::text = (storage.foldername(name))[1]
        and p.agency_id = public.current_agency_id()
    )
  );

create policy "property_images_storage_update_agent_own_agency" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'property-images'
    and public.current_role() = 'agent'
    and exists (
      select 1 from public.properties p
      where p.id::text = (storage.foldername(name))[1]
        and p.agency_id = public.current_agency_id()
    )
  )
  with check (
    bucket_id = 'property-images'
    and public.current_role() = 'agent'
    and exists (
      select 1 from public.properties p
      where p.id::text = (storage.foldername(name))[1]
        and p.agency_id = public.current_agency_id()
    )
  );

create policy "property_images_storage_delete_agent_own_agency" on storage.objects
  for delete to authenticated using (
    bucket_id = 'property-images'
    and public.current_role() = 'agent'
    and exists (
      select 1 from public.properties p
      where p.id::text = (storage.foldername(name))[1]
        and p.agency_id = public.current_agency_id()
    )
  );

create policy "property_images_storage_manage_admin" on storage.objects
  for all to authenticated
  using (bucket_id = 'property-images' and public.current_role() = 'admin')
  with check (bucket_id = 'property-images' and public.current_role() = 'admin');

-- ── AGENT-007 (agent-facing half): submit_property_for_verification ─────────
-- database.md §9 already documents set_property_verification() as the *sole*
-- writer of verification_status/verified_by/last_verified_at, restricted to
-- moderator/admin — that RPC and property_verifications remain Sprint 7
-- scope, untouched. But nothing in the current schema lets an agent submit
-- their own unverified/rejected listing for review in the first place
-- (api-design.md §6.9 explicitly scopes verification writes to
-- Moderator/Admin only). This RPC closes exactly that one narrow gap: it
-- transitions unverified/rejected -> pending_verification only, never
-- touches verified_by/last_verified_at, and never writes
-- property_verifications (it doesn't exist yet).
--
-- Real wrinkle: auth.role() reads a JWT-claim GUC, not the actual executing
-- Postgres role, so this being `security definer` does NOT by itself bypass
-- enforce_verification_authority() (whose only existing bypass check is
-- `auth.role() = 'service_role'`) — a security-definer function called by an
-- authenticated agent still has auth.role() = 'authenticated' inside it.
-- Resolved via a transaction-local custom GUC the trigger also checks (see
-- enforce_verification_authority() below) — not settable by any ordinary
-- client call through PostgREST, and auto-resets at transaction end.
-- Recorded as ADR-029 (decisions.md) given this narrows a Sprint-3
-- security-critical trigger.

create or replace function public.submit_property_for_verification(p_property_id uuid)
returns public.properties
language plpgsql security definer set search_path = public as $$
declare
  v_agency_id uuid;
  v_status public.verification_status;
  v_property public.properties;
begin
  select agency_id, verification_status into v_agency_id, v_status
    from public.properties where id = p_property_id;

  -- Not distinguishing "doesn't exist" from "not yours" — same non-leaking
  -- reasoning already established for viewing_requests_cancel_own_customer's
  -- 0-row-affected case (api-design.md §15.3).
  --
  -- `is distinct from`, not `<>` — current_role()/current_agency_id() both
  -- return NULL outside a real agent's auth context, and NULL <> 'agent' is
  -- NULL (not true), which plpgsql's `if` silently treats as false. That
  -- fail-open bug was caught testing this function directly as a raw
  -- session with no JWT context: the `<>` guard let the update through.
  -- `is distinct from` treats NULL as a real, comparable value instead.
  if v_agency_id is null
     or public.current_role() is distinct from 'agent'
     or v_agency_id is distinct from public.current_agency_id() then
    raise exception 'You do not have permission to submit this property for verification.'
      using errcode = '42501';
  end if;

  if v_status not in ('unverified', 'rejected') then
    raise exception 'This property cannot be submitted for verification from its current status.'
      using errcode = 'RH002';
  end if;

  perform set_config('app.bypass_verification_authority', 'true', true);

  update public.properties
    set verification_status = 'pending_verification'
    where id = p_property_id
    returning * into v_property;

  return v_property;
end;
$$;

grant execute on function public.submit_property_for_verification(uuid) to authenticated;

-- ── enforce_verification_authority(): widened bypass ─────────────────────────
-- Forward-only schema evolution (database.md §13) — a create-or-replace of
-- an existing function, not an edit to the historical migration file that
-- first created it.

create or replace function public.enforce_verification_authority() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role'
     or current_setting('app.bypass_verification_authority', true) = 'true' then
    return new;
  end if;

  if (new.verification_status is distinct from old.verification_status)
     or (new.verified_by is distinct from old.verified_by)
     or (new.last_verified_at is distinct from old.last_verified_at) then
    raise exception 'verification_status/verified_by/last_verified_at can only be changed via set_property_verification() or submit_property_for_verification().';
  end if;
  return new;
end;
$$;

-- ── AGENT-008: increment_property_view_count ─────────────────────────────────
-- Deferred in both Sprint 3 and Sprint 4 ("no PROP-* acceptance criterion
-- needs it, only a future AGENT-008 dashboard story") — this is that story.
-- An RPC, not a guest UPDATE + narrow RLS policy, since RLS can't scope a
-- single column. Called once per PropertyDetailPage mount, fire-and-forget,
-- errors swallowed client-side (api-design.md §6.2).

create or replace function public.increment_property_view_count(p_property_id uuid)
returns void
language sql security definer set search_path = public as $$
  update public.properties set view_count = view_count + 1 where id = p_property_id;
$$;

grant execute on function public.increment_property_view_count(uuid) to anon, authenticated;

-- ── BOOK-001: profiles visibility for an agent's own customers ──────────────
-- The agent's booking queue must show "customer, property, requested
-- date/time, status" (BOOK-001), but profiles' Policy Summary only grants
-- Agent "SELECT own row only" — identical to Customer, meaning an agent has
-- zero access to any customer's profile, including one who booked with them.
-- Additive OR'd SELECT policy widening visibility only into a customer's
-- profile the agent already has a real, existing stake in (mirrors Sprint
-- 5's properties_select_favorited_by_customer shape/rationale exactly).
-- `to authenticated` from the start — the subquery references
-- viewing_requests, and Sprint 5 already learned the hard way that omitting
-- this clause lets the policy apply to anon too, which has zero grant on
-- viewing_requests.

create policy "profiles_select_own_customers_by_agent" on public.profiles
  for select to authenticated using (
    public.current_role() = 'agent' and exists (
      select 1 from public.viewing_requests vr
      where vr.customer_id = profiles.id and vr.agent_id = public.current_agent_id()
    )
  );
