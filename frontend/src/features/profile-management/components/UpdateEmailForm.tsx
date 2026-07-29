import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle, Button, FieldError, Input, Label } from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import { useCurrentEmail } from '../hooks/useCurrentEmail';
import { useUpdateEmail } from '../hooks/useUpdateEmail';
import { UpdateEmailSchema, type UpdateEmailInput } from '../schemas/updateEmail.schema';

export function UpdateEmailForm() {
  const {
    data: currentEmail,
    isLoading: isLoadingEmail,
    isError: isEmailError,
  } = useCurrentEmail();
  const { mutate, isPending, error } = useUpdateEmail();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateEmailInput>({
    resolver: zodResolver(UpdateEmailSchema),
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onSuccess: () => {
        toast.success('Check your new email inbox to confirm the change.');
        reset();
      },
    });
  });

  const submissionError = isAppError(error) ? error.message : null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <h2 className="text-h3 text-foreground font-semibold">Email address</h2>

      <p className="text-body-sm text-muted-foreground">
        {isLoadingEmail && 'Loading your current email…'}
        {isEmailError && 'Unable to load your current email.'}
        {!isLoadingEmail && !isEmailError && `Current email: ${currentEmail}`}
      </p>

      {submissionError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Update failed</AlertTitle>
          <AlertDescription>{submissionError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="newEmail">
          New email <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </Label>
        <Input
          id="newEmail"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.newEmail}
          aria-describedby={errors.newEmail ? 'newEmail-error' : undefined}
          readOnly={isPending}
          {...register('newEmail')}
        />
        {errors.newEmail && <FieldError id="newEmail-error">{errors.newEmail.message}</FieldError>}
      </div>

      <Button type="submit" isLoading={isPending}>
        Update email
      </Button>
    </form>
  );
}
