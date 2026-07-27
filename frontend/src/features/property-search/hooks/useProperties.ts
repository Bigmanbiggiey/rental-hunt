import { useInfiniteQuery } from '@tanstack/react-query';
import type { Cursor } from '@/entities/property';
import { propertySearchService } from '../services/property.service';
import type { PropertyFiltersRawInput } from '../schemas/propertyFilters.schema';

/** DISC-001/003/004 — the public property feed, "Load more" infinite scroll backed by keyset pagination. */
export function useProperties(rawFilters: PropertyFiltersRawInput) {
  return useInfiniteQuery({
    queryKey: ['properties', 'list', rawFilters],
    queryFn: ({ pageParam }) => propertySearchService.list(rawFilters, pageParam),
    initialPageParam: undefined as Cursor | undefined,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? (lastPage.meta.nextCursor ?? undefined) : undefined),
    staleTime: 30_000, // live availability data — the project-wide default, not long-cached reference data
  });
}
