import { lazy } from 'react';
import type { RouteObject } from 'react-router';
// Imported directly (not from the `@/pages` barrel) — the barrel statically
// re-exports every page, which would otherwise defeat the dynamic imports
// below (Rollup can't split a module into its own chunk if something else
// still imports it statically through the barrel).
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { AdminDashboardLayout, AgentDashboardLayoutRoute, AppLayout, type NavLink } from '@/widgets';
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
const AgentPropertiesPage = lazy(() =>
  import('@/pages/AgentPropertiesPage').then((m) => ({ default: m.AgentPropertiesPage })),
);
const AgentPropertyFormPage = lazy(() =>
  import('@/pages/AgentPropertyFormPage').then((m) => ({ default: m.AgentPropertyFormPage })),
);
const AgentBookingsPage = lazy(() =>
  import('@/pages/AgentBookingsPage').then((m) => ({ default: m.AgentBookingsPage })),
);
const AgentAnalyticsPage = lazy(() =>
  import('@/pages/AgentAnalyticsPage').then((m) => ({ default: m.AgentAnalyticsPage })),
);
const AdminOverviewPage = lazy(() =>
  import('@/pages/AdminOverviewPage').then((m) => ({ default: m.AdminOverviewPage })),
);
const AdminVerificationQueuePage = lazy(() =>
  import('@/pages/AdminVerificationQueuePage').then((m) => ({ default: m.AdminVerificationQueuePage })),
);
const AdminUsersPage = lazy(() =>
  import('@/pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
);
const AdminAgenciesPage = lazy(() =>
  import('@/pages/AdminAgenciesPage').then((m) => ({ default: m.AdminAgenciesPage })),
);
const AdminAnalyticsPage = lazy(() =>
  import('@/pages/AdminAnalyticsPage').then((m) => ({ default: m.AdminAnalyticsPage })),
);
const AdminActivityLogPage = lazy(() =>
  import('@/pages/AdminActivityLogPage').then((m) => ({ default: m.AdminActivityLogPage })),
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
        // Moderator + Admin (Sprint 7, roadmap.md §11) — a single shared
        // `/admin` shell rather than two separate route groups; per-page/
        // per-nav-link role filtering happens inside `AdminDashboardLayout`
        // and `AdminOverviewPage` instead. `ProtectedRoute`'s own documented
        // philosophy already treats this route guard as client-side UX,
        // never the real security boundary (RLS is) — the same reasoning
        // that justifies not duplicating a second route group here.
        element: <ProtectedRoute allowedRoles={['moderator', 'admin']} />,
        children: [
          {
            element: <AdminDashboardLayout />,
            children: [
              { path: PATHS.admin.root, element: <AdminOverviewPage /> },
              { path: PATHS.admin.verificationQueue, element: <AdminVerificationQueuePage /> },
              { path: PATHS.admin.activityLogs, element: <AdminActivityLogPage /> },
              // Admin-only pages below still sit inside the shared
              // allowedRoles gate above — a moderator hitting these URLs
              // directly is a client-side UX gap only, since RLS blocks the
              // actual reads/writes regardless (`agencies_select_all_agent_moderator_admin`/
              // `agencies_insert_admin` etc., database.md §9).
              { path: PATHS.admin.users, element: <AdminUsersPage /> },
              { path: PATHS.admin.agencies, element: <AdminAgenciesPage /> },
              { path: PATHS.admin.analytics, element: <AdminAnalyticsPage /> },
              { path: PATHS.admin.properties, element: <PlaceholderPage title="Admin — Properties" /> },
              { path: PATHS.admin.bookings, element: <PlaceholderPage title="Admin — Bookings" /> },
            ],
          },
        ],
      },
      {
        // Agent only (Sprint 6, Gap 3) — mirrors the admin-only group above
        // exactly. `/dashboard` itself is deliberately NOT here: it stays in
        // the generic authenticated group and branches role at the
        // `DashboardPage` component level instead (see that file's own
        // comment) — `AgentDashboardLayoutRoute` only wraps these four.
        element: <ProtectedRoute allowedRoles={['agent']} />,
        children: [
          {
            element: <AgentDashboardLayoutRoute />,
            children: [
              { path: PATHS.authenticated.agentProperties, element: <AgentPropertiesPage /> },
              { path: PATHS.authenticated.agentPropertyNew, element: <AgentPropertyFormPage /> },
              { path: PATHS.authenticated.agentPropertyEdit, element: <AgentPropertyFormPage /> },
              { path: PATHS.authenticated.agentBookings, element: <AgentBookingsPage /> },
              { path: PATHS.authenticated.agentAnalytics, element: <AgentAnalyticsPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <PlaceholderPage title="Not Found" /> },
    ],
  },
];
