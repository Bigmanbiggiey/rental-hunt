import { Outlet } from 'react-router';
import { DashboardShell } from '@/widgets/dashboard-shell';
import { PATHS } from '@/shared/config';

const NAV_LINKS = [
  { label: 'Overview', to: PATHS.adminDashboard.root, end: true },
  { label: 'Verification Queue', to: PATHS.adminDashboard.verificationQueue },
  { label: 'Users', to: PATHS.adminDashboard.users },
  { label: 'Agencies', to: PATHS.adminDashboard.agencies },
  { label: 'Analytics', to: PATHS.adminDashboard.analytics },
  { label: 'Activity Log', to: PATHS.adminDashboard.activityLogs },
];

/**
 * Admin's own route group (post-Sprint-8 restructuring — see decisions.md).
 * `/admin-dashboard/*` is reachable only by `role: 'admin'`
 * (`ProtectedRoute allowedRoles={['admin']}` in routes.tsx) — moderator has
 * its own separate `/moderator-dashboard` group now, so this layout no
 * longer needs to filter nav links by role the way the old shared `/admin`
 * shell did.
 */
export function AdminDashboardLayout() {
  return (
    <DashboardShell brandHref={PATHS.adminDashboard.root} navLabel="Admin dashboard" navLinks={NAV_LINKS}>
      <Outlet />
    </DashboardShell>
  );
}
