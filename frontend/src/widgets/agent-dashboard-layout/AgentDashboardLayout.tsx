import { Outlet } from 'react-router';
import { DashboardShell } from '@/widgets/dashboard-shell';
import { PATHS } from '@/shared/config';

const NAV_LINKS = [
  { label: 'Overview', to: PATHS.agentDashboard.root, end: true },
  { label: 'Properties', to: PATHS.agentDashboard.properties },
  { label: 'Bookings', to: PATHS.agentDashboard.bookings },
  { label: 'Analytics', to: PATHS.agentDashboard.analytics },
];

/**
 * Agent's own route group. Simplified in the post-Sprint-8 restructuring
 * (see decisions.md): `/agent-dashboard` is now its own dedicated root,
 * so this no longer needs the `children`-vs-`Outlet` duality Sprint 6's
 * Gap 3 required back when `/dashboard` had to double as the generic
 * authenticated landing page for every role — every agent route, including
 * the overview, is now reached the same way, via `<Outlet/>`.
 */
export function AgentDashboardLayout() {
  return (
    <DashboardShell brandHref={PATHS.agentDashboard.root} navLabel="Agent dashboard" navLinks={NAV_LINKS}>
      <Outlet />
    </DashboardShell>
  );
}
