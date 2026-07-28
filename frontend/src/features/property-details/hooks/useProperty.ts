import { useQuery } from '@tanstack/react-query';
import { propertyDetailsService } from '../services/property-details.service';

/** PROP-001 — staleTime matches `useProperties`' live-data default (availability/verification can change). */
export function useProperty(slug: string) {
  return useQuery({
    queryKey: ['properties', 'detail', slug],
    queryFn: () => propertyDetailsService.getBySlug(slug),
    staleTime: 30_000,
  });
}
