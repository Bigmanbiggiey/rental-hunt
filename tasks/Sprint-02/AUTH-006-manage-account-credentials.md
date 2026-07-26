# AUTH-006 — Manage Account Credentials

> **Sprint:** Sprint 2 — Authentication
> **Status:** Completed — 2026-07-26
> **Priority:** Medium
> **Derived from:** `docs/user-stories.md` AUTH-006, `docs/api-design.md` §5.9/§5.10 (added this ticket).

---

## 1. Objective

Let a logged-in user change their account email and password, so they can keep their login credentials current and secure.

## 2. In Scope

- `docs/api-design.md` §5.9 (Update Email) and §5.10 (Update Password) — no documented contract existed for either operation before this ticket (§5.8 only covers `fullName`/`phone`/`avatarUrl`/`notificationPreferences`); added before implementation, not improvised during it.
- New feature slice `features/profile-management` (`architecture.md` §5 lists "Profile Management" as its own feature, distinct from `features/authentication`):
  - `credentials.repository.ts` — `getCurrentEmail()`, `updateEmail(newEmail)` (`supabase.auth.updateUser({ email })`), `updatePassword({ currentPassword, newPassword })` (re-authenticates via `supabase.auth.signInWithPassword()` using the current session's email + supplied current password, then `supabase.auth.updateUser({ password })`).
  - `credentials.service.ts` — Zod validation (`UpdateEmailSchema`, `UpdatePasswordSchema`) in front of the repository.
  - `useCurrentEmail`/`useUpdateEmail`/`useUpdatePassword` hooks.
  - `UpdateEmailForm`/`UpdatePasswordForm` components.
- `ProfilePage` (replaces the `/profile` `PlaceholderPage`), rendering both forms.
- Extracted `passwordSchema` into `entities/user/user.schema.ts` (alongside `fullNameSchema`/`phoneSchema`) and pointed `RegisterSchema`/`ResetPasswordSchema` at it — the rule's third duplication (Register, Reset Password, Update Password), the project's own extraction threshold (`coding-standards.md` §7).

## 3. Explicitly Out of Scope

- Editing `fullName`/`phone`/`avatarUrl`/other non-credential profile fields — that's `CUST-003` (Manage Profile), a separate Sprint 5 (Customer Dashboard) story with its own acceptance criteria. `profileRepository.update()` already exists (`AUTH-001`) and is untouched here.
- The `boundaries/dependencies` sibling-feature-import lint rule (Technical Debt) — this ticket makes it *actionable* (a second real feature slice now exists) but does not implement it; that stays a separate, deliberate tooling task.
- Re-verifying Supabase's own emailed-confirmation-link handoff for the new email — that's the library/service's own behavior, not this project's code.

## 4. Definition of Done

- [x] A user can change their password after confirming their current password (`UpdatePasswordForm` re-authenticates via `signInWithPassword` before applying the change).
- [x] A user can update their account email; Supabase's confirmation-link flow gates when the change actually takes effect, and the UI copy reflects that ("Check your new email inbox to confirm the change") rather than implying an immediate change.
- [x] New-password validation uses the same rules as registration (shared `passwordSchema`).
- [x] Confirmation feedback (toast) is shown after each successful update.
- [x] A wrong current password is rejected (`INVALID_CREDENTIALS`) without changing the password (`credentials.repository.test.ts`, `UpdatePasswordForm.test.tsx`).
- [x] `npm run lint`/`typecheck`/`test`/`build` all pass — 53 tests total (12 new: 7 unit, 5 integration).
- [x] `docs/project-state.md` updated.
