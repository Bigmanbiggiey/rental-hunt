import { supabase } from '@/shared/lib/supabase';
import { mapSupabaseError } from '@/shared/lib/errors';

export interface AdminMetrics {
  totalProperties: number;
  pendingVerifications: number;
  activeAgencies: number;
  /** Rolling 7-day window, not calendar-week — api-design.md §9 doesn't pin down a specific week boundary. */
  bookingsThisWeek: number;
}

export interface AdminMetricsRepository {
  getMetrics(): Promise<AdminMetrics>;
}

// api-design.md §9's "Dashboard Metrics" row. Four lightweight
// `count: 'exact', head: true` queries, mirroring
// `agentDashboardRepository.getSummary()`'s shape exactly — no new
// aggregating RPC. Unlike that agent-scoped repository, none of these need
// an explicit `.eq('agency_id', ...)` filter: admin's RLS
// (`properties_select_all_moderator_admin`, `agencies_select_all_agent_moderator_admin`)
// already grants full visibility with no guest-visibility-policy leak to
// guard against, since there's no narrower "my own X" scope for an admin.
export const adminMetricsRepository: AdminMetricsRepository = {
  async getMetrics() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [totalProperties, pendingVerifications, activeAgencies, bookingsThisWeek] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending_verification'),
      supabase.from('agencies').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('viewing_requests').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    ]);

    for (const result of [totalProperties, pendingVerifications, activeAgencies, bookingsThisWeek]) {
      if (result.error) throw mapSupabaseError(result.error);
    }

    return {
      totalProperties: totalProperties.count ?? 0,
      pendingVerifications: pendingVerifications.count ?? 0,
      activeAgencies: activeAgencies.count ?? 0,
      bookingsThisWeek: bookingsThisWeek.count ?? 0,
    };
  },
};
