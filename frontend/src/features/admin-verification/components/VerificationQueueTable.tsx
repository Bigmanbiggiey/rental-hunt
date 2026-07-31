import { Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui';
import type { Property } from '@/entities/property';

export interface VerificationQueueTableProps {
  properties: Property[];
  onReview: (property: Property) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * ui-guidelines.md §13.2: a real Table on >= lg, a stacked Card list on < lg
 * — same responsive pattern as `AgentPropertyTable`. Shows the submitting
 * agent's name (already embedded on `Property.agent`) rather than the
 * agency's — `PROPERTY_COLUMNS` has no agency-name join, and the agent's
 * name is what a reviewer actually needs to know who to follow up with.
 */
export function VerificationQueueTable({ properties, onReview }: VerificationQueueTableProps) {
  return (
    <>
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-24">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((property) => (
              <TableRow key={property.id}>
                <TableCell className="font-medium">{property.title}</TableCell>
                <TableCell>{property.agent.fullName}</TableCell>
                <TableCell>{formatDate(property.updatedAt)}</TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => onReview(property)}>
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 lg:hidden">
        {properties.map((property) => (
          <li key={property.id}>
            <Card>
              <CardContent className="flex items-center justify-between gap-3 pt-4">
                <div>
                  <p className="font-medium">{property.title}</p>
                  <p className="text-body-sm text-muted-foreground">
                    {property.agent.fullName} · {formatDate(property.updatedAt)}
                  </p>
                </div>
                <Button size="sm" onClick={() => onReview(property)}>
                  Review
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
