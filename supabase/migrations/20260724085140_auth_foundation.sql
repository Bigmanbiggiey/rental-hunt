-- Sprint 2 (Authentication) foundation migration.
--
-- Scope is deliberately limited to what AUTH-001..AUTH-006/SYS-001/SYS-002 need:
-- the user_role enum, profiles, roles (+ seed), the handle_new_user and
-- prevent_self_role_change triggers, the current_role() helper, and RLS for
-- profiles/roles only (database.md §9's first two Policy Summary rows).
--
-- agencies/agents and current_agency_id() are intentionally NOT created here —
-- they belong to a later sprint's migration and current_agency_id() depends on
-- agents, which doesn't exist yet (docs/project-state.md, Sprint 2 session notes).

-- ── 6. Enumerations ─────────────────────────────────────────────────────────

create type public.user_role as enum ('customer', 'agent', 'moderator', 'admin');

-- ── shared updated_at trigger function (used by every timestamped table) ────

create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 5.1 profiles ─────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text not null,
  phone text,
  avatar_url text,
  notification_preferences jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index profiles_role_idx on public.profiles (role) where deleted_at is null;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── 5.2 roles ────────────────────────────────────────────────────────────────

create table public.roles (
  code text primary key,
  label text not null,
  description text,
  sort_order smallint not null default 0
);

insert into public.roles (code, label, description, sort_order) values
  ('customer', 'Customer', 'Authenticated renter searching for and booking property viewings.', 1),
  ('agent', 'Agent', 'Manages property listings and viewing requests for one agency.', 2),
  ('moderator', 'Moderator', 'Cross-agency verification and moderation authority; no billing or account-management access.', 3),
  ('admin', 'Admin', 'Full platform access, including user and agency management.', 4)
on conflict (code) do nothing;

-- ── 9. RLS helper function ───────────────────────────────────────────────────

create function public.current_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ── 5.1 handle_new_user trigger ──────────────────────────────────────────────
-- Creates the profiles row on signup (api-design.md §5.1). role always defaults
-- to 'customer' here — registration never accepts a role from the client.

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 9. prevent_self_role_change trigger ──────────────────────────────────────
-- RLS is row-level, not column-level, so a Customer's own-row UPDATE policy
-- can't exclude just the `role` column — this trigger closes that gap
-- (database.md §9's column-level note).

create function public.prevent_self_role_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- service_role (backend/ops, e.g. an admin RPC or a trusted script) has
  -- no `auth.uid()` of its own, so current_role() reads NULL for it — which
  -- IS DISTINCT FROM 'admin' and would otherwise wrongly block it. It's
  -- already trusted to bypass RLS entirely; the trigger defers to that.
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.role is distinct from old.role and public.current_role() is distinct from 'admin' then
    raise exception 'Only an admin can change a user role.';
  end if;
  return new;
end;
$$;

create trigger prevent_self_role_change_trigger
  before update on public.profiles
  for each row execute function public.prevent_self_role_change();

-- ── 9. Row Level Security ────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.roles enable row level security;

-- Table-level GRANTs. RLS policies decide which *rows* a role sees, but
-- Postgres also requires the underlying table-level privilege before a
-- policy is even evaluated — this project's local/CLI-created tables don't
-- inherit useful default grants (`anon`/`authenticated` start with only
-- Dxtm — truncate/references/trigger/maintain — no select/insert/update/
-- delete), so every grant implied by the Policy Summary is made explicit.
grant select on public.roles to anon, authenticated;
grant insert, update, delete on public.roles to authenticated; -- narrowed to admin-only by roles_manage_admin
grant select, insert, update, delete on public.profiles to authenticated; -- narrowed per-policy below; guests get no grant at all (Policy Summary: "No access")

-- service_role (Supabase's elevated backend/ops role — used by admin
-- tooling and test fixtures, never the browser client) needs the same
-- explicit grants; it isn't exempt from table-level GRANT checks just
-- because RLS treats it specially.
grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.roles to service_role;

-- profiles: Guest none; Customer/Agent select+update own row; Moderator select
-- all; Admin select+update all, insert/delete (deactivation).
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_select_all_moderator_admin" on public.profiles
  for select using (public.current_role() in ('moderator', 'admin'));

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_update_all_admin" on public.profiles
  for update using (public.current_role() = 'admin');

create policy "profiles_insert_admin" on public.profiles
  for insert with check (public.current_role() = 'admin');

create policy "profiles_delete_admin" on public.profiles
  for delete using (public.current_role() = 'admin');

-- roles: public reference data, readable by everyone (including guests);
-- only Admin may manage it.
create policy "roles_select_all" on public.roles
  for select using (true);

create policy "roles_manage_admin" on public.roles
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
