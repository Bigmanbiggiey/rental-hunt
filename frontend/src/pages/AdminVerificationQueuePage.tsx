import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import {
  VerificationActionDialog,
  VerificationQueueTable,
  useSetVerificationStatus,
  useVerificationQueue,
} from '@/features/admin-verification';
import type { Property } from '@/entities/property';
import { isAppError } from '@/shared/lib/errors';
import { Alert, AlertDescription, Button, EmptyState, Skeleton } from '@/shared/ui';

const PAGE_SIZE = 20;

/**
 * roadmap.md §11's core DoD: "a moderator can review a pending listing,
 * verify or reject it with a reason." Realtime for the reviewer's own view
 * isn't needed here (they're the one taking the action, not waiting on
 * someone else's) — the mutation's own `onSuccess` invalidation is enough;
 * `useAgentPropertyVerificationRealtime` is what covers the *agent's* side.
 */
function AdminVerificationQueuePage() {
  const [page, setPage] = useState(1);
  const [reviewing, setReviewing] = useState<Property | null>(null);
  const { data, isLoading, isError } = useVerificationQueue(page, PAGE_SIZE);
  const { mutate, isPending } = useSetVerificationStatus();

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
          <VerificationQueueTable properties={data.data} onReview={setReviewing} />

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

      <VerificationActionDialog
        property={reviewing}
        isPending={isPending}
        onOpenChange={(open) => {
          if (!open) setReviewing(null);
        }}
        onSubmit={(input) => {
          if (!reviewing) return;
          mutate(
            { propertyId: reviewing.id, input },
            {
              onSuccess: () => {
                toast.success(input.status === 'verified' ? 'Listing approved.' : 'Listing rejected.');
                setReviewing(null);
              },
              onError: (error) => {
                toast.error(isAppError(error) ? error.message : 'Something went wrong.');
              },
            },
          );
        }}
      />
    </div>
  );
}

export { AdminVerificationQueuePage };
