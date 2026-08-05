import { useState } from 'react';
import { MailOpen } from 'lucide-react';
import { ContactMessageTable, useContactMessages } from '@/features/admin-messages';
import { Alert, AlertDescription, EmptyState, Label, Skeleton, Switch } from '@/shared/ui';

/** CONTENT-003 (roadmap.md §13). Mirrors AdminActivityLogPage's list/filter/empty-state shape. */
function AdminMessagesPage() {
  const [unresolvedOnly, setUnresolvedOnly] = useState(true);
  const { data, isLoading, isError } = useContactMessages(unresolvedOnly ? { isResolved: false } : undefined);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-foreground font-semibold">Contact Messages</h1>

      <div className="flex items-center gap-2">
        <Switch id="unresolved-only" checked={unresolvedOnly} onCheckedChange={setUnresolvedOnly} />
        <Label htmlFor="unresolved-only" className="text-body-sm text-muted-foreground">
          Show unresolved only
        </Label>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Something went wrong loading contact messages.</AlertDescription>
        </Alert>
      )}

      {data && data.length === 0 && (
        <EmptyState
          icon={MailOpen}
          heading="No messages found"
          description={unresolvedOnly ? 'Nothing unresolved right now.' : 'No messages have been submitted yet.'}
        />
      )}

      {data && data.length > 0 && <ContactMessageTable messages={data} />}
    </div>
  );
}

export { AdminMessagesPage };
