import { Heart } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

// ui-guidelines.md §12.12. Controlled component — `entities/` may not import
// `features/`, so every side effect (the mutation, the optimistic update,
// the guest-redirect) lives in `features/favorites`'s `useToggleFavorite()`
// hook; this component only renders the current state and forwards a click.
//
// Extracted out of PropertyCard (was private/inline) in Sprint 4 because
// FAV-001 itself requires the button on both listing cards and the property
// details page — a second real usage, not speculative reuse.
export function FavoriteButton({
  isSaved,
  isPending = false,
  onToggle,
  className,
}: {
  isSaved: boolean;
  isPending?: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSaved}
      aria-label={isSaved ? 'Remove from favorites' : 'Save property'}
      aria-disabled={isPending}
      className={cn(
        'flex size-8 items-center justify-center rounded-full',
        'bg-background/80 text-foreground hover:bg-background shadow-sm',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        isPending && 'opacity-70',
        className,
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (isPending) return;
        onToggle();
      }}
    >
      <Heart className={cn('size-4', isSaved && 'fill-current')} aria-hidden="true" />
    </button>
  );
}
