import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';

// ui-guidelines.md §12.12: saving isn't implemented until Sprint 5
// (FAV-001/FAV-002). Rendered permanently in its "unsaved" state rather than
// omitted — the anatomy is already decided (§12.1/§12.4) and omitting it now
// would reshuffle layout once Sprint 5 wires up the real toggle.
// TODO(FAV-001/002, Sprint 5): replace with a real optimistic save/unsave.
//
// Extracted out of PropertyCard (was private/inline) because FAV-001 itself
// requires the button on both listing cards and the property details page —
// a second real usage, not speculative reuse.
export function FavoriteButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={false}
      aria-label="Save property (coming soon)"
      className={cn(
        'flex size-8 items-center justify-center rounded-full',
        'bg-background/80 text-foreground shadow-sm hover:bg-background',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toast.info('Saving properties is coming soon.');
      }}
    >
      <Heart className="size-4" aria-hidden="true" />
    </button>
  );
}
