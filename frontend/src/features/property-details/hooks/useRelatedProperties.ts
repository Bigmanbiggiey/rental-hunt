import { useQuery } from '@tanstack/react-query';
import type { Property } from '@/entities/property';
import { propertyDetailsService } from '../services/property-details.service';

/** PROP-001's related/similar properties section — a small, bounded query, not paginated. */
export function useRelatedProperties(property: Property | undefined) {
  return useQuery({
    queryKey: ['properties', 'related', property?.id],
    queryFn: () => propertyDetailsService.listRelated(property!),
    enabled: !!property,
    staleTime: 60_000,
  });
}
