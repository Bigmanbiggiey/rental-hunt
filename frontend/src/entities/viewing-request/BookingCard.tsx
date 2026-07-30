import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { CalendarClock } from 'lucide-react';
import { Button, Card } from '@/shared/ui';
import { PATHS } from '@/shared/config';
import { ViewingStatusBadge } from './ViewingStatusBadge';
import type { ViewingRequest } from './viewing-request.types';

function propertyDetailPath(slug: string): string {
  return PATHS.public.propertyDetail.replace(':slug', slug);
}

// ui-guidelines.md §12.10 — shared shape between the Customer Dashboard
// (VIEW-005) and the Agent's booking queue (BOOK-001, Sprint 6). `actions`
// lets the agent side pass its own action set (`BookingActionsMenu`) in
// place of the customer-only Cancel button, and `showCustomer` surfaces
// Sprint 6's `customer` embed (Gap 6) — additive, so the pre-existing
// customer-side usage (`onCancelClick` alone) is unchanged.
export function BookingCard({
  viewingRequest,
  onCancelClick,
  isCancelling = false,
  showCustomer = false,
  actions,
}: {
  viewingRequest: ViewingRequest;
  onCancelClick?: () => void;
  isCancelling?: boolean;
  showCustomer?: boolean;
  actions?: ReactNode;
}) {
  const { property } = viewingRequest;
  const primaryImage = property.images[0];
  const canCancel =
    Boolean(onCancelClick) &&
    (viewingRequest.status === 'pending' || viewingRequest.status === 'confirmed');

  return (
    <Card className="flex items-center gap-4 p-4">
      <Link
        to={propertyDetailPath(property.slug)}
        className="bg-muted size-16 shrink-0 overflow-hidden rounded-md"
      >
        {primaryImage ? (
          <img
            src={primaryImage.imageUrl}
            alt={primaryImage.altText ?? property.title}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          to={propertyDetailPath(property.slug)}
          className="text-body-sm text-foreground truncate font-semibold hover:underline"
        >
          {property.title}
        </Link>
        <p className="text-body-sm text-muted-foreground flex items-center gap-1">
          <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
          {viewingRequest.requestedDate} at {viewingRequest.requestedTime}
        </p>
        {showCustomer && viewingRequest.customer && (
          <p className="text-body-sm text-muted-foreground">
            {viewingRequest.customer.fullName}
            {viewingRequest.customer.phone ? ` · ${viewingRequest.customer.phone}` : ''}
          </p>
        )}
        <ViewingStatusBadge status={viewingRequest.status} />
      </div>

      {actions}
      {!actions && canCancel && (
        <Button variant="outline" size="sm" isLoading={isCancelling} onClick={onCancelClick}>
          Cancel
        </Button>
      )}
    </Card>
  );
}
