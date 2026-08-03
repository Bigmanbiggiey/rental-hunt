import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router';
import { VerificationQueueTable, useVerificationQueue } from '@/features/admin-verification';
import { Alert, AlertDescription, EmptyState, Skeleton } from '@/shared/ui';
import { PATHS } from '@/shared/config';

// roadmap.md §11 — a moderator's overview *is* the verification queue
// (their only real dashboard action per the DoD). Extracted out of
// AdminOverviewPage's old role-branch (post-Sprint-8 restructuring, see
// decisions.md) now that moderator has its own route group.
function ModeratorDashboardOverviewPage() {
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
          onReview={() => navigate(PATHS.moderatorDashboard.verificationQueue)}
        />
      )}
    </div>
  );
}

export { ModeratorDashboardOverviewPage };
