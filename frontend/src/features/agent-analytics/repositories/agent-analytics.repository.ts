import { supabase } from '@/shared/lib/supabase';
import { mapSupabaseError } from '@/shared/lib/errors';

export interface PropertyAnalytics {
  propertyId: string;
  title: string;
  viewCount: number;
  viewingRequestCount: number;
}

export interface AgentAnalyticsRepository {
  listPropertyAnalytics(agencyId: string): Promise<PropertyAnalytics[]>;
}

interface PropertyRow {
  id: string;
  title: string;
  view_count: number;
}

// AGENT-008. Two data sources: `properties.view_count` (lifetime cumulative
// counter — no timestamped history exists, so a true daily-bucketed trend
// isn't buildable without new schema; recorded as technical debt, see
// project-state.md) and a client-side count of `viewing_requests` grouped
// by `property_id` (Sprint 6 plan, Part E.4: simpler than a new aggregating
// RPC for a Medium-priority, basic-analytics screen).
//
// `agencyId` is an explicit filter on the `properties` query — see
// `agentDashboardRepository`'s identical note: RLS's guest-visibility
// policy has no role restriction, so an unscoped query also returns other
// agencies' guest-visible properties. `viewing_requests` is left to RLS
// alone (genuinely scoped to `agent_id = current_agent_id()`, matching the
// same per-agent scope the booking queue itself uses).
export const agentAnalyticsRepository: AgentAnalyticsRepository = {
  async listPropertyAnalytics(agencyId) {
    const [propertiesResult, viewingRequestsResult] = await Promise.all([
      supabase.from('properties').select('id, title, view_count').eq('agency_id', agencyId).returns<PropertyRow[]>(),
      supabase.from('viewing_requests').select('property_id').returns<{ property_id: string }[]>(),
    ]);

    if (propertiesResult.error) throw mapSupabaseError(propertiesResult.error);
    if (viewingRequestsResult.error) throw mapSupabaseError(viewingRequestsResult.error);

    const requestCounts = new Map<string, number>();
    for (const row of viewingRequestsResult.data ?? []) {
      requestCounts.set(row.property_id, (requestCounts.get(row.property_id) ?? 0) + 1);
    }

    return (propertiesResult.data ?? []).map((row) => ({
      propertyId: row.id,
      title: row.title,
      viewCount: row.view_count,
      viewingRequestCount: requestCounts.get(row.id) ?? 0,
    }));
  },
};
