// Every path from architecture.md §6, grouped exactly as that section groups them.
//
// Lives in shared/ (not routes/) so that pages/, features/, and widgets/ can
// all build links/navigate without violating the FSD import-direction rule
// (coding-standards.md §3.2 — none of those layers may import from routes/).
// routes/routes.tsx still owns turning this into the actual RouteObject[].
export const PATHS = {
  public: {
    home: '/',
    properties: '/properties',
    propertyDetail: '/properties/:slug',
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    // CONTENT-002 (user-stories.md Epic 11, added 2026-08-05). CONTENT-001
    // (About) has no route of its own — merged into home, 2026-08-05.
    contact: '/contact',
  },
  // Every authenticated role has its own independent dashboard route group
  // (post-Sprint-8 restructuring, 2026-08-04 — see decisions.md for the ADR
  // reversing Sprint 7's single shared `/admin` shell). Profile is the one
  // authenticated route that stays outside all four — it's role-agnostic.
  authenticated: {
    profile: '/profile',
  },
  adminDashboard: {
    root: '/admin-dashboard',
    verificationQueue: '/admin-dashboard/verification-queue',
    verificationReview: '/admin-dashboard/verification-queue/:id',
    users: '/admin-dashboard/users',
    agencies: '/admin-dashboard/agencies',
    analytics: '/admin-dashboard/analytics',
    activityLogs: '/admin-dashboard/activity-logs',
    // CONTENT-003, added 2026-08-05.
    messages: '/admin-dashboard/messages',
  },
  // Moderator's own route group, not a role-filtered view inside admin's —
  // reuses the same admin-verification/admin-activity-log feature hooks and
  // page components admin uses (no new backend/data work), just mounted at
  // its own URL prefix with its own, narrower nav.
  moderatorDashboard: {
    root: '/moderator-dashboard',
    verificationQueue: '/moderator-dashboard/verification-queue',
    verificationReview: '/moderator-dashboard/verification-queue/:id',
    activityLogs: '/moderator-dashboard/activity-logs',
  },
  agentDashboard: {
    root: '/agent-dashboard',
    properties: '/agent-dashboard/properties',
    propertyNew: '/agent-dashboard/properties/new',
    propertyEdit: '/agent-dashboard/properties/:id/edit',
    bookings: '/agent-dashboard/bookings',
    analytics: '/agent-dashboard/analytics',
  },
  userDashboard: {
    root: '/user-dashboard',
    favorites: '/user-dashboard/favorites',
    bookings: '/user-dashboard/bookings',
  },
} as const;
