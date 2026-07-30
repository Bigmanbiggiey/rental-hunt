import { lazy, Suspense } from 'react';
import { Skeleton } from '@/shared/ui';
import type { PropertyAnalytics } from '../repositories/agent-analytics.repository';

const PropertyAnalyticsChartCanvas = lazy(() =>
  import('./PropertyAnalyticsChartCanvas').then((m) => ({ default: m.PropertyAnalyticsChartCanvas })),
);

// AGENT-008. `React.lazy` keeps `recharts` out of the eager bundle, matching
// `entities/property/PropertyMap.tsx` + `PropertyMapCanvas.tsx`'s existing
// heavy-library-splitting precedent — only /dashboard/analytics pays for
// this chunk.
export function PropertyAnalyticsChart({ data }: { data: PropertyAnalytics[] }) {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full rounded-lg" />}>
      <PropertyAnalyticsChartCanvas data={data} />
    </Suspense>
  );
}
