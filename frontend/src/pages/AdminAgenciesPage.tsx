import { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { AdminAgencyFormDialog, AdminAgencyTable, useAdminAgencies } from '@/features/admin-agencies';
import type { Agency } from '@/entities/agency';
import { Alert, AlertDescription, Button, EmptyState, Skeleton } from '@/shared/ui';

/** roadmap.md §11's DoD: "an admin can... create a new agency." */
function AdminAgenciesPage() {
  const { data: agencies, isLoading, isError } = useAdminAgencies();
  const [editing, setEditing] = useState<Agency | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-h1 text-foreground font-semibold">Agencies</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus aria-hidden="true" />
          New agency
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Something went wrong loading agencies.</AlertDescription>
        </Alert>
      )}

      {agencies && agencies.length === 0 && (
        <EmptyState icon={Building2} heading="No agencies yet" description="Create the first agency to get started." />
      )}

      {agencies && agencies.length > 0 && (
        <AdminAgencyTable
          agencies={agencies}
          onEdit={(agency) => {
            setEditing(agency);
            setDialogOpen(true);
          }}
        />
      )}

      <AdminAgencyFormDialog agency={editing} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

export { AdminAgenciesPage };
