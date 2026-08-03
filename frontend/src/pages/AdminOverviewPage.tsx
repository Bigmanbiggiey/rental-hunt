import { AdminStatCards, useAdminMetrics } from '@/features/admin-dashboard';
import { Alert, AlertDescription, Skeleton } from '@/shared/ui';

// roadmap.md §11. Only ever reached by role: 'admin' — moderator has its
// own separate overview at /moderator-dashboard now (see
// ModeratorDashboardOverviewPage), so this no longer branches by role.
function AdminOverviewPage() {
  const { data: metrics, isLoading, isError } = useAdminMetrics();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-foreground font-semibold">Admin Overview</h1>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Something went wrong loading platform metrics.</AlertDescription>
        </Alert>
      )}

      {metrics && <AdminStatCards metrics={metrics} />}
    </div>
  );
}

export { AdminOverviewPage };
