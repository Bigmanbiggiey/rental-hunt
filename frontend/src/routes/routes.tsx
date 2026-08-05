import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';
import { AppLayout } from '@/widgets/layout/AppLayout';
import type { NavLink } from '@/widgets/layout/navLink.types';
import { ProtectedRoute } from '@/features/authentication/components/ProtectedRoute';
import { RouteLoadingFallback } from '@/shared/ui/route-loading-fallback';
import { PATHS } from '@/shared/config';

// Route-level code splitting (Lighthouse Performance 61/100 on production
// /properties, 2026-07-27 — root cause: an unsplit ~262KB JS bundle shipped
// on every route). Deferred since FEAT-007/FEAT-010 for lack of real,
// differently-sized pages to split on; that's no longer true. Each import
// points at the page's own module (never the `@/pages` barrel, which would
// re-bundle every page into one chunk regardless of the dynamic import).
// `PlaceholderPage` is no longer referenced here at all (2026-08-05 —
// CONTENT-005 gave the catch-all `*` route its own real `NotFoundPage`,
// its only remaining use); it's kept in `pages/` for any future
// still-unbuilt route that needs a stand-in, per its own doc comment.
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
// CONTENT-001/002/005 (user-stories.md Epic 11, added 2026-08-05).
const AboutPage = lazy(() => import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('@/pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const ProfilePage = lazy(() =>
  import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const UserDashboardOverviewPage = lazy(() =>
  import('@/pages/UserDashboardOverviewPage').then((m) => ({ default: m.UserDashboardOverviewPage })),
);
const FavoritesPage = lazy(() =>
  import('@/pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })),
);
const BookingsPage = lazy(() =>
  import('@/pages/BookingsPage').then((m) => ({ default: m.BookingsPage })),
);
const AgentDashboardOverviewPage = lazy(() =>
  import('@/pages/AgentDashboardOverviewPage').then((m) => ({ default: m.AgentDashboardOverviewPage })),
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
const AdminVerificationReviewPage = lazy(() =>
  import('@/pages/AdminVerificationReviewPage').then((m) => ({ default: m.AdminVerificationReviewPage })),
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
const AdminMessagesPage = lazy(() =>
  import('@/pages/AdminMessagesPage').then((m) => ({ default: m.AdminMessagesPage })),
);
const ModeratorDashboardOverviewPage = lazy(() =>
  import('@/pages/ModeratorDashboardOverviewPage').then((m) => ({
    default: m.ModeratorDashboardOverviewPage,
  })),
);
// The four dashboard shells are lazy too (not just their page content) —
// Sprint 8's bundle investigation (docs/roadmap.md §12) found eagerly
// importing role-gated layout widgets pulls DropdownMenu/Sheet/Avatar into
// every guest's initial load. Each dashboard route group below wraps its own
// lazy layout in its own <Suspense> — post-Sprint-8 restructuring (see
// decisions.md) moved every dashboard group out of AppLayout's children, so
// they no longer inherit AppLayout's single top-level Suspense boundary.
const AdminDashboardLayout = lazy(() =>
  import('@/widgets/admin-dashboard-layout/AdminDashboardLayout').then((m) => ({
    default: m.AdminDashboardLayout,
  })),
);
const ModeratorDashboardLayout = lazy(() =>
  import('@/widgets/moderator-dashboard-layout/ModeratorDashboardLayout').then((m) => ({
    default: m.ModeratorDashboardLayout,
  })),
);
const AgentDashboardLayout = lazy(() =>
  import('@/widgets/agent-dashboard-layout/AgentDashboardLayout').then((m) => ({
    default: m.AgentDashboardLayout,
  })),
);
const UserDashboardLayout = lazy(() =>
  import('@/widgets/user-dashboard-layout/UserDashboardLayout').then((m) => ({
    default: m.UserDashboardLayout,
  })),
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
      { path: PATHS.public.about, element: <AboutPage /> },
      { path: PATHS.public.contact, element: <ContactPage /> },
      {
        // Any authenticated role — Profile is the one authenticated route
        // that isn't part of any specific role's dashboard.
        element: <ProtectedRoute />,
        children: [{ path: PATHS.authenticated.profile, element: <ProfilePage /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  // Four independent, role-owned dashboard route groups (post-Sprint-8
  // restructuring — see decisions.md for the ADR reversing Sprint 7's single
  // shared `/admin` shell). Each is a top-level sibling of AppLayout above,
  // not nested under it, specifically so its own dashboard shell is the only
  // header/nav that renders — the public site's Header/Footer never mount
  // alongside a dashboard. React Router ranks routes by path specificity
  // across the whole tree regardless of nesting, so these still correctly
  // beat AppLayout's own `*` catch-all above.
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <AdminDashboardLayout />
          </Suspense>
        ),
        children: [
          { path: PATHS.adminDashboard.root, element: <AdminOverviewPage /> },
          { path: PATHS.adminDashboard.verificationQueue, element: <AdminVerificationQueuePage /> },
          { path: PATHS.adminDashboard.verificationReview, element: <AdminVerificationReviewPage /> },
          { path: PATHS.adminDashboard.users, element: <AdminUsersPage /> },
          { path: PATHS.adminDashboard.agencies, element: <AdminAgenciesPage /> },
          { path: PATHS.adminDashboard.analytics, element: <AdminAnalyticsPage /> },
          { path: PATHS.adminDashboard.activityLogs, element: <AdminActivityLogPage /> },
          { path: PATHS.adminDashboard.messages, element: <AdminMessagesPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['moderator']} />,
    children: [
      {
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ModeratorDashboardLayout />
          </Suspense>
        ),
        children: [
          { path: PATHS.moderatorDashboard.root, element: <ModeratorDashboardOverviewPage /> },
          // Same page components admin uses (RLS already scopes what a
          // moderator can see/do — no separate moderator-only data layer).
          { path: PATHS.moderatorDashboard.verificationQueue, element: <AdminVerificationQueuePage /> },
          { path: PATHS.moderatorDashboard.verificationReview, element: <AdminVerificationReviewPage /> },
          { path: PATHS.moderatorDashboard.activityLogs, element: <AdminActivityLogPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['agent']} />,
    children: [
      {
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <AgentDashboardLayout />
          </Suspense>
        ),
        children: [
          { path: PATHS.agentDashboard.root, element: <AgentDashboardOverviewPage /> },
          { path: PATHS.agentDashboard.properties, element: <AgentPropertiesPage /> },
          { path: PATHS.agentDashboard.propertyNew, element: <AgentPropertyFormPage /> },
          { path: PATHS.agentDashboard.propertyEdit, element: <AgentPropertyFormPage /> },
          { path: PATHS.agentDashboard.bookings, element: <AgentBookingsPage /> },
          { path: PATHS.agentDashboard.analytics, element: <AgentAnalyticsPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['customer']} />,
    children: [
      {
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <UserDashboardLayout />
          </Suspense>
        ),
        children: [
          { path: PATHS.userDashboard.root, element: <UserDashboardOverviewPage /> },
          { path: PATHS.userDashboard.favorites, element: <FavoritesPage /> },
          { path: PATHS.userDashboard.bookings, element: <BookingsPage /> },
        ],
      },
    ],
  },
];
