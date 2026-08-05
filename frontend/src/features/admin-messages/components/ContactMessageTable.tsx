import { Trash2 } from 'lucide-react';
import {
  Button,
  Label,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';
import type { ContactMessage } from '@/entities/contact-message';
import { useDeleteContactMessage } from '../hooks/useDeleteContactMessage';
import { useResolveContactMessage } from '../hooks/useResolveContactMessage';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });
}

/** CONTENT-003 (api-design.md §23.2–§23.4). Admin-only — RLS scopes reads/writes accordingly. */
export function ContactMessageTable({ messages }: { messages: ContactMessage[] }) {
  const { mutate: setResolved, isPending: isResolving } = useResolveContactMessage();
  const { mutate: deleteMessage, isPending: isDeleting } = useDeleteContactMessage();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>When</TableHead>
          <TableHead>From</TableHead>
          <TableHead>Message</TableHead>
          <TableHead>Resolved</TableHead>
          <TableHead className="w-10">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {messages.map((message) => (
          <TableRow key={message.id}>
            <TableCell className="whitespace-nowrap">{formatDateTime(message.createdAt)}</TableCell>
            <TableCell>
              <div className="font-medium">{message.name}</div>
              <div className="text-muted-foreground text-body-sm">{message.email}</div>
            </TableCell>
            <TableCell className="max-w-md">
              <p className="line-clamp-2">{message.message}</p>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={message.isResolved}
                  disabled={isResolving}
                  onCheckedChange={(checked) => setResolved({ id: message.id, isResolved: checked })}
                  aria-label={`Mark message from ${message.name} as ${message.isResolved ? 'unresolved' : 'resolved'}`}
                />
                <Label className="text-body-sm text-muted-foreground">
                  {message.isResolved ? 'Resolved' : 'Unresolved'}
                </Label>
              </div>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete message from ${message.name}`}
                disabled={isDeleting}
                onClick={() => deleteMessage(message.id)}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
