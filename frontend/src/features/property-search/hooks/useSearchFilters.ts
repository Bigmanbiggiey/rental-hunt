import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { PropertySortOrder } from '@/entities/property';
import { parsePropertyFilters, type PropertyFiltersRawInput } from '../schemas/propertyFilters.schema';

type FilterKey = keyof PropertyFiltersRawInput;

/**
 * Wraps react-router's `useSearchParams` (NFR-SEARCH-004, `ui-guidelines.md`
 * §15.8): the URL is the single source of truth for filter/sort state, so a
 * filtered view is always bookmarkable/shareable. Pagination cursors are
 * deliberately NOT reflected here — the public feed uses "Load more"
 * infinite scroll (`ui-guidelines.md` §11.16), not numbered pages, so a
 * fresh visit to a shared/bookmarked filtered URL reasonably starts at the
 * first page of that filter set rather than replaying every prior "Load
 * more" click.
 */
export function useSearchFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawFilters = useMemo<PropertyFiltersRawInput>(() => {
    const amenitiesParam = searchParams.get('amenities');
    return {
      q: searchParams.get('q') ?? undefined,
      county: searchParams.get('county') ?? undefined,
      propertyType: searchParams.get('propertyType') ?? undefined,
      bedroomsMin: searchParams.get('bedroomsMin') ?? undefined,
      bedroomsMax: searchParams.get('bedroomsMax') ?? undefined,
      minPrice: searchParams.get('minPrice') ?? undefined,
      maxPrice: searchParams.get('maxPrice') ?? undefined,
      amenities: amenitiesParam ? amenitiesParam.split(',').filter(Boolean) : undefined,
      sort: searchParams.get('sort') ?? undefined,
    };
  }, [searchParams]);

  const filters = useMemo(() => parsePropertyFilters(rawFilters), [rawFilters]);

  const setFilter = useCallback(
    (key: FilterKey, value: string | string[] | undefined) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const isEmpty = value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
          if (isEmpty) {
            next.delete(key);
          } else {
            next.set(key, Array.isArray(value) ? value.join(',') : value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setSort = useCallback((sort: PropertySortOrder) => setFilter('sort', sort), [setFilter]);

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        rawFilters.q ||
          rawFilters.county ||
          rawFilters.propertyType ||
          rawFilters.bedroomsMin ||
          rawFilters.bedroomsMax ||
          rawFilters.minPrice ||
          rawFilters.maxPrice ||
          (rawFilters.amenities && rawFilters.amenities.length > 0),
      ),
    [rawFilters],
  );

  return { filters, rawFilters, setFilter, setSort, clearFilters, hasActiveFilters };
}
