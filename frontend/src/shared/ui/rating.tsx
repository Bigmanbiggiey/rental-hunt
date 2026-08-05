import { Star } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface RatingProps {
  /** `null` means no reviews yet — rendered as "No reviews yet" rather than a misleading 0-star display. */
  averageRating: number | null;
  reviewCount: number;
  className?: string;
}

/**
 * Read-only star display (Epic 12 — ui-guidelines.md's new Rating spec).
 * Stars are `aria-hidden`; the one real accessible label carries the actual
 * numbers, so a screen reader never has to count filled/half/empty icons.
 */
function Rating({ averageRating, reviewCount, className }: RatingProps) {
  if (averageRating === null || reviewCount === 0) {
    return <span className={cn('text-body-sm text-muted-foreground', className)}>No reviews yet</span>;
  }

  const rounded = Math.round(averageRating * 2) / 2; // nearest half-star

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      role="img"
      aria-label={`Rated ${averageRating.toFixed(1)} out of 5 from ${reviewCount} review${reviewCount === 1 ? '' : 's'}`}
    >
      <span className="flex" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => {
          const fill = Math.min(1, Math.max(0, rounded - i));
          return (
            <span key={i} className="relative inline-block size-4">
              <Star className="text-muted-foreground/40 absolute inset-0 size-4" />
              {fill > 0 && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star className="fill-warning text-warning size-4" />
                </span>
              )}
            </span>
          );
        })}
      </span>
      <span className="text-body-sm text-foreground font-medium">{averageRating.toFixed(1)}</span>
      <span className="text-body-sm text-muted-foreground">
        ({reviewCount} review{reviewCount === 1 ? '' : 's'})
      </span>
    </span>
  );
}

export { Rating };
