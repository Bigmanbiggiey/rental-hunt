import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from '@/shared/ui';
import type { Property } from '@/entities/property';
import type { VerificationActionFormInput } from '../schemas/verificationAction.schema';

export interface VerificationActionDialogProps {
  property: Property | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: VerificationActionFormInput) => void;
  isPending?: boolean;
}

/**
 * roadmap.md §11's core moderator action: approve or reject a pending
 * listing, with a reason required on reject (api-design.md §6.9). The
 * reason field only renders/validates when Reject is chosen — the kind of
 * non-trivial conditional `coding-standards.md` §19 calls out for a
 * dedicated component test.
 */
export function VerificationActionDialog({
  property,
  onOpenChange,
  onSubmit,
  isPending = false,
}: VerificationActionDialogProps) {
  const [reason, setReason] = useState('');
  const [showReasonError, setShowReasonError] = useState(false);

  const reset = () => {
    setReason('');
    setShowReasonError(false);
  };

  const handleApprove = () => {
    onSubmit({ status: 'verified' });
  };

  const handleReject = () => {
    if (!reason.trim()) {
      setShowReasonError(true);
      return;
    }
    onSubmit({ status: 'rejected', reason: reason.trim() });
  };

  return (
    <Dialog
      open={property !== null}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review listing</DialogTitle>
          <DialogDescription>{property?.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="verification-reason">Reason (required if rejecting)</Label>
          <Textarea
            id="verification-reason"
            rows={3}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (event.target.value.trim()) setShowReasonError(false);
            }}
            readOnly={isPending}
            aria-invalid={showReasonError}
            aria-describedby={showReasonError ? 'verification-reason-error' : undefined}
          />
          {showReasonError && (
            <p id="verification-reason-error" className="text-body-sm text-destructive">
              A reason is required when rejecting a listing.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="destructive" isLoading={isPending} onClick={handleReject}>
            Reject
          </Button>
          <Button isLoading={isPending} onClick={handleApprove}>
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
