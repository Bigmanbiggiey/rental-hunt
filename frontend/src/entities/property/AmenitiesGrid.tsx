import { cn } from '@/shared/lib/utils';
import { getAmenityIcon } from './amenityIcons';
import type { Amenity } from './property.types';

interface AmenitiesGridProps {
  /** The amenities this property actually has (`property.amenities`). */
  available: Amenity[];
  /** The full catalogue (`referenceDataRepository.listAmenities()`), to know what to show as absent. */
  all: Amenity[];
}

// PROP-003 / ui-guidelines.md §12.5. Presentational only — takes both lists
// as props and diffs internally; does not fetch data itself (entities/ may
// not import from features/, so the page fetches `all` via the already-built
// `useAmenities()` hook and passes it down alongside `property.amenities`).
export function AmenitiesGrid({ available, all }: AmenitiesGridProps) {
  const availableIds = new Set(available.map((a) => a.id));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {all.map((amenity) => {
        const isAvailable = availableIds.has(amenity.id);
        const Icon = getAmenityIcon(amenity.icon);
        return (
          <div
            key={amenity.id}
            className={cn(
              'flex items-center gap-2 text-body-sm',
              isAvailable ? 'text-foreground' : 'text-muted-foreground opacity-40',
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span>{amenity.name}</span>
            {!isAvailable && <span className="sr-only"> (not available)</span>}
          </div>
        );
      })}
    </div>
  );
}
