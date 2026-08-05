import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, MailCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { FieldError } from '@/shared/ui/field-error';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { isAppError } from '@/shared/lib/errors';
import { useRequestPasswordReset } from '../hooks/useRequestPasswordReset';
import {
  RequestPasswordResetSchema,
  type RequestPasswordResetInput,
} from '../schemas/requestPasswordReset.schema';

/**
 * api-design.md §5.5 / user-stories.md AUTH-004: the confirmation message
 * must be identical whether or not the submitted email is registered, so a
 * successful submission always replaces the form with the same generic
 * message — never branches on what the request actually found.
 */
export function ForgotPasswordForm() {
  const { mutate, isPending, isSuccess, error } = useRequestPasswordReset();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(RequestPasswordResetSchema),
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values);
  });

  const submissionError = isAppError(error) ? error.message : null;

  if (isSuccess) {
    return (
      <Alert>
        <MailCheck className="size-4" aria-hidden="true" />
        <AlertTitle>Check your email</AlertTitle>
        <AlertDescription>
          If an account exists for that email address, we&apos;ve sent a link to reset your
          password.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {submissionError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{submissionError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          readOnly={isPending}
          {...register('email')}
        />
        {errors.email && <FieldError id="email-error">{errors.email.message}</FieldError>}
      </div>

      <Button type="submit" className="w-full" isLoading={isPending}>
        Send reset link
      </Button>
    </form>
  );
}
