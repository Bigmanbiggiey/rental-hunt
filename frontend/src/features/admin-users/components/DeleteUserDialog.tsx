import { toast } from 'sonner';
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import { useDeleteUser } from '../hooks/useDeleteUser';

export interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const BLOCKER_LABELS: Record<string, string> = {
  properties: 'listing(s)',
  agentBookings: 'booking(s) as the assigned agent',
  customerBookings: 'booking(s) as the customer',
  reviews: 'verification review(s)',
  verifiedProperties: 'listing(s) they verified',
};

// Only ever attempts a real, permanent delete — admin-delete-user (Edge
// Function) checks for any owned listings/bookings/reviews first and
// refuses with USER_HAS_ACTIVITY rather than letting a raw FK-constraint
// error surface, per the developer's explicit choice (2026-08-04) to keep
// hard-delete limited to genuinely empty accounts and point everything
// else at the existing Deactivate toggle instead.
export function DeleteUserDialog({ open, onOpenChange, userId, userName }: DeleteUserDialogProps) {
  const { mutate, isPending, error, reset } = useDeleteUser();

  const submissionError = isAppError(error) ? error : null;
  const isBlocked = submissionError?.code === 'USER_HAS_ACTIVITY';
  // details is Record<string, string> (AppError's own convention — a
  // field-path -> message map) even here, where the values happen to be
  // stringified counts rather than messages; parsed back to numbers only
  // for display.
  const blockedCounts: [string, number][] = submissionError?.details
    ? Object.entries(submissionError.details).map(([key, value]) => [key, Number(value)])
    : [];

  const handleConfirm = () => {
    mutate(userId, {
      onSuccess: () => {
        toast.success(`${userName}'s account was deleted.`);
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {userName}’s account?</DialogTitle>
          <DialogDescription>This permanently deletes their account. This can’t be undone.</DialogDescription>
        </DialogHeader>

        {submissionError && (
          <Alert variant="destructive">
            <AlertDescription>
              {isBlocked ? (
                <>
                  {submissionError.message}
                  {blockedCounts.length > 0 && (
                    <ul className="mt-2 list-disc pl-5">
                      {blockedCounts
                        .filter(([, count]) => count > 0)
                        .map(([key, count]) => (
                          <li key={key}>
                            {count} {BLOCKER_LABELS[key] ?? key}
                          </li>
                        ))}
                    </ul>
                  )}
                </>
              ) : (
                submissionError.message
              )}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {isBlocked ? 'Close' : 'Cancel'}
          </Button>
          {!isBlocked && (
            <Button variant="destructive" isLoading={isPending} onClick={handleConfirm}>
              Delete account
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
