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
- [ ] `npm run dev` runs the app locally, themed with `ui-guidelines.md`'s tokens (not default Tailwind). *(Partially met: the dev server runs an untethemed, unbranded empty shell — Tailwind/tokens are FEAT-002+ work.)*
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` all pass. *(Partially met: lint and typecheck both pass clean; no test script/suite exists yet — Vitest setup is not part of FEAT-001.)*
- [ ] A merged PR triggers a real Vercel preview deployment. *(Not started — CI/CD and Vercel wiring are out of FEAT-001's scope.)*
- [x] FSD folder structure exists; import-boundary lint rule is active and passing. — 2026-07-21 (FEAT-001)
- [x] No feature-specific code has been written — infrastructure only. — 2026-07-21 (FEAT-001)

**Current Progress:** ~15% — FEAT-001 (Workspace Bootstrap) complete: React 19 + TypeScript + Vite scaffolded, FSD folder skeleton in place, ESLint (with the FSD import-boundary rule) and Prettier configured, dev server/build/lint/typecheck all passing. Tailwind/shadcn, Supabase, TanStack Query, React Router, React Hook Form + Zod, CI/CD, and the base layout/nav shell remain — see **Next Recommended Action**.

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
| **Dependencies** | FEAT-001 (Workspace Bootstrap, complete) |
| **Notes** | No task is currently in progress. FEAT-001 just closed — see **Completed Tasks** and **Next Recommended Action**. |

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

- [x] `FEAT-001` — Workspace Bootstrap — 2026-07-21. Scaffolded React 19 + TypeScript + Vite in `frontend/`; built the full FSD folder skeleton (`app/pages/widgets/features/entities/shared/routes/assets/styles`) with placeholder barrels; configured strict TypeScript (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`); replaced the scaffold's default `oxlint` with ESLint (flat config) per `coding-standards.md` §3.3/§6, wiring up `@typescript-eslint/no-explicit-any`, `import-x/no-cycle`, `no-console`, and an `eslint-plugin-boundaries`-enforced FSD import-direction rule; configured Prettier. `npm run dev`, `npm run lint`, `npm run typecheck`, and `npm run build` all verified passing. No feature code, styling system, data layer, or routing was added — see `tasks/Sprint-01/FEAT-001-workspace-bootstrap.md` for the full scoped spec (drafted this session, since no task file pre-existed) and the Session Notes entry below for implementation details/decisions.

---

# In Progress

_Nothing is currently in progress._

---

# Blocked

_Nothing is currently blocked._

---

# Pending Decisions

_No pending decisions at this time._

---

# Technical Debt

| Issue | Impact | Priority | Status |
|---|---|---|---|
| The ESLint `boundaries/dependencies` rule (FEAT-001) enforces the coarse cross-layer FSD direction rule (`coding-standards.md` §3.2) but not the finer "a feature may not import a sibling feature" rule, since `features/` has no real slices yet to verify a capture-based rule against. | Low now (no features exist to violate it); the layer-direction rule is the part that matters for an empty skeleton. | Medium | Open — revisit when Sprint 2 adds a second real feature slice (`AUTH-*`), so the capture-based rule can be added and tested against real sibling folders. |

This table populates per `docs/roadmap.md` §17 as debt is deliberately incurred and documented — never retroactively, never for an undocumented shortcut.

---

# Known Issues

_None recorded yet — no application code exists._

---

# Recent Changes

**2026-07-17 — Documentation baseline complete.** All ten `docs/*.md` files, the root `CLAUDE.md` operating manual, and this `project-state.md` file were written and committed, closing Sprint 0. No application code has been written yet; the repository currently contains only documentation and empty scaffold directories (`frontend/`, `supabase/`, `tasks/`).

**2026-07-18 — Architecture Decision Record log added.** `docs/decisions.md` was written, recording 18 accepted ADRs covering every major product/architectural/engineering decision made during Sprint 0 (documentation-driven engineering, the full technology stack, FSD, the Repository/Service split, RLS-as-authority, the agency-first ownership model, the verification workflow, and the specific database exceptions such as the roles enum/metadata split and composite junction-table keys). This is a documentation-only change — no application code affected, no decisions altered, only the rationale behind already-approved decisions made explicit and citable by ADR ID going forward.

**2026-07-21 — FEAT-001 (Workspace Bootstrap) complete.** The first application code in the repository: `frontend/` now contains a working React 19 + TypeScript + Vite workspace with the full FSD folder skeleton, strict TypeScript, and an ESLint + Prettier setup enforcing the FSD import-direction rule. `docs/roadmap.md` §5's full Sprint 1 scope (Tailwind/shadcn, Supabase, TanStack Query, Router, RHF+Zod, CI/CD, base layout) was deliberately not attempted — this task was scoped narrowly to workspace bootstrap only, per the task instruction that created it. See **Completed Tasks** for the full detail and **Technical Debt** for one deferred refinement.

---

# Upcoming Tasks

**Immediate (Sprint 1 kickoff, carried over from Sprint 0):**
1. Confirm the GitHub repository is initialized and the documentation baseline is pushed.
2. Create the Supabase development project and record credentials in a local, gitignored `.env.local`.

**Sprint 1 — Project Foundation:**
3. Scaffold React 19 + TypeScript + Vite in `frontend/`.
4. Install and configure Tailwind CSS v4 + shadcn/ui with the `ui-guidelines.md` §21 token set.
5. Wire up the Supabase client, TanStack Query, React Router, React Hook Form + Zod.
6. Configure ESLint (including the FSD import-boundary rule and `no-explicit-any`) and Prettier (`prettier-plugin-tailwindcss`).
7. Build the full FSD folder skeleton.
8. Set up environment variables (`.env.local`, `VITE_`-prefixed only).
9. Set up GitHub Actions CI (lint → typecheck → test) and connect Vercel for preview deployments.
10. Build the base layout and navigation shell.

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
| `docs/ui-guidelines.md` | Draft | 2026-07-17 | Design & Engineering Team |
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
| **Deployment** | Not yet deployed — pending Sprint 1 CI/CD + Vercel setup |
| **Database** | Supabase project not yet created — pending, carried into Sprint 1 kickoff |

---

# Testing Status

| Area | Status |
|---|---|
| **Unit Tests** | Not started — no application code exists yet |
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
| **Sprint Progress** | 1 / 10 sprints complete (Sprint 0) — Sprint 1 active, FEAT-001 of an estimated ~10 Sprint 1 tasks done |
| **Documentation Progress** | 13 / 13 governing documents complete (100%) |
| **Known Bugs** | 0 |
| **Open Tasks** | 9 remaining Sprint 1 items (Tailwind/shadcn, Supabase client, TanStack Query, Router, RHF+Zod, CI/CD, base layout/nav) |

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

---

# Next Recommended Action

**Highest-priority next task:** FEAT-001 (Workspace Bootstrap) is complete. The two carried-over Sprint 0 infrastructure items are still open and should come next: (1) confirm the GitHub repository is initialized with the documentation baseline pushed, and (2) create the Supabase development project and store its credentials in a local, gitignored `frontend/.env.local`. After that, continue Sprint 1 with a FEAT-002-style ticket covering Tailwind CSS v4 + shadcn/ui with the `ui-guidelines.md` §21 design tokens (the next item in `roadmap.md` §5's Initialize list not yet done), followed by the Supabase client, TanStack Query, React Router, React Hook Form + Zod, CI/CD (GitHub Actions + Vercel), and the base layout/nav shell.

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
