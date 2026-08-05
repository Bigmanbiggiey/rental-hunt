import { Link } from 'react-router';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui';
import { AvailabilityBadge, VerificationBadge } from '@/entities/property';
import type { Property } from '@/entities/property';
import { PATHS } from '@/shared/config';

function propertyDetailPath(slug: string): string {
  return PATHS.public.propertyDetail.replace(':slug', slug);
}

/** Epic 12's Admin Overview "Total properties" drill-down — every property platform-wide, 10-per-page. */
export function AdminPropertyTable({ properties }: { properties: Property[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Agency</TableHead>
          <TableHead>Verification</TableHead>
          <TableHead>Availability</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {properties.map((property) => (
          <TableRow key={property.id}>
            <TableCell className="font-medium">
              <Link to={propertyDetailPath(property.slug)} className="hover:underline">
                {property.title}
              </Link>
            </TableCell>
            <TableCell>{property.agent.agencyName}</TableCell>
            <TableCell>
              <VerificationBadge status={property.verificationStatus} />
            </TableCell>
            <TableCell>
              <AvailabilityBadge status={property.availabilityStatus} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
