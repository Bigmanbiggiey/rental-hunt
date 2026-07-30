import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import { BookingCard, type ViewingRequest } from '@/entities/viewing-request';
import { useConfirmViewingRequest } from '../hooks/useConfirmViewingRequest';
import { useRescheduleViewingRequest } from '../hooks/useRescheduleViewingRequest';
import { useCancelViewingRequestAgent } from '../hooks/useCancelViewingRequestAgent';
import { useCompleteViewingRequest } from '../hooks/useCompleteViewingRequest';
import { useMarkNoShow } from '../hooks/useMarkNoShow';
import { BookingActionsMenu } from './BookingActionsMenu';
import { RescheduleBookingDialog } from './RescheduleBookingDialog';
import { CancelBookingDialog } from './CancelBookingDialog';
import type { RescheduleViewingRequestInput } from '../schemas/rescheduleViewingRequest.schema';

export interface AgentBookingQueueProps {
  viewingRequests: ViewingRequest[];
  emptyMessage: string;
}

function showError(error: unknown) {
  toast.error(isAppError(error) ? error.message : 'Something went wrong. Please try again.');
}

/** BOOK-001–006 — owns all five transitions' dialog/menu wiring internally, mirroring `ViewingRequestList`'s single-cancel-dialog precedent. */
export function AgentBookingQueue({ viewingRequests, emptyMessage }: AgentBookingQueueProps) {
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const confirmMutation = useConfirmViewingRequest();
  const rescheduleMutation = useRescheduleViewingRequest();
  const cancelMutation = useCancelViewingRequestAgent();
  const completeMutation = useCompleteViewingRequest();
  const noShowMutation = useMarkNoShow();

  if (viewingRequests.length === 0) {
    return <EmptyState icon={CalendarClock} heading="No bookings here yet" description={emptyMessage} />;
  }

  const reschedulingRequest = viewingRequests.find((vr) => vr.id === reschedulingId) ?? null;
  const cancellingRequest = viewingRequests.find((vr) => vr.id === cancellingId) ?? null;

  return (
    <div className="flex flex-col gap-3">
      {viewingRequests.map((viewingRequest) => (
        <BookingCard
          key={viewingRequest.id}
          viewingRequest={viewingRequest}
          showCustomer
          actions={
            <BookingActionsMenu
              viewingRequest={viewingRequest}
              onConfirm={() =>
                confirmMutation.mutate(viewingRequest, {
                  onSuccess: () => toast.success('Viewing confirmed.'),
                  onError: showError,
                })
              }
              onReschedule={() => setReschedulingId(viewingRequest.id)}
              onComplete={() =>
                completeMutation.mutate(viewingRequest, {
                  onSuccess: () => toast.success('Viewing marked completed.'),
                  onError: showError,
                })
              }
              onMarkNoShow={() =>
                noShowMutation.mutate(viewingRequest, {
                  onSuccess: () => toast.success('Viewing marked as no-show.'),
                  onError: showError,
                })
              }
              onCancel={() => setCancellingId(viewingRequest.id)}
            />
          }
        />
      ))}

      <RescheduleBookingDialog
        open={reschedulingRequest !== null}
        onOpenChange={(open) => {
          if (!open) setReschedulingId(null);
        }}
        isPending={rescheduleMutation.isPending}
        error={rescheduleMutation.error}
        onConfirm={(input: RescheduleViewingRequestInput) => {
          if (!reschedulingRequest) return;
          rescheduleMutation.mutate(
            { viewingRequest: reschedulingRequest, input },
            {
              onSuccess: () => {
                toast.success('Viewing rescheduled.');
                setReschedulingId(null);
              },
              onError: showError,
            },
          );
        }}
      />

      <CancelBookingDialog
        open={cancellingRequest !== null}
        onOpenChange={(open) => {
          if (!open) setCancellingId(null);
        }}
        isPending={cancelMutation.isPending}
        onConfirm={(reason) => {
          if (!cancellingRequest) return;
          cancelMutation.mutate(
            { viewingRequest: cancellingRequest, reason },
            {
              onSuccess: () => {
                toast.success('Booking cancelled.');
                setCancellingId(null);
              },
              onError: showError,
            },
          );
        }}
      />
    </div>
  );
}
