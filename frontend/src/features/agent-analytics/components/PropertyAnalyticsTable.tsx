import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui';
import type { PropertyAnalytics } from '../repositories/agent-analytics.repository';

/**
 * ui-guidelines.md §13.5: an always-visible (not hidden-toggle) accessible
 * `<table>` alternative to the chart, satisfying WCAG 2.2's non-text-content
 * requirement — also naturally the "stacked Card list < lg" convention's
 * table-shaped equivalent, since a real `<table>` is legible at any width.
 */
export function PropertyAnalyticsTable({ data }: { data: PropertyAnalytics[] }) {
  return (
    <Table>
      <TableCaption className="sr-only">Views and viewing requests per property</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Property</TableHead>
          <TableHead className="text-right">Views</TableHead>
          <TableHead className="text-right">Viewing requests</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.propertyId}>
            <TableCell className="font-medium">{row.title}</TableCell>
            <TableCell className="text-right">{row.viewCount}</TableCell>
            <TableCell className="text-right">{row.viewingRequestCount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
