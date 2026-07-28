import { Alert, AlertDescription, Button } from '@/shared/ui';

// ui-guidelines.md §12.4/§12.14. Always disabled this sprint — booking
// (VIEW-001) doesn't exist yet, independent of availability_status or
// guest/customer state; that distinction is real once VIEW-001 ships, not
// before, so a single generic "coming soon" state is more honest than
// half-implementing the guest-redirect/availability rule from §12.14.
// Sticky-bottom positioning on mobile is implemented now (pure layout,
// already decided in docs) so Sprint 5 doesn't have to reshuffle the page —
// the same reasoning already applied to FavoriteButton in Sprint 3.
// TODO(VIEW-001, Sprint 5): wire up the real booking flow and the
// availability/guest-redirect branches from ui-guidelines.md §12.14.
export function ViewingCTA() {
  return (
    <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t border-border bg-background p-4 sm:static sm:border-0 sm:p-0">
      <Button size="lg" disabled>
        Book a Viewing
      </Button>
      <Alert>
        <AlertDescription>Booking is coming soon.</AlertDescription>
      </Alert>
    </div>
  );
}
