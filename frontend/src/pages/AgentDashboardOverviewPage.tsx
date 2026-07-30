import { AgentStatCards, useAgentDashboardSummary } from '@/features/agent-dashboard';
import { AgentDashboardLayout } from '@/widgets';
import { Alert, AlertDescription, Skeleton } from '@/shared/ui';

// AGENT-001. Reached at the shared `/dashboard` URL (Gap 3 — DashboardPage's
// role branch), which stays inside the *generic* authenticated route group,
// not this widget's own agent-only route group — so this page self-wraps
// with `AgentDashboardLayout` directly, unlike the other four agent pages
// (which get it from `AgentDashboardLayoutRoute` in `routes.tsx` instead).
function AgentDashboardOverviewPage() {
  const { data: summary, isLoading, isError } = useAgentDashboardSummary();

  return (
    <AgentDashboardLayout>
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
    </AgentDashboardLayout>
  );
}

export { AgentDashboardOverviewPage };
