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
- [ ] `npm run dev` runs the app locally, themed with `ui-guidelines.md`'s tokens (not default Tailwind).
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` all pass.
- [ ] A merged PR triggers a real Vercel preview deployment.
- [ ] FSD folder structure exists; import-boundary lint rule is active and passing.
- [ ] No feature-specific code has been written — infrastructure only.

**Current Progress:** 0% — not yet started. See **Next Recommended Action** below.

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
| **Dependencies** | Sprint 0 documentation baseline (complete) |
| **Notes** | No task is currently in progress. See **Next Recommended Action**. |

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
| _None recorded yet._ | — | — | — |

This table populates per `docs/roadmap.md` §17 as debt is deliberately incurred and documented — never retroactively, never for an undocumented shortcut.

---

# Known Issues

_None recorded yet — no application code exists._

---

# Recent Changes

**2026-07-17 — Documentation baseline complete.** All ten `docs/*.md` files, the root `CLAUDE.md` operating manual, and this `project-state.md` file were written and committed, closing Sprint 0. No application code has been written yet; the repository currently contains only documentation and empty scaffold directories (`frontend/`, `supabase/`, `tasks/`).

**2026-07-18 — Architecture Decision Record log added.** `docs/decisions.md` was written, recording 18 accepted ADRs covering every major product/architectural/engineering decision made during Sprint 0 (documentation-driven engineering, the full technology stack, FSD, the Repository/Service split, RLS-as-authority, the agency-first ownership model, the verification workflow, and the specific database exceptions such as the roles enum/metadata split and composite junction-table keys). This is a documentation-only change — no application code affected, no decisions altered, only the rationale behind already-approved decisions made explicit and citable by ADR ID going forward.

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
| **Sprint Progress** | 1 / 10 sprints complete (Sprint 0) — Sprint 1 active |
| **Documentation Progress** | 13 / 13 governing documents complete (100%) |
| **Known Bugs** | 0 |
| **Open Tasks** | 10 (Sprint 1 task list, above) |

---

# Session Notes

_Append one entry per session, most recent last. Never edit or delete a prior entry — see Claude Instructions._

- **2026-07-17:** Completed the full documentation baseline — all ten `docs/*.md` files, `CLAUDE.md`, and this `project-state.md`. Sprint 0 closed. Sprint 1 (Project Foundation) is now the active sprint. No application code written yet.
- **2026-07-18:** Added `docs/decisions.md`, an 18-entry ADR log recording the rationale, alternatives, and revisit criteria behind every major decision baked into the existing documentation set. Sprint 1 remains the active sprint and is still not started — this was a documentation-consistency task, not sprint work.

---

# Next Recommended Action

**Highest-priority next task:** Complete the two carried-over Sprint 0 infrastructure items — (1) confirm the GitHub repository is initialized with the documentation baseline pushed, and (2) create the Supabase development project and store its credentials in a local, gitignored `.env.local` — then begin Sprint 1, Task 1: scaffold the React 19 + TypeScript + Vite project inside `frontend/`.

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
