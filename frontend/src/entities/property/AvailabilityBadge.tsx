import { Badge } from '@/shared/ui';
import type { PropertyAvailabilityStatus } from './property.types';

// ui-guidelines.md §12.8 — `hidden` is never rendered publicly (excluded by
// RLS's is_archived/deleted_at/verification_status guest filter; hidden
// availability_status rows are excluded at the query layer instead, see
// `features/property-search/services/property.service.ts`), so this
// component is never expected to receive it in practice.
const VARIANT: Record<PropertyAvailabilityStatus, 'success' | 'warning' | 'secondary' | null> = {
  available: 'success',
  reserved: 'warning',
  occupied: 'secondary',
  hidden: null,
};

const LABEL: Record<PropertyAvailabilityStatus, string> = {
  available: 'Available',
  reserved: 'Reserved',
  occupied: 'Occupied',
  hidden: '',
};

export function AvailabilityBadge({ status }: { status: PropertyAvailabilityStatus }) {
  const variant = VARIANT[status];
  if (!variant) return null;
  return <Badge variant={variant}>{LABEL[status]}</Badge>;
}
