import { useState } from 'react';
import { AgentBookingQueue, useAgentViewingRequests, useAgentViewingRequestsRealtime } from '@/features/agent-bookings';
import type { ViewingStatus } from '@/entities/viewing-request';
import {
  Alert,
  AlertDescription,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@/shared/ui';

const STATUS_OPTIONS: ViewingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
const ANY = '__any__';

// BOOK-001–006.
function AgentBookingsPage() {
  useAgentViewingRequestsRealtime();
  const [status, setStatus] = useState<ViewingStatus | typeof ANY>(ANY);

  const { data, isLoading, isError } = useAgentViewingRequests({
    status: status === ANY ? undefined : [status],
    sort: 'requestedDateAsc',
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-foreground font-semibold">Bookings</h1>

      <div className="flex flex-col gap-1 sm:w-48">
        <Label htmlFor="booking-status-filter">Status</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as ViewingStatus | typeof ANY)}>
          <SelectTrigger id="booking-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All statuses</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Something went wrong loading your bookings.</AlertDescription>
        </Alert>
      )}

      {data && (
        <AgentBookingQueue
          viewingRequests={data.data}
          emptyMessage="Bookings for your properties will show up here."
        />
      )}
    </div>
  );
}

export { AgentBookingsPage };
