import { useQuery } from '@tanstack/react-query';
import { agencyProfileService } from '../services/agency-profile.service';

export function useAgencyReviews(agencyId: string, page: number, pageSize?: number) {
  return useQuery({
    queryKey: ['agencies', 'reviews', agencyId, page, pageSize],
    queryFn: () => agencyProfileService.listReviews(agencyId, page, pageSize),
    staleTime: 30_000,
  });
}
