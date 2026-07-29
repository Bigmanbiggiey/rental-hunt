import { useState } from 'react';
import {
  useViewingRequests,
  useViewingRequestsRealtime,
  ViewingRequestList,
} from '@/features/viewing-requests';
import type { ViewingStatus } from '@/entities/viewing-request';
import {
  Alert,
  AlertDescription,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@/shared/ui';

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: ViewingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

// VIEW-005 — the full booking history, most recently requested first,
// filterable by status.
function BookingsPage() {
  useViewingRequestsRealtime();

  const [status, setStatus] = useState<ViewingStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useViewingRequests({
    status: status === 'all' ? undefined : [status],
    sort: 'createdAtDesc',
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h1 text-foreground font-semibold">Bookings</h1>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as ViewingStatus | 'all');
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Filter by status" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <Skeleton className="h-24 w-full" />}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Something went wrong loading your bookings. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          <ViewingRequestList
            viewingRequests={data.data}
            emptyMessage="Book a viewing from any property's details page to see it here."
          />

          {data.meta.totalPages > 1 && (
            <div className="mx-auto flex items-center gap-4">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
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

export { BookingsPage };
