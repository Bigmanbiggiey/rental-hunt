import { useInfiniteQuery } from '@tanstack/react-query';
import type { Cursor } from '@/entities/property';
import { agencyProfileService } from '../services/agency-profile.service';

/** The Agency Profile Page's "Properties" section — the same public, cursor-paginated feed as `useProperties`, scoped to one agency. */
export function useAgencyProperties(agencyId: string) {
  return useInfiniteQuery({
    queryKey: ['agencies', 'properties', agencyId],
    queryFn: ({ pageParam }) => agencyProfileService.listProperties(agencyId, pageParam),
    initialPageParam: undefined as Cursor | undefined,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? (lastPage.meta.nextCursor ?? undefined) : undefined),
    staleTime: 30_000,
  });
}
