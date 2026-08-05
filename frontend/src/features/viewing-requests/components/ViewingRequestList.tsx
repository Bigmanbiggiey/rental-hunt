import { useState, type ReactNode } from 'react';
import { CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import { BookingCard, type ViewingRequest } from '@/entities/viewing-request';
import { useCancelViewingRequest } from '../hooks/useCancelViewingRequest';
import { CancelBookingDialog } from './CancelBookingDialog';

// Owns cancel-dialog wiring internally so DashboardPage (x2 sections) and
// BookingsPage (x1) don't each duplicate it — mirrors PropertyGrid/
// PropertyCard's existing fetch/render split (loading/error stay the
// caller's responsibility, since they differ per section/page).
export function ViewingRequestList({
  viewingRequests,
  emptyMessage,
  renderExtraActions,
}: {
  viewingRequests: ViewingRequest[];
  emptyMessage: string;
  /**
   * Epic 12's "Write a review" action — deliberately a render-prop, not a
   * direct `features/reviews` import: features can't cross-import each
   * other (coding-standards.md §3.2), so the actual review-dialog wiring
   * lives one layer up (a widget/page, which may import both). Returning
   * `undefined` for a given booking (e.g. anything not `completed`) falls
   * back to `BookingCard`'s own default Cancel-button behavior unchanged.
   */
  renderExtraActions?: (viewingRequest: ViewingRequest) => ReactNode;
}) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { mutate, isPending } = useCancelViewingRequest();

  if (viewingRequests.length === 0) {
    return (
      <EmptyState icon={CalendarClock} heading="No viewings here yet" description={emptyMessage} />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {viewingRequests.map((viewingRequest) => (
        <BookingCard
          key={viewingRequest.id}
          viewingRequest={viewingRequest}
          onCancelClick={() => setCancellingId(viewingRequest.id)}
          isCancelling={isPending && cancellingId === viewingRequest.id}
          actions={renderExtraActions?.(viewingRequest)}
        />
      ))}

      <CancelBookingDialog
        open={cancellingId !== null}
        onOpenChange={(open) => {
          if (!open) setCancellingId(null);
        }}
        isPending={isPending}
        onConfirm={(reason) => {
          if (!cancellingId) return;
          mutate(
            { id: cancellingId, reason },
            {
              onSuccess: () => {
                toast.success('Viewing cancelled.');
                setCancellingId(null);
              },
              onError: (error) => {
                toast.error(
                  isAppError(error) ? error.message : 'Something went wrong. Please try again.',
                );
              },
            },
          );
        }}
      />
    </div>
  );
}
