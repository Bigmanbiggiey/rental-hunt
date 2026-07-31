import { Building2, CalendarClock, Home, ShieldAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui';
import type { AdminMetrics } from '../repositories/admin-metrics.repository';

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

/** api-design.md §9's Dashboard Metrics — mirrors `AgentStatCards`' layout (ui-guidelines.md §7.2/§13.1). */
export function AdminStatCards({ metrics }: { metrics: AdminMetrics }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total properties" value={metrics.totalProperties} icon={Home} />
      <StatCard label="Pending verifications" value={metrics.pendingVerifications} icon={ShieldAlert} />
      <StatCard label="Active agencies" value={metrics.activeAgencies} icon={Building2} />
      <StatCard label="Bookings this week" value={metrics.bookingsThisWeek} icon={CalendarClock} />
    </div>
  );
}
