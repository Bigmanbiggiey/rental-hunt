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
  },
  authenticated: {
    dashboard: '/dashboard',
    favorites: '/favorites',
    bookings: '/bookings',
    profile: '/profile',
    // Sprint 6, agent role only — nested under /dashboard specifically to
    // avoid colliding with the customer's own top-level /bookings (Sprint
    // 5's full viewing-history page). /dashboard itself stays one URL,
    // branching its content by role (Gap 3, DashboardPage.tsx).
    agentProperties: '/dashboard/properties',
    agentPropertyNew: '/dashboard/properties/new',
    agentPropertyEdit: '/dashboard/properties/:id/edit',
    agentBookings: '/dashboard/bookings',
    agentAnalytics: '/dashboard/analytics',
  },
  admin: {
    root: '/admin',
    properties: '/admin/properties',
    bookings: '/admin/bookings',
    users: '/admin/users',
    agencies: '/admin/agencies',
    // Sprint 7 — roadmap.md §11. /admin/properties and /admin/bookings stay
    // PlaceholderPage stubs: neither has an unambiguous Sprint 7 DoD
    // dependency (verification is fully covered by verificationQueue below;
    // admin viewing-request oversight is already reachable through
    // viewingRequestRepository's own Moderator/Admin RLS permissions without
    // a dedicated screen) — building either now would be scope creep beyond
    // what the DoD actually names.
    verificationQueue: '/admin/verification-queue',
    analytics: '/admin/analytics',
    activityLogs: '/admin/activity-logs',
  },
} as const;
