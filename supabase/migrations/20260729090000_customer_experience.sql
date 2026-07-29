-- Sprint 5 (Customer Experience) migration.
--
-- Scope: viewing_status enum, favorites, viewing_requests, the
-- prevent_booking_unavailable_property() trigger, the current_agent_id()
-- helper, and the full RLS Policy Summary (database.md §9) for both new
-- tables — including the agent SELECT/UPDATE policy on viewing_requests,
-- added now per the same precedent Sprint 3 set for properties' agent
-- INSERT/UPDATE policies (shipped a full sprint ahead of AGENT-002/003's
-- UI). No agent-side Service/Hook/UI ships this sprint (BOOK-* is Sprint 6
-- scope) — the RLS grant just exists so Sprint 6 doesn't need its own
-- migration merely to unblock reads/writes it already conceptually owns.
--
-- Also adds two new customer-scoped SELECT policies on the EXISTING
-- `properties` table (properties_select_favorited_by_customer,
-- properties_select_booked_by_customer) — a real gap found while designing
-- this sprint: without them, an archived/rejected property a customer has
-- favorited or booked would silently vanish from an embedded
-- `property:properties(...)` join (RLS applies to nested selects too),
-- breaking FAV-003's "unavailable or archived... clearly marked" criterion.
-- Documented as a database.md §9 correction in the same change.

-- ── 6. Enumerations ─────────────────────────────────────────────────────────

create type public.viewing_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

-- ── 5.12 favorites ────────────────────────────────────────────────────────────

create table public.favorites (
  customer_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_pkey primary key (customer_id, property_id)
);

create index favorites_property_id_idx on public.favorites (property_id);

-- ── 5.13 viewing_requests ─────────────────────────────────────────────────────

create table public.viewing_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete restrict,
  property_id uuid not null references public.properties (id) on delete restrict,
  agent_id uuid not null references public.agents (id) on delete restrict,
  requested_date date not null,
  requested_time time not null,
  status public.viewing_status not null default 'pending',
  notes text,
  cancellation_reason text,
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint viewing_requests_requested_date_check check (requested_date >= current_date)
);

create index viewing_requests_customer_id_idx on public.viewing_requests (customer_id);
create index viewing_requests_property_id_idx on public.viewing_requests (property_id);
create index viewing_requests_agent_id_idx on public.viewing_requests (agent_id);
create index viewing_requests_status_idx on public.viewing_requests (status);

-- BOOK-001's primary agent-dashboard query (Sprint 6) — created now since
-- this is the one migration that creates the table.
create index viewing_requests_agent_status_date_idx
  on public.viewing_requests (agent_id, status, requested_date);

create trigger set_viewing_requests_updated_at
  before update on public.viewing_requests
  for each row execute function public.set_updated_at();

-- ── 9. current_agent_id() RLS helper ─────────────────────────────────────────
-- Mirrors current_agency_id()'s existing shape: stable, security definer so
-- it can read `agents` regardless of the caller's own RLS visibility.
-- Resolves "my own agents.id" — current_agency_id() only resolves the
-- agency id, which isn't enough to scope a viewing_requests.agent_id policy.

create function public.current_agent_id() returns uuid
language sql stable security definer set search_path = public as $$
  select a.id from public.agents a where a.profile_id = auth.uid()
$$;

-- ── 9. prevent_booking_unavailable_property trigger ──────────────────────────
-- database.md §9's DB-level booking-integrity backstop: the Service layer
-- checks availability first for a good UX (viewing-request.service.ts), but
-- this trigger guarantees the rule holds even if a bug or a direct SQL
-- client bypasses the Service layer. Raises with a dedicated errcode (RH001)
-- rather than the default P0001 so mapSupabaseError.ts can map this specific
-- rejection to PROPERTY_NOT_AVAILABLE (api-design.md §15.3) without relying
-- on brittle message-text matching.

create function public.prevent_booking_unavailable_property() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_status public.property_status;
  v_archived boolean;
  v_deleted timestamptz;
begin
  select availability_status, is_archived, deleted_at
    into v_status, v_archived, v_deleted
    from public.properties
    where id = new.property_id;

  if v_status is distinct from 'available' or v_archived or v_deleted is not null then
    raise exception 'This property is not currently available for booking.' using errcode = 'RH001';
  end if;
  return new;
end;
$$;

create trigger prevent_booking_unavailable_property_trigger
  before insert on public.viewing_requests
  for each row execute function public.prevent_booking_unavailable_property();

-- ── 9. Row Level Security ────────────────────────────────────────────────────

alter table public.favorites enable row level security;
alter table public.viewing_requests enable row level security;

-- Table-level GRANTs (Sprint 2 lesson: fresh CLI-created tables start with
-- only Dxtm for anon/authenticated — every grant implied by the Policy
-- Summary below is made explicit).
grant select, insert, delete on public.favorites to authenticated;
grant select, insert, update, delete on public.viewing_requests to authenticated; -- delete narrowed to admin-only by viewing_requests_manage_admin

grant select, insert, delete on public.favorites to service_role;
grant select, insert, update, delete on public.viewing_requests to service_role;

-- favorites: Guest none; Customer select/insert/delete own rows only;
-- Agent no special access; Moderator/Admin select all (support/analytics).
create policy "favorites_select_own_customer" on public.favorites
  for select using (public.current_role() = 'customer' and customer_id = auth.uid());

create policy "favorites_insert_own_customer" on public.favorites
  for insert with check (public.current_role() = 'customer' and customer_id = auth.uid());

create policy "favorites_delete_own_customer" on public.favorites
  for delete using (public.current_role() = 'customer' and customer_id = auth.uid());

create policy "favorites_select_all_moderator_admin" on public.favorites
  for select using (public.current_role() in ('moderator', 'admin'));

-- viewing_requests: Guest none; Customer select/insert own rows, and may
-- update own row only to set status='cancelled' while status is
-- pending/confirmed (VIEW-004); Agent select/update rows where agent_id is
-- their own (BOOK-002..006, Sprint 6 exercises the update side); Moderator
-- select all; Admin full CRUD.
create policy "viewing_requests_select_own_customer" on public.viewing_requests
  for select using (public.current_role() = 'customer' and customer_id = auth.uid());

create policy "viewing_requests_insert_own_customer" on public.viewing_requests
  for insert with check (public.current_role() = 'customer' and customer_id = auth.uid());

create policy "viewing_requests_cancel_own_customer" on public.viewing_requests
  for update
  using (
    public.current_role() = 'customer' and customer_id = auth.uid()
    and status in ('pending', 'confirmed')
  )
  with check (
    public.current_role() = 'customer' and customer_id = auth.uid()
    and status = 'cancelled'
  );

create policy "viewing_requests_select_own_agent" on public.viewing_requests
  for select using (public.current_role() = 'agent' and agent_id = public.current_agent_id());

create policy "viewing_requests_update_own_agent" on public.viewing_requests
  for update
  using (public.current_role() = 'agent' and agent_id = public.current_agent_id())
  with check (public.current_role() = 'agent' and agent_id = public.current_agent_id());

create policy "viewing_requests_select_all_moderator_admin" on public.viewing_requests
  for select using (public.current_role() in ('moderator', 'admin'));

create policy "viewing_requests_manage_admin" on public.viewing_requests
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- properties: new customer carve-outs so a favorited/booked property stays
-- visible to its own customer even once archived/rejected (see migration
-- header note + database.md §9 correction). Additive OR'd SELECT policies —
-- widens only the customer's own visibility into rows they already have a
-- personal stake in; nobody else's access changes.
--
-- `to authenticated` is required, not optional: without it, Postgres
-- applies the policy to every role including anon, and evaluating the
-- `exists (select ... from favorites/viewing_requests)` subquery then
-- requires anon to hold a table-level grant on those tables even though the
-- `current_role() = 'customer'` condition would always be false for a
-- guest — anon has zero grant on either table by design, so every guest
-- query against `properties` failed outright with 42501 (found via
-- `property.rls.test.ts` regressing after this migration, not assumed).
create policy "properties_select_favorited_by_customer" on public.properties
  for select to authenticated using (
    public.current_role() = 'customer' and exists (
      select 1 from public.favorites f
      where f.property_id = properties.id and f.customer_id = auth.uid()
    )
  );

create policy "properties_select_booked_by_customer" on public.properties
  for select to authenticated using (
    public.current_role() = 'customer' and exists (
      select 1 from public.viewing_requests vr
      where vr.property_id = properties.id and vr.customer_id = auth.uid()
    )
  );
