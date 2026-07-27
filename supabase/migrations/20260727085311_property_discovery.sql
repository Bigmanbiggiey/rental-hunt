-- Sprint 3 (Property Discovery) foundation migration.
--
-- Scope: reference data (counties, locations, property_types, amenities),
-- agencies/agents, properties, property_images, property_amenities, the
-- public-safe agent_directory view, and the full RLS Policy Summary
-- (database.md §9) for every table created here — not just the guest-read
-- subset DISC-001..006/SYS-003 need, since this is the one migration that
-- creates these tables and database.md already fully specifies their policies.
--
-- Deliberately NOT created here (later sprints' scope): favorites,
-- viewing_requests, activity_logs, property_verifications, and the
-- set_property_verification() RPC that will supersede the simplified
-- enforce_verification_authority() bypass below.

-- ── 6. Enumerations ─────────────────────────────────────────────────────────

create type public.property_status as enum ('available', 'reserved', 'occupied', 'hidden');
create type public.verification_status as enum ('unverified', 'pending_verification', 'verified', 'rejected');

-- ── 5.5 counties ──────────────────────────────────────────────────────────────

create table public.counties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  constraint counties_name_key unique (name)
);

-- ── 5.6 locations ─────────────────────────────────────────────────────────────

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  county_id uuid not null references public.counties (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint locations_county_name_key unique (county_id, name)
);

create index locations_county_id_idx on public.locations (county_id);

-- ── 5.7 property_types ────────────────────────────────────────────────────────

create table public.property_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  constraint property_types_name_key unique (name)
);

-- ── 5.10 amenities ─────────────────────────────────────────────────────────────

create table public.amenities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  created_at timestamptz not null default now(),
  constraint amenities_name_key unique (name)
);

-- ── 5.3 agencies ───────────────────────────────────────────────────────────────

create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  logo_url text,
  phone text,
  email text,
  county_id uuid references public.counties (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint agencies_slug_key unique (slug)
);

create index agencies_county_id_idx on public.agencies (county_id);

create trigger set_agencies_updated_at
  before update on public.agencies
  for each row execute function public.set_updated_at();

-- ── 5.4 agents ─────────────────────────────────────────────────────────────────

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete restrict,
  job_title text,
  bio text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint agents_profile_id_key unique (profile_id)
);

create index agents_agency_id_idx on public.agents (agency_id);

create trigger set_agents_updated_at
  before update on public.agents
  for each row execute function public.set_updated_at();

-- ── 9. current_agency_id() RLS helper ────────────────────────────────────────
-- Mirrors current_role()'s existing shape (auth_foundation.sql): stable,
-- security definer so it can read `agents` regardless of the caller's own
-- RLS visibility of that table. Must come after `agents` is created — unlike
-- plpgsql, a `language sql` function body is validated against the catalog
-- at CREATE FUNCTION time, not just at call time.

create function public.current_agency_id() returns uuid
language sql stable security definer set search_path = public as $$
  select a.agency_id from public.agents a where a.profile_id = auth.uid()
$$;

-- ── 5.8 properties ───────────────────────────────────────────────────────────

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete restrict,
  agent_id uuid not null references public.agents (id) on delete restrict,
  property_type_id uuid not null references public.property_types (id) on delete restrict,
  county_id uuid not null references public.counties (id) on delete restrict,
  location_id uuid not null references public.locations (id) on delete restrict,
  title text not null,
  slug text not null,
  description text not null,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  bedrooms smallint not null,
  bathrooms smallint not null,
  rent_amount numeric(12, 2) not null,
  deposit_amount numeric(12, 2) not null,
  currency text not null default 'KES',
  availability_status public.property_status not null default 'available',
  verification_status public.verification_status not null default 'unverified',
  last_verified_at timestamptz,
  verified_by uuid references public.profiles (id) on delete set null,
  is_featured boolean not null default false,
  is_archived boolean not null default false,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint properties_slug_key unique (slug),
  constraint properties_bedrooms_check check (bedrooms >= 0),
  constraint properties_bathrooms_check check (bathrooms >= 0),
  constraint properties_rent_amount_check check (rent_amount > 0),
  constraint properties_deposit_amount_check check (deposit_amount >= 0),
  constraint properties_featured_requires_verified_check
    check (is_featured = false or verification_status = 'verified')
);

create index properties_agency_id_idx on public.properties (agency_id);
create index properties_agent_id_idx on public.properties (agent_id);
create index properties_property_type_id_idx on public.properties (property_type_id);
create index properties_location_id_idx on public.properties (location_id);
create index properties_verified_by_idx on public.properties (verified_by);

-- Primary search/filter path (DISC-003): one composite index scan instead of
-- a bitmap merge across several single-column indexes.
create index properties_search_idx
  on public.properties (county_id, property_type_id, bedrooms, rent_amount);

-- The "public browse" hot path: every guest/customer query filters these
-- out first (NFR-SEARCH-001's 2-second target).
create index properties_public_browse_idx
  on public.properties (availability_status, verification_status)
  where is_archived = false and deleted_at is null;

-- Homepage featured-section query (DISC-005) — small, stable subset.
create index properties_featured_idx on public.properties (is_featured) where is_featured = true;

-- Free-text search (NFR-SEARCH-002) without a future schema change.
create index properties_search_text_idx
  on public.properties using gin (to_tsvector('english', title || ' ' || description));

create trigger set_properties_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- ── 9. enforce_verification_authority trigger ────────────────────────────────
-- database.md §9: verification_status/verified_by/last_verified_at may only
-- be written by the (Sprint 7) set_property_verification() RPC, never a
-- direct UPDATE. RLS can't restrict individual columns within a row-level
-- UPDATE policy, so this trigger closes the gap the same way
-- prevent_self_role_change() does for profiles.role. Implemented now, ahead
-- of the sanctioning RPC, because "RLS enabled on every table, no
-- exceptions" (coding-standards.md §12) means this table can't ship with a
-- real bypass just because the sanctioned path lands two sprints later —
-- once Sprint 7 adds the RPC, it will run as security definer and must be
-- given an explicit bypass here, the same way service_role is below.

create function public.enforce_verification_authority() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if (new.verification_status is distinct from old.verification_status)
     or (new.verified_by is distinct from old.verified_by)
     or (new.last_verified_at is distinct from old.last_verified_at) then
    raise exception 'verification_status/verified_by/last_verified_at can only be changed via set_property_verification().';
  end if;
  return new;
end;
$$;

create trigger enforce_verification_authority_trigger
  before update on public.properties
  for each row execute function public.enforce_verification_authority();

-- ── 5.9 property_images ───────────────────────────────────────────────────────

create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  image_url text not null,
  alt_text text,
  display_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index property_images_property_display_order_idx
  on public.property_images (property_id, display_order);

-- ── 5.11 property_amenities ───────────────────────────────────────────────────

create table public.property_amenities (
  property_id uuid not null references public.properties (id) on delete cascade,
  amenity_id uuid not null references public.amenities (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint property_amenities_pkey primary key (property_id, amenity_id)
);

create index property_amenities_amenity_id_idx on public.property_amenities (amenity_id);

-- ── amenities AND-filter helper ───────────────────────────────────────────────
-- database.md §17 requires the `amenities` search filter to use AND
-- semantics (a property must have ALL listed amenities, not any) — a plain
-- PostgREST query-builder chain can't express "has every row in this set"
-- against a many-to-many join in one call, so this function does it in one
-- indexed query instead of N client-side round trips. Documented as a new
-- database.md §9.x entry in the same change as this migration (CLAUDE.md §8).
create function public.property_ids_with_all_amenities(p_amenity_ids uuid[])
returns setof uuid
language sql stable as $$
  select property_id
  from public.property_amenities
  where amenity_id = any (p_amenity_ids)
  group by property_id
  having count(distinct amenity_id) = array_length(p_amenity_ids, 1)
$$;

-- ── agent_directory public view ──────────────────────────────────────────────
-- database.md §9: guests need an agent's name/avatar on the property details
-- page without gaining broad `profiles` read access (Policy Summary: guest
-- has "No access" to profiles). database.md's prose called this a "security
-- invoker" view, but an invoker-mode view would need the *caller's* RLS to
-- already permit reading `profiles` — exactly the access this view exists to
-- avoid granting. That's a documentation wording bug, not a real design
-- choice: SECURITY DEFINER (matching current_role()/current_agency_id()'s
-- existing pattern) is the only mode that achieves the view's own stated
-- purpose. Fixed here and in database.md §9 in the same change.
create view public.agent_directory
with (security_invoker = false) as
  select
    a.id as agent_id,
    a.agency_id,
    p.full_name,
    p.avatar_url,
    a.job_title,
    a.bio
  from public.agents a
  join public.profiles p on p.id = a.profile_id
  where a.is_active = true and a.deleted_at is null;

alter view public.agent_directory set (security_barrier = true);

-- ── 12. Reference-data seed ───────────────────────────────────────────────────
-- Idempotent, mirrors the `roles` seed precedent in auth_foundation.sql —
-- this way production also gets real reference data once this migration
-- eventually runs there (database.md §13's "one-off data backfills... written
-- as idempotent SQL within a migration file" guidance).

insert into public.counties (name) values
  ('Nairobi'), ('Kiambu'), ('Kajiado'), ('Machakos')
on conflict (name) do nothing;

insert into public.locations (county_id, name)
select c.id, l.name
from public.counties c
join (values
  ('Nairobi', 'Kilimani'), ('Nairobi', 'Westlands'), ('Nairobi', 'Karen'),
  ('Nairobi', 'Lavington'), ('Nairobi', 'Kileleshwa'), ('Nairobi', 'South B'),
  ('Nairobi', 'South C'), ('Nairobi', 'Embakasi'), ('Nairobi', 'Langata'),
  ('Nairobi', 'Ngong Road')
) as l(county_name, name) on l.county_name = c.name
on conflict (county_id, name) do nothing;

insert into public.property_types (name) values
  ('Apartment'), ('Bedsitter'), ('Studio'), ('Townhouse'),
  ('Maisonette'), ('Bungalow'), ('Villa'), ('Commercial')
on conflict (name) do nothing;

insert into public.amenities (name, icon) values
  ('Parking', 'car'),
  ('Borehole/Water Backup', 'droplet'),
  ('Security/Gated Community', 'shield'),
  ('WiFi', 'wifi'),
  ('Balcony', 'door-open'),
  ('Furnished', 'sofa'),
  ('Pets Allowed', 'paw-print'),
  ('Swimming Pool', 'waves'),
  ('Backup Generator', 'zap'),
  ('Gym', 'dumbbell')
on conflict (name) do nothing;

-- ── 9. Row Level Security ────────────────────────────────────────────────────

alter table public.counties enable row level security;
alter table public.locations enable row level security;
alter table public.property_types enable row level security;
alter table public.amenities enable row level security;
alter table public.agencies enable row level security;
alter table public.agents enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.property_amenities enable row level security;

-- Table-level GRANTs (Sprint 2 lesson: fresh CLI-created tables start with
-- only Dxtm for anon/authenticated — no select/insert/update/delete — so
-- every grant implied by the Policy Summary below is made explicit).

grant select on public.counties, public.locations, public.property_types, public.amenities
  to anon, authenticated;
grant insert, update, delete on public.counties, public.locations, public.property_types, public.amenities
  to authenticated; -- narrowed to admin-only by the _manage_admin policies below

grant select on public.agencies to anon, authenticated;
grant insert, update, delete on public.agencies to authenticated; -- narrowed per-policy

grant select on public.agents to authenticated; -- guests use agent_directory only, no direct grant
grant insert, update, delete on public.agents to authenticated; -- narrowed per-policy

grant select on public.properties to anon, authenticated;
grant insert, update, delete on public.properties to authenticated; -- narrowed per-policy

grant select on public.property_images to anon, authenticated;
grant insert, update, delete on public.property_images to authenticated; -- narrowed per-policy

grant select on public.property_amenities to anon, authenticated;
grant insert, delete on public.property_amenities to authenticated; -- narrowed per-policy; no update on a pure junction table

grant select on public.agent_directory to anon, authenticated;

-- service_role needs the same explicit grants (Sprint 2 lesson) — it isn't
-- exempt from table-level GRANT checks just because RLS treats it specially.
grant select, insert, update, delete on
  public.counties, public.locations, public.property_types, public.amenities,
  public.agencies, public.agents, public.properties, public.property_images, public.property_amenities
  to service_role;
grant select on public.agent_directory to service_role;
grant execute on function public.property_ids_with_all_amenities(uuid[]) to anon, authenticated, service_role;

-- counties / locations / property_types: public reference data, Admin-managed.
create policy "counties_select_all" on public.counties for select using (true);
create policy "counties_manage_admin" on public.counties
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "locations_select_all" on public.locations for select using (true);
create policy "locations_manage_admin" on public.locations
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "property_types_select_all" on public.property_types for select using (true);
create policy "property_types_manage_admin" on public.property_types
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- amenities: same shape as the reference tables above.
create policy "amenities_select_all" on public.amenities for select using (true);
create policy "amenities_manage_admin" on public.amenities
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- agencies: Guest/Customer see active agencies; Agent/Moderator see all;
-- Agent may update their own agency's non-critical fields; Admin full CRUD.
create policy "agencies_select_active" on public.agencies
  for select to anon, authenticated using (is_active = true);

create policy "agencies_select_all_agent_moderator_admin" on public.agencies
  for select using (public.current_role() in ('agent', 'moderator', 'admin'));

create policy "agencies_update_own_agent" on public.agencies
  for update using (public.current_role() = 'agent' and id = public.current_agency_id())
  with check (public.current_role() = 'agent' and id = public.current_agency_id());

create policy "agencies_insert_admin" on public.agencies
  for insert with check (public.current_role() = 'admin');

create policy "agencies_delete_admin" on public.agencies
  for delete using (public.current_role() = 'admin');

create policy "agencies_update_admin" on public.agencies
  for update using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- agents: Guest has no direct table access (agent_directory view only);
-- Customer/Moderator see all rows; Agent sees all and updates own row;
-- Admin full CRUD.
create policy "agents_select_all_authenticated" on public.agents
  for select to authenticated using (true);

create policy "agents_update_own_agent" on public.agents
  for update using (public.current_role() = 'agent' and profile_id = auth.uid())
  with check (public.current_role() = 'agent' and profile_id = auth.uid());

create policy "agents_insert_admin" on public.agents
  for insert with check (public.current_role() = 'admin');

create policy "agents_delete_admin" on public.agents
  for delete using (public.current_role() = 'admin');

create policy "agents_update_admin" on public.agents
  for update using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- properties: Guest/Customer see the public-browse subset; Agent sees/writes
-- (non-verification columns) their own agency's rows; Moderator sees all
-- (verification writes wait for the Sprint 7 RPC); Admin full CRUD.
create policy "properties_select_public" on public.properties
  for select to anon, authenticated
  using (is_archived = false and deleted_at is null and verification_status <> 'rejected');

create policy "properties_select_all_agent_own_agency" on public.properties
  for select using (public.current_role() = 'agent' and agency_id = public.current_agency_id());

create policy "properties_select_all_moderator_admin" on public.properties
  for select using (public.current_role() in ('moderator', 'admin'));

create policy "properties_insert_agent_own_agency" on public.properties
  for insert with check (public.current_role() = 'agent' and agency_id = public.current_agency_id());

create policy "properties_update_agent_own_agency" on public.properties
  for update using (public.current_role() = 'agent' and agency_id = public.current_agency_id())
  with check (public.current_role() = 'agent' and agency_id = public.current_agency_id());

create policy "properties_update_admin" on public.properties
  for update using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "properties_insert_admin" on public.properties
  for insert with check (public.current_role() = 'admin');

create policy "properties_delete_admin" on public.properties
  for delete using (public.current_role() = 'admin');

-- property_images: visible whenever the parent property is; Agent manages
-- their own agency's images; Moderator sees all; Admin full CRUD.
create policy "property_images_select_visible_parent" on public.property_images
  for select to anon, authenticated using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id
        and p.is_archived = false and p.deleted_at is null and p.verification_status <> 'rejected'
    )
  );

create policy "property_images_select_all_moderator_admin" on public.property_images
  for select using (public.current_role() in ('moderator', 'admin'));

create policy "property_images_manage_agent_own_agency" on public.property_images
  for all using (
    public.current_role() = 'agent' and exists (
      select 1 from public.properties p
      where p.id = property_images.property_id and p.agency_id = public.current_agency_id()
    )
  )
  with check (
    public.current_role() = 'agent' and exists (
      select 1 from public.properties p
      where p.id = property_images.property_id and p.agency_id = public.current_agency_id()
    )
  );

create policy "property_images_manage_admin" on public.property_images
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- property_amenities: same visibility/ownership shape as property_images.
create policy "property_amenities_select_visible_parent" on public.property_amenities
  for select to anon, authenticated using (
    exists (
      select 1 from public.properties p
      where p.id = property_amenities.property_id
        and p.is_archived = false and p.deleted_at is null and p.verification_status <> 'rejected'
    )
  );

create policy "property_amenities_select_all_moderator_admin" on public.property_amenities
  for select using (public.current_role() in ('moderator', 'admin'));

create policy "property_amenities_manage_agent_own_agency" on public.property_amenities
  for all using (
    public.current_role() = 'agent' and exists (
      select 1 from public.properties p
      where p.id = property_amenities.property_id and p.agency_id = public.current_agency_id()
    )
  )
  with check (
    public.current_role() = 'agent' and exists (
      select 1 from public.properties p
      where p.id = property_amenities.property_id and p.agency_id = public.current_agency_id()
    )
  );

create policy "property_amenities_manage_admin" on public.property_amenities
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
