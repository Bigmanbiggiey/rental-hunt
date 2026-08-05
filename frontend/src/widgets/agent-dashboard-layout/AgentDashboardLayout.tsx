import { Outlet } from 'react-router';
import { DashboardShell } from '@/widgets/dashboard-shell';
import { useCurrentAgent } from '@/entities/agent';
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
  // useCurrentAgent() is already the established "my own agency" hook,
  // reused elsewhere in this feature set — added here 2026-08-05 so the
  // agent's own agency name shows on every screen in this dashboard, not
  // just one page.
  const { data: agent } = useCurrentAgent();

  return (
    <DashboardShell
      brandHref={PATHS.agentDashboard.root}
      navLabel="Agent dashboard"
      navLinks={NAV_LINKS}
      subtitle={agent?.agencyName}
    >
      <Outlet />
    </DashboardShell>
  );
}
