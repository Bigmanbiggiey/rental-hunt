import { useQuery } from '@tanstack/react-query';
import { isAppError } from '@/shared/lib/errors';
import { propertyDetailsService } from '../services/property-details.service';

/** PROP-001 — staleTime matches `useProperties`' live-data default (availability/verification can change). */
export function useProperty(slug: string) {
  return useQuery({
    queryKey: ['properties', 'detail', slug],
    queryFn: () => propertyDetailsService.getBySlug(slug),
    staleTime: 30_000,
    // A missing slug is a deterministic 404, not a transient failure — retrying
    // it just delays the correct "not found" message behind pointless backoff
    // (and leaves `isError`/`error` unset in the gap between attempts, which
    // `PropertyDetailPage` briefly misreads as the generic error). Other
    // failures still get the default retry behavior.
    retry: (failureCount, error) =>
      isAppError(error) && error.code === 'PROPERTY_NOT_FOUND' ? false : failureCount < 3,
  });
}
