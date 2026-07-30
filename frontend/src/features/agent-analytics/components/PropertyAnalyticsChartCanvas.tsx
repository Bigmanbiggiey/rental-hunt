import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PropertyAnalytics } from '../repositories/agent-analytics.repository';

/**
 * ui-guidelines.md §13.5: two separate single-series charts, never one
 * dual-axis combo (views and viewing-request counts are different scales);
 * no legend needed (single series named by its own heading); `primary` for
 * views / `secondary` for viewing-requests per §13.5's stated token
 * priority order. `var(--color-primary)`/`var(--color-secondary)` resolve
 * per-theme automatically (light/dark), same tokens `styles/index.css`
 * defines for every other themed color in the app.
 */
export function PropertyAnalyticsChartCanvas({ data }: { data: PropertyAnalytics[] }) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-h4 text-foreground mb-2 font-semibold">Views per property</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="title" tick={false} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="viewCount" name="Views" fill="var(--color-primary)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-h4 text-foreground mb-2 font-semibold">Viewing requests per property</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="title" tick={false} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="viewingRequestCount" name="Viewing requests" fill="var(--color-secondary)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
