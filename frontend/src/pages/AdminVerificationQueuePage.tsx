import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { VerificationQueueTable, useVerificationQueue } from '@/features/admin-verification';
import type { Property } from '@/entities/property';
import { Alert, AlertDescription, Button, EmptyState, Skeleton } from '@/shared/ui';
import { PATHS } from '@/shared/config';

const PAGE_SIZE = 20;

/**
 * roadmap.md §11's core DoD: "a moderator can review a pending listing,
 * verify or reject it with a reason." "Review" navigates to
 * `AdminVerificationReviewPage` (full listing details + the approve/reject
 * action bar) rather than opening a dialog here — the point of verification
 * is confirming what the agent entered is accurate, which needs the whole
 * listing visible, not just a title. Realtime for the reviewer's own view
 * isn't needed here (they're the one taking the action, not waiting on
 * someone else's) — the review page's own mutation `onSuccess` invalidation
 * is enough; `useAgentPropertyVerificationRealtime` is what covers the
 * *agent's* side.
 */
function AdminVerificationQueuePage() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading, isError } = useVerificationQueue(page, PAGE_SIZE);

  const reviewProperty = (property: Property) => {
    // Works for both the admin and moderator route groups (this page is
    // mounted at both, per AdminVerificationReviewPage's own note) — swap
    // just the trailing `verification-queue` segment for the current
    // location's own prefix rather than hardcoding one PATHS constant.
    const basePath = location.pathname.startsWith('/moderator-dashboard')
      ? PATHS.moderatorDashboard.verificationQueue
      : PATHS.adminDashboard.verificationQueue;
    navigate(`${basePath}/${property.id}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-foreground font-semibold">Verification Queue</h1>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
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
        <>
          <VerificationQueueTable properties={data.data} onReview={reviewProperty} />

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

export { AdminVerificationQueuePage };
