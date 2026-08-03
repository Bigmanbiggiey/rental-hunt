import { Outlet } from 'react-router';
import { DashboardShell } from '@/widgets/dashboard-shell';
import { PATHS } from '@/shared/config';

const NAV_LINKS = [
  { label: 'Overview', to: PATHS.moderatorDashboard.root, end: true },
  { label: 'Verification Queue', to: PATHS.moderatorDashboard.verificationQueue },
  { label: 'Activity Log', to: PATHS.moderatorDashboard.activityLogs },
];

/**
 * Moderator's own route group (post-Sprint-8 restructuring — see
 * decisions.md), reachable only by `role: 'moderator'`. Matches
 * `roadmap.md` §11's DoD split — a moderator reviews pending listings, not
 * users/agencies/analytics — by only having a route for what it's given.
 * The pages themselves (`AdminVerificationQueuePage`, `AdminActivityLogPage`)
 * are the exact same components admin uses, reused as-is: RLS already scopes
 * what a moderator can see/do, so there's no separate moderator-only data
 * layer to build.
 */
export function ModeratorDashboardLayout() {
  return (
    <DashboardShell
      brandHref={PATHS.moderatorDashboard.root}
      navLabel="Moderator dashboard"
      navLinks={NAV_LINKS}
    >
      <Outlet />
    </DashboardShell>
  );
}
