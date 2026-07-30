import { CalendarCheck, CalendarClock, Home, ListChecks } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui';
import type { AgentDashboardSummary } from '../repositories/agent-dashboard.repository';

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 pt-6">
        <div>
          <p className="text-body-sm text-muted-foreground">{label}</p>
          <p className="text-h2 text-foreground font-semibold">{value}</p>
        </div>
        <Icon className="text-muted-foreground size-8" aria-hidden="true" />
      </CardContent>
    </Card>
  );
}

/** AGENT-001. ui-guidelines.md §13.1 (anatomy) / §7.2 (1 col mobile -> 2 sm -> 4 lg). */
export function AgentStatCards({ summary }: { summary: AgentDashboardSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total properties" value={summary.totalProperties} icon={Home} />
      <StatCard label="Active listings" value={summary.activeListings} icon={ListChecks} />
      <StatCard label="Pending viewings" value={summary.pendingViewings} icon={CalendarClock} />
      <StatCard label="Completed viewings" value={summary.completedViewings} icon={CalendarCheck} />
    </div>
  );
}
