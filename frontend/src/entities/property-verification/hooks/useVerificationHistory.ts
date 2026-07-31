import { useQuery } from '@tanstack/react-query';
import { verificationRepository } from '../verification.repository';

/**
 * Cross-cutting — read by both the agent's own `VerificationStatusPanel`
 * (their own agency's history, RLS-scoped) and the moderator/admin review
 * screen, the ADR-026/028 "2+ consumers" test for living in `entities/`
 * rather than a single feature's own hooks (features can't cross-import
 * each other, per coding-standards.md §3.2).
 */
export function useVerificationHistory(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['properties', 'verification', 'history', propertyId],
    queryFn: () => verificationRepository.history(propertyId!),
    enabled: !!propertyId,
    staleTime: 30_000,
  });
}
