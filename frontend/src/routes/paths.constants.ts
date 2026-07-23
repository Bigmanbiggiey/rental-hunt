// Every path from architecture.md §6, grouped exactly as that section groups them.
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
