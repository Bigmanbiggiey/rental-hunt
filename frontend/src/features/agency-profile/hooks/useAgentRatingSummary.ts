import { useQuery } from '@tanstack/react-query';
import { agencyProfileService } from '../services/agency-profile.service';

/** The Agency Profile Page's "Agents" section — each agent's own rating, distinct from the agency-level `useAgencyRatingSummary`. */
export function useAgentRatingSummary(agentId: string) {
  return useQuery({
    queryKey: ['agents', 'ratingSummary', agentId],
    queryFn: () => agencyProfileService.getAgentRatingSummary(agentId),
    staleTime: 60_000,
  });
}
