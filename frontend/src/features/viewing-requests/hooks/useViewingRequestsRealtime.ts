import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import { supabase } from '@/shared/lib/supabase';

/**
 * api-design.md §11 — deliberately separate from `useViewingRequests` (not
 * one subscription per data-hook call) to avoid duplicate `postgres_changes`
 * channels when a page calls `useViewingRequests` more than once (e.g.
 * `DashboardPage`'s Upcoming + Completed sections). Call once per page.
 */
export function useViewingRequestsRealtime() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel(`viewing-requests-customer-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'viewing_requests',
          filter: `customer_id=eq.${profile.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['viewingRequests', 'customer'] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profile, queryClient]);
}
