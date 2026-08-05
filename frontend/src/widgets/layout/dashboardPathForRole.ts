import type { UserRole } from '@/entities/user';
import { PATHS } from '@/shared/config';

// A signed-in non-customer browsing the public site (e.g. via each dashboard's
// own `ViewSiteLink`) previously had no way back except the browser's own
// back button — every dashboard route group is a sibling of `AppLayout`, not
// nested under it (post-Sprint-8 restructuring), so there's no shared shell
// to carry a link forward. `Header`/`MobileNavDrawer` both need this same
// role -> dashboard-root lookup, hence its own small shared file rather than
// duplicating the mapping in each.
export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return PATHS.adminDashboard.root;
    case 'moderator':
      return PATHS.moderatorDashboard.root;
    case 'agent':
      return PATHS.agentDashboard.root;
    case 'customer':
      return PATHS.userDashboard.root;
  }
}
