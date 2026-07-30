import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import { agentRepository } from '../agent.repository';

/**
 * Cross-cutting across every Sprint 6 agent-dashboard feature
 * (agent-properties, agent-bookings, agent-dashboard, agent-analytics all
 * need "my own agentId/agencyId") — lives in `entities/agent` per the same
 * ADR-026/028 reasoning already applied to `entities/viewing-request`
 * (three-or-more real consumers), not duplicated per-feature the way the
 * smaller reference-data hooks were.
 */
export function useCurrentAgent() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['agents', 'current', profile?.id],
    queryFn: () => agentRepository.getCurrentAgent(profile!.id),
    enabled: !!profile,
    staleTime: 5 * 60_000,
  });
}
