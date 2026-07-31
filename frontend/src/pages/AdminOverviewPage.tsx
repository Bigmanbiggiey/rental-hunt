import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router';
import { AdminStatCards, useAdminMetrics } from '@/features/admin-dashboard';
import { VerificationQueueTable, useVerificationQueue } from '@/features/admin-verification';
import { useAuth } from '@/entities/user';
import { Alert, AlertDescription, EmptyState, Skeleton } from '@/shared/ui';
import { PATHS } from '@/shared/config';

/**
 * roadmap.md §11. Branches by role at the component level, the same
 * "one URL, branch content" pattern already established by `DashboardPage`'s
 * agent/customer split (Gap 3) — a moderator's overview *is* the
 * verification queue (their only real dashboard action per the DoD), while
 * an admin sees platform-wide stat cards.
 */
function AdminOverviewPage() {
  const { profile } = useAuth();

  if (profile?.role === 'moderator') {
    return <ModeratorOverview />;
  }

  return <AdminOverview />;
}

function AdminOverview() {
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

function ModeratorOverview() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useVerificationQueue(1, 10);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-foreground font-semibold">Verification Queue</h1>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Something went wrong loading the verification queue.</AlertDescription>
        </Alert>
      )}

      {data && data.data.length === 0 && (
        <EmptyState icon={ShieldAlert} heading="Nothing pending" description="No listings are awaiting review." />
      )}

      {data && data.data.length > 0 && (
        <VerificationQueueTable
          properties={data.data}
          onReview={() => navigate(PATHS.admin.verificationQueue)}
        />
      )}
    </div>
  );
}

export { AdminOverviewPage };
