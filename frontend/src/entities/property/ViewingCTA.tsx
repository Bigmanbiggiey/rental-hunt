import { Alert, AlertDescription, Button } from '@/shared/ui';
import type { PropertyAvailabilityStatus } from './property.types';

// ui-guidelines.md §12.4/§12.14. Controlled component (entities/ can't
// import features/, see FavoriteButton's same note) — `onBook` is decided by
// whichever page renders this (guest -> navigate to login; customer -> open
// the booking dialog), `entities/property` only knows availability. Sticky-
// bottom positioning on mobile is pure layout, unchanged since Sprint 3/4.
export function ViewingCTA({
  availabilityStatus,
  onBook,
}: {
  availabilityStatus: PropertyAvailabilityStatus;
  onBook: () => void;
}) {
  const isAvailable = availabilityStatus === 'available';

  return (
    <div className="border-border bg-background sticky bottom-0 z-10 flex flex-col gap-2 border-t p-4 sm:static sm:border-0 sm:p-0">
      <Button size="lg" disabled={!isAvailable} onClick={onBook}>
        Book a Viewing
      </Button>
      {!isAvailable && (
        <Alert>
          <AlertDescription>This property isn't currently available for booking.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
