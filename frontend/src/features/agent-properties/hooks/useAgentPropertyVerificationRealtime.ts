import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentAgent } from '@/entities/agent';
import { supabase } from '@/shared/lib/supabase';

/**
 * Sprint 7 (roadmap.md §11 DoD: "the agent sees the resulting status
 * change... without a manual refresh"). Mirrors
 * `features/agent-bookings/hooks/useAgentViewingRequestsRealtime.ts`'s shape
 * exactly — a moderator/admin's `set_property_verification()` call happens
 * in a *different* browser session than the agent's, so a plain TanStack
 * Query `staleTime`/refetch-on-focus can't reach it; only a live
 * `postgres_changes` subscription can. Filtered on `agency_id`, not a single
 * property id, since both the agent's list (`AgentPropertiesPage`) and its
 * detail/edit view (`AgentPropertyFormPage`, where `VerificationStatusPanel`
 * lives) need to pick up any of their agency's properties changing.
 */
export function useAgentPropertyVerificationRealtime() {
  const { data: agent } = useCurrentAgent();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!agent) return;

    const channel = supabase
      .channel(`properties-verification-agency-${agent.agencyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'properties',
          filter: `agency_id=eq.${agent.agencyId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['properties', 'agent'] });
          void queryClient.invalidateQueries({ queryKey: ['properties', 'verification', 'history'] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [agent, queryClient]);
}
