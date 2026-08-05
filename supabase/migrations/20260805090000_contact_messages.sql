-- Post-Sprint-8 feature: Contact page (CONTENT-002/003, user-stories.md
-- Epic 11; database.md §5.16, api-design.md §24).
--
-- A public contact form (guest or signed-in) inserts a row here; admin
-- reviews/resolves/deletes them (features/admin-messages). No email-sending
-- provider exists in this project yet, and setting one up wasn't in scope
-- (developer decision, 2026-08-05, ADR-034) — messages are stored for admin
-- review, not delivered as outbound email.

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  -- Nullable: a guest can submit without an account. Never client-supplied —
  -- defaults to the caller's own session and is re-checked in the INSERT
  -- policy below, so an authenticated caller can't spoof another user's id.
  user_id uuid references public.profiles (id) on delete set null default auth.uid(),
  name text not null check (char_length(btrim(name)) > 0),
  email text not null check (char_length(btrim(email)) > 0),
  message text not null check (char_length(btrim(message)) between 10 and 2000),
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index contact_messages_created_at_idx on public.contact_messages (created_at);
-- Partial: the admin queue only ever filters/counts unresolved messages, and
-- this table has no other query shape that needs is_resolved indexed at all.
create index contact_messages_unresolved_idx on public.contact_messages (created_at) where not is_resolved;
-- Backs the Service-layer rate-limit counter (api-design.md §18) — recent
-- submissions counted by email, since a guest submitter has no stable id.
create index contact_messages_email_created_at_idx on public.contact_messages (email, created_at);

alter table public.contact_messages enable row level security;

grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;
grant select, insert, update, delete on public.contact_messages to service_role;

create policy "contact_messages_insert_anyone" on public.contact_messages
  for insert to anon, authenticated with check (
    -- Blocks an authenticated client from spoofing user_id to someone else's
    -- profile — the same shape as every other "own row" WITH CHECK in this
    -- schema, just written to also allow the guest (NULL) case.
    user_id is not distinct from auth.uid()
  );

-- `to authenticated` explicit throughout, per database.md §9's general rule:
-- a policy with no role restriction combines (OR) with every other policy on
-- the table, and `anon` has no grant to fall back on regardless — omitting
-- `to authenticated` here would be harmless today only by accident.
create policy "contact_messages_select_admin" on public.contact_messages
  for select to authenticated using (public.current_role() = 'admin');

create policy "contact_messages_update_admin" on public.contact_messages
  for update to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "contact_messages_delete_admin" on public.contact_messages
  for delete to authenticated using (public.current_role() = 'admin');

-- Backs the Service-layer rate limit (api-design.md §18: 5 per hour, per
-- email). A plain `select(..., { count: 'exact', head: true })` from the
-- client returns a bare 401 for `anon` regardless of filters — `anon` has
-- no SELECT grant on this table at all (by design: no role but admin can
-- read contact_messages, database.md §9), and a `head: true` count request
-- still requires that grant to execute, even though it returns no rows.
-- `security definer` (mirroring `current_role()`/`property_ids_with_all_amenities()`'s
-- existing pattern) lets this one narrow, count-only query run with elevated
-- privilege without granting broad SELECT to anon/authenticated.
create function public.count_recent_contact_messages_by_email(p_email text, p_since timestamptz)
returns bigint
language sql stable security definer
set search_path = public
as $$
  select count(*) from public.contact_messages
  where email = p_email and created_at >= p_since
$$;

grant execute on function public.count_recent_contact_messages_by_email(text, timestamptz) to anon, authenticated;
