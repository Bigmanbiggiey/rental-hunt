import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle, Button, FieldError, Input, Label } from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import { useUpdatePassword } from '../hooks/useUpdatePassword';
import { UpdatePasswordSchema, type UpdatePasswordInput } from '../schemas/updatePassword.schema';

export function UpdatePasswordForm() {
  const { mutate, isPending, error } = useUpdatePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(UpdatePasswordSchema),
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onSuccess: () => {
        toast.success('Your password has been updated.');
        reset();
      },
    });
  });

  const submissionError = isAppError(error) ? error.message : null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <h2 className="text-h3 text-foreground font-semibold">Password</h2>

      {submissionError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Update failed</AlertTitle>
          <AlertDescription>{submissionError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="currentPassword">
          Current password <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.currentPassword}
          aria-describedby={errors.currentPassword ? 'currentPassword-error' : undefined}
          readOnly={isPending}
          {...register('currentPassword')}
        />
        {errors.currentPassword && (
          <FieldError id="currentPassword-error">{errors.currentPassword.message}</FieldError>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">
          New password <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.newPassword}
          aria-describedby={errors.newPassword ? 'newPassword-error' : undefined}
          readOnly={isPending}
          {...register('newPassword')}
        />
        {errors.newPassword && (
          <FieldError id="newPassword-error">{errors.newPassword.message}</FieldError>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmNewPassword">
          Confirm new password <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </Label>
        <Input
          id="confirmNewPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmNewPassword}
          aria-describedby={errors.confirmNewPassword ? 'confirmNewPassword-error' : undefined}
          readOnly={isPending}
          {...register('confirmNewPassword')}
        />
        {errors.confirmNewPassword && (
          <FieldError id="confirmNewPassword-error">{errors.confirmNewPassword.message}</FieldError>
        )}
      </div>

      <Button type="submit" isLoading={isPending}>
        Update password
      </Button>
    </form>
  );
}
