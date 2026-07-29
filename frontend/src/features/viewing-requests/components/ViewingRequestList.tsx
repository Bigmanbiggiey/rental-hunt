import { useState } from 'react';
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
}: {
  viewingRequests: ViewingRequest[];
  emptyMessage: string;
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
