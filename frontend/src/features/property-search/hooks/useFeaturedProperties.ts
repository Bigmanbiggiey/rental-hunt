import { useQuery } from '@tanstack/react-query';
import { propertySearchService } from '../services/property.service';

/** DISC-005 — semi-static homepage content; a few minutes' staleTime, not `Infinity`, since `is_featured` can change. */
export function useFeaturedProperties() {
  return useQuery({
    queryKey: ['properties', 'featured'],
    queryFn: () => propertySearchService.listFeatured(),
    staleTime: 5 * 60_000,
  });
}
