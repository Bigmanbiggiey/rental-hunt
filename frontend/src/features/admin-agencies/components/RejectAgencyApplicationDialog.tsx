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

// Epic 12 — mirrors agent-bookings' CancelBookingDialog shape
// (ui-guidelines.md §11.10), but reason is required here (the RPC itself
// enforces it), not optional.
export function RejectAgencyApplicationDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending?: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason('');
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject this application?</DialogTitle>
          <DialogDescription>The applicant will see this reason.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="agency-rejection-reason">
            Reason <span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </Label>
          <Textarea
            id="agency-rejection-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            readOnly={isPending}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            isLoading={isPending}
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason)}
          >
            Reject application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
