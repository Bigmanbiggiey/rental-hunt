import { toast } from 'sonner';
import { Label, Switch } from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import { useAuth } from '@/entities/user';
import { useUpdateNotificationPreferences } from '../hooks/useUpdateNotificationPreferences';

// CUST-004. Each toggle fires its mutation immediately on change (no Save
// button, per ui-guidelines.md §11.6's Switch behavior) — not a submit-on-
// blur form field. "Booking status updates" renders checked and disabled:
// the AC's "not fully disable-able, only their delivery channel" has no
// delivery-channel mechanism to expose yet (see profile.service.ts's note),
// so a locked toggle is the honest state rather than a fake selector.
export function NotificationPreferencesForm() {
  const { profile } = useAuth();
  const { mutate, isPending } = useUpdateNotificationPreferences();

  if (!profile) return null;

  const promotionalUpdates = profile.notificationPreferences.promotionalUpdates ?? false;

  function handlePromotionalChange(checked: boolean) {
    mutate(
      { bookingUpdates: true, promotionalUpdates: checked },
      {
        onSuccess: () => toast.success('Notification preferences updated.'),
        onError: (error) => {
          toast.error(
            isAppError(error) ? error.message : 'Something went wrong. Please try again.',
          );
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-h3 text-foreground font-semibold">Notification preferences</h2>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="bookingUpdates">Booking status updates</Label>
          <p className="text-body-sm text-muted-foreground">
            Confirmations and status changes for your viewing requests can’t be fully turned off
            yet.
          </p>
        </div>
        <Switch id="bookingUpdates" checked disabled />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="promotionalUpdates">Promotional updates</Label>
          <p className="text-body-sm text-muted-foreground">News and offers from Rental Hunt KE.</p>
        </div>
        <Switch
          id="promotionalUpdates"
          checked={promotionalUpdates}
          disabled={isPending}
          onCheckedChange={handlePromotionalChange}
        />
      </div>
    </div>
  );
}
