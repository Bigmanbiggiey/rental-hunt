# AUTH-004 — Reset Forgotten Password

> **Sprint:** Sprint 2 — Authentication
> **Status:** Completed — 2026-07-25
> **Priority:** High
> **Derived from:** `docs/user-stories.md` AUTH-004, `docs/api-design.md` §5.5/§5.6.

---

## 1. Objective

Let a user who forgot their password request a reset link by email and complete the reset, without ever revealing whether a given email is registered.

## 2. In Scope

- `RequestPasswordResetSchema` (email only) and `ResetPasswordSchema` (`newPassword`/`confirmPassword`, same password rules as `RegisterSchema`, refined to require a match) — `features/authentication/schemas`.
- `authService.requestPasswordReset(input)` — now Zod-validated (previously took a raw unvalidated `email: string`); `authService.resetPassword(input)` — new, validates then calls the already-existing `authRepository.resetPassword({ newPassword })`.
- `useRequestPasswordReset`/`useResetPassword` hooks (`useMutation` wrappers, same shape as `useLogin`).
- `ForgotPasswordForm` — email field; on success replaces the form with an inline generic confirmation message ("If an account exists for that email address...") regardless of whether the account exists, per the acceptance criteria's anti-enumeration requirement.
- `ResetPasswordForm` — `newPassword`/`confirmPassword` fields; on success, toast + redirect to `/login`.
- `ForgotPasswordPage` (replaces the `/forgot-password` `PlaceholderPage`) and `ResetPasswordPage` (new `/reset-password` route). `ResetPasswordPage` gates on `useAuth()`: the emailed recovery link establishes a temporary session automatically (supabase-js's default `detectSessionInUrl`) before this page renders; if no session exists once loading settles (missing/expired/already-used link), an "invalid or expired" message is shown instead of the form.
- Two small, real gaps fixed in the same change (found during exploration, not new scope):
  - `PATHS.public.resetPassword` was missing even though `authRepository`'s `redirectTo` already pointed at `/reset-password`.
  - `mapSupabaseError.ts`'s `AUTH_ERROR_CODE_MAP` never mapped Supabase's `otp_expired` code to the already-declared `RESET_TOKEN_EXPIRED` `ErrorCode` — an expired reset link would have surfaced the generic `INVALID_CREDENTIALS` message instead.

## 3. Explicitly Out of Scope

- Any change to `docs/api-design.md`/`database.md`/`architecture.md` — the contract was already fully specified before this ticket; nothing here changes it.
- Re-verifying supabase-js's own `detectSessionInUrl` recovery-link handoff — that's the library's own tested default behavior, not this project's code.

## 4. Definition of Done

- [x] A user can request a reset link by submitting their registered email.
- [x] A generic confirmation message is shown regardless of whether the email exists (`ForgotPasswordForm.test.tsx` — identical message asserted for both a real and a nonexistent email).
- [x] Reset link expiry surfaces a clear message (`RESET_TOKEN_EXPIRED`, now actually reachable via the `otp_expired` mapping fix) rather than a generic/misleading one.
- [x] Successful reset allows immediate login with the new password (`ResetPasswordForm.test.tsx` — signs in with the old password first to confirm it now fails, then with the new password to confirm it succeeds).
- [x] `npm run lint`/`typecheck`/`test`/`build` all pass.
- [x] `docs/project-state.md` updated.
