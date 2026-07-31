import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import {
  ActivityLogFilterBar,
  ActivityLogTable,
  useActivityLogs,
  type ActivityLogFilters as Filters,
} from '@/features/admin-activity-log';
import { Alert, AlertDescription, Button, EmptyState, Skeleton } from '@/shared/ui';

const PAGE_SIZE = 20;

/** roadmap.md §11's DoD: "view a basic activity log filtered by entity." */
function AdminActivityLogPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useActivityLogs(filters, page, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-foreground font-semibold">Activity Log</h1>

      <ActivityLogFilterBar
        filters={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
      />

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Something went wrong loading the activity log.</AlertDescription>
        </Alert>
      )}

      {data && data.data.length === 0 && (
        <EmptyState icon={ScrollText} heading="No activity found" description="Try a different filter." />
      )}

      {data && data.data.length > 0 && (
        <>
          <ActivityLogTable logs={data.data} />

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

export { AdminActivityLogPage };
