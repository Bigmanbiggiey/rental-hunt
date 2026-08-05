import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { FieldError } from '@/shared/ui/field-error';
import { Label } from '@/shared/ui/label';
import { PasswordInput } from '@/shared/ui/password-input';
import { isAppError } from '@/shared/lib/errors';
import { PATHS } from '@/shared/config';
import { useResetPassword } from '../hooks/useResetPassword';
import { ResetPasswordSchema, type ResetPasswordInput } from '../schemas/resetPassword.schema';

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const { mutate, isPending, error } = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onSuccess: () => {
        toast.success('Your password has been reset. Please log in.');
        navigate(PATHS.public.login, { replace: true });
      },
    });
  });

  const submissionError = isAppError(error) ? error.message : null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {submissionError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Reset failed</AlertTitle>
          <AlertDescription>{submissionError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="newPassword">
          New password <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </Label>
        <PasswordInput
          id="newPassword"
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
        <Label htmlFor="confirmPassword">
          Confirm new password <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </Label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
          readOnly={isPending}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <FieldError id="confirmPassword-error">{errors.confirmPassword.message}</FieldError>
        )}
      </div>

      <Button type="submit" className="w-full" isLoading={isPending}>
        Reset password
      </Button>
    </form>
  );
}
