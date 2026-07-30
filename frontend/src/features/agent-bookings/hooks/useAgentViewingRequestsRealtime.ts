import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentAgent } from '@/entities/agent';
import { supabase } from '@/shared/lib/supabase';

/**
 * Mirrors `features/viewing-requests/hooks/useViewingRequestsRealtime.ts`'s
 * shape exactly (api-design.md §11) — deliberately separate from the data
 * hook to avoid duplicate `postgres_changes` channels; call once per page.
 * Filtered on `agents.id` (via `useCurrentAgent()`), not `profiles.id` —
 * `viewing_requests.agent_id` references `agents.id`.
 */
export function useAgentViewingRequestsRealtime() {
  const { data: agent } = useCurrentAgent();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!agent) return;

    const channel = supabase
      .channel(`viewing-requests-agent-${agent.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'viewing_requests',
          filter: `agent_id=eq.${agent.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['viewingRequests', 'agent'] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [agent, queryClient]);
}
