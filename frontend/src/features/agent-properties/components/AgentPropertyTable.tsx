import { MoreHorizontal } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';
import { VerificationBadge, type Property } from '@/entities/property';
import { AvailabilityToggle } from './AvailabilityToggle';
import { useArchiveProperty } from '../hooks/useArchiveProperty';

export interface AgentPropertyTableProps {
  properties: Property[];
  onEdit: (propertyId: string) => void;
}

/** ui-guidelines.md §13.2: a real Table on >= lg, a stacked Card list on < lg. */
export function AgentPropertyTable({ properties, onEdit }: AgentPropertyTableProps) {
  const { mutate: archiveMutate } = useArchiveProperty();

  const actionsMenu = (property: Property) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${property.title}`}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(property.id)}>Edit</DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => archiveMutate({ id: property.id, archived: !property.isArchived })}
        >
          {property.isArchived ? 'Unarchive' : 'Archive'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Views</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((property) => (
              <TableRow key={property.id}>
                <TableCell className="font-medium">
                  {property.title}
                  {property.isArchived && (
                    <Badge variant="outline" className="ml-2">
                      Archived
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <AvailabilityToggle propertyId={property.id} status={property.availabilityStatus} />
                </TableCell>
                <TableCell>
                  <VerificationBadge status={property.verificationStatus} />
                </TableCell>
                <TableCell>{property.viewCount}</TableCell>
                <TableCell>{actionsMenu(property)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 lg:hidden">
        {properties.map((property) => (
          <li key={property.id}>
            <Card>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{property.title}</span>
                  {actionsMenu(property)}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <VerificationBadge status={property.verificationStatus} />
                  {property.isArchived && <Badge variant="outline">Archived</Badge>}
                </div>
                <AvailabilityToggle propertyId={property.id} status={property.availabilityStatus} />
                <p className="text-body-sm text-muted-foreground">{property.viewCount} views</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
