import { supabase } from '@/shared/lib/supabase';
import { mapSupabaseError } from '@/shared/lib/errors';

export interface AgentDashboardSummary {
  totalProperties: number;
  /** Non-archived listings — "active" as in still managed/live, distinct from a specific `availability_status`. */
  activeListings: number;
  pendingViewings: number;
  completedViewings: number;
}

export interface AgentDashboardRepository {
  getSummary(agencyId: string): Promise<AgentDashboardSummary>;
}

// AGENT-001. Four lightweight `count: 'exact', head: true` queries — not a
// new aggregating RPC (Sprint 6 plan, Part E.3: simpler than new SQL
// surface for a High-, not Critical-, priority screen). Lives in this
// feature, not `entities/`, since this exact 4-count shape has no second
// consumer anywhere in the roadmap (fails the ADR-026/028 cross-cutting
// test).
//
// `agencyId` is an explicit filter on both `properties` counts — found via
// manual browser testing (not the RLS test suite, which used non-guest-
// visible fixtures) that RLS alone isn't enough here: the guest-visibility
// policy has no role restriction, so an unscoped query also returns *other*
// agencies' guest-visible properties. `viewing_requests`' agent-facing
// policy, by contrast, is genuinely scoped to `agent_id = current_agent_id()`
// (not agency-wide, and there's no guest-level access to leak through), so
// those two counts are correctly left to RLS alone.
export const agentDashboardRepository: AgentDashboardRepository = {
  async getSummary(agencyId) {
    const [totalProperties, activeListings, pendingViewings, completedViewings] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId),
      supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .eq('is_archived', false),
      supabase.from('viewing_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('viewing_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    ]);

    for (const result of [totalProperties, activeListings, pendingViewings, completedViewings]) {
      if (result.error) throw mapSupabaseError(result.error);
    }

    return {
      totalProperties: totalProperties.count ?? 0,
      activeListings: activeListings.count ?? 0,
      pendingViewings: pendingViewings.count ?? 0,
      completedViewings: completedViewings.count ?? 0,
    };
  },
};
