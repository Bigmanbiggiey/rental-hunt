import { useState } from 'react';
import { Users } from 'lucide-react';
import { AdminInviteUserDialog, AdminUserTable, useAdminUsers, type AdminUserFilters } from '@/features/admin-users';
import { Alert, AlertDescription, Button, EmptyState, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from '@/shared/ui';
import type { UserRole } from '@/entities/user';

const PAGE_SIZE = 20;
const ROLES: UserRole[] = ['customer', 'agent', 'moderator', 'admin'];
const ANY = '__any__';

/** roadmap.md §11's DoD: "an admin can deactivate a user" — plus role management (api-design.md §9) and, post-Sprint-8, invite/delete (api-design.md §9/§12). */
function AdminUsersPage() {
  const [filters, setFilters] = useState<AdminUserFilters>({});
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const { data, isLoading, isError } = useAdminUsers(filters, page, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-h1 text-foreground font-semibold">Users</h1>
        <Button onClick={() => setInviteOpen(true)}>Invite user</Button>
      </div>

      <Select
        value={filters.role ?? ANY}
        onValueChange={(value) => {
          setFilters({ ...filters, role: value === ANY ? undefined : (value as UserRole) });
          setPage(1);
        }}
      >
        <SelectTrigger className="w-full sm:w-48" aria-label="Filter by role">
          <SelectValue placeholder="Any role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any role</SelectItem>
          {ROLES.map((role) => (
            <SelectItem key={role} value={role}>
              {role[0]!.toUpperCase() + role.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Something went wrong loading users.</AlertDescription>
        </Alert>
      )}

      {data && data.data.length === 0 && (
        <EmptyState icon={Users} heading="No users found" description="Try a different filter." />
      )}

      {data && data.data.length > 0 && (
        <>
          <AdminUserTable users={data.data} />

          {data.meta.totalPages > 1 && (
            <div className="mx-auto flex items-center gap-4">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <span className="text-body-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <AdminInviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}

export { AdminUsersPage };
