import { useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/entities/user';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { useIdleTimer } from '../hooks/useIdleTimer';
import { useLogout } from '../hooks/useLogout';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const WARNING_MS = 60 * 1000;

/**
 * Session-security hardening (post-Sprint-8, 2026-08-04) — admin/moderator
 * accounts can approve listings and manage other users' accounts, so an
 * unattended, still-authenticated tab is a higher-value target than a
 * customer/agent one. Scoped to those two roles only via `enabled`; every
 * other role's session behaves exactly as before — no timer runs at all,
 * not just a longer one. Mounted once in `App.tsx` (role check happens
 * internally, same shape as `AuthProvider`) rather than per-dashboard-layout,
 * so it also covers a signed-in admin/moderator on a shared route like
 * `/profile`, not only `/admin-dashboard/*`.
 *
 * On timeout, reuses the exact `useLogout()` mutation the header/sidebar
 * logout buttons already call — no separate sign-out path to keep in sync,
 * and the existing `AuthProvider`/`ProtectedRoute` reactivity (not an
 * explicit `navigate()` here) is what actually returns the user to
 * `/login`, same as a manual logout click.
 */
export function IdleSessionGuard() {
  const { profile } = useAuth();
  const { mutate: logout } = useLogout();
  const enabled = profile?.role === 'admin' || profile?.role === 'moderator';

  const handleTimeout = useCallback(() => {
    logout(undefined, {
      onSuccess: () => toast.info('You were signed out due to inactivity.'),
    });
  }, [logout]);

  const { isWarning, remainingMs, reset } = useIdleTimer({
    idleMs: IDLE_TIMEOUT_MS,
    warningMs: WARNING_MS,
    onTimeout: handleTimeout,
    enabled,
  });

  if (!enabled) return null;

  return (
    <Dialog
      open={isWarning}
      onOpenChange={(next) => {
        if (!next) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>You’ve been inactive</DialogTitle>
          <DialogDescription>
            You’ll be signed out in {Math.max(1, Math.ceil(remainingMs / 1000))}s due to inactivity, to protect
            your account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={reset}>Stay signed in</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
