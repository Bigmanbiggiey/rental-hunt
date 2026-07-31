import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui';
import type { AgencyListingCount } from '../repositories/admin-analytics.repository';

export function AdminAnalyticsByAgencyTable({ byAgency }: { byAgency: AgencyListingCount[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agency</TableHead>
          <TableHead>Listings</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {byAgency.map((row) => (
          <TableRow key={row.agencyId}>
            <TableCell className="font-medium">{row.agencyName}</TableCell>
            <TableCell>{row.listingCount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
