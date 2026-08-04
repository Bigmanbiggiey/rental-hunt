import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FieldError,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import type { UserRole } from '@/entities/user';
import { useInviteUser } from '../hooks/useInviteUser';
import { InviteUserSchema, type InviteUserFormInput } from '../schemas/inviteUser.schema';

const ROLES: UserRole[] = ['customer', 'agent', 'moderator', 'admin'];

export interface AdminInviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Sends a real Supabase invite email (admin-invite-user Edge Function) —
// the admin never sets or sees a password, the recipient completes their
// own on the link they receive. Developer's explicit choice over a
// temp-password flow, 2026-08-04.
export function AdminInviteUserDialog({ open, onOpenChange }: AdminInviteUserDialogProps) {
  const { mutate, isPending, error, reset } = useInviteUser();

  const {
    register,
    handleSubmit,
    control,
    reset: resetForm,
    formState: { errors },
  } = useForm<InviteUserFormInput>({
    resolver: zodResolver(InviteUserSchema),
    mode: 'onBlur',
    defaultValues: { role: 'customer' },
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onSuccess: (invited) => {
        toast.success(`Invite sent to ${invited.email}.`);
        resetForm({ email: '', fullName: '', role: 'customer' });
        onOpenChange(false);
      },
    });
  });

  const submissionError = isAppError(error) ? error.message : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          resetForm({ email: '', fullName: '', role: 'customer' });
          reset();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a new user</DialogTitle>
          <DialogDescription>
            They’ll get an email to set their own password and finish creating their account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {submissionError && (
            <Alert variant="destructive">
              <AlertDescription>{submissionError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="invite-email">
              Email <span aria-hidden="true">*</span>
              <span className="sr-only"> (required)</span>
            </Label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="off"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'invite-email-error' : undefined}
              readOnly={isPending}
              {...register('email')}
            />
            {errors.email && <FieldError id="invite-email-error">{errors.email.message}</FieldError>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-fullName">
              Full name <span aria-hidden="true">*</span>
              <span className="sr-only"> (required)</span>
            </Label>
            <Input
              id="invite-fullName"
              autoComplete="off"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'invite-fullName-error' : undefined}
              readOnly={isPending}
              {...register('fullName')}
            />
            {errors.fullName && <FieldError id="invite-fullName-error">{errors.fullName.message}</FieldError>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">
              Role <span aria-hidden="true">*</span>
              <span className="sr-only"> (required)</span>
            </Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                  <SelectTrigger id="invite-role" aria-invalid={!!errors.role}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role[0]!.toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && <FieldError id="invite-role-error">{errors.role.message}</FieldError>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
