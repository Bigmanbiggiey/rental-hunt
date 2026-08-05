import { Link } from 'react-router';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui';
import { ViewingStatusBadge, type ViewingRequest } from '@/entities/viewing-request';
import { PATHS } from '@/shared/config';

function propertyDetailPath(slug: string): string {
  return PATHS.public.propertyDetail.replace(':slug', slug);
}

function formatDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}`).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Epic 12's Admin Overview "Bookings this week" drill-down — every viewing request platform-wide, 10-per-page. */
export function AdminBookingTable({ bookings }: { bookings: ViewingRequest[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Property</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Requested for</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="font-medium">
              <Link to={propertyDetailPath(booking.property.slug)} className="hover:underline">
                {booking.property.title}
              </Link>
            </TableCell>
            <TableCell>{booking.customer?.fullName ?? '—'}</TableCell>
            <TableCell>{formatDateTime(booking.requestedDate, booking.requestedTime)}</TableCell>
            <TableCell>
              <ViewingStatusBadge status={booking.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
