import { Link } from 'react-router';
import { Building2, CalendarClock, Home, ShieldAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui';
import { PATHS } from '@/shared/config';
import type { AdminMetrics } from '../repositories/admin-metrics.repository';

function StatCard({ label, value, icon: Icon, to }: { label: string; value: number; icon: LucideIcon; to: string }) {
  return (
    <Link
      to={to}
      className="focus-visible:ring-ring block rounded-lg focus-visible:ring-2 focus-visible:outline-none"
    >
      <Card className="hover:border-ring/50 transition-colors">
        <CardContent className="flex items-center justify-between gap-4 pt-6">
          <div>
            <p className="text-body-sm text-muted-foreground">{label}</p>
            <p className="text-h2 text-foreground font-semibold">{value}</p>
          </div>
          <Icon className="text-muted-foreground size-8" aria-hidden="true" />
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * api-design.md §9's Dashboard Metrics — mirrors `AgentStatCards`' layout
 * (ui-guidelines.md §7.2/§13.1). Epic 12: each card is now a drill-down link
 * into a browsable (10-per-page) list rather than a static number —
 * "Pending verifications"/"Active agencies" link to their existing pages;
 * "Total properties"/"Bookings this week" link to the two new admin pages
 * built specifically for this (`AdminPropertiesPage`/`AdminBookingsPage`).
 */
export function AdminStatCards({ metrics }: { metrics: AdminMetrics }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total properties"
        value={metrics.totalProperties}
        icon={Home}
        to={PATHS.adminDashboard.properties}
      />
      <StatCard
        label="Pending verifications"
        value={metrics.pendingVerifications}
        icon={ShieldAlert}
        to={PATHS.adminDashboard.verificationQueue}
      />
      <StatCard
        label="Active agencies"
        value={metrics.activeAgencies}
        icon={Building2}
        to={PATHS.adminDashboard.agencies}
      />
      <StatCard
        label="Bookings this week"
        value={metrics.bookingsThisWeek}
        icon={CalendarClock}
        to={PATHS.adminDashboard.bookings}
      />
    </div>
  );
}
