# SYS-002 — Role-Based Authorization Verification

> **Sprint:** Sprint 2 — Authentication
> **Status:** Completed — 2026-07-24
> **Priority:** Critical
> **Derived from:** `docs/user-stories.md` SYS-002, `docs/roadmap.md` §6 ("Role-based Authorization... verified against a real Customer, Agent, and Admin test account").

---

## 1. Objective

Prove `database.md` §9's `profiles`/`roles` RLS policies actually hold against real accounts of every role this migration introduces — not just that the policy SQL was written, but that it behaves correctly end-to-end.

## 2. In Scope

`src/entities/user/profile.rls.test.ts` — a real integration test suite against the local Supabase stack, using isolated per-actor Supabase clients (own `storageKey`, no shared session) so multiple concurrently-authenticated identities can be exercised in one process. Test accounts are created by real `signUp()` calls; Agent/Moderator/Admin roles are assigned via a `service_role` client directly updating `profiles.role` (RLS-bypassing, the one legitimate path available before any admin UI exists). Proves:

- A Customer can read/update only their own profile row.
- A Customer cannot update another Customer's profile (RLS's own-row `USING` clause filters the target out).
- A non-admin cannot change their own role — `prevent_self_role_change` trigger fires.
- A Moderator can read every profile; a Customer still cannot read a Moderator's.
- An Admin can read/update any profile, including changing another user's role.
- The `roles` reference table is publicly readable, even signed out.
- A guest has zero access to `profiles` (fails outright — no table-level `GRANT` at all for `anon`, not merely an empty RLS-filtered result).

Also, `ProtectedRoute.test.tsx` (`AUTH-002` ticket) gained a case proving a Customer hitting an `allowedRoles={['admin']}` route is redirected home client-side — combined with this ticket's RLS proof, this closes roadmap.md §6's full acceptance test: "navigating to `/admin` as a Customer is blocked (both client-side redirect *and* verified this can't be bypassed by directly hitting a data query, per RLS)."

## 3. Explicitly Out of Scope

- Agent-specific RLS (properties, viewing requests) — no such tables exist yet (Sprint 3+).
- A real admin UI for role management — the `service_role`-bypass technique used in tests is explicitly a test-only fixture pattern, not a shipped feature.

## 4. Definition of Done

- [x] All 7 RLS integration test cases pass against a real local Supabase stack.
- [x] `docs/project-state.md` updated.
