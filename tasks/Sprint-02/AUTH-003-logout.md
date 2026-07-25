# AUTH-003 — Logout

> **Sprint:** Sprint 2 — Authentication
> **Status:** Completed — 2026-07-24
> **Priority:** High
> **Derived from:** `docs/user-stories.md` AUTH-003.

---

## 1. Objective

Let a logged-in user end their session from any authenticated page, immediately losing access to protected routes.

## 2. In Scope

- `useLogout` hook (`features/authentication`) wrapping `authService.logout()` → `supabase.auth.signOut()`, invalidating the `['auth','currentUser']` query on success.
- A "Log out" action in `Header` (desktop) and `MobileNavDrawer` (mobile), visible whenever `useAuth()` reports a signed-in `profile` — reachable from every page, since the header is present on every route (`AppLayout`).
- Logging out fires `supabase.auth.onAuthStateChange`, which `AuthProvider` already subscribes to (`AUTH-001`), so `profile` reactively becomes `null` — `ProtectedRoute` then redirects away from any protected page still mounted.

## 3. Explicitly Out of Scope

- A confirmation dialog before logout — not requested by the acceptance criteria, and would slow down a routine action.

## 4. Definition of Done

- [x] "Log out" is visible and reachable from the nav on every page once signed in.
- [x] Logging out clears the session and protected routes become inaccessible without re-authenticating (proven by `ProtectedRoute.test.tsx`'s guest-redirect case using the same `signOut()` path).
- [x] `npm run lint`/`typecheck`/`test`/`build` all pass.
- [x] `docs/project-state.md` updated.
