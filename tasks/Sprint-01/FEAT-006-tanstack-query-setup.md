# FEAT-006 — TanStack Query Setup

> **Sprint:** Sprint 1 — Project Foundation
> **Status:** Completed — 2026-07-22
> **Priority:** Critical
> **Derived from:** `docs/roadmap.md` §5's Initialize bullet: "TanStack Query (`QueryClientProvider` in `app/`)." As with prior Sprint 1 tickets, no pre-existing task file existed under this ID; drafted during implementation.

---

## 1. Objective

Wire up TanStack Query as the project's exclusive server-state layer (`architecture.md` §10, `coding-standards.md` §9/§222) by installing `@tanstack/react-query` and mounting a single `QueryClient`/`QueryClientProvider` in `app/`, with `staleTime` defaults set per `coding-standards.md` §436's tuning guidance. No query hooks are written yet — there is no Service/Repository for any hook to wrap.

## 2. In Scope

- `@tanstack/react-query` installed.
- `frontend/src/shared/lib/query-client.ts` — a single `QueryClient` instance with sane project-wide defaults (a short-but-nonzero default `staleTime` matching the "property listings" case from `coding-standards.md` §436, since that's the common case; individual future hooks override it per-query — e.g. `Infinity` for reference data, session-lifetime for the current user).
- Wired into the `shared/lib` barrel.
- `QueryClientProvider` mounted in `app/App.tsx` (the app's single root composition point), wrapping the existing themed shell.
- Verified: `npm run dev` serves with no console errors/warnings from the provider; `npm run lint`/`typecheck`/`build` all pass.

## 3. Explicitly Out of Scope

- Any actual `useQuery`/`useMutation` hook — none exist because no Repository/Service exists yet to wrap (`api-design.md` §4's Hook → Service → Repository chain). The first real hook arrives with the first real feature (Sprint 2 auth or later).
- TanStack Query Devtools — a genuinely optional dev-ergonomics add-on, not part of `roadmap.md` §5's Sprint 1 list; can be proposed as a follow-up but isn't invented here unasked.
- Realtime/`postgres_changes` cache-invalidation wiring (`api-design.md` §11) — no subscriptions exist yet.
- Suspense-mode TanStack Query — `coding-standards.md` §197 explicitly decides standard (non-Suspense) mode for the MVP; not revisited here.

## 4. Definition of Done

- [x] `@tanstack/react-query` installed.
- [x] `shared/lib/query-client.ts` created, exporting a single configured `QueryClient`.
- [x] Wired into the `shared/lib` barrel.
- [x] `QueryClientProvider` mounted once, in `app/App.tsx`.
- [x] `npm run lint`/`typecheck`/`build` all pass.
- [x] `npm run dev` verified serving with no errors.
- [x] `docs/project-state.md` updated.
