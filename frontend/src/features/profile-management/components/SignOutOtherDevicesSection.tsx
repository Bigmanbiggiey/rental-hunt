import { useState } from 'react';
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
import { useSignOutOtherDevices } from '../hooks/useSignOutOtherDevices';

/**
 * `scope: 'others'` (`credentials.repository.ts`), not `'global'` — revokes
 * every other refresh token for this account without also signing the
 * caller out of the page they clicked this from, the same "sign out of all
 * other sessions" shape Google/GitHub/Slack use. A confirm step is
 * warranted since it's a real, immediate action against sessions the user
 * can't see or undo from here, mirroring `DeleteUserDialog`'s same pattern.
 */
export function SignOutOtherDevicesSection() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending, error, reset } = useSignOutOtherDevices();

  const submissionError = isAppError(error) ? error.message : null;

  const handleConfirm = () => {
    mutate(undefined, {
      onSuccess: () => {
        toast.success('Signed out of all other devices.');
        setOpen(false);
      },
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-h3 text-foreground font-semibold">Sessions</h2>
        <p className="text-body-sm text-muted-foreground">
          If you think your account is signed in somewhere it shouldn’t be, sign out every other
          device — this one stays signed in.
        </p>
      </div>

      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Sign out of all other devices
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) reset();
          setOpen(next);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out of all other devices?</DialogTitle>
            <DialogDescription>
              Any other browser or device currently signed in to your account will be signed out
              immediately. This device stays signed in.
            </DialogDescription>
          </DialogHeader>

          {submissionError && (
            <Alert variant="destructive">
              <AlertDescription>{submissionError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" isLoading={isPending} onClick={handleConfirm}>
              Sign out other devices
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
