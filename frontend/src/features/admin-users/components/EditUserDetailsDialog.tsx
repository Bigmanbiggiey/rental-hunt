import { useForm } from 'react-hook-form';
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
} from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import type { Profile } from '@/entities/user';
import { useAdminUpdateUser } from '../hooks/useAdminUpdateUser';
import { EditUserDetailsSchema, type EditUserDetailsFormInput } from '../schemas/adminUpdateUser.schema';

export interface EditUserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile;
}

// Full name/phone only — role and active status already have their own
// direct, always-visible controls in AdminUserTable (a Select and a
// Switch), no need to duplicate them in a dialog too.
export function EditUserDetailsDialog({ open, onOpenChange, user }: EditUserDetailsDialogProps) {
  const { mutate, isPending, error, reset } = useAdminUpdateUser();

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<EditUserDetailsFormInput>({
    resolver: zodResolver(EditUserDetailsSchema),
    mode: 'onBlur',
    defaultValues: { fullName: user.fullName, phone: user.phone ?? '' },
  });

  const onSubmit = handleSubmit((values) => {
    mutate(
      { id: user.id, input: values },
      {
        onSuccess: () => {
          toast.success('User details updated.');
          onOpenChange(false);
        },
      },
    );
  });

  const submissionError = isAppError(error) ? error.message : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          resetForm({ fullName: user.fullName, phone: user.phone ?? '' });
          reset();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {user.fullName}’s details</DialogTitle>
          <DialogDescription>Updates their name and phone number.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {submissionError && (
            <Alert variant="destructive">
              <AlertDescription>{submissionError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-fullName">
              Full name <span aria-hidden="true">*</span>
              <span className="sr-only"> (required)</span>
            </Label>
            <Input
              id="edit-fullName"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'edit-fullName-error' : undefined}
              readOnly={isPending}
              {...register('fullName')}
            />
            {errors.fullName && <FieldError id="edit-fullName-error">{errors.fullName.message}</FieldError>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              type="tel"
              placeholder="+254712345678"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'edit-phone-error' : undefined}
              readOnly={isPending}
              {...register('phone')}
            />
            {errors.phone && <FieldError id="edit-phone-error">{errors.phone.message}</FieldError>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
