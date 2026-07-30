import { BarChart3 } from 'lucide-react';
import { PropertyAnalyticsChart, PropertyAnalyticsTable, useAgentAnalytics } from '@/features/agent-analytics';
import { Alert, AlertDescription, EmptyState, Skeleton } from '@/shared/ui';

// AGENT-008.
function AgentAnalyticsPage() {
  const { data, isLoading, isError } = useAgentAnalytics();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-foreground font-semibold">Analytics</h1>

      {isLoading && <Skeleton className="h-72 w-full" />}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Something went wrong loading your analytics.</AlertDescription>
        </Alert>
      )}

      {data && data.length === 0 && (
        <EmptyState
          icon={BarChart3}
          heading="No data yet"
          description="Analytics will appear once your listings have views or viewing requests."
        />
      )}

      {data && data.length > 0 && (
        <div className="flex flex-col gap-8">
          <PropertyAnalyticsChart data={data} />
          <PropertyAnalyticsTable data={data} />
        </div>
      )}
    </div>
  );
}

export { AgentAnalyticsPage };
