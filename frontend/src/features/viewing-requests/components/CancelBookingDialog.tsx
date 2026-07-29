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

// ui-guidelines.md §11.10's named "confirm cancellation" example. VIEW-004.
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
          <DialogTitle>Cancel this viewing?</DialogTitle>
          <DialogDescription>
            This can’t be undone. The agent will be notified the viewing was cancelled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="cancellation-reason">Reason (optional)</Label>
          <Textarea
            id="cancellation-reason"
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
          <Button
            variant="destructive"
            isLoading={isPending}
            onClick={() => onConfirm(reason || undefined)}
          >
            Cancel booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
