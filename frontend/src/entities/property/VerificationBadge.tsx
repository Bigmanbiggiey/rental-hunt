import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/shared/ui';
import type { PropertyVerificationStatus } from './property.types';

// ui-guidelines.md §12.9. `rejected` is excluded from public visibility by
// RLS (database.md §9) — this component still maps it (destructive) for
// reuse in the agent/moderator dashboards a later sprint builds.
const CONFIG: Record<
  PropertyVerificationStatus,
  { variant: 'success' | 'warning' | 'outline' | 'destructive'; label: string }
> = {
  verified: { variant: 'success', label: 'Verified' },
  pending_verification: { variant: 'warning', label: 'Pending Verification' },
  unverified: { variant: 'outline', label: 'Unverified' },
  rejected: { variant: 'destructive', label: 'Rejected' },
};

export function VerificationBadge({ status }: { status: PropertyVerificationStatus }) {
  const { variant, label } = CONFIG[status];
  return (
    <Badge variant={variant} className="gap-1">
      {status === 'verified' && <ShieldCheck className="size-3" aria-hidden="true" />}
      {label}
    </Badge>
  );
}
