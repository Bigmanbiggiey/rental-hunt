import { useState } from 'react';
import { Button, Label, Textarea } from '@/shared/ui';
import type { VerificationActionFormInput } from '../schemas/verificationAction.schema';

export interface VerificationActionBarProps {
  onSubmit: (input: VerificationActionFormInput) => void;
  isPending?: boolean;
}

/**
 * The review page's decision surface — reason field + Approve/Reject, fixed
 * to the bottom of the viewport (sticky on mobile, in-flow at the bottom of
 * the page content on `sm:` and up, mirroring `ViewingCTA`'s exact same
 * sticky/static breakpoint pattern). Replaces `VerificationActionDialog`:
 * the point of review is reading the listing above this bar, not a separate
 * modal — see `AdminVerificationReviewPage`. A reason is required on reject
 * (api-design.md §6.9); approve needs none.
 */
export function VerificationActionBar({ onSubmit, isPending = false }: VerificationActionBarProps) {
  const [reason, setReason] = useState('');
  const [showReasonError, setShowReasonError] = useState(false);

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
    <div className="border-border bg-background sticky bottom-0 z-10 flex flex-col gap-3 border-t p-4 sm:static sm:border-0 sm:bg-transparent sm:p-0">
      <div className="space-y-2">
        <Label htmlFor="verification-reason">Reason (required if rejecting)</Label>
        <Textarea
          id="verification-reason"
          rows={2}
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

      <div className="flex justify-end gap-2">
        <Button variant="destructive" isLoading={isPending} onClick={handleReject}>
          Reject
        </Button>
        <Button isLoading={isPending} onClick={handleApprove}>
          Approve
        </Button>
      </div>
    </div>
  );
}
