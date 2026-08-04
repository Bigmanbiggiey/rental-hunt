import { Link } from 'react-router';
import { CalendarCheck, Eye, Search, ShieldCheck, Users } from 'lucide-react';
import {
  useViewingRequests,
  useViewingRequestsRealtime,
  ViewingRequestList,
} from '@/features/viewing-requests';
import { Alert, AlertDescription, Button, Skeleton } from '@/shared/ui';
import { PATHS } from '@/shared/config';

const SECTION_PAGE_SIZE = 5;

// branding.md's Tagline + a condensed Brand Promise — the same "static,
// qualitative trust indicators" precedent SearchHero already established on
// the public homepage (ui-guidelines.md §1's "trust is shown, not claimed"
// governs per-listing signals tied to real DB fields; this is a one-time
// welcome explanation of how the platform works, not a substitute for
// those). Wording for the three steps themselves is this page's own, not
// quoted from branding.md — they just describe what DISC-*/PROP-*/VIEW-*
// already let a customer do.
const HOW_IT_WORKS = [
  { icon: Search, label: 'Search', description: 'Filter by neighborhood, price, and bedrooms.' },
  { icon: Eye, label: 'Compare', description: 'View full listing details, photos, and the map.' },
  { icon: CalendarCheck, label: 'Book a Viewing', description: 'Request a viewing straight from the listing.' },
] as const;

// CUST-001 (Upcoming) + CUST-002 (Completed). Reached at /user-dashboard,
// extracted out of the old DashboardPage's customer branch (post-Sprint-8
// restructuring — customer now has its own dedicated route group, same as
// every other role, so there's no more role-branching to do at this level).
// Realtime status updates (api-design.md §11) are subscribed once for the
// whole page, not per section, to avoid duplicate `postgres_changes`
// channels. The welcome block below (post-Sprint-8, 2026-08-04) stays
// visible always, not just for first-time/empty-state customers — the
// developer's explicit call over hiding it once real booking history
// exists, see decisions.md.
function UserDashboardOverviewPage() {
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
    <div className="flex flex-col gap-8">
      <section className="bg-accent flex flex-col gap-6 rounded-lg p-6 sm:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-h1 text-foreground font-bold">Find your next home with confidence.</h1>
          <p className="text-body text-muted-foreground max-w-2xl">
            Rental Hunt KE connects you with verified listings from legitimate agents — no wasted
            time, no surprises.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ icon: Icon, label, description }) => (
            <div key={label} className="flex flex-col gap-1">
              <Icon className="text-primary size-5" aria-hidden="true" />
              <p className="text-body text-foreground font-semibold">{label}</p>
              <p className="text-body-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button asChild size="lg">
            <Link to={PATHS.public.properties}>Browse Properties</Link>
          </Button>
          <div className="text-body-sm text-muted-foreground flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Verified Listings
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-4" aria-hidden="true" />
              Legitimate Agents
            </span>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-8">
        <h2 className="text-h1 text-foreground font-semibold">Your Bookings</h2>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-h2 text-foreground font-semibold">Upcoming Viewings</h3>
            {upcoming.data && upcoming.data.meta.totalPages > 1 && (
              <Link
                to={PATHS.userDashboard.bookings}
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
            <h3 className="text-h2 text-foreground font-semibold">Completed Viewings</h3>
            {completed.data && completed.data.meta.totalPages > 1 && (
              <Link
                to={PATHS.userDashboard.bookings}
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
    </div>
  );
}

export { UserDashboardOverviewPage };
