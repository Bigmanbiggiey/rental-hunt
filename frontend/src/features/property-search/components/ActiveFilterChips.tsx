import { X } from 'lucide-react';
import { Badge } from '@/shared/ui';
import { useAmenities, useCounties, usePropertyTypes } from '../hooks/useReferenceData';
import type { PropertyFiltersRawInput } from '../schemas/propertyFilters.schema';

interface ActiveFilterChipsProps {
  rawFilters: PropertyFiltersRawInput;
  setFilter: (key: keyof PropertyFiltersRawInput, value: string | string[] | undefined) => void;
}

/** `ui-guidelines.md` §13.3 — each active filter removable individually via a dismissible chip. */
export function ActiveFilterChips({ rawFilters, setFilter }: ActiveFilterChipsProps) {
  const { data: counties } = useCounties();
  const { data: propertyTypes } = usePropertyTypes();
  const { data: amenities } = useAmenities();

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (rawFilters.q) {
    chips.push({ key: 'q', label: `"${rawFilters.q}"`, onRemove: () => setFilter('q', undefined) });
  }
  if (rawFilters.county) {
    const name = counties?.find((c) => c.id === rawFilters.county)?.name ?? 'County';
    chips.push({ key: 'county', label: name, onRemove: () => setFilter('county', undefined) });
  }
  if (rawFilters.propertyType) {
    const name = propertyTypes?.find((t) => t.id === rawFilters.propertyType)?.name ?? 'Type';
    chips.push({ key: 'propertyType', label: name, onRemove: () => setFilter('propertyType', undefined) });
  }
  if (rawFilters.bedroomsMin || rawFilters.bedroomsMax) {
    chips.push({
      key: 'bedrooms',
      label: `Bedrooms ${rawFilters.bedroomsMin ?? '0'}–${rawFilters.bedroomsMax ?? '∞'}`,
      onRemove: () => {
        setFilter('bedroomsMin', undefined);
        setFilter('bedroomsMax', undefined);
      },
    });
  }
  if (rawFilters.minPrice || rawFilters.maxPrice) {
    chips.push({
      key: 'price',
      label: `KES ${rawFilters.minPrice ?? '0'}–${rawFilters.maxPrice ?? '∞'}`,
      onRemove: () => {
        setFilter('minPrice', undefined);
        setFilter('maxPrice', undefined);
      },
    });
  }
  for (const amenityId of rawFilters.amenities ?? []) {
    const name = amenities?.find((a) => a.id === amenityId)?.name ?? 'Amenity';
    chips.push({
      key: `amenity-${amenityId}`,
      label: name,
      onRemove: () =>
        setFilter(
          'amenities',
          (rawFilters.amenities ?? []).filter((id) => id !== amenityId),
        ),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <Badge key={chip.key} variant="secondary" className="gap-1 pr-1">
          {chip.label}
          <button
            type="button"
            aria-label={`Remove ${chip.label} filter`}
            onClick={chip.onRemove}
            className="rounded-full p-0.5 hover:bg-background/50"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
