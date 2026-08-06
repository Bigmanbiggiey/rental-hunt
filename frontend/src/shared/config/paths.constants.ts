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
    // Epic 12 — the public Agency Profile Page (properties/agents/reviews
    // under one agency), mirroring `propertyDetail`'s exact shape.
    agencyDetail: '/agencies/:slug',
    // CONTENT-004 (Sprint 10, added 2026-08-06) — previously blocked on real
    // legal text from the Product Owner; now built with boilerplate content
    // customized to this app's actual data collection (see TermsPage.tsx/
    // PrivacyPage.tsx's own header comments for the "not final legal advice"
    // caveat).
    terms: '/terms',
    privacy: '/privacy',
  },
  // Every authenticated role has its own independent dashboard route group
  // (post-Sprint-8 restructuring, 2026-08-04 — see decisions.md for the ADR
  // reversing Sprint 7's single shared `/admin` shell). Profile is the one
  // authenticated route that stays outside all four — it's role-agnostic.
  authenticated: {
    profile: '/profile',
    // Epic 12 — a signed-in customer applying to self-register an agency;
    // its own narrow `allowedRoles={['customer']}` group, not folded into
    // the generic authenticated group above (which allows every role).
    agencyRegister: '/register-agency',
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
    // Epic 12 — the Overview's stat cards become clickable drill-downs;
    // these two were never actually wired into the post-Sprint-8 dashboard
    // restructuring (the Sprint 7-era "PlaceholderPage" mentions predate it
    // and were dropped, not carried forward), so they're new here, not
    // un-hidden.
    properties: '/admin-dashboard/properties',
    bookings: '/admin-dashboard/bookings',
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
