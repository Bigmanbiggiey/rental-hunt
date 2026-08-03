import { AgentStatCards, useAgentDashboardSummary } from '@/features/agent-dashboard';
import { Alert, AlertDescription, Skeleton } from '@/shared/ui';

// AGENT-001. Reached at /agent-dashboard, wrapped by AgentDashboardLayout via
// routes.tsx like every other agent route (post-Sprint-8 restructuring —
// see decisions.md — removed the old children/Outlet self-wrap this page
// needed back when /dashboard had to double as the shared generic landing
// page for every role).
function AgentDashboardOverviewPage() {
  const { data: summary, isLoading, isError } = useAgentDashboardSummary();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-foreground font-semibold">Dashboard</h1>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Something went wrong loading your dashboard summary.</AlertDescription>
        </Alert>
      )}

      {summary && <AgentStatCards summary={summary} />}
    </div>
  );
}

export { AgentDashboardOverviewPage };
