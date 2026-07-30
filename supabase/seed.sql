-- Local development seed data (database.md §12).
--
-- IMPORTANT: this file runs ONLY against the local Docker stack via
-- `supabase db reset`/`supabase start` (supabase/config.toml's
-- [db.seed] sql_paths). It is NEVER pushed to a hosted project — `supabase
-- db push` only applies migrations, never seed.sql. Sprint 9 replaces this
-- fixture data with real, launch-ready production reference data
-- (roadmap.md) rather than this file ever running there.
--
-- `agents.profile_id` FKs through `profiles` to `auth.users`, and `profiles`
-- rows only get created by the `handle_new_user` trigger firing on an
-- `auth.users` insert (auth_foundation.sql) — this file can't call
-- `supabase.auth.signUp()`, so it inserts directly into `auth.users` with
-- fixed UUIDs and a locally-hashed password (`extensions.crypt`/
-- `gen_salt('bf')`, already on the search_path per config.toml). This is a
-- standard local-only Supabase seeding pattern, not something safe to reuse
-- against a real Auth service.

-- ── Agent identities (fires handle_new_user, creating `profiles` rows) ──────

-- `confirmation_token`/`recovery_token`/`email_change_token_new`/`email_change`
-- have no column default (NULL unless set) — GoTrue's Go SQL driver errors
-- scanning NULL into these on a *login* request ("Scan error on column
-- index 3... converting NULL to string is unsupported"), even though the
-- exact same row is readable for other purposes. Never surfaced before
-- because every prior verification signed a fresh user up through the real
-- app flow (which lets GoTrue set these itself) rather than logging in with
-- a directly-seeded row. Explicit `''` on all four avoids it.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
   'agent1.seed@rentalhunt.test', extensions.crypt('seed-password-not-real', extensions.gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Wanjiru Kamau"}', now(), now(),
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
   'agent2.seed@rentalhunt.test', extensions.crypt('seed-password-not-real', extensions.gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"James Mwangi"}', now(), now(),
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated',
   'agent3.seed@rentalhunt.test', extensions.crypt('seed-password-not-real', extensions.gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Aisha Noor"}', now(), now(),
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated',
   'agent4.seed@rentalhunt.test', extensions.crypt('seed-password-not-real', extensions.gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Brian Otieno"}', now(), now(),
   '', '', '', '');

-- prevent_self_role_change_trigger (auth_foundation.sql) only bypasses for
-- auth.role() = 'service_role', which this raw seed session running as the
-- `postgres` superuser doesn't have (there's no PostgREST/JWT context at
-- all here, so auth.role() reads NULL). Local-seed-only, scoped disable.
alter table public.profiles disable trigger prevent_self_role_change_trigger;

update public.profiles set role = 'agent'
where id in (
  'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004'
);

alter table public.profiles enable trigger prevent_self_role_change_trigger;

-- ── Agencies ─────────────────────────────────────────────────────────────────

insert into public.agencies (id, name, slug, description, phone, email, county_id, is_active) values
  ('a2000000-0000-0000-0000-000000000001', 'Nairobi Homes Realty', 'nairobi-homes-realty',
   'A trusted agency letting quality homes across Nairobi since 2015.', '+254700000001',
   'info@nairobihomes.test', (select id from public.counties where name = 'Nairobi'), true),
  ('a2000000-0000-0000-0000-000000000002', 'Kiambu Estates', 'kiambu-estates',
   'Family-run agency specializing in Kiambu and greater Nairobi rentals.', '+254700000002',
   'hello@kiambuestates.test', (select id from public.counties where name = 'Kiambu'), true);

-- ── Agents ───────────────────────────────────────────────────────────────────

insert into public.agents (id, profile_id, agency_id, job_title, bio, is_active) values
  ('a3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001',
   'Senior Leasing Agent', 'Ten years matching renters with the right Nairobi neighborhood.', true),
  ('a3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001',
   'Leasing Agent', 'Specialist in Westlands and Kilimani apartments.', true),
  ('a3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000001',
   'Leasing Agent', 'Focused on family homes in Karen and Lavington.', true),
  ('a3000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000002',
   'Leasing Agent', 'Kiambu-based, covering the wider metro area.', true);

-- ── Properties ───────────────────────────────────────────────────────────────
-- Spans every RLS-relevant state (verification/archive) and every publicly
-- visible availability_status, so the full guest-visibility rule and every
-- documented UI state (ui-guidelines.md) is reachable locally without manual
-- data entry (database.md §12).

insert into public.properties (
  id, agency_id, agent_id, property_type_id, county_id, location_id,
  title, slug, description, latitude, longitude, bedrooms, bathrooms,
  rent_amount, deposit_amount, availability_status, verification_status,
  last_verified_at, verified_by, is_featured, is_archived
) values
  ('a4000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000002',
   (select id from public.property_types where name = 'Apartment'), (select id from public.counties where name = 'Nairobi'),
   (select id from public.locations where name = 'Kilimani'), 'Modern 2BR Apartment in Kilimani', '2br-apartment-kilimani-a1',
   'A bright, modern 2-bedroom apartment in the heart of Kilimani, close to shops and restaurants.',
   -1.290000, 36.783000, 2, 2, 55000, 55000, 'available', 'verified', now(), 'a1000000-0000-0000-0000-000000000001', true, false),

  ('a4000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000002',
   (select id from public.property_types where name = 'Apartment'), (select id from public.counties where name = 'Nairobi'),
   (select id from public.locations where name = 'Westlands'), 'Spacious 3BR Apartment in Westlands', '3br-apartment-westlands-a2',
   'A spacious 3-bedroom apartment with balcony views over Westlands.',
   -1.267000, 36.811000, 3, 2, 85000, 85000, 'available', 'verified', now(), 'a1000000-0000-0000-0000-000000000001', true, false),

  ('a4000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003',
   (select id from public.property_types where name = 'Villa'), (select id from public.counties where name = 'Nairobi'),
   (select id from public.locations where name = 'Karen'), 'Family Villa in Karen', 'family-villa-karen-a3',
   'A generous 4-bedroom villa with a large garden, ideal for families, in leafy Karen.',
   -1.319000, 36.706000, 4, 4, 150000, 150000, 'available', 'verified', now(), 'a1000000-0000-0000-0000-000000000001', false, false),

  ('a4000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003',
   (select id from public.property_types where name = 'Townhouse'), (select id from public.counties where name = 'Nairobi'),
   (select id from public.locations where name = 'Lavington'), 'Elegant Townhouse in Lavington', 'townhouse-lavington-a4',
   'A three-bedroom townhouse in a quiet, gated Lavington compound. Currently occupied.',
   -1.279000, 36.767000, 3, 3, 95000, 95000, 'occupied', 'verified', now(), 'a1000000-0000-0000-0000-000000000001', false, false),

  ('a4000000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000002',
   (select id from public.property_types where name = 'Maisonette'), (select id from public.counties where name = 'Nairobi'),
   (select id from public.locations where name = 'Embakasi'), 'Maisonette in Embakasi', 'maisonette-embakasi-a5',
   'A comfortable 3-bedroom maisonette, currently reserved by another applicant.',
   -1.324000, 36.894000, 3, 2, 60000, 60000, 'reserved', 'verified', now(), 'a1000000-0000-0000-0000-000000000001', false, false),

  ('a4000000-0000-0000-0000-000000000006', 'a2000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000002',
   (select id from public.property_types where name = 'Studio'), (select id from public.counties where name = 'Nairobi'),
   (select id from public.locations where name = 'Kileleshwa'), 'Cozy Studio in Kileleshwa', 'studio-kileleshwa-a6',
   'A cozy studio unit awaiting its first verification review.',
   -1.281000, 36.782000, 1, 1, 35000, 35000, 'available', 'pending_verification', null, null, false, false),

  ('a4000000-0000-0000-0000-000000000007', 'a2000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000004',
   (select id from public.property_types where name = 'Bedsitter'), (select id from public.counties where name = 'Nairobi'),
   (select id from public.locations where name = 'South B'), 'Budget Bedsitter in South B', 'bedsitter-south-b-a7',
   'An affordable bedsitter, newly listed and not yet submitted for verification.',
   -1.310000, 36.834000, 1, 1, 20000, 20000, 'available', 'unverified', null, null, false, false),

  ('a4000000-0000-0000-0000-000000000008', 'a2000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000004',
   (select id from public.property_types where name = 'Apartment'), (select id from public.counties where name = 'Nairobi'),
   (select id from public.locations where name = 'South C'), 'Apartment in South C (rejected listing)', 'apartment-south-c-a8',
   'Fixture data only: a listing rejected during verification, visible only to its owning agent/moderator/admin, never to guests.',
   -1.316000, 36.825000, 2, 1, 40000, 40000, 'available', 'rejected', now(), 'a1000000-0000-0000-0000-000000000001', false, false),

  ('a4000000-0000-0000-0000-000000000009', 'a2000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000004',
   (select id from public.property_types where name = 'Bungalow'), (select id from public.counties where name = 'Nairobi'),
   (select id from public.locations where name = 'Ngong Road'), 'Archived Bungalow on Ngong Road', 'bungalow-ngong-road-a9',
   'Fixture data only: a verified but archived listing, hidden from guest browse per the is_archived rule.',
   -1.300000, 36.769000, 4, 3, 120000, 120000, 'available', 'verified', now(), 'a1000000-0000-0000-0000-000000000001', false, true);

-- ── Property images ──────────────────────────────────────────────────────────
-- Placeholder paths only (no real Storage objects uploaded for seed data;
-- Storage/upload flow is a later sprint's scope) — enough for the gallery
-- query shape to be exercised.

insert into public.property_images (property_id, image_url, alt_text, display_order)
select p.id, format('https://placehold.co/800x600?text=%s+%s', p.slug, gs), format('%s photo %s', p.title, gs), gs
from public.properties p, generate_series(0, 1) as gs;

-- ── Property amenities ───────────────────────────────────────────────────────
-- Every seeded property gets Parking + WiFi + Security, plus one property
-- gets the full amenity set so the amenities AND-filter has a real
-- multi-amenity match to test against.

insert into public.property_amenities (property_id, amenity_id)
select p.id, a.id
from public.properties p
join public.amenities a on a.name in ('Parking', 'WiFi', 'Security/Gated Community');

insert into public.property_amenities (property_id, amenity_id)
select 'a4000000-0000-0000-0000-000000000003', a.id
from public.amenities a
where a.name in ('Swimming Pool', 'Backup Generator', 'Gym', 'Furnished')
on conflict do nothing;

-- ── Customer identities (fires handle_new_user; role defaults to 'customer', no trigger-disable needed) ──

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
   'customer1.seed@rentalhunt.test', extensions.crypt('seed-password-not-real', extensions.gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Grace Achieng"}', now(), now(),
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
   'customer2.seed@rentalhunt.test', extensions.crypt('seed-password-not-real', extensions.gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Peter Kariuki"}', now(), now(),
   '', '', '', '');

update public.profiles set phone = '+254711000001' where id = 'c1000000-0000-0000-0000-000000000001';
update public.profiles set phone = '+254711000002' where id = 'c1000000-0000-0000-0000-000000000002';

-- ── Viewing requests ─────────────────────────────────────────────────────────
-- Sprint 6 (BOOK-*) needs at least one row per status to test the agent
-- booking queue against; requested_date must stay >= current_date
-- (viewing_requests_requested_date_check), so relative offsets are used
-- rather than fixed dates.

insert into public.viewing_requests (
  id, customer_id, property_id, agent_id, requested_date, requested_time,
  status, notes, confirmed_at, completed_at, cancelled_at, cancellation_reason
) values
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
   'a4000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000002',
   current_date + 3, '10:00', 'pending', 'Looking forward to seeing the kitchen.', null, null, null, null),

  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001',
   'a4000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000002',
   current_date + 5, '14:30', 'confirmed', null, now(), null, null, null),

  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002',
   'a4000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003',
   current_date + 1, '09:00', 'completed', null, now(), now(), null, null),

  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002',
   'a4000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000002',
   current_date + 7, '11:00', 'cancelled', null, null, null, now(), 'Change of plans.'),

  ('b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001',
   'a4000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003',
   current_date + 2, '16:00', 'no_show', null, now(), null, null, null);
