# FEAT-001 — Workspace Bootstrap

> **Sprint:** Sprint 1 — Project Foundation
> **Status:** Completed — 2026-07-21
> **Priority:** Critical
> **Derived from:** `docs/roadmap.md` §5 (Sprint 1 — Project Foundation), scoped down to only the "Initialize the app skeleton" slice per the task instruction that created this file. This document was drafted by Claude Code because no pre-existing task file existed at the time work began (2026-07-20) — see `docs/project-state.md` Session Notes for that day.

---

## 1. Objective

Establish a production-ready, empty React + TypeScript + Vite workspace in `frontend/` that:

- Follows the FSD folder structure defined in `docs/architecture.md` §5 and `docs/coding-standards.md` §3.
- Compiles under strict TypeScript settings (`coding-standards.md` §6).
- Lints cleanly under rules that enforce this project's architectural boundaries (no `any`, no import cycles, FSD layer direction).
- Runs locally (`npm run dev`) and builds for production (`npm run build`) without errors.

This is infrastructure-only work. **No feature-specific code, no styling system, no data layer, and no routing are part of this task.**

---

## 2. In Scope

- Scaffold React 19 + TypeScript + Vite in `frontend/` (Vite's official `react-ts` template as the starting point, with template boilerplate — the counter demo, default assets — removed).
- `tsconfig`: `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, per `coding-standards.md` §6.
- The full FSD folder skeleton under `src/`: `app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/`, `routes/`, `assets/`, `styles/`, each with a placeholder `index.ts` barrel (`coding-standards.md` §3, §4).
- `app/` bootstraps the React tree (`main.tsx` renders an `App` component sourced from `app/`) — an empty shell, no providers yet (Query/Router/etc. are later tickets).
- ESLint (flat config) configured with: `@typescript-eslint/no-explicit-any`, `import/no-cycle`, an FSD layer-boundary rule (`eslint-plugin-boundaries` matching `coding-standards.md` §3.2's downward-only import direction), and `no-console` (allowing only `warn`/`error`, per `coding-standards.md` §22).
- Prettier configured for consistent formatting (the Tailwind class-sorting plugin is deferred to the ticket that introduces Tailwind, since there are no Tailwind classes yet to sort).
- `package.json` scripts: `dev`, `build`, `preview`, `lint`, `typecheck`.
- Verification: dev server starts, production build succeeds, lint passes, `tsc --noEmit` passes.

## 3. Explicitly Out of Scope (deferred to later tickets)

- Tailwind CSS v4, shadcn/ui, and the `ui-guidelines.md` §21 design-token `@theme` block.
- The Supabase client (`shared/lib/supabase.ts`).
- TanStack Query and its `QueryClientProvider`.
- React Router and the route skeleton (`architecture.md` §6).
- React Hook Form + Zod.
- GitHub Actions CI and Vercel preview deployment wiring.
- Base page layout (header/footer) and the navigation shell.

These remain tracked against Sprint 1's full Definition of Done in `docs/roadmap.md` §5 and `docs/project-state.md`, and will be picked up as FEAT-002 and onward.

## 4. Definition of Done

- [x] `npm run dev` starts the app locally with no errors.
- [x] `npm run build` succeeds.
- [x] `npm run lint` passes with zero errors.
- [x] `npm run typecheck` (`tsc -b`, equivalent to `--noEmit` since every tsconfig has `noEmit: true`) passes clean.
- [x] FSD folder skeleton exists under `frontend/src/` matching `architecture.md` §5.
- [x] The FSD import-boundary lint rule is active — verified by deliberately introducing and lint-checking a cross-layer violation (entities → app), confirming it's caught, then removing the test file.
- [x] No feature-specific code, styling system, data layer, or routing has been added.
- [x] `docs/project-state.md` updated to reflect completion and the next task.
