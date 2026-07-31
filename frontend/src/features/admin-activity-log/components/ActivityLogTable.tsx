import { Trash2 } from 'lucide-react';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui';
import { useAuth } from '@/entities/user';
import type { ActivityLog } from '../repositories/activity-log.repository';
import { useDeleteActivityLog } from '../hooks/useDeleteActivityLog';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });
}

/** api-design.md §9: Moderator read-only, Admin read + retention delete. */
export function ActivityLogTable({ logs }: { logs: ActivityLog[] }) {
  const { profile } = useAuth();
  const { mutate: deleteLog, isPending } = useDeleteActivityLog();
  const canDelete = profile?.role === 'admin';

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>When</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Entity</TableHead>
          <TableHead>Actor</TableHead>
          {canDelete && (
            <TableHead className="w-10">
              <span className="sr-only">Actions</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell>{formatDateTime(log.createdAt)}</TableCell>
            <TableCell className="font-medium">{log.action}</TableCell>
            <TableCell>
              {log.entityType}
              {log.entityId ? ` (${log.entityId.slice(0, 8)}…)` : ''}
            </TableCell>
            <TableCell>{log.actorName ?? 'System'}</TableCell>
            {canDelete && (
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete log entry"
                  disabled={isPending}
                  onClick={() => deleteLog(log.id)}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
