-- Scope: two small, related additions for the agent property-listing form
-- (found 2026-08-04, real developer testing): (1) `counties` only had the
-- 4-county Nairobi-metro MVP subset seeded by property_discovery.sql —
-- database.md §13's own seed note already said "production seeding should
-- include all 47 counties for future expansion," just deferred until now.
-- (2) a new RLS policy letting an agent insert a `locations` row directly
-- (previously admin-only), so the property form's Location field can offer
-- "create this neighborhood" instead of being limited to the ~10
-- Nairobi-only neighborhoods pre-seeded so far.

-- ── 1. Remaining 43 Kenya counties ──────────────────────────────────────────
-- Nairobi, Kiambu, Kajiado, Machakos already exist (property_discovery.sql) —
-- that migration is already applied and immutable, so this is a new,
-- idempotent INSERT rather than an edit to the old one. Full 47-county list,
-- official names.

insert into public.counties (name) values
  ('Mombasa'), ('Kwale'), ('Kilifi'), ('Tana River'), ('Lamu'),
  ('Taita-Taveta'), ('Garissa'), ('Wajir'), ('Mandera'), ('Marsabit'),
  ('Isiolo'), ('Meru'), ('Tharaka-Nithi'), ('Embu'), ('Kitui'),
  ('Makueni'), ('Nyandarua'), ('Nyeri'), ('Kirinyaga'), ('Murang''a'),
  ('Turkana'), ('West Pokot'), ('Samburu'), ('Trans Nzoia'), ('Uasin Gishu'),
  ('Elgeyo-Marakwet'), ('Nandi'), ('Baringo'), ('Laikipia'), ('Nakuru'),
  ('Narok'), ('Kericho'), ('Bomet'), ('Kakamega'), ('Vihiga'),
  ('Bungoma'), ('Busia'), ('Siaya'), ('Kisumu'), ('Homa Bay'),
  ('Migori'), ('Kisii'), ('Nyamira')
on conflict (name) do nothing;

-- ── 2. Agents can create a new location within any county ──────────────────
-- Table-level `insert` grant to `authenticated` already exists
-- (property_discovery.sql's reference-data GRANT block) — only the RLS
-- policy itself is new. Deliberately `insert`-only, not `for all`: an agent
-- proposing a new neighborhood is low-risk, shared reference data (the same
-- `locations_select_all`/unique-per-county constraint everyone already
-- relies on), but renaming or deleting an *existing* location could break
-- other agencies' already-published listings — that stays admin-only via
-- the existing `locations_manage_admin` policy.
create policy "locations_insert_agent" on public.locations
  for insert to authenticated
  with check (public.current_role() = 'agent');
