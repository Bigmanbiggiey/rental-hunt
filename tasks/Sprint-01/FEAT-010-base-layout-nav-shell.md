# FEAT-010 — Base Layout & Navigation Shell

> **Sprint:** Sprint 1 — Project Foundation
> **Status:** In Progress — 2026-07-23
> **Priority:** Critical
> **Derived from:** `docs/roadmap.md` §5's Configure bullets: "Base layouts: the shared page shell (header/footer regions) per `ui-guidelines.md` §7" and "Navigation shell: top nav + mobile drawer scaffold (`ui-guidelines.md` §15), with no real links behind it yet beyond placeholders." No pre-existing task file existed under this ID; drafted during implementation. This is the last unstarted item from `roadmap.md` §5.

---

## 1. Objective

Build the persistent page chrome — desktop top nav, mobile top bar + off-canvas Drawer, and a minimal footer — matching `ui-guidelines.md` §15 (Navigation) and §11.11 (Drawer), wrapping every route defined in FEAT-007 via a nested React Router layout route, replacing the flat route list with `AppLayout` as the parent.

## 2. In Scope

- `lucide-react` installed (`ui-guidelines.md` §10's exclusive icon library — not yet a dependency).
- A `Sheet` primitive added to `shared/ui` (shadcn/Radix `Dialog`-based off-canvas panel — the underlying mechanism `ui-guidelines.md` §11.11's Drawer spec describes: focus-trap, `Esc`-to-close, slides from an edge).
- `widgets/layout/Header.tsx` — desktop (≥ `lg`): logo (text wordmark, links home) → primary nav (`<nav aria-label="Primary">`, "Browse Properties") → guest auth actions (Login/Register). Mobile (< `lg`): logo + hamburger trigger only.
- `widgets/layout/MobileNavDrawer.tsx` — the same link set as desktop, stacked vertically, slides in from the left, auth actions at the bottom, per §11.11/§15.2.
- `widgets/layout/Footer.tsx` — minimal (brand name + copyright line). No footer-specific link/content spec exists anywhere in `ui-guidelines.md`, so nothing beyond that minimum is fabricated.
- `widgets/layout/AppLayout.tsx` — composes `Header` + `<main><Outlet /></main>` + `Footer`; receives `homeHref`/`primaryLinks`/`authLinks` as props (kept presentation-only and route-agnostic — see §3's FSD note).
- `routes/routes.tsx` restructured: every existing route nests under one layout route rendering `<AppLayout />`, with the nav's link data (built from the already-existing `PATHS`) passed in as props.
- `pages/PlaceholderPage.tsx` adjusted: drops its own `<main>` wrapper (now owned by `AppLayout`, avoiding a duplicate landmark) in favor of a plain `<div>` with the same layout classes.
- `widgets/index.ts` barrel updated.

## 3. A Real FSD Boundary Constraint Found Mid-Task (resolved, not deviated from)

`coding-standards.md` §3.2's import-direction rule — and the already-configured `eslint-plugin-boundaries` rule from FEAT-001 — allows `widgets/` to import from `widgets`/`features`/`entities`/`shared`, but **not** from `routes/`. `routes/paths.constants.ts` (FEAT-007) therefore cannot be imported directly by a `widgets/layout` component. Resolution: `Header`/`MobileNavDrawer`/`AppLayout` accept plain `{ label, to }` link data as props; only `routes/routes.tsx` (which is allowed to import both `routes` and `widgets`) reads `PATHS` and passes the resulting link arrays down. This keeps the layout widgets genuinely reusable/route-agnostic (`architecture.md` §5's own description of `widgets/`) rather than requiring a rule exception or relocating FEAT-007's file — no lint config change was needed.

## 4. Explicitly Out of Scope

- **The search affordance** in `ui-guidelines.md` §15.1's desktop nav description. No search feature/backend exists until Sprint 3 (`DISC-002`); a decorative, non-functional search box would be worse than omitting it. Deferred to Sprint 3.
- **Role-based/authenticated nav states** (Dashboard link, Favorites/Bookings quick-access icon, Avatar/User Menu dropdown, `ui-guidelines.md` §15.1/§15.2/§13.9). No auth/session state exists until Sprint 2 (`AUTH-*`). The nav renders the guest state only (Login/Register); switching the right-hand cluster on session state arrives with Sprint 2.
- **Breadcrumbs** (`ui-guidelines.md` §15.3) — explicitly not shown on the homepage or auth pages, and no property-detail/dashboard sub-pages exist yet for the cases where they would be shown.
- **The Dashboard sidebar layout** (`ui-guidelines.md` §7.3/§7.4, §13.7) — a distinct layout for the authenticated dashboard shell, out of scope until a dashboard exists (Sprint 5+).
- **A real footer content strategy** (site map links, social links, legal links) — no such spec exists in any approved doc yet; inventing one would be guessing at undecided content. Flagged as a documentation gap worth a `ui-guidelines.md` addition whenever the real footer requirements are decided.

## 5. Definition of Done

- [x] `lucide-react` installed.
- [x] `Sheet` primitive added to `shared/ui`.
- [x] `Header`, `MobileNavDrawer`, `Footer`, `AppLayout` built in `widgets/layout/`.
- [x] `routes/routes.tsx` nests all routes under `AppLayout`; `PlaceholderPage` no longer renders a duplicate `<main>`.
- [x] `npm run lint`/`typecheck`/`test`/`build` all pass.
- [x] Verified: desktop nav, mobile hamburger + Drawer open/close, and keyboard operability (Tab order, `Esc` closes the Drawer, focus returns to the trigger) — via the same non-browser verification approach used for FEAT-007/FEAT-008, since no Chrome connection is available this session.
- [x] `docs/project-state.md` updated.
