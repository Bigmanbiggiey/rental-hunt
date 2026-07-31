import { Card, CardContent } from '@/shared/ui';
import type { AdminAnalytics } from '../repositories/admin-analytics.repository';

/**
 * A plain accessible summary + table, not a chart — `PropertyAnalyticsTable`
 * (Sprint 6) already established this project's "always-visible accessible
 * alternative" precedent per WCAG 2.2; here it's the primary view, not a
 * fallback, since roadmap.md §11's DoD only requires analytics be reachable
 * through real UI, not rendered as any particular chart type.
 */
export function AdminAnalyticsSummary({ analytics }: { analytics: AdminAnalytics }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card>
        <CardContent className="pt-6">
          <p className="text-body-sm text-muted-foreground">Total listing views</p>
          <p className="text-h2 text-foreground font-semibold">{analytics.totalViews}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-body-sm text-muted-foreground">Viewing requests in range</p>
          <p className="text-h2 text-foreground font-semibold">{analytics.viewingRequestsInRange}</p>
        </CardContent>
      </Card>
    </div>
  );
}
