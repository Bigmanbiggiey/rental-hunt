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

// BOOK-004. Agent variant of `features/viewing-requests/components/CancelBookingDialog.tsx`
// — same shape (ui-guidelines.md §11.10's "confirm cancellation" example),
// agent-appropriate copy. Features can't cross-import (coding-standards.md
// §3.2), and per "extract on the third real duplicate" a second occurrence
// doesn't yet justify a shared move.
export function CancelBookingDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void;
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
          <DialogTitle>Cancel this booking?</DialogTitle>
          <DialogDescription>
            This can’t be undone. The customer will be notified the booking was cancelled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="agent-cancellation-reason">Reason (optional)</Label>
          <Textarea
            id="agent-cancellation-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            readOnly={isPending}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Keep booking
          </Button>
          <Button variant="destructive" isLoading={isPending} onClick={() => onConfirm(reason || undefined)}>
            Cancel booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
