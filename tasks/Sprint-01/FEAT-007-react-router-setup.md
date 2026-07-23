# FEAT-007 — React Router Setup

> **Sprint:** Sprint 1 — Project Foundation
> **Status:** Completed — 2026-07-22
> **Priority:** Critical
> **Derived from:** `docs/roadmap.md` §5's Initialize bullet: "React Router (route skeleton matching `architecture.md` §6: public, authenticated, admin route groups)." No pre-existing task file existed under this ID; drafted during implementation.

---

## 1. Objective

Wire up React Router as the route skeleton for all paths decided in `architecture.md` §6 (public, authenticated, administrative groups), matching the FSD layer split from `coding-standards.md` §3 (`routes/` = route definitions, `pages/` = route-level composition, `app/` = router instantiation) — with no route guards, no real page content, and no feature-specific code, per this sprint's "infrastructure only" boundary.

## 2. In Scope

- `react-router` installed (v7's unified package — `RouterProvider`/`createBrowserRouter` from `react-router`, not the legacy `react-router-dom` split).
- `frontend/src/routes/paths.constants.ts` — a single `PATHS` object enumerating every path from `architecture.md` §6, grouped `public`/`authenticated`/`admin` exactly as that section groups them.
- `frontend/src/routes/routes.tsx` — the `RouteObject[]` route config, one entry per path (plus a catch-all `*`), each pointing at the one shared `PlaceholderPage`.
- `frontend/src/pages/PlaceholderPage.tsx` — a minimal, themed (real tokens, proving FEAT-002's theming still applies through the router) placeholder used by every route until each page gets its real implementation in the sprint that owns it (Home/Properties in Sprint 3, Property Details in Sprint 4, Login/Register/Forgot Password in Sprint 2, Dashboard/Favorites/Bookings/Profile across Sprints 2/5/7, Admin/* in Sprint 9).
- `frontend/src/app/router.tsx` — `createBrowserRouter(routeConfig)`.
- `App.tsx` updated to render `<RouterProvider router={router} />` inside the existing `QueryClientProvider`, replacing the static FEAT-002 proof shell.
- Barrels (`routes/index.ts`, `pages/index.ts`) updated to export the new public surface.

## 3. Explicitly Out of Scope

- **Route guards / protected routes.** `architecture.md` §6's authenticated and admin groups are represented here only as *paths* — actual auth-based redirection is `roadmap.md` §6's `AUTH-*`-scoped "Protected Routes" story (Sprint 2), since it needs session state that doesn't exist yet. Building a guard now against no real auth would be premature.
- **Real page components.** Every route renders the same generic `PlaceholderPage`; no `HomePage`, `LoginPage`, etc. is fabricated ahead of the sprint that actually owns that page's design and data. This is deliberately analogous to FEAT-002 installing one `Button` as an end-to-end proof rather than a full component library.
- **`React.lazy` route-level code splitting** (`coding-standards.md` §7/§195). The rule is real and will be honored once real (non-trivial) page components exist to split on; applying `React.lazy` now to one trivial shared placeholder used by every route has no measurable benefit and would be complexity for its own sake (`CLAUDE.md` §2's "avoid unnecessary complexity"). Flagged here as a deliberate, documented deferral — not a silently dropped requirement — for whichever ticket adds the first real page.
- **`<RouteErrorBoundary>`** (`coding-standards.md` §194). Same reasoning: a shared route error boundary is real architecture, but wrapping it around a placeholder with nothing that can meaningfully throw yet is premature; deferred to the first real page ticket.
- **The styled 404 empty state** (`ui-guidelines.md` §19's documented copy/CTA). The catch-all `*` route exists and resolves correctly, but renders the same generic `PlaceholderPage` rather than the full `EmptyState` component (which doesn't exist yet) — building that component now, for one route, ahead of any of its other real use cases (empty search results, empty favorites, etc.) would be a premature, single-use abstraction.

## 4. Definition of Done

- [x] `react-router` installed.
- [x] `routes/paths.constants.ts` created, matching every path in `architecture.md` §6 exactly.
- [x] `routes/routes.tsx` created, one route per path plus a catch-all.
- [x] `pages/PlaceholderPage.tsx` created, using real `ui-guidelines.md` §21 tokens.
- [x] `app/router.tsx` created; `App.tsx` renders `RouterProvider` inside `QueryClientProvider`.
- [x] `routes/index.ts` and `pages/index.ts` barrels updated.
- [x] `npm run lint`/`typecheck`/`build` all pass.
- [x] `npm run dev` verified: at least one route from each of the three groups (public, authenticated, admin) and the catch-all confirmed to actually render, not just assumed from the route config.
- [x] `docs/project-state.md` updated.
