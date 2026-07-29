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
// (VIEW-005) and, in a future Sprint 6 pass, the Agent's booking queue
// (BOOK-001). Deliberately customer-scoped this sprint: `onCancelClick` is
// the only action wired up (agent actions — confirm/reschedule/complete/
// no-show — aren't built yet), so the component doesn't render affordances
// for behavior that doesn't exist, but its shape doesn't need a rewrite to
// grow those actions later.
export function BookingCard({
  viewingRequest,
  onCancelClick,
  isCancelling = false,
}: {
  viewingRequest: ViewingRequest;
  onCancelClick?: () => void;
  isCancelling?: boolean;
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
        <ViewingStatusBadge status={viewingRequest.status} />
      </div>

      {canCancel && (
        <Button variant="outline" size="sm" isLoading={isCancelling} onClick={onCancelClick}>
          Cancel
        </Button>
      )}
    </Card>
  );
}
