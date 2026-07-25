import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth, type UserRole } from '@/entities/user';
import { PATHS } from '@/shared/config';

interface ProtectedRouteProps {
  /** Defaults to "any authenticated role" when omitted. */
  allowedRoles?: UserRole[];
}

/**
 * Route guard (roadmap.md §6's "Protected Routes") — a layout route wrapping
 * `/dashboard`, `/favorites`, `/bookings`, `/profile`, and `/admin/*`
 * (architecture.md §6). Client-side only: the actual security boundary is
 * RLS (database.md §9) — this exists for fast, specific UX, per
 * api-design.md §2.2's defense-in-depth note, never as the real guarantee.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { profile, isLoading } = useAuth();
  const location = useLocation();

  // Deliberately renders nothing (rather than redirecting) while the
  // session is still resolving, so a logged-in user never sees a flash of
  // "redirected to login" on refresh (AUTH-005's acceptance criterion).
  if (isLoading) return null;

  if (!profile) {
    return <Navigate to={PATHS.public.login} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to={PATHS.public.home} replace />;
  }

  return <Outlet />;
}
