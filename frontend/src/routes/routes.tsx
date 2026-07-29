import { lazy } from 'react';
import type { RouteObject } from 'react-router';
// Imported directly (not from the `@/pages` barrel) — the barrel statically
// re-exports every page, which would otherwise defeat the dynamic imports
// below (Rollup can't split a module into its own chunk if something else
// still imports it statically through the barrel).
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { AppLayout, type NavLink } from '@/widgets';
import { ProtectedRoute } from '@/features/authentication';
import { PATHS } from '@/shared/config';

// Route-level code splitting (Lighthouse Performance 61/100 on production
// /properties, 2026-07-27 — root cause: an unsplit ~262KB JS bundle shipped
// on every route). Deferred since FEAT-007/FEAT-010 for lack of real,
// differently-sized pages to split on; that's no longer true. Each import
// points at the page's own module (never the `@/pages` barrel, which would
// re-bundle every page into one chunk regardless of the dynamic import).
// PlaceholderPage stays a regular import — it's tiny and shared across many
// still-unbuilt routes, so splitting it has no payoff.
const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const PropertiesPage = lazy(() =>
  import('@/pages/PropertiesPage').then((m) => ({ default: m.PropertiesPage })),
);
const PropertyDetailPage = lazy(() =>
  import('@/pages/PropertyDetailPage').then((m) => ({ default: m.PropertyDetailPage })),
);
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('@/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('@/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
);
const ProfilePage = lazy(() =>
  import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const FavoritesPage = lazy(() =>
  import('@/pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })),
);
const BookingsPage = lazy(() =>
  import('@/pages/BookingsPage').then((m) => ({ default: m.BookingsPage })),
);

const PRIMARY_NAV_LINKS: NavLink[] = [{ label: 'Browse Properties', to: PATHS.public.properties }];

export const routeConfig: RouteObject[] = [
  {
    element: <AppLayout homeHref={PATHS.public.home} primaryLinks={PRIMARY_NAV_LINKS} />,
    children: [
      { path: PATHS.public.home, element: <HomePage /> },
      { path: PATHS.public.properties, element: <PropertiesPage /> },
      { path: PATHS.public.propertyDetail, element: <PropertyDetailPage /> },
      { path: PATHS.public.login, element: <LoginPage /> },
      { path: PATHS.public.register, element: <RegisterPage /> },
      { path: PATHS.public.forgotPassword, element: <ForgotPasswordPage /> },
      { path: PATHS.public.resetPassword, element: <ResetPasswordPage /> },
      {
        // Any authenticated role (architecture.md §6's "Authenticated Routes").
        element: <ProtectedRoute />,
        children: [
          { path: PATHS.authenticated.dashboard, element: <DashboardPage /> },
          { path: PATHS.authenticated.favorites, element: <FavoritesPage /> },
          { path: PATHS.authenticated.bookings, element: <BookingsPage /> },
          { path: PATHS.authenticated.profile, element: <ProfilePage /> },
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
