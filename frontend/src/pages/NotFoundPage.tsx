import { MapPinOff } from 'lucide-react';
import { useNavigate } from 'react-router';
import { EmptyState } from '@/shared/ui';
import { PATHS } from '@/shared/config';

// CONTENT-005. Replaces `PlaceholderPage` on the catch-all `*` route —
// `PlaceholderPage`'s "Route skeleton — page not yet implemented" copy is
// correct for an unbuilt feature route but actively misleading for a
// genuine not-found case (found during the 2026-08-04 landing-page
// discussion, scoped and built 2026-08-05). Copy/anatomy is ui-guidelines.md
// §19's already-documented "404" row, not invented here — the icon-only
// (no red) treatment matches that section's "situational, not the user's
// fault" rule for offline/server-error/404 states.
function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full items-center justify-center p-6">
      <EmptyState
        icon={MapPinOff}
        heading="We couldn't find that page"
        description="It may have moved, or the listing may no longer be available."
        action={{ label: 'Back to homepage', onClick: () => navigate(PATHS.public.home) }}
      />
    </div>
  );
}

export { NotFoundPage };
