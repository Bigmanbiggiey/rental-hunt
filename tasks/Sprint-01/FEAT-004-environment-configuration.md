# FEAT-004 — Environment Configuration

> **Sprint:** Sprint 1 — Project Foundation
> **Status:** Completed — 2026-07-21
> **Priority:** Critical
> **Derived from:** the task instruction that requested this work (2026-07-21), which itself derives from `docs/roadmap.md` §5's "Environment variables: `.env.local` (gitignored) with `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` only" bullet and `docs/coding-standards.md` §21. As with FEAT-001/FEAT-003, no pre-existing task file existed under this ID; drafted during implementation.

---

## 1. Objective

Establish a secure, predictable, centralized environment-variable configuration system for the frontend: real credentials never committed, only `VITE_`-prefixed public values ever reach the browser bundle, and a missing required variable fails loudly and clearly at application startup rather than surfacing as a confusing downstream error.

---

## 2. In Scope

- `frontend/.env.example` — variable names only, no real values.
- `frontend/.env.local` — local dev file, blank until real Supabase dev-project credentials are supplied by the user (not invented — the developer supplied them shortly after initial implementation; see §4).
- `.gitignore` hardening — both `frontend/.gitignore` and a new repo-root `.gitignore` explicitly cover `.env`, `.env.local`, `.env.*.local` (the pre-existing `*.local` in `frontend/.gitignore` already caught the `.local` cases; made explicit for clarity and to also cover a bare `.env`).
- `frontend/src/vite-env.d.ts` — types the two known `VITE_` variables via `ImportMetaEnv` declaration merging.
- `frontend/src/shared/config/env.ts` (+ `index.ts` barrel) — the single centralized module that reads `import.meta.env`; validates both required variables are present and non-empty; throws one clear `Error` naming every missing variable if not; exports a typed, validated `env` object.
- `frontend/src/app/index.ts` — imports `shared/config` for its side effect, so the validation runs as soon as the app bootstraps, even though nothing yet consumes `env`'s values (the Supabase client doesn't exist yet — that's a later ticket).

## 3. Explicitly Out of Scope

- The Supabase client itself (`shared/lib/supabase.ts` — not created; nothing yet calls `createClient`).
- Any database schema/migration work.
- Authentication.
- Production environment variables/deployment configuration.

## 4. Definition of Done

- [x] Existing environment configuration inspected — none existed before this task (no `.env*` files, no config module).
- [x] `frontend/.env.example` created — names only, empty values.
- [x] `frontend/.env.local` created for local development. Initially blank (real Supabase URL/anon key weren't available at first and were deliberately not invented); the developer supplied the real values shortly after, decoded and confirmed as the `anon`-role key (not `service_role`) before use, and re-verified via `ssrLoadModule` to load correctly — still gitignored and untracked.
- [x] `.env`, `.env.local`, `.env.*.local` confirmed excluded from Git via `git check-ignore -v`, in both `frontend/.gitignore` and the new root `.gitignore`.
- [x] Only `VITE_`-prefixed variables are defined; no service-role/secret/admin credential variable exists anywhere in frontend config.
- [x] Centralized, typed config module (`shared/config/env.ts`) added; every other file must import `env` from here rather than reading `import.meta.env` directly.
- [x] Required variables validated eagerly (at module-evaluation time, triggered from `app/` at bootstrap) — verified via `vite`'s `ssrLoadModule` to actually throw a clear, actionable error listing every missing variable when unset, and to load cleanly when set.
- [x] `npm run lint`, `npm run typecheck`, `npm run build` all verified passing.
- [x] `git status` confirmed no `.env`/`.env.local` file staged or tracked.
- [x] `docs/project-state.md` updated.
