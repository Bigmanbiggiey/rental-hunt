import { supabase } from '@/shared/lib/supabase';
import { mapSupabaseError } from '@/shared/lib/errors';

export interface AgencyListingCount {
  agencyId: string;
  agencyName: string;
  listingCount: number;
}

export interface AdminAnalytics {
  totalViews: number;
  viewingRequestsInRange: number;
  byAgency: AgencyListingCount[];
}

export interface AdminAnalyticsRange {
  from: string;
  to: string;
}

export interface AdminAnalyticsRepository {
  getAnalytics(range: AdminAnalyticsRange): Promise<AdminAnalytics>;
}

// api-design.md §9's "Analytics" row — platform-level aggregation on top of
// Sprint 6's per-property analytics (`features/agent-analytics`). PostgREST's
// query builder can't express a grouped count directly, so the per-agency
// breakdown is counted client-side from a plain row list — the same
// "two parallel queries, grouped client-side" shape
// `agentAnalyticsRepository.listPropertyAnalytics()` already established,
// applied at the platform level instead of one agency's.
export const adminAnalyticsRepository: AdminAnalyticsRepository = {
  async getAnalytics(range) {
    const [viewsResult, viewingRequestsResult, propertiesResult, agenciesResult] = await Promise.all([
      supabase.from('properties').select('view_count'),
      supabase
        .from('viewing_requests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', range.from)
        .lte('created_at', range.to),
      supabase.from('properties').select('agency_id'),
      supabase.from('agencies').select('id, name'),
    ]);

    for (const result of [viewsResult, viewingRequestsResult, propertiesResult, agenciesResult]) {
      if (result.error) throw mapSupabaseError(result.error);
    }

    const totalViews = (viewsResult.data ?? []).reduce(
      (sum: number, row: { view_count: number }) => sum + row.view_count,
      0,
    );

    const agencyNames = new Map<string, string>(
      (agenciesResult.data ?? []).map((row: { id: string; name: string }) => [row.id, row.name]),
    );

    const counts = new Map<string, number>();
    for (const row of (propertiesResult.data ?? []) as { agency_id: string }[]) {
      counts.set(row.agency_id, (counts.get(row.agency_id) ?? 0) + 1);
    }

    const byAgency: AgencyListingCount[] = Array.from(counts.entries())
      .map(([agencyId, listingCount]) => ({
        agencyId,
        agencyName: agencyNames.get(agencyId) ?? 'Unknown agency',
        listingCount,
      }))
      .sort((a, b) => b.listingCount - a.listingCount);

    return {
      totalViews,
      viewingRequestsInRange: viewingRequestsResult.count ?? 0,
      byAgency,
    };
  },
};
