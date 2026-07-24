import type { RouteObject } from 'react-router';
import { PlaceholderPage } from '@/pages';
import { AppLayout, type AuthNavLink, type NavLink } from '@/widgets';
import { PATHS } from './paths.constants';

const PRIMARY_NAV_LINKS: NavLink[] = [{ label: 'Browse Properties', to: PATHS.public.properties }];

const AUTH_NAV_LINKS: AuthNavLink[] = [
  { label: 'Login', to: PATHS.public.login, variant: 'outline' },
  { label: 'Register', to: PATHS.public.register, variant: 'default' },
];

export const routeConfig: RouteObject[] = [
  {
    element: (
      <AppLayout
        homeHref={PATHS.public.home}
        primaryLinks={PRIMARY_NAV_LINKS}
        authLinks={AUTH_NAV_LINKS}
      />
    ),
    children: [
      { path: PATHS.public.home, element: <PlaceholderPage title="Home" /> },
      { path: PATHS.public.properties, element: <PlaceholderPage title="Properties" /> },
      { path: PATHS.public.propertyDetail, element: <PlaceholderPage title="Property Details" /> },
      { path: PATHS.public.login, element: <PlaceholderPage title="Login" /> },
      { path: PATHS.public.register, element: <PlaceholderPage title="Register" /> },
      { path: PATHS.public.forgotPassword, element: <PlaceholderPage title="Forgot Password" /> },
      { path: PATHS.authenticated.dashboard, element: <PlaceholderPage title="Dashboard" /> },
      { path: PATHS.authenticated.favorites, element: <PlaceholderPage title="Favorites" /> },
      { path: PATHS.authenticated.bookings, element: <PlaceholderPage title="Bookings" /> },
      { path: PATHS.authenticated.profile, element: <PlaceholderPage title="Profile" /> },
      { path: PATHS.admin.root, element: <PlaceholderPage title="Admin" /> },
      { path: PATHS.admin.properties, element: <PlaceholderPage title="Admin — Properties" /> },
      { path: PATHS.admin.bookings, element: <PlaceholderPage title="Admin — Bookings" /> },
      { path: PATHS.admin.users, element: <PlaceholderPage title="Admin — Users" /> },
      { path: PATHS.admin.agencies, element: <PlaceholderPage title="Admin — Agencies" /> },
      { path: '*', element: <PlaceholderPage title="Not Found" /> },
    ],
  },
];
