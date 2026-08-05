import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { AdminBookingTable, useAdminBookings } from '@/features/admin-bookings';
import { Alert, AlertDescription, Button, EmptyState, Skeleton } from '@/shared/ui';

const PAGE_SIZE = 10;

/** Epic 12 — the Admin Overview's "Bookings this week" stat card drills into this, 10-per-page. */
function AdminBookingsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAdminBookings(page, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-foreground font-semibold">Bookings</h1>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Something went wrong loading bookings.</AlertDescription>
        </Alert>
      )}

      {data && data.data.length === 0 && (
        <EmptyState icon={CalendarClock} heading="No bookings yet" description="Viewing requests will appear here once customers book." />
      )}

      {data && data.data.length > 0 && (
        <>
          <AdminBookingTable bookings={data.data} />

          {data.meta.totalPages > 1 && (
            <div className="mx-auto flex items-center gap-4">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <span className="text-body-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { AdminBookingsPage };
