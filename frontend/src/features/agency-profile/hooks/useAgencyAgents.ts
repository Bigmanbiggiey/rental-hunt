import { useQuery } from '@tanstack/react-query';
import { agencyProfileService } from '../services/agency-profile.service';

export function useAgencyAgents(agencyId: string) {
  return useQuery({
    queryKey: ['agencies', 'agents', agencyId],
    queryFn: () => agencyProfileService.listAgents(agencyId),
    staleTime: 60_000,
  });
}
