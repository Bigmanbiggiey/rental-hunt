# FEAT-009 — CI/CD Setup

> **Sprint:** Sprint 1 — Project Foundation
> **Status:** Completed (repository side) — 2026-07-22. Vercel connection itself remains a manual step for the developer — see §4.
> **Priority:** Critical
> **Derived from:** `docs/roadmap.md` §5's Configure bullet: "CI/CD: GitHub Actions workflow running install → lint → type-check → test on every PR; Vercel connected for preview deployments." No pre-existing task file existed under this ID; drafted during implementation.

---

## 1. Objective

Stand up the GitHub Actions pipeline (`roadmap.md` §29's "every PR runs lint/typecheck/test before merge") and prepare the repository for Vercel preview deployments (`architecture.md` §19, ADR-016), closing Sprint 1's two remaining CI/CD-related Definition of Done lines.

## 2. In Scope

- `.github/workflows/ci.yml` — triggered on every `pull_request` targeting `main` (and `push` to `main`, so a direct merge is still checked): `npm ci` → `npm run lint` → `npm run typecheck` → `npm run test` → `npm run build`, all scoped to `frontend/` via `working-directory`.
- **A real, minimal Vitest setup** — not a no-op. `roadmap.md` §5's Definition of Done explicitly allows "the test suite may be empty at this point," but a CI `test` step needs an actual passing script to run, not a fabricated stand-in. Scoped in here (rather than left as a dangling gap or spun into its own ticket) since CI/CD cannot meaningfully close without it: `vitest` installed, `test`/`test:run` scripts added, Vitest configured to share `vite.config.ts` (including the `@/` alias), and one real unit test — `shared/lib/utils.test.ts` against the existing, previously-untested `cn()` utility (`coding-standards.md` §19's own "utilities" category, not a synthetic placeholder).
- `vercel.json` — SPA rewrite (`{ "source": "/(.*)", "destination": "/index.html" }`). Required because `FEAT-007` chose client-side routing (`createBrowserRouter`); without an explicit rewrite, Vercel's static hosting 404s on any direct/refreshed navigation to a non-root path (`/properties/some-slug`, `/dashboard`, etc.) — a real deployment necessity following directly from an already-made architecture decision, not a speculative addition.
- Documentation of the one step that cannot be completed from this session: connecting the GitHub repository to a Vercel project. That requires the developer's own Vercel account/OAuth grant — see §4.

## 3. Explicitly Out of Scope / Cannot Be Completed Here

- **Actually connecting the repository to Vercel and confirming a live preview URL.** This needs the developer to authenticate to their own Vercel account (`vercel.com` → Import Git Repository, or the Vercel CLI's interactive `vercel login`) — an external, credentialed action no coding session can perform on the developer's behalf. Everything on the repository side (`vercel.json`, a working build) is prepared and ready for that connection; see §4 for exact steps.
- **A broader Vitest test suite.** Only the one real `cn()` test is added — building out coverage for Services/Repositories/components that don't exist yet would be speculative. The **coverage floor** (`coding-standards.md` §19: >80% for Services/Repositories) starts applying once those layers have real code.
- **Database migrations via CI/CD** (`roadmap.md` §17's "Applied via the Supabase CLI through CI/CD") — no migrations exist yet; `database.md`'s schema hasn't been applied to any environment. Tracked as a Sprint 2+ concern once the first migration exists.
- **Branch protection rules requiring the CI check to pass before merge.** GitHub branch-protection settings are a repository-admin action taken in GitHub's UI/API, not a file in the repo; noted as a manual follow-up for the developer (§4), not something this ticket can silently assume is on.

## 4. Manual Steps Required From the Developer

1. **Connect Vercel:** go to vercel.com → Add New → Project → Import `Bigmanbiggiey/rental-hunt` from GitHub → set the project **Root Directory** to `frontend` (critical — the repo root has no `package.json`) → deploy. Vercel auto-detects the Vite framework preset once the root directory is set correctly.
2. **Environment variables in Vercel:** add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the same real dev-project values already in `frontend/.env.local`) to the Vercel project's Environment Variables settings — these are not committed to the repo (`coding-standards.md` §21) and won't be picked up automatically.
3. **(Recommended) GitHub branch protection:** in the repository's Settings → Branches, require the `CI` workflow's check to pass before merging to `main`, per `roadmap.md` §29's "no PR merges on a red pipeline."

## 5. Definition of Done

- [x] `.github/workflows/ci.yml` created: install → lint → typecheck → build → test, on every PR to `main`.
- [x] `vitest` installed; `npm run test` is a real, passing script (one genuine unit test, not a placeholder).
- [x] `vercel.json` created with the SPA rewrite rule.
- [x] `npm run lint`/`typecheck`/`build`/`test` all verified passing locally (the same commands CI will run).
- [x] Manual Vercel-connection steps documented for the developer (§4) — cannot be completed by this session.
- [x] `docs/project-state.md` updated.
