import { Outlet } from 'react-router';
import { DashboardShell } from '@/widgets/dashboard-shell';
import { PATHS } from '@/shared/config';

const NAV_LINKS = [
  { label: 'Overview', to: PATHS.userDashboard.root, end: true },
  { label: 'Favorites', to: PATHS.userDashboard.favorites },
  { label: 'Bookings', to: PATHS.userDashboard.bookings },
];

/**
 * Customer's own route group (post-Sprint-8 restructuring — see
 * decisions.md). Previously the only role with no dedicated dashboard shell
 * at all — Favorites/Bookings were separate, unlinked top-level routes with
 * no sidebar nav between them. Now structurally symmetric with the other
 * three roles.
 */
export function UserDashboardLayout() {
  return (
    <DashboardShell brandHref={PATHS.userDashboard.root} navLabel="Dashboard" navLinks={NAV_LINKS}>
      <Outlet />
    </DashboardShell>
  );
}
