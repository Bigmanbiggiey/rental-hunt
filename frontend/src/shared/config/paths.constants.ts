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
  },
  authenticated: {
    dashboard: '/dashboard',
    favorites: '/favorites',
    bookings: '/bookings',
    profile: '/profile',
  },
  admin: {
    root: '/admin',
    properties: '/admin/properties',
    bookings: '/admin/bookings',
    users: '/admin/users',
    agencies: '/admin/agencies',
  },
} as const;
