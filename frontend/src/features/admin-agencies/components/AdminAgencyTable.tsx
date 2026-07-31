import {
  Badge,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';
import type { Agency } from '@/entities/agency';

export interface AdminAgencyTableProps {
  agencies: Agency[];
  onEdit: (agency: Agency) => void;
}

/** ui-guidelines.md §13.2: a real Table on >= lg, a stacked Card list on < lg. */
export function AdminAgencyTable({ agencies, onEdit }: AdminAgencyTableProps) {
  return (
    <>
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agencies.map((agency) => (
              <TableRow key={agency.id}>
                <TableCell className="font-medium">{agency.name}</TableCell>
                <TableCell>{agency.phone ?? '—'}</TableCell>
                <TableCell>{agency.email ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={agency.isActive ? 'success' : 'outline'}>
                    {agency.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(agency)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 lg:hidden">
        {agencies.map((agency) => (
          <li key={agency.id}>
            <Card>
              <CardContent className="flex items-center justify-between gap-3 pt-4">
                <div>
                  <p className="font-medium">{agency.name}</p>
                  <p className="text-body-sm text-muted-foreground">{agency.phone ?? '—'}</p>
                  <Badge variant={agency.isActive ? 'success' : 'outline'} className="mt-1">
                    {agency.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onEdit(agency)}>
                  Edit
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
