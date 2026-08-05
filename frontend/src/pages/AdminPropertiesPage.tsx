import { useState } from 'react';
import { Home } from 'lucide-react';
import { AdminPropertyTable, useAdminProperties } from '@/features/admin-properties';
import { Alert, AlertDescription, Button, EmptyState, Skeleton } from '@/shared/ui';

const PAGE_SIZE = 10;

/** Epic 12 — the Admin Overview's "Total properties" stat card drills into this, 10-per-page. */
function AdminPropertiesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAdminProperties(page, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-foreground font-semibold">Properties</h1>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Something went wrong loading properties.</AlertDescription>
        </Alert>
      )}

      {data && data.data.length === 0 && (
        <EmptyState icon={Home} heading="No properties yet" description="Listings will appear here once agents create them." />
      )}

      {data && data.data.length > 0 && (
        <>
          <AdminPropertyTable properties={data.data} />

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

export { AdminPropertiesPage };
