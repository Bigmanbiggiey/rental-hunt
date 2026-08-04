import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { VerificationActionFormInput } from '../schemas/verificationAction.schema';
import { adminVerificationService } from '../services/admin-verification.service';

/**
 * roadmap.md §11's DoD: "the agent sees the resulting status change... without
 * a manual refresh." Invalidating `['properties', 'agent']` here covers the
 * moderator/admin's own tab immediately; the agent's own tab is covered by
 * `features/agent-properties/hooks/useAgentPropertyVerificationRealtime.ts`'s
 * `postgres_changes` subscription instead (this mutation runs in a different
 * browser session than the agent's, so a local `invalidateQueries` call here
 * can't reach it).
 */
export function useSetVerificationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ propertyId, input }: { propertyId: string; input: VerificationActionFormInput }) =>
      adminVerificationService.setStatus(propertyId, input),
    onSuccess: (_result, { propertyId }) => {
      void queryClient.invalidateQueries({ queryKey: ['properties', 'verification', 'pending'] });
      void queryClient.invalidateQueries({ queryKey: ['properties', 'verification', 'detail', propertyId] });
      void queryClient.invalidateQueries({ queryKey: ['properties', 'verification', 'history', propertyId] });
      void queryClient.invalidateQueries({ queryKey: ['properties', 'agent'] });
      void queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
    },
  });
}
