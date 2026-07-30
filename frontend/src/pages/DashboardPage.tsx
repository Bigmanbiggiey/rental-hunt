import { Link } from 'react-router';
import {
  useViewingRequests,
  useViewingRequestsRealtime,
  ViewingRequestList,
} from '@/features/viewing-requests';
import { AgentDashboardOverviewPage } from './AgentDashboardOverviewPage';
import { Alert, AlertDescription, Skeleton } from '@/shared/ui';
import { PATHS } from '@/shared/config';
import { useAuth } from '@/entities/user';

const SECTION_PAGE_SIZE = 5;

// Gap 3 (Sprint 6 plan): `/dashboard` stays one URL, branching its content
// by role — not a redirect to two URLs, since `ProtectedRoute`'s
// `allowedRoles` only gates access, it can't branch content, and a redirect
// would add an extra hop plus two bookmarkable URLs for one conceptual
// landing page.
function DashboardPage() {
  const { profile } = useAuth();
  if (profile?.role === 'agent') return <AgentDashboardOverviewPage />;
  return <CustomerDashboardOverview />;
}

// CUST-001 (Upcoming) + CUST-002 (Completed). Realtime status updates
// (api-design.md §11) are subscribed once for the whole page, not per
// section, to avoid duplicate `postgres_changes` channels.
function CustomerDashboardOverview() {
  useViewingRequestsRealtime();

  const upcoming = useViewingRequests({
    status: ['pending', 'confirmed'],
    sort: 'requestedDateAsc',
    pageSize: SECTION_PAGE_SIZE,
  });
  const completed = useViewingRequests({
    status: ['completed', 'no_show'],
    sort: 'requestedDateDesc',
    pageSize: SECTION_PAGE_SIZE,
  });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <h1 className="text-h1 text-foreground font-semibold">Dashboard</h1>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-foreground font-semibold">Upcoming Viewings</h2>
          {upcoming.data && upcoming.data.meta.totalPages > 1 && (
            <Link
              to={PATHS.authenticated.bookings}
              className="text-body-sm text-primary font-medium hover:underline"
            >
              View all
            </Link>
          )}
        </div>
        {upcoming.isLoading && <Skeleton className="h-24 w-full" />}
        {upcoming.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              Something went wrong loading your upcoming viewings.
            </AlertDescription>
          </Alert>
        )}
        {upcoming.data && (
          <ViewingRequestList
            viewingRequests={upcoming.data.data}
            emptyMessage="Book a viewing from any property's details page to see it here."
          />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-foreground font-semibold">Completed Viewings</h2>
          {completed.data && completed.data.meta.totalPages > 1 && (
            <Link
              to={PATHS.authenticated.bookings}
              className="text-body-sm text-primary font-medium hover:underline"
            >
              View all
            </Link>
          )}
        </div>
        {completed.isLoading && <Skeleton className="h-24 w-full" />}
        {completed.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              Something went wrong loading your completed viewings.
            </AlertDescription>
          </Alert>
        )}
        {completed.data && (
          <ViewingRequestList
            viewingRequests={completed.data.data}
            emptyMessage="Viewings you've completed will show up here."
          />
        )}
      </section>
    </div>
  );
}

export { DashboardPage };
