import { toast } from 'sonner';
import {
  Card,
  CardContent,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import type { Profile, UserRole } from '@/entities/user';
import { useAdminUpdateUser } from '../hooks/useAdminUpdateUser';

export interface AdminUserTableProps {
  users: Profile[];
}

const ROLES: UserRole[] = ['customer', 'agent', 'moderator', 'admin'];

function titleCase(value: string): string {
  return value[0]!.toUpperCase() + value.slice(1);
}

/** ui-guidelines.md §13.2: a real Table on >= lg, a stacked Card list on < lg. */
export function AdminUserTable({ users }: AdminUserTableProps) {
  const { mutate, isPending } = useAdminUpdateUser();

  const onError = (error: unknown) => {
    toast.error(isAppError(error) ? error.message : 'Something went wrong.');
  };

  const roleSelect = (user: Profile) => (
    <Select
      value={user.role}
      disabled={isPending}
      onValueChange={(value) => mutate({ id: user.id, input: { role: value as UserRole } }, { onError })}
    >
      <SelectTrigger className="w-full sm:w-36" aria-label={`Change role for ${user.fullName}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {titleCase(role)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const activeSwitch = (user: Profile) => (
    <div className="flex items-center gap-2">
      <Switch
        checked={user.isActive}
        disabled={isPending}
        onCheckedChange={(checked) => mutate({ id: user.id, input: { isActive: checked } }, { onError })}
        aria-label={`${user.isActive ? 'Deactivate' : 'Activate'} ${user.fullName}`}
      />
      <Label className="text-body-sm text-muted-foreground">{user.isActive ? 'Active' : 'Inactive'}</Label>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.fullName}</TableCell>
                <TableCell>{user.phone ?? '—'}</TableCell>
                <TableCell>{roleSelect(user)}</TableCell>
                <TableCell>{activeSwitch(user)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 lg:hidden">
        {users.map((user) => (
          <li key={user.id}>
            <Card>
              <CardContent className="space-y-3 pt-4">
                <div>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-body-sm text-muted-foreground">{user.phone ?? '—'}</p>
                </div>
                {roleSelect(user)}
                {activeSwitch(user)}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
