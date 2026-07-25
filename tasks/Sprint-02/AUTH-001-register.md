# AUTH-001 — Register with Email and Password

> **Sprint:** Sprint 2 — Authentication
> **Status:** Completed — 2026-07-24
> **Priority:** Critical
> **Derived from:** `docs/user-stories.md` AUTH-001, `docs/roadmap.md` §6. This is the foundation ticket for Sprint 2 — it also bundles the Supabase CLI setup, the first real database migration, and the shared error-handling infrastructure that every later Sprint 2 ticket depends on (mirroring how FEAT-001 bootstrapped all of Sprint 1).

---

## 1. Objective

Let a guest register an account with email/password and be immediately signed in as a Customer, and stand up the database/infrastructure foundation (migration, `AppError`/`mapSupabaseError`, `entities/user`) that the rest of Sprint 2 builds on.

## 2. In Scope

- **Supabase CLI** added as a repo-root dev dependency; `supabase init` scaffolded `supabase/config.toml`.
- **Migration** `supabase/migrations/20260724085140_auth_foundation.sql` — `user_role` enum, `profiles` table, `roles` table (+ 4-row seed), `handle_new_user` trigger (creates the `profiles` row on signup, `role` always `'customer'`), `prevent_self_role_change` trigger, `current_role()` RLS helper, RLS policies for `profiles`/`roles` (`database.md` §9's first two Policy Summary rows), and explicit table-level `GRANT`s to `anon`/`authenticated`/`service_role` (see §4 below — a real, non-obvious gap found during verification).
- **Shared infra:** `shared/lib/errors/` — `AppError` (typed error class + `ErrorCode` union covering the full `api-design.md` §15.2 taxonomy), `mapSupabaseError()` (normalizes Postgres/PostgREST and Supabase Auth errors per §15.3), `parseOrThrow()` (Zod → `AppError` with field-path `details`).
- **shadcn primitives:** `Input`, `Label`, `Alert`, `Sonner` (`Toaster`) added to `shared/ui`; `FieldError` hand-built per `ui-guidelines.md` §11.2/§14; `Button` gained an `isLoading` prop (§11.1's loading state).
- **`entities/user`:** `Profile`/`Session`/`UserRole` types, `user.mapper.ts` (row → DTO), `user.schema.ts` (shared `fullNameSchema`/`phoneSchema`), `profile.repository.ts` (`getById`/`update`), and `context/AuthProvider.tsx` + `useAuth()` — the session-observing Context (`coding-standards.md` §9's sanctioned cross-cutting Context), subscribing to `supabase.auth.onAuthStateChange` directly rather than through `authRepository`, so it never needs a `features/authentication` import (see §5).
- **`features/authentication`:** `auth.repository.ts` (full `AuthRepository` interface + implementation — register/login/logout/refreshSession/requestPasswordReset/resetPassword/getCurrentUser), `auth.service.ts` (register/login/logout/requestPasswordReset, each Zod-validated via `parseOrThrow`), `RegisterSchema`/`LoginSchema`, `useRegister`, `RegisterForm`, wired into a real `RegisterPage` at `/register`.
- `PATHS` relocated from `routes/paths.constants.ts` to `shared/config/paths.constants.ts` — needed by `pages/`/`features/` which cannot import from `routes/` (see §5).

## 3. Explicitly Out of Scope

- `agencies`/`agents` tables and `current_agency_id()` — not needed until Sprint 3+; `current_agency_id()` specifically depends on `agents`, which doesn't exist yet.
- Login, Logout, Session Persistence, Protected Routes — `AUTH-002`/`AUTH-005`.
- Password Reset (`AUTH-004`) and Manage Credentials (`AUTH-006`) — deferred, next tickets.
- Pushing the migration to the real remote Supabase dev project — requires the developer's own Supabase access token (`supabase link`); documented as a manual step, matching FEAT-009's Vercel-connection precedent.

## 4. A Real Bug Found During Verification (not obvious from `database.md`)

`database.md` §9 documents RLS policies but doesn't mention table-level `GRANT`s. On a fresh Supabase-CLI-created (non-dashboard-bootstrapped) project, `anon`/`authenticated`/`service_role` start with **only** `Dxtm` (truncate/references/trigger/maintain) on any newly created table — **no** `select`/`insert`/`update`/`delete` — regardless of RLS policies. RLS policies are only ever evaluated *after* the table-level grant already permits the operation; without an explicit `GRANT`, every request fails with `42501 permission denied for table profiles`, even for a policy that should allow it. This is not a Supabase quirk specific to this project — it's standard Postgres/PostgREST behavior for a table that was never touched by the dashboard's own default-privilege bootstrap SQL. Fixed by adding explicit `GRANT`s matching exactly what `database.md` §9's Policy Summary already implies per role. Also found: the `prevent_self_role_change` trigger's `current_role()` check reads `NULL` for `service_role` requests (no `auth.uid()`), which — since `NULL IS DISTINCT FROM 'admin'` is `true` — wrongly blocked `service_role` from changing anyone's role; fixed with an explicit `auth.role() = 'service_role'` bypass at the top of the trigger function, matching that service_role already bypasses RLS entirely.

## 5. Assumptions Stated Per `CLAUDE.md` §5

- **Cross-feature auth-state reuse:** `AuthProvider`/`useAuth()` live in `entities/user`, not `features/authentication`, per `coding-standards.md` §3.2's explicit resolution ("if two features need the same logic, extract it into `entities/` or `shared/`"). It composes `supabase.auth.getSession()` + `profileRepository.getById()` directly instead of calling `authRepository.getCurrentUser()` (same composition, `api-design.md` §5.7), since `entities/` may only import `shared/`, never `features/`.
- **`PATHS` relocation:** moved to `shared/config/` since `pages/`/`features/` (which need it for links/`navigate()`) cannot import from `routes/` under the FSD boundary rule — the same constraint FEAT-010 hit for `widgets/`.
- **`Session` type:** not explicitly declared in `api-design.md` §3.1 — defined as `{ accessToken, refreshToken, expiresAt }` matching §5.1's JSON example.
- **`CONFLICT` error code:** referenced by `api-design.md` §15.3's normalization table but missing from §15.2's taxonomy list — added to the `ErrorCode` union as the generic unique-violation fallback, since §15.3 is authoritative for normalization.

## 6. Definition of Done

- [x] Migration applied and verified end-to-end against a local Supabase stack (`supabase start`): real signup → `handle_new_user` trigger creates a `profiles` row with `role = 'customer'`.
- [x] `RegisterForm` validates client-side (Zod via `zodResolver`), submits, creates the account, and navigates home on success; duplicate email shows a clear `EMAIL_ALREADY_REGISTERED` message.
- [x] Unit tests: `mapSupabaseError.test.ts` (12 cases), `profile.repository.test.ts` (4 cases, fake Supabase client).
- [x] Integration tests: `RegisterForm.test.tsx` (3 cases) against the real local Supabase stack.
- [x] `npm run lint`/`typecheck`/`test`/`build` all pass.
- [x] `docs/api-design.md` §19 updated to resolve the FEAT-005-flagged JWT-storage documentation tension.
- [x] `docs/project-state.md` updated.
