import { Badge } from '@/shared/ui';
import type { ViewingStatus } from './viewing-request.types';

// ui-guidelines.md §12.10 — mirrors AvailabilityBadge/VerificationBadge's
// color-mapping pattern.
const CONFIG: Record<
  ViewingStatus,
  { variant: 'warning' | 'success' | 'secondary' | 'destructive'; label: string }
> = {
  pending: { variant: 'warning', label: 'Pending' },
  confirmed: { variant: 'success', label: 'Confirmed' },
  completed: { variant: 'secondary', label: 'Completed' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
  no_show: { variant: 'destructive', label: 'No Show' },
};

export function ViewingStatusBadge({ status }: { status: ViewingStatus }) {
  const { variant, label } = CONFIG[status];
  return <Badge variant={variant}>{label}</Badge>;
}
