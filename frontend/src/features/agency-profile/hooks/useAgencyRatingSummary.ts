import { useQuery } from '@tanstack/react-query';
import { agencyProfileService } from '../services/agency-profile.service';

export function useAgencyRatingSummary(agencyId: string) {
  return useQuery({
    queryKey: ['agencies', 'ratingSummary', agencyId],
    queryFn: () => agencyProfileService.getRatingSummary(agencyId),
    staleTime: 60_000,
  });
}
