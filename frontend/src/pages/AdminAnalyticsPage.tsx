import { useState } from 'react';
import { AdminAnalyticsByAgencyTable, AdminAnalyticsSummary, useAdminAnalytics } from '@/features/admin-analytics';
import { Alert, AlertDescription, Input, Label, Skeleton } from '@/shared/ui';

function defaultRange() {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

/** api-design.md §9's "Analytics" row — platform-level aggregation on top of Sprint 6's per-property analytics. */
function AdminAnalyticsPage() {
  const [range, setRange] = useState(defaultRange());
  const { data, isLoading, isError } = useAdminAnalytics({
    from: `${range.from}T00:00:00Z`,
    to: `${range.to}T23:59:59Z`,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-foreground font-semibold">Analytics</h1>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1">
          <Label htmlFor="admin-analytics-from">From</Label>
          <Input
            id="admin-analytics-from"
            type="date"
            value={range.from}
            onChange={(event) => setRange({ ...range, from: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="admin-analytics-to">To</Label>
          <Input
            id="admin-analytics-to"
            type="date"
            value={range.to}
            onChange={(event) => setRange({ ...range, to: event.target.value })}
          />
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Something went wrong loading analytics.</AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          <AdminAnalyticsSummary analytics={data} />
          <AdminAnalyticsByAgencyTable byAgency={data.byAgency} />
        </>
      )}
    </div>
  );
}

export { AdminAnalyticsPage };
