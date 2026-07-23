# Rental Hunt KE - Project State

> **This is a living document.** Unlike the rest of `docs/`, it is expected to change constantly. Claude Code must read it at the start of every session and update it at the end of every completed task. See **Claude Instructions** at the bottom for the exact rules governing how this file is edited.

---

# Project Summary

| Field | Value |
|---|---|
| **Project Name** | Rental Hunt KE |
| **Current Version** | `v0.1.0-dev` (pre-launch — semantic versioning per `coding-standards.md` §23; `v1.0.0` is reserved for MVP production launch) |
| **Current Sprint** | Sprint 1 — Project Foundation |
| **Current Phase** | Foundation & Tooling |
| **Overall Progress** | 1 / 10 sprints complete (**10%** by sprint count — see Metrics for story-level progress) |
| **Project Status** | 🟢 On Track |

---

# Active Sprint

## Sprint 1 — Project Foundation

**Sprint Goal:** Stand up the actual application skeleton — tooling, structure, and a deployed (empty) shell — so every subsequent sprint adds features to a working foundation rather than fighting configuration.

**Objectives**
- Initialize React 19 + TypeScript + Vite, Tailwind CSS v4 + shadcn/ui, the Supabase client, TanStack Query, React Router, React Hook Form + Zod.
- Configure ESLint, Prettier, optional Git hooks, the full FSD folder structure, environment variables, CI/CD, base layouts, and the navigation shell.

**Deliverables**
- A themed, empty application shell running locally via `npm run dev`.
- A GitHub Actions pipeline running lint → typecheck → test on every PR.
- A Vercel preview deployment triggered by a merged PR.
- The complete FSD folder skeleton with an active, passing import-boundary lint rule.

**Definition of Done** *(full detail: `docs/roadmap.md` §5)*
- [x] `npm run dev` runs the app locally, themed with `ui-guidelines.md`'s tokens (not default Tailwind). — 2026-07-21 (FEAT-002)
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` all pass. *(Partially met: lint and typecheck both pass clean; no test script/suite exists yet — Vitest setup is not part of any FEAT ticket so far.)*
- [ ] A merged PR triggers a real Vercel preview deployment. *(Not started — CI/CD and Vercel wiring are out of FEAT-001's scope.)*
- [x] FSD folder structure exists; import-boundary lint rule is active and passing. — 2026-07-21 (FEAT-001)
- [x] No feature-specific code has been written — infrastructure only. — 2026-07-21 (FEAT-001)

**Current Progress:** ~85% — FEAT-001 (Workspace Bootstrap), FEAT-002 (Tailwind CSS v4 + shadcn/ui), FEAT-004 (Environment Configuration), FEAT-005 (Supabase Client Setup), FEAT-006 (TanStack Query Setup), FEAT-007 (React Router Setup), and FEAT-008 (React Hook Form + Zod Setup) all complete; FEAT-003 (Project Structure/FSD) substantially absorbed by FEAT-001 with one tracked-debt exception. FEAT-009 (CI/CD Setup) now also complete on the repository side: `.github/workflows/ci.yml` runs install → lint → typecheck → test → build on every PR to `main`; a minimal, real Vitest setup was bootstrapped in the same change (previously `npm run test` had no script at all) with one genuine unit test against the existing `cn()` utility; `vercel.json` adds the SPA rewrite rule client-side routing (FEAT-007) requires. **Actually connecting the repository to Vercel is a manual step the developer still needs to do** (external account/OAuth — no session can do this) — exact steps are in `tasks/Sprint-01/FEAT-009-cicd-setup.md` §4. Only the real base layout/nav shell remains — see **Next Recommended Action**.

---

# Current Task

| Field | Value |
|---|---|
| **Task ID** | — |
| **Task Name** | — |
| **Status** | Not started |
| **Started** | — |
| **Completed** | — |
| **Assigned To** | Claude Code |
| **Dependencies** | FEAT-001, FEAT-002, FEAT-004, FEAT-005, FEAT-006, FEAT-007, FEAT-008 all complete; FEAT-003 substantially absorbed by FEAT-001; FEAT-009 (CI/CD Setup) now also complete on the repository side |
| **Notes** | No task is currently in progress. GitHub Actions CI is live (`.github/workflows/ci.yml`); `vercel.json` is ready; the developer still needs to manually connect the repo to a Vercel project (§4 of FEAT-009's task file). See **Completed Tasks** and **Next Recommended Action**. |

---

# Completed Tasks

## Sprint 0 — Planning & Architecture ✅

- [x] `docs/branding.md` written and approved — 2026-07-17
- [x] `docs/vision.md` written and approved — 2026-07-17
- [x] `docs/requirements.md` written and approved — 2026-07-17
- [x] `docs/user-stories.md` written (61 stories across 10 epics) — 2026-07-17
- [x] `docs/architecture.md` written and approved — 2026-07-17
- [x] `docs/database.md` written, including `property_verifications` addition — 2026-07-17
- [x] `docs/ui-guidelines.md` written — 2026-07-17
- [x] `docs/api-design.md` written — 2026-07-17
- [x] `docs/coding-standards.md` written — 2026-07-17
- [x] `docs/roadmap.md` written — 2026-07-17
- [x] `CLAUDE.md` (root operating manual) written — 2026-07-17
- [x] `docs/project-state.md` (this file) initialized — 2026-07-17
- [x] `docs/decisions.md` (18-entry Architecture Decision Record log) written — 2026-07-18

**Carried forward into Sprint 1** (infrastructure tasks from `roadmap.md` §4 not yet actioned): confirming the GitHub repository is pushed with the docs baseline, and creating the Supabase development project. These are folded into Sprint 1's kickoff rather than blocking Sprint 0's documentation close-out — see **Next Recommended Action**.

## Sprint 1 — Project Foundation (in progress)

- [x] `FEAT-001` — Workspace Bootstrap — 2026-07-21, **reviewed and approved 2026-07-21**. Scaffolded React 19 + TypeScript + Vite in `frontend/`; built the full FSD folder skeleton (`app/pages/widgets/features/entities/shared/routes/assets/styles`) with placeholder barrels; configured strict TypeScript (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`); replaced the scaffold's default `oxlint` with ESLint (flat config) per `coding-standards.md` §3.3/§6, wiring up `@typescript-eslint/no-explicit-any`, `import-x/no-cycle`, `no-console`, and an `eslint-plugin-boundaries`-enforced FSD import-direction rule; configured Prettier. `npm run dev`, `npm run lint`, `npm run typecheck`, and `npm run build` all verified passing. No feature code, styling system, data layer, or routing was added — see `tasks/Sprint-01/FEAT-001-workspace-bootstrap.md` for the full scoped spec (drafted this session, since no task file pre-existed) and the Session Notes entry below for implementation details/decisions. Underlying tooling decisions formally recorded as ADR-019–ADR-021 in `docs/decisions.md`.
- [x] `FEAT-003` — Project Structure (FSD) — **reviewed 2026-07-21, substantially absorbed by FEAT-001; not fully closed.** Compared FEAT-001's actual implementation against `coding-standards.md` §3's requirements (folder skeleton, import-direction enforcement, `import/no-cycle` equivalent, sibling-feature isolation, folder naming conventions). Five of six requirements are satisfied by FEAT-001's work; one — the sibling-feature-import prohibition (§3.2) — is not yet implemented and is not being duplicated or re-implemented here. See `tasks/Sprint-01/FEAT-003-project-structure-fsd.md` for the full item-by-item review and ADR-022 for the deferral rationale. The remaining item is tracked in the Technical Debt table below, not silently dropped.
- [x] `FEAT-004` — Environment Configuration — 2026-07-21, **real credentials supplied 2026-07-21**. Added `frontend/.env.example` (names only, no values) and `frontend/.env.local` (local dev file); hardened both `frontend/.gitignore` and a new repo-root `.gitignore` to explicitly exclude `.env`/`.env.local`/`.env.*.local` (verified via `git check-ignore -v`); added `frontend/src/vite-env.d.ts` typing the two known `VITE_` variables; added the centralized, validated config module `frontend/src/shared/config/env.ts` (+ barrel), which every future file must read environment variables through rather than touching `import.meta.env` directly; wired validation into `app/index.ts` so a missing required variable throws a clear, actionable error (naming every missing variable) as soon as the app bootstraps. No Supabase client, database schema, or auth work was touched, per the task's explicit exclusions. Verified: the "missing variable" throw and the "present variable" success path were both exercised directly via `vite`'s `ssrLoadModule` (not just assumed from reading the code); `npm run lint`/`typecheck`/`build` all pass; `git status` confirms no `.env`/`.env.local` file is tracked or staged. The developer subsequently supplied the real Supabase development-project URL and anon key (decoded and confirmed `role: "anon"`, not `service_role`, before use) into `frontend/.env.local` — re-verified via `ssrLoadModule` that both values load correctly and the file remains gitignored/untracked. See `tasks/Sprint-01/FEAT-004-environment-configuration.md` for the full spec/DoD and ADR-023 for the centralization-pattern decision.
- [x] `FEAT-002` — Tailwind CSS v4 + shadcn/ui Setup — 2026-07-21. Installed Tailwind v4 (`tailwindcss` + `@tailwindcss/vite`); rewrote `styles/index.css` as the Tailwind entry point with the full `ui-guidelines.md` §21 `@theme` token block plus the dark-mode override block (values defined, unused per §4.5/§23). Added a `@/` → `src/` path alias (`tsconfig.app.json`, root `tsconfig.json`, `vite.config.ts`) required by shadcn/ui. Hand-authored `components.json` (style `new-york`, base color `neutral`, Radix primitives, CSS variables, Lucide icons) targeting `shared/ui`/`shared/lib` per `coding-standards.md` §3.1, since the installed CLI's 8 bundled design presets all conflict with our already-decided tokens/font/icon choices. Installed `Button` (`shared/ui/button.tsx`) + its `cn()` utility (`shared/lib/utils.ts`) as an end-to-end proof, each with an `index.ts` barrel; updated `App.tsx` to a themed shell using real tokens and the real `Button` — closing Sprint 1's last open DoD item. Found and fixed a real gap in `ui-guidelines.md` §21 itself (missing `--color-card-foreground`, missing `--color-card`/`--color-destructive` aliases shadcn's vendor components need) in the same change. Verified: `npm run lint`/`typecheck`/`build` all pass; the FSD import-boundary rule re-verified against the new `shared/ui`/`shared/lib` subfolders via a throwaway violation file; compiled CSS checked via `grep` to contain the real token hex values (not tree-shaken placeholders) once a token was actually used. See `tasks/Sprint-01/FEAT-002-tailwind-shadcn-setup.md` for full detail (including two CLI quirks worked around: a stray `@/` folder from unresolved alias discovery, and inconsistent auto-dependency-installation) and ADR-024 for the configuration-choice rationale.
- [x] `FEAT-005` — Supabase Client Setup — 2026-07-21. Installed `@supabase/supabase-js`; added `frontend/src/shared/lib/supabase.ts`, a single client instance built from `env.supabaseUrl`/`env.supabaseAnonKey` (`shared/config`, FEAT-004) — no direct `import.meta.env` access, per ADR-023. Wired into the `shared/lib` barrel. Deliberately did **not** build `AppError`/`mapSupabaseError()` (`api-design.md` §15.3) or any Repository — no Repository exists yet to need them, and introducing them now would be premature abstraction; that work belongs with the first real Repository. Also did not add a `Database` type generic to `createClient` — no schema/migrations exist in the project yet to generate types from; noted as a follow-up directly in the file's JSDoc. Verified against the **real** development project (not mocked): `supabase.auth.getSession()` resolved with no error, and a probe query against a deliberately nonexistent table returned a genuine live PostgREST error (`PGRST205`) — proof the client actually reaches the real backend. `npm run lint`/`typecheck`/`build` all pass; confirmed via `grep` that the (public, anon-role) URL/key appearing in the built bundle is expected and that `dist/` itself stays gitignored. Also flagged, without resolving, a wording tension in `api-design.md` §19 (claims tokens are "never persisted in `localStorage`" while also saying the SDK's *default* storage — which is `localStorage` — is "used as-is") for whoever implements Sprint 2 auth to settle deliberately. See `tasks/Sprint-01/FEAT-005-supabase-client-setup.md` for full detail. No new ADR — this is a routine implementation of already-decided architecture, not a new decision.
- [x] `FEAT-006` — TanStack Query Setup — 2026-07-22. Installed `@tanstack/react-query`; added `frontend/src/shared/lib/query-client.ts`, a single `QueryClient` instance with a project-wide default `staleTime` of 30s (matching the "property listings" tuning case in `coding-standards.md` §436 as the common-case default — individual future hooks override per query, e.g. `Infinity` for reference data). Wired into the `shared/lib` barrel and mounted once via `QueryClientProvider` in `app/App.tsx`, the app's single composition root. Deliberately did **not** write any `useQuery`/`useMutation` hook — no Repository/Service exists yet for a hook to wrap (`api-design.md` §4's Hook → Service → Repository chain); did not add TanStack Query Devtools (optional, not in `roadmap.md` §5's Sprint 1 list, not invented unasked); did not touch Suspense mode (`coding-standards.md` §197 already decided standard non-Suspense mode). Verified: `npm run lint`/`typecheck`/`build` all pass (the one ESLint warning present is pre-existing, from FEAT-002's vendor `button.tsx`, not new); `npm run dev` started cleanly and `curl` against `/`, `/src/main.tsx`, and `/src/app/App.tsx` all returned HTTP 200 with correctly transformed modules (not just assumed from a clean build) before the dev server was stopped; the FSD `boundaries/dependencies` rule already permits `app → shared`, confirmed by lint passing with no rule change needed. See `tasks/Sprint-01/FEAT-006-tanstack-query-setup.md` for full detail. No new ADR — routine implementation of an already-decided technology choice (`roadmap.md` §5, `architecture.md` §10), not a new decision.
- [x] `FEAT-007` — React Router Setup — 2026-07-22. Installed `react-router` (v8, the unified package — no separate `react-router-dom`). Added `routes/paths.constants.ts` (a `PATHS` object grouped `public`/`authenticated`/`admin`, matching `architecture.md` §6 path-for-path), `routes/routes.tsx` (the `RouteObject[]` route config, one entry per path plus a catch-all `*`), `pages/PlaceholderPage.tsx` (one shared, themed placeholder component used by every route — deliberately not fifteen fabricated real pages), and `app/router.tsx` (`createBrowserRouter(routeConfig)`). `App.tsx` now renders `RouterProvider` inside the existing `QueryClientProvider`, replacing FEAT-002's static proof shell. Both the `routes/` and `pages/` barrels (previously placeholder stubs explicitly anticipating this ticket) were filled in. Deliberately out of scope, each with a stated reason: route guards/protected routes (needs Sprint 2 auth state, per `roadmap.md` §6's `AUTH-*`-scoped Protected Routes story); `React.lazy` route-level code splitting and a shared `<RouteErrorBoundary>` (`coding-standards.md` §7/§194 — real, decided patterns, but premature against one trivial shared placeholder with nothing to split or catch yet); the fully styled 404 empty state (`ui-guidelines.md` §19's documented copy — the catch-all route resolves correctly today, just not with the real `EmptyState` component, which doesn't exist yet and shouldn't be built for one single use case). Verified: `npm run lint`/`typecheck`/`build` all pass (same single pre-existing FEAT-002 warning, nothing new); since no Chrome browser-automation tool was available this session, route resolution was verified more rigorously than a visual spot-check — a throwaway script used Vite's `ssrLoadModule` (the same verification technique FEAT-004/FEAT-005 used) to load the real `routeConfig` and run React Router's own `matchRoutes` against all 15 real paths plus one bogus path, confirming each resolved to the exact intended page title (e.g. `/admin/agencies` → "Admin — Agencies", `/totally-bogus-route` → "Not Found") rather than just trusting the route config was written correctly; the script was deleted immediately after. See `tasks/Sprint-01/FEAT-007-react-router-setup.md` for full detail. No new ADR — routine implementation of an already-decided technology and route list (`roadmap.md` §5, `architecture.md` §6), not a new decision.
- [x] `FEAT-008` — React Hook Form + Zod Setup — 2026-07-22. Installed `react-hook-form`, `zod`, and `@hookform/resolvers` as direct dependencies (`zod` had previously only been present transitively, via `eslint-plugin-react-hooks`'s own dependency tree — not something app code should have relied on). Built a throwaway Zod schema + `useForm`/`zodResolver` component to verify the pipeline two ways: (1) type-level — `useForm<Input>({ resolver: zodResolver(Schema) })` compiles clean under this project's strict TypeScript config, ruling out a real class of RHF/`@hookform/resolvers`/Zod version-triangle incompatibility; (2) runtime — the resolver returned by `zodResolver(Schema)` was called directly (matching RHF's own `Resolver` contract) against an invalid email, an empty-required-field case, and a valid email, confirming it returns the exact custom error messages the schema defines (`"Enter a valid email address"`, `"Email is required"`) and the correctly parsed `values` on success — not just that it doesn't throw. Both throwaway files were deleted immediately after verification; confirmed via a rebuild that the production bundle's module count and output file hashes are byte-identical to FEAT-007's, proving zero trace was left behind. Deliberately did **not** build any real form (`LoginForm`, etc. — none exist until Sprint 2's `AUTH-001`) or any shared form primitive (`Input`/`Label`/`FieldError` per `ui-guidelines.md` §11.2/§14 — sized against a real form's needs, not guessed at now) or set up a test framework (Vitest/`@testing-library/react` — a separate, larger addition tracked as its own future gap, not silently bundled into this ticket). `npm run lint`/`typecheck`/`build` all pass. See `tasks/Sprint-01/FEAT-008-react-hook-form-zod-setup.md` for full detail. No new ADR — routine implementation of an already-decided technology choice (`roadmap.md` §5, `architecture.md` §10, `coding-standards.md` §12).
- [x] `FEAT-009` — CI/CD Setup — 2026-07-22, **repository side complete; the Vercel connection itself is pending on the developer.** Added `.github/workflows/ci.yml`: on every PR to `main` (and direct pushes to `main`), runs `npm ci` → `npm run lint` → `npm run typecheck` → `npm run test` → `npm run build`, scoped to `frontend/` via `working-directory`. Since `npm run test` had no script at all before this ticket, bootstrapped a real, minimal Vitest setup in the same change (folded in rather than deferred, since CI/CD cannot meaningfully close without something real for the `test` step to run): installed `vitest`, switched `vite.config.ts` to `vitest/config`'s `defineConfig` so Vitest shares the existing `@/` alias, configured the `node` test environment (deliberately not `jsdom` — no component test exists yet to need a DOM, and installing that dependency unused would be premature), and wrote one genuine unit test (`shared/lib/utils.test.ts`, three cases) against the existing, previously-untested `cn()` utility — not a synthetic placeholder. Added `frontend/vercel.json` with an SPA rewrite rule (`/(.*)` → `/index.html`), required because FEAT-007's client-side routing (`createBrowserRouter`) would otherwise 404 on any direct/refreshed navigation to a non-root path once deployed to Vercel's static hosting. Verified locally: `npm run lint`/`typecheck`/`test`/`build` all pass — the exact commands the CI workflow runs. **Cannot be completed by this session:** actually connecting the GitHub repository to a Vercel project requires the developer's own Vercel account/OAuth grant; exact manual steps (including setting the Vercel project's Root Directory to `frontend` and adding the two `VITE_` env vars to Vercel's dashboard) are documented in `tasks/Sprint-01/FEAT-009-cicd-setup.md` §4 and recorded as an open item under **Blocked**. Also flagged as a manual follow-up: enabling GitHub branch protection to actually require the CI check before merge (a GitHub repo-admin action, not a repo file). No new ADR — routine implementation of an already-decided deployment strategy (ADR-016, `architecture.md` §19).

---

# In Progress

_Nothing is currently in progress._

---

# Blocked

- **Vercel preview deployment** (Sprint 1 DoD line: "A PR merged to `main` triggers a real Vercel preview deployment"). The repository side is fully ready — `vercel.json`'s SPA rewrite is in place, the build is verified clean, and CI is green — but connecting the GitHub repo to a Vercel project requires the developer's own Vercel account/OAuth grant, which no coding session can do on their behalf. Exact steps: `tasks/Sprint-01/FEAT-009-cicd-setup.md` §4. Once connected, this line can be checked off directly (no further implementation work needed).

---

# Pending Decisions

_No pending decisions at this time._

---

# Technical Debt

| Issue | Impact | Priority | Status |
|---|---|---|---|
| The ESLint `boundaries/dependencies` rule (FEAT-001) enforces the coarse cross-layer FSD direction rule (`coding-standards.md` §3.2) but not the finer "a feature may not import a sibling feature" rule, since `features/` has no real slices yet to verify a capture-based rule against. This is the one requirement keeping FEAT-003 (Project Structure/FSD) from being fully closed — see its review at `tasks/Sprint-01/FEAT-003-project-structure-fsd.md` and ADR-022. | Low now (no features exist to violate it); the layer-direction rule is the part that matters for an empty skeleton. Rises to Medium-High once Sprint 2 adds a second feature, since the gap becomes actually violable at that point. | Medium | Open — revisit as one of the first tooling tasks of Sprint 2, once `AUTH-*` adds a second real feature slice, so the capture-based rule can be added and tested against real sibling folders. |

This table populates per `docs/roadmap.md` §17 as debt is deliberately incurred and documented — never retroactively, never for an undocumented shortcut.

---

# Known Issues

_None recorded yet — no application code exists._

---

# Recent Changes

**2026-07-17 — Documentation baseline complete.** All ten `docs/*.md` files, the root `CLAUDE.md` operating manual, and this `project-state.md` file were written and committed, closing Sprint 0. No application code has been written yet; the repository currently contains only documentation and empty scaffold directories (`frontend/`, `supabase/`, `tasks/`).

**2026-07-18 — Architecture Decision Record log added.** `docs/decisions.md` was written, recording 18 accepted ADRs covering every major product/architectural/engineering decision made during Sprint 0 (documentation-driven engineering, the full technology stack, FSD, the Repository/Service split, RLS-as-authority, the agency-first ownership model, the verification workflow, and the specific database exceptions such as the roles enum/metadata split and composite junction-table keys). This is a documentation-only change — no application code affected, no decisions altered, only the rationale behind already-approved decisions made explicit and citable by ADR ID going forward.

**2026-07-21 — FEAT-001 (Workspace Bootstrap) complete.** The first application code in the repository: `frontend/` now contains a working React 19 + TypeScript + Vite workspace with the full FSD folder skeleton, strict TypeScript, and an ESLint + Prettier setup enforcing the FSD import-direction rule. `docs/roadmap.md` §5's full Sprint 1 scope (Tailwind/shadcn, Supabase, TanStack Query, Router, RHF+Zod, CI/CD, base layout) was deliberately not attempted — this task was scoped narrowly to workspace bootstrap only, per the task instruction that created it. See **Completed Tasks** for the full detail and **Technical Debt** for one deferred refinement.

**2026-07-21 — FEAT-001 approved; FEAT-003 reviewed (no new implementation).** FEAT-001 was reviewed and approved by the Product Owner. At the same time, FEAT-003 (Project Structure/FSD) — which also had no pre-existing task file — was drafted from `coding-standards.md` §3 and reviewed item-by-item against FEAT-001's actual implementation. 5 of 6 requirements were found already satisfied; the sibling-feature-import isolation rule was confirmed still open and was **not** implemented in this pass, consistent with the instruction to list remaining gaps rather than duplicate or rush new work. Four ADRs (ADR-019–ADR-022) were added to `docs/decisions.md` formalizing the ESLint-over-oxlint, eslint-plugin-import-x, eslint-plugin-boundaries configuration, and sibling-feature-isolation-deferral decisions made during FEAT-001. See **Completed Tasks** and **Technical Debt** for detail.

**2026-07-21 — FEAT-004 (Environment Configuration) complete.** The Supabase development project was created manually (outside this session). Added `.env.example`/`.env.local`, hardened `.gitignore` (both `frontend/` and repo-root), and introduced a centralized, validated, typed `shared/config/env.ts` module that every future file must read environment variables through — no direct `import.meta.env` access elsewhere. Real Supabase credentials were not available at first and were **not invented**; the developer supplied them shortly after, and they are now in `frontend/.env.local` (gitignored, confirmed untracked). One ADR (ADR-023) recorded the centralization-pattern decision. See **Completed Tasks** for full detail.

**2026-07-22 — FEAT-006 (TanStack Query Setup) complete.** Installed `@tanstack/react-query`, added `shared/lib/query-client.ts` (single `QueryClient`, project-wide default `staleTime`), and mounted `QueryClientProvider` in `app/App.tsx`. No query hooks were added — none have a Repository/Service to wrap yet. Lint/typecheck/build all pass; the dev server was started and its served HTML/module output checked directly via `curl`, not just inferred from a clean build. See **Completed Tasks** for full detail.

**2026-07-22 — FEAT-007 (React Router Setup) complete.** Installed `react-router`; added the full `architecture.md` §6 route skeleton (`routes/paths.constants.ts`, `routes/routes.tsx`), one shared `pages/PlaceholderPage.tsx`, and `app/router.tsx`; `App.tsx` now renders `RouterProvider` inside `QueryClientProvider`. Route guards, lazy-loading, a shared error boundary, and the styled 404 empty state are all deliberately deferred (each with a stated reason — see FEAT-007's Out of Scope). Lint/typecheck/build all pass. No Chrome browser-automation tool was available this session, so route resolution was verified via a throwaway script running React Router's own `matchRoutes` against the real route config through Vite's `ssrLoadModule` — all 15 real paths plus a bogus path resolved to the correct page title; the script was deleted afterward. See **Completed Tasks** for full detail.

**2026-07-22 — FEAT-008 (React Hook Form + Zod Setup) complete.** Installed `react-hook-form`, `zod`, `@hookform/resolvers` as direct dependencies. Verified the `useForm`/`zodResolver` pipeline via a throwaway schema + component: type-level (strict-TS compilation) and runtime (calling the resolver directly against invalid/empty/valid payloads and checking the exact returned error messages and parsed values) — both files deleted immediately after, confirmed via a rebuild with byte-identical output to FEAT-007's. No real form or shared form primitive (`Input`/`Label`/`FieldError`) was built — none exist until Sprint 2's `AUTH-001`. Lint/typecheck/build all pass. See **Completed Tasks** for full detail.

**2026-07-22 — FEAT-009 (CI/CD Setup) complete on the repository side.** Added `.github/workflows/ci.yml` (install → lint → typecheck → test → build on every PR to `main`) and `frontend/vercel.json` (SPA rewrite, required by FEAT-007's client-side routing). Bootstrapped a minimal, real Vitest setup in the same change since `npm run test` had no script before this — one genuine unit test against the existing `cn()` utility, not a placeholder. All four CI commands verified passing locally. Actually connecting the repo to Vercel requires the developer's own account/OAuth grant and could not be done from this session — recorded as an open item under **Blocked**, with exact manual steps in the task file. See **Completed Tasks** for full detail.

---

# Upcoming Tasks

**Immediate (Sprint 1 kickoff, carried over from Sprint 0):**
1. Confirm the GitHub repository is initialized and the documentation baseline is pushed. ✅ Done.
2. ~~Create the Supabase development project~~ ✅ Created manually (2026-07-21, outside this session). ~~Fill in real credentials into `frontend/.env.local`~~ ✅ Done — real URL/anon key supplied by the developer 2026-07-21 (see FEAT-004 in Completed Tasks).

**Sprint 1 — Project Foundation:**
3. ~~Scaffold React 19 + TypeScript + Vite in `frontend/`.~~ ✅ Done (FEAT-001).
4. ~~Install and configure Tailwind CSS v4 + shadcn/ui with the `ui-guidelines.md` §21 token set.~~ ✅ Done (FEAT-002).
5. ~~Wire up the Supabase client~~ ✅ Done (FEAT-005), verified against the real dev project. ~~TanStack Query~~ ✅ Done (FEAT-006), `QueryClientProvider` mounted in `app/App.tsx`. ~~React Router~~ ✅ Done (FEAT-007), full `architecture.md` §6 route skeleton wired up. ~~React Hook Form + Zod~~ ✅ Done (FEAT-008), `zodResolver` pipeline verified end-to-end.
6. ~~Configure ESLint (including the FSD import-boundary rule and `no-explicit-any`) and Prettier~~ ✅ Done (FEAT-001); `prettier-plugin-tailwindcss` added in FEAT-002 now that Tailwind exists.
7. ~~Build the full FSD folder skeleton.~~ ✅ Done (FEAT-001/FEAT-003).
8. ~~Set up environment variables (`.env.local`, `VITE_`-prefixed only).~~ ✅ Done (FEAT-004).
9. ~~Set up GitHub Actions CI (lint → typecheck → test)~~ ✅ Done (FEAT-009), `.github/workflows/ci.yml` live. ~~Connect Vercel for preview deployments~~ ⏳ Repository side ready (`vercel.json`); the actual account connection is a manual step for the developer — see **Blocked**.
10. Build the base layout and navigation shell. — Not started (FEAT-002's themed `App.tsx` shell is a token/component proof, not the real page chrome from `ui-guidelines.md` §7/§15).

**Next sprint preview — Sprint 2 (Authentication):** `AUTH-001`–`AUTH-006`, baseline `SYS-001`/`SYS-002` — see `docs/roadmap.md` §6.

---

# Documentation Status

| Document | Status | Last Updated | Owner |
|---|---|---|---|
| `docs/branding.md` | Approved | 2026-07-17 | Product Team |
| `docs/vision.md` | Approved | 2026-07-17 | Product Team |
| `docs/requirements.md` | Approved | 2026-07-17 | Product Team |
| `docs/user-stories.md` | Draft | 2026-07-17 | Product Team |
| `docs/architecture.md` | Approved | 2026-07-17 | Engineering Team |
| `docs/database.md` | Draft | 2026-07-17 | Engineering Team |
| `docs/api-design.md` | Draft | 2026-07-17 | Engineering Team |
| `docs/ui-guidelines.md` | Draft | 2026-07-21 (§21 token-gap fix, FEAT-002) | Design & Engineering Team |
| `docs/coding-standards.md` | Draft | 2026-07-17 | Engineering |
| `docs/roadmap.md` | Draft | 2026-07-17 | Engineering |
| `CLAUDE.md` | Draft | 2026-07-17 | Engineering |
| `docs/project-state.md` | Active (living document) | 2026-07-18 | Engineering (Claude Code-maintained) |
| `docs/decisions.md` | Active (living ADR index) | 2026-07-18 | Engineering |

---

# Repository Status

| Field | Value |
|---|---|
| **Main Branch** | `main` |
| **Latest Version** | Unreleased (pre-`v0.1.0`) — no tags cut yet |
| **Environment** | Local development only |
| **Deployment** | Not yet deployed — GitHub Actions CI is live; Vercel connection is a pending manual step for the developer (see **Blocked**) |
| **Database** | Supabase project not yet created — pending, carried into Sprint 1 kickoff |

---

# Testing Status

| Area | Status |
|---|---|
| **Unit Tests** | Vitest configured and running in CI (FEAT-009); one real test so far (`shared/lib/utils.test.ts`) — coverage grows as Services/Repositories/utilities are actually built |
| **Integration Tests** | Not started |
| **Manual Testing** | N/A |
| **Accessibility** | N/A |
| **Performance** | N/A |

---

# Deployment Status

| Environment | Status |
|---|---|
| **Development** | Not deployed |
| **Staging** | Not deployed |
| **Production** | Not deployed |

---

# Metrics

| Metric | Value |
|---|---|
| **Features Complete** | 0 / 54 MVP user stories (`user-stories.md` Epics 1–9) |
| **Features Remaining** | 54 |
| **Sprint Progress** | 1 / 10 sprints complete (Sprint 0) — Sprint 1 active, FEAT-001/FEAT-002/FEAT-004/FEAT-005/FEAT-006/FEAT-007/FEAT-008/FEAT-009 of an estimated ~10 Sprint 1 tasks done |
| **Documentation Progress** | 13 / 13 governing documents complete (100%) |
| **Known Bugs** | 0 |
| **Open Tasks** | 1 remaining Sprint 1 implementation item (base layout/nav shell), plus the developer's manual Vercel connection |

---

# Session Notes

_Append one entry per session, most recent last. Never edit or delete a prior entry — see Claude Instructions._

- **2026-07-17:** Completed the full documentation baseline — all ten `docs/*.md` files, `CLAUDE.md`, and this `project-state.md`. Sprint 0 closed. Sprint 1 (Project Foundation) is now the active sprint. No application code written yet.
- **2026-07-18:** Added `docs/decisions.md`, an 18-entry ADR log recording the rationale, alternatives, and revisit criteria behind every major decision baked into the existing documentation set. Sprint 1 remains the active sprint and is still not started — this was a documentation-consistency task, not sprint work.
- **2026-07-21:** Implemented FEAT-001 (Workspace Bootstrap), the first application-code task. Notable decisions made along the way (all stated as assumptions per `CLAUDE.md` §5, since docs were silent or scaffold defaults conflicted with approved docs):
  - No `tasks/Sprint-01/FEAT-001-workspace-bootstrap.md` existed when this task began; it was drafted this session (scoped to workspace-bootstrap only, deferring the rest of `roadmap.md` §5's Sprint 1 list to later FEAT tickets) since the task instruction directed deriving it from `roadmap.md`.
  - Vite's current `react-ts` scaffold defaults to `oxlint` instead of ESLint. Replaced it with ESLint (flat config) because `coding-standards.md` §3.3/§6 specifically requires `@typescript-eslint/no-explicit-any`, `import/no-cycle`, and an FSD boundary rule — none of which oxlint provides in the documented form. This is a case of following already-decided docs over a tool's new default, not an invented deviation.
  - Used `eslint-plugin-import-x` (the maintained fork) instead of `eslint-plugin-import`, which doesn't yet support ESLint 10 (peer dependency conflict). Same `no-cycle` rule, different package name.
  - `eslint-plugin-boundaries` v6/v7's real config API turned out to differ substantially from its own README's "Quick Example" (which documents v7's `policies` key) — v6.0.2 (installed) actually uses a `rules` key with `{ from: { type }, allow: [{ to: { type } }] }` entries, and element classification requires `mode: 'full'` with a recursive (`**`) pattern for layers like `app/` that don't have per-slice subfolders (the default `mode: 'folder'` only works for layers like `entities/*` that do, e.g. `entities/property/`). Also needed `eslint-import-resolver-typescript` wired in as `settings['import/resolver']`, since directory/index imports (e.g. `from '../../app'`) don't resolve without it — without that resolver, the boundaries rule silently no-ops on every barrel import. Verified the final rule actually fires by deliberately creating and lint-checking a throwaway cross-layer violation file before deleting it.
  - Replaced Vite's demo-branded `index.css` (purple accent tokens, fixed-width `#root`, Vite/React branding) with a minimal, neutral CSS reset — the real `ui-guidelines.md` §21 design tokens are out of scope for this task and shouldn't be pre-empted by leftover scaffold branding.
  - Deferred the FSD "no sibling-feature imports" refinement (`coding-standards.md` §3.2) — the coarse cross-layer direction rule is verified working, but the capture-based same-slice rule needs at least two real feature folders to test meaningfully against, and multiple hallucinated/deprecated config shapes were encountered for this plugin during this session; logged as technical debt for Sprint 2 rather than shipped unverified.

  Verified: `npm run dev` serves correctly (resolving through the `app/` barrel), `npm run build` succeeds, `npm run lint` and `npm run typecheck` both pass clean. Sprint 1 remains active; FEAT-001 is the only Sprint 1 item closed so far.
- **2026-07-21 (review pass):** FEAT-001 reviewed and approved. At the user's request, also reviewed FEAT-003 (Project Structure/FSD) — no task file existed for it either, so it was drafted (`tasks/Sprint-01/FEAT-003-project-structure-fsd.md`) from `coding-standards.md` §3, then checked item-by-item against FEAT-001's actual implementation rather than assumed complete. Result: 5 of 6 requirements already satisfied by FEAT-001 (folder skeleton, coarse import-direction rule, `import/no-cycle` equivalent, layer-ownership non-violation, folder-naming N/A-until-slices-exist); the sibling-feature-import isolation rule (§3.2) remains unimplemented and was left that way rather than built speculatively — recorded as technical debt (above) with its priority reassessed (rises to Medium-High once Sprint 2 adds a second feature). Formally recorded four ADRs (ADR-019 through ADR-022 in `docs/decisions.md`) covering the ESLint-over-oxlint choice, the eslint-plugin-import-x substitution, the verified eslint-plugin-boundaries configuration (including the specific pitfalls found: README/actual-schema mismatch, `mode: 'folder'` vs `mode: 'full'`, and the silent no-op without a resolver configured), and the sibling-feature-isolation deferral rationale. No new implementation work was started — this was a review-and-document-only pass.
- **2026-07-21 (FEAT-004):** Implemented Environment Configuration. The Supabase development project was created manually by the developer (outside this session) — no schema/auth/Supabase-client work was touched, per the task's explicit exclusions. Added `frontend/.env.example` (names only) and `frontend/.env.local` (initially blank — real Supabase URL/anon key were not available yet and were deliberately not invented). Hardened `.gitignore` in both `frontend/` and a new repo-root file to explicitly exclude `.env`/`.env.local`/`.env.*.local`, verified via `git check-ignore -v`. Added `frontend/src/vite-env.d.ts` (typed `ImportMetaEnv` augmentation) and the centralized, validated config module `frontend/src/shared/config/env.ts`, wired into `app/index.ts` so a missing required variable throws a clear, actionable error at bootstrap. Verified both the "missing variable throws" and "present variable loads cleanly" paths directly via `vite`'s `ssrLoadModule` (not just read the code and assumed) — the success-path check used obviously-fake, non-credential-shaped transient values (`https://example.test`, `test-value-not-real`) in `.env.local`, immediately reverted to blank afterward. `npm run lint`/`typecheck`/`build` all verified passing; `git status` confirmed no `.env`/`.env.local` tracked or staged; grepped `frontend/src` and the `dist/` build output for hardcoded Supabase values — none found. One ADR (ADR-023) recorded the centralized-env-access-module decision.
- **2026-07-21 (credentials supplied):** The developer provided the real Supabase development-project URL and anon key directly in conversation. Before using it, decoded the JWT payload to confirm it was genuinely the `anon`-role key (not `service_role`) — `role: "anon"` was visible in the (unencrypted, base64) JWT payload. Wrote both values into `frontend/.env.local` (never into any tracked/committed file — the actual credential values do not appear anywhere in `docs/*.md` or git history). Re-verified via `vite`'s `ssrLoadModule` that the real values load correctly through `shared/config/env.ts`, confirmed `git status`/`git check-ignore` still show the file as untracked/ignored, and confirmed `npm run dev` serves successfully with the real config in place. FEAT-004 is now fully complete with no outstanding credential gap.
- **2026-07-21 (FEAT-002):** Implemented Tailwind CSS v4 + shadcn/ui Setup. Installed `tailwindcss`/`@tailwindcss/vite`; rewrote `styles/index.css` as the Tailwind entry point with the full `ui-guidelines.md` §21 token block (plus the dark-mode override block, defined per §4.5/§21 but unused) and, while transcribing it, found that §21's own cheat-sheet had omitted `--color-card-foreground` despite §4.1 already deciding it, and never defined `--color-card`/`--color-destructive` at all (both needed for shadcn's vendor component class names) — fixed §21 in the same change per `CLAUDE.md` §8, rather than silently patching only the CSS. The installed shadcn CLI (`shadcn@4.13.1`) turned out to be a much newer, preset-driven tool (8 bundled design presets, none matching our already-decided tokens/font/icon choices) than the classic one the docs implicitly assumed; used the classic `style: "new-york"`/`baseColor: "neutral"` combination instead, via a hand-authored `components.json` targeting `shared/ui`/`shared/lib`. Hit two CLI quirks along the way: it initially failed to resolve the new `@/` path alias (it only reads the root `tsconfig.json`, not the referenced `tsconfig.app.json` where the alias actually lived) and created a stray literal `@/shared/ui/button.tsx` folder — fixed by also declaring `paths` in the root `tsconfig.json` and deleting the stray folder; and its dependency auto-install was inconsistent (`class-variance-authority` had to be installed manually even though `clsx`/`tailwind-merge` were correctly auto-installed for the `utils` registry item). Installed `Button` as an end-to-end proof and updated `App.tsx` to a themed shell using real tokens — closing Sprint 1's last open DoD item ("themed empty shell, not default Tailwind"). Verified: `npm run lint`/`typecheck`/`build` all pass (one expected, harmless `react-refresh` warning on the vendor `button.tsx`); the FSD boundary rule re-verified against the new `shared/ui`/`shared/lib` subfolders via a fresh throwaway violation file; confirmed via `grep` on the compiled CSS that real token hex values (not placeholders) are emitted once a token is actually used — Tailwind v4's `@theme` tokens are tree-shaken, which is expected content-aware behavior, not a bug. Also added `prettier-plugin-tailwindcss` (`coding-standards.md` §13), now that there are Tailwind classes to sort. One ADR (ADR-024) recorded the shadcn configuration-choice rationale.
- **2026-07-22 (FEAT-006):** Implemented TanStack Query Setup. Installed `@tanstack/react-query`; added `frontend/src/shared/lib/query-client.ts`, a single `QueryClient` with a project-wide default `staleTime` of 30s (the "property listings" tuning case from `coding-standards.md` §436, used as the sane common-case default — individual future hooks are expected to override it per query, e.g. `Infinity` for reference data or session-lifetime for the current user). Wired into the `shared/lib` barrel; mounted `QueryClientProvider` once in `app/App.tsx`, the app's single composition root. Deliberately wrote no `useQuery`/`useMutation` hook (no Repository/Service exists yet to wrap, per `api-design.md` §4's Hook → Service → Repository chain), no Devtools (optional, not in `roadmap.md` §5's Sprint 1 list), and made no change to Suspense-mode behavior (`coding-standards.md` §197 already decided standard mode). Verified: `npm run lint`/`typecheck`/`build` all pass (the sole ESLint warning is FEAT-002's pre-existing vendor-file warning, unrelated to this change); started `npm run dev` and confirmed via direct `curl` requests (not just a clean build) that `/`, `/src/main.tsx`, and `/src/app/App.tsx` all served HTTP 200 with correctly transformed ES modules, then stopped the dev server. The FSD `boundaries/dependencies` rule already permits `app → shared` with no config change needed, confirmed by lint passing clean. No new ADR — routine implementation of an already-decided technology choice (`roadmap.md` §5, `architecture.md` §10).
- **2026-07-22 (FEAT-007):** Implemented React Router Setup. Installed `react-router` (v8's unified package). Added `routes/paths.constants.ts` (all `architecture.md` §6 paths, grouped `public`/`authenticated`/`admin`), `routes/routes.tsx` (the `RouteObject[]` config, one entry per path plus a catch-all `*`, each pointing at one new `pages/PlaceholderPage.tsx`), and `app/router.tsx` (`createBrowserRouter`); `App.tsx` now renders `RouterProvider` inside `QueryClientProvider`, replacing FEAT-002's static proof shell. Filled in the `routes/` and `pages/` barrels, which had been left as explicit placeholder stubs anticipating exactly this ticket. Deliberately deferred, each with a stated reason recorded in the task file: route guards (needs Sprint 2 auth state), `React.lazy`/`Suspense` route splitting and a shared `<RouteErrorBoundary>` (real decided patterns, premature against one trivial shared placeholder), and the fully styled 404 empty state (`ui-guidelines.md` §19 — the catch-all resolves correctly today, just not yet with the real `EmptyState` component). Attempted browser-based verification first via the `claude-in-chrome` skill, but no Chrome extension connection was available this session; fell back to the same rigor used for FEAT-004/FEAT-005 instead of a lower-confidence check — a throwaway Node script loaded the real `routeConfig` via Vite's `ssrLoadModule` and ran React Router's own `matchRoutes` against all 15 real paths plus one bogus path, confirming each resolved to the exact intended page (verified by inspecting the matched route's rendered `title` prop, e.g. `/properties/some-slug` → "Property Details", `/totally-bogus-route` → "Not Found"), then deleted the script. `npm run lint`/`typecheck`/`build` all pass (same single pre-existing FEAT-002 warning, nothing new). No new ADR — routine implementation of an already-decided route list and technology choice (`roadmap.md` §5, `architecture.md` §6).
- **2026-07-22 (FEAT-008):** Implemented React Hook Form + Zod Setup. Installed `react-hook-form`, `zod`, `@hookform/resolvers` as direct dependencies — `zod` had only been present transitively before this (via `eslint-plugin-react-hooks`), which app code shouldn't have relied on. Rather than build a real form with no real feature to back it, followed the roadmap's own "throwaway form" framing literally: wrote a temporary Zod schema + `useForm`/`zodResolver` component, verified it two ways — the TypeScript generics compile clean under strict mode (ruling out a real class of RHF/`@hookform/resolvers`/Zod version-triangle mismatch), and, since no jsdom/browser was available to simulate real user interaction, called the resolver function `zodResolver(Schema)` returns directly against RHF's own `Resolver` contract shape, with an invalid email, an empty required field, and a valid email — confirming the exact custom error messages and parsed values came back correctly, not just that nothing threw. Deleted both throwaway files immediately after, then rebuilt and confirmed the production bundle's module count and output file hashes were byte-identical to FEAT-007's — proof nothing was left behind. Deliberately did not build any real form, any shared form primitive (`Input`/`Label`/`FieldError`), or a test framework (Vitest) — all belong with whichever ticket actually needs them first. `npm run lint`/`typecheck`/`build` all pass. No new ADR — routine implementation of an already-decided technology choice.
- **2026-07-22 (FEAT-009):** Implemented CI/CD Setup. Added `.github/workflows/ci.yml`, running `npm ci` → lint → typecheck → test → build on every PR to `main` and on direct pushes to `main`, scoped to `frontend/`. `npm run test` had no script at all going into this ticket, so — rather than leave the CI `test` step with nothing real to run, or spin off a whole separate ticket for what's a small, obviously-needed gap — bootstrapped a minimal Vitest setup in the same change: installed `vitest`, moved `vite.config.ts` to `vitest/config`'s `defineConfig` (so Vitest inherits the `@/` alias for free), set the test environment to `node` (not `jsdom` — no component test exists yet to need a DOM; that dependency arrives with the first one), and wrote one real unit test suite (three cases) against the previously-untested `cn()` utility. Added `frontend/vercel.json` with an SPA rewrite rule — necessary because FEAT-007's `createBrowserRouter` client-side routing would otherwise 404 on Vercel's static hosting for any direct/refreshed navigation to a non-root path. Ran all four CI commands locally (`lint`/`typecheck`/`test`/`build`) and confirmed each passes clean, matching exactly what the workflow will run. Could not complete the actual Vercel account connection — that requires the developer's own login/OAuth grant to vercel.com, which is outside what any coding session can do; documented the exact manual steps (set Root Directory to `frontend`, add the two `VITE_` env vars, deploy) directly in the task file and recorded it under **Blocked** rather than silently marking the DoD line done. Also flagged GitHub branch protection (requiring the CI check before merge) as a manual follow-up, since that's a GitHub repo-settings action, not a file this session can commit. No new ADR — routine implementation of an already-decided deployment strategy (ADR-016).

---

# Next Recommended Action

**Highest-priority next task:** FEAT-001, FEAT-002, FEAT-003 (substantially), FEAT-004, FEAT-005, FEAT-006, FEAT-007, FEAT-008, and FEAT-009 (repository side) are all closed. Every item in `roadmap.md` §5's "Initialize" and "Configure" lists is now done except the base layout/nav shell. Recommended next: **the real base layout/nav shell** (`ui-guidelines.md` §7/§15 — header/footer regions, top nav + mobile drawer scaffold with placeholder links, distinct from the current per-route `PlaceholderPage`s) — the last unstarted Sprint 1 implementation item. In parallel (not blocking further coding work): **the developer needs to manually connect the repo to Vercel** — see **Blocked** and `tasks/Sprint-01/FEAT-009-cicd-setup.md` §4. Once the layout/nav shell lands and Vercel is connected, do an explicit full Sprint 1 DoD re-check against `roadmap.md` §5 before declaring Sprint 1 done and starting Sprint 2 (`AUTH-001`–`AUTH-006`).

**Also worth noting for a resuming session:** browser-based UI verification (`claude-in-chrome`) was unavailable this session — the user began installing the extension but chose to continue without it. `/chrome` will complete the connection once installed; until then, route/UI changes are being verified via Vite's `ssrLoadModule` + targeted assertions rather than an actual rendered browser, which is a reasonable substitute but not a full substitute for the Definition of Done's "verified accessible/responsive" checks (§13) — those will need a real browser once available, before Sprint 1 is called fully done.

Do not begin any Sprint 2 (Authentication) work until Sprint 1's Definition of Done (above) is fully met, per `docs/roadmap.md` §23 and `CLAUDE.md` §5.

---

# Claude Instructions

**Before every coding session:**
1. Read this file in full.
2. Read the current sprint's section in `docs/roadmap.md`.
3. Continue from the **Current Task** / **Next Recommended Action** above — do not start unrelated work.
4. Update this file before finishing the session (see below).

**Update rules:**
- **Never overwrite history.** Completed Tasks, Recent Changes, and Session Notes are append-only logs — a past entry is never edited or deleted to reflect new information; a correction is a *new* entry noting the correction.
- **Append updates instead of replacing sections wholesale.** Move a task from "In Progress" to "Completed Tasks" rather than deleting it; add a new bullet to "Recent Changes" rather than rewriting the existing summary.
- **Maintain chronological order.** Every dated entry (Completed Tasks, Session Notes, Technical Debt) is added in date order, oldest first, at the end of its list.
- **Always update, in this order, at the end of a session:** Current Task → Completed Tasks (if finished) → In Progress / Blocked / Pending Decisions (if changed) → Recent Changes → Metrics → Session Notes → Next Recommended Action.
- **Keep dates in absolute `YYYY-MM-DD` form**, never relative ("today", "yesterday") — this file is read cold by sessions with no memory of when "today" was.
