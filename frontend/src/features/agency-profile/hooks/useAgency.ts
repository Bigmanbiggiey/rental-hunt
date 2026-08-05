import { useQuery } from '@tanstack/react-query';
import { isAppError } from '@/shared/lib/errors';
import { agencyProfileService } from '../services/agency-profile.service';

/** Same not-found-shouldn't-retry rule as `useProperty` (features/property-details). */
export function useAgency(slug: string) {
  return useQuery({
    queryKey: ['agencies', 'detail', slug],
    queryFn: () => agencyProfileService.getBySlug(slug),
    staleTime: 30_000,
    retry: (failureCount, error) =>
      isAppError(error) && error.code === 'AGENCY_NOT_FOUND' ? false : failureCount < 3,
  });
}
