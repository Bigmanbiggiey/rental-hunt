# AUTH-002 / AUTH-005 — Login, Session Persistence, Protected Routes

> **Sprint:** Sprint 2 — Authentication
> **Status:** Completed — 2026-07-24
> **Priority:** Critical
> **Derived from:** `docs/user-stories.md` AUTH-002/AUTH-005, `docs/roadmap.md` §6 ("Protected Routes"). Bundled together since they're inherently interdependent — session persistence has nothing to observe without login, and protected routes have nothing to guard without both.

---

## 1. Objective

Let a registered user log in, keep their session across a page refresh (no flash of logged-out state), and be redirected away from authenticated/admin routes when not permitted — both client-side and backed by RLS.

## 2. In Scope

- `LoginSchema`, `useLogin`, `LoginForm` (generic `INVALID_CREDENTIALS` message, never reveals which field was wrong, per `api-design.md` §5.2), real `LoginPage` at `/login`. Redirects back to wherever the user was trying to go (`location.state.from`) after a successful login, falling back to home.
- `AuthProvider` (built in `AUTH-001`) mounted in `app/App.tsx`, wrapping `RouterProvider`, so session state is available app-wide from the first render.
- `ProtectedRoute` (`features/authentication`) — a layout-route guard: renders nothing while the session is still resolving (avoids a flash of "redirected to login" on refresh), redirects to `/login` with `state.from` if no session, redirects home if `allowedRoles` is set and the current role isn't included, otherwise renders `<Outlet />`. Client-side only — RLS remains the actual authorization boundary (`api-design.md` §2.2).
- `routes/routes.tsx` restructured: `/dashboard`, `/favorites`, `/bookings`, `/profile` wrapped in a plain `<ProtectedRoute />`; `/admin/*` wrapped in `<ProtectedRoute allowedRoles={['admin']} />`.
- `Header`/`MobileNavDrawer` (`widgets/layout`) now call `useAuth()` directly (allowed: `widgets` → `entities/features`) instead of receiving a static `authLinks` prop — the guest-state Login/Register buttons vs. an authenticated-state name + Log out action are now genuinely reactive to session state, not fixed route config. The `authLinks` prop and `AuthNavLink` type were removed as no longer meaningful.

## 3. Explicitly Out of Scope

- A full Avatar dropdown menu (`ui-guidelines.md` §13.9) — no Profile/Notification pages exist yet to link to; the header shows a minimal name + Log out instead, matching `AUTH-003`'s "minimal" framing. Revisit once a real dashboard exists (Sprint 5+).
- Moderator access to `/admin/*` — not decided in any approved doc; `allowedRoles={['admin']}` only, matching the literal roadmap acceptance test ("as a Customer is blocked").
- `React.lazy` route-level code splitting / a shared `<RouteErrorBoundary>` — pre-existing Sprint 1 technical debt (`FEAT-007`), not touched here.

## 4. Definition of Done

- [x] Valid login redirects to the originally-requested page (or home); invalid credentials show the generic message.
- [x] `AuthProvider` correctly reflects session across `RegisterForm`/`LoginForm`/`ProtectedRoute` in integration tests (proves persistence indirectly — the session survives from one component's action to another's read via the shared Supabase client + `onAuthStateChange`).
- [x] Guest visiting a protected route is redirected to `/login`; a signed-in user sees the protected content; a Customer visiting an admin-only route is redirected home (both proven in `ProtectedRoute.test.tsx`, plus `profile.rls.test.ts` proves the same boundary can't be bypassed by a direct query).
- [x] `npm run lint`/`typecheck`/`test`/`build` all pass.
- [x] `docs/project-state.md` updated.
