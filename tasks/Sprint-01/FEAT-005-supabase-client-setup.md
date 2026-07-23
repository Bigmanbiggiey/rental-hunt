# FEAT-005 — Supabase Client Setup

> **Sprint:** Sprint 1 — Project Foundation
> **Status:** Completed — 2026-07-21
> **Priority:** Critical
> **Derived from:** `docs/roadmap.md` §5's Initialize bullet: "Supabase client (`shared/lib/supabase.ts`) pointed at the Sprint 0 project." As with prior Sprint 1 tickets, no pre-existing task file existed under this ID; drafted during implementation.

---

## 1. Objective

Create the single, shared Supabase client instance (`architecture.md` §5/§9) that every future Repository will call through, pointed at the real development project created for FEAT-004, and verify it actually reaches that live project.

## 2. In Scope

- `@supabase/supabase-js` installed.
- `frontend/src/shared/lib/supabase.ts` — a single `supabase` client instance, built with `createClient(env.supabaseUrl, env.supabaseAnonKey)` from `shared/config` (FEAT-004) — no direct `import.meta.env` access, consistent with ADR-023.
- Wired into the `shared/lib` barrel.
- Verified against the **real** development Supabase project (not mocked): `supabase.auth.getSession()` succeeds with no error, and a probe query against a deliberately nonexistent table returns a genuine PostgREST error (`PGRST205`) — proof the client is really hitting the live project's REST endpoint, not just constructing without throwing.

## 3. Explicitly Out of Scope

- Any database schema or migration work (no tables exist yet in the development project).
- Authentication flows (register/login/logout/session UI) — Sprint 2.
- Repositories, Services, or `AppError`/`mapSupabaseError()` (`api-design.md` §15.3) — these belong with the first real Repository, which doesn't exist yet; introducing them now would be premature abstraction with no consumer (`coding-standards.md` §2's companion rule).
- Typing the client against the database schema (`createClient<Database>`) — deferred until `database.md`'s schema is actually migrated into the project and `supabase gen types typescript` has something real to generate from. Noted directly in the file's JSDoc as a known follow-up, not silently dropped.
- Any override of `supabase-js`'s default session/token storage behavior — `api-design.md` §19 says its default handling is used "as-is"; no custom storage adapter is introduced without a concrete reason to deviate.

## 4. A Documentation Tension Worth Flagging (not resolved here)

`api-design.md` §19 says both "Tokens are never persisted in `localStorage`" and "`supabase-js`'s default secure storage handling is used as-is" in the same row — but `supabase-js`'s actual default storage mechanism *is* `localStorage` (`window.localStorage`) unless explicitly configured otherwise. These two clauses are in tension. Not resolved in this ticket since no session-consuming code exists yet to force the decision; flagged here for whoever implements Sprint 2 authentication to resolve deliberately (either accept the SDK default and correct the doc's wording, or configure a different storage adapter and keep the doc's stronger claim) rather than notice it mid-implementation with no record of the question.

## 5. Definition of Done

- [x] `@supabase/supabase-js` installed.
- [x] `shared/lib/supabase.ts` created, importing `env` from `shared/config` — no direct `import.meta.env` access.
- [x] Wired into the `shared/lib` barrel.
- [x] `npm run lint`/`typecheck`/`build` all pass.
- [x] Verified against the real development project: `getSession()` succeeds; a probe query against a nonexistent table returns a genuine live-project PostgREST error, not a network failure or generic throw.
- [x] `docs/project-state.md` updated.
