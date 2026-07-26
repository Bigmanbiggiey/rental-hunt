import type { RouteObject } from 'react-router';
import {
  ForgotPasswordPage,
  LoginPage,
  PlaceholderPage,
  RegisterPage,
  ResetPasswordPage,
} from '@/pages';
import { AppLayout, type NavLink } from '@/widgets';
import { ProtectedRoute } from '@/features/authentication';
import { PATHS } from '@/shared/config';

const PRIMARY_NAV_LINKS: NavLink[] = [{ label: 'Browse Properties', to: PATHS.public.properties }];

export const routeConfig: RouteObject[] = [
  {
    element: <AppLayout homeHref={PATHS.public.home} primaryLinks={PRIMARY_NAV_LINKS} />,
    children: [
      { path: PATHS.public.home, element: <PlaceholderPage title="Home" /> },
      { path: PATHS.public.properties, element: <PlaceholderPage title="Properties" /> },
      { path: PATHS.public.propertyDetail, element: <PlaceholderPage title="Property Details" /> },
      { path: PATHS.public.login, element: <LoginPage /> },
      { path: PATHS.public.register, element: <RegisterPage /> },
      { path: PATHS.public.forgotPassword, element: <ForgotPasswordPage /> },
      { path: PATHS.public.resetPassword, element: <ResetPasswordPage /> },
      {
        // Any authenticated role (architecture.md §6's "Authenticated Routes").
        element: <ProtectedRoute />,
        children: [
          { path: PATHS.authenticated.dashboard, element: <PlaceholderPage title="Dashboard" /> },
          { path: PATHS.authenticated.favorites, element: <PlaceholderPage title="Favorites" /> },
          { path: PATHS.authenticated.bookings, element: <PlaceholderPage title="Bookings" /> },
          { path: PATHS.authenticated.profile, element: <PlaceholderPage title="Profile" /> },
        ],
      },
      {
        // Admin only — roadmap.md §6's acceptance test is specifically
        // "navigating to /admin as a Customer is blocked"; moderator access
        // to any of these isn't decided yet, so it isn't included here.
        element: <ProtectedRoute allowedRoles={['admin']} />,
        children: [
          { path: PATHS.admin.root, element: <PlaceholderPage title="Admin" /> },
          { path: PATHS.admin.properties, element: <PlaceholderPage title="Admin — Properties" /> },
          { path: PATHS.admin.bookings, element: <PlaceholderPage title="Admin — Bookings" /> },
          { path: PATHS.admin.users, element: <PlaceholderPage title="Admin — Users" /> },
          { path: PATHS.admin.agencies, element: <PlaceholderPage title="Admin — Agencies" /> },
        ],
      },
      { path: '*', element: <PlaceholderPage title="Not Found" /> },
    ],
  },
];
