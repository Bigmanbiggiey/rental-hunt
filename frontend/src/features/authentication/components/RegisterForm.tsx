import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { Alert, AlertDescription, AlertTitle, Button, FieldError, Input, Label, PasswordInput } from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import { PATHS } from '@/shared/config';
import { useRegister } from '../hooks/useRegister';
import { RegisterSchema, type RegisterInput } from '../schemas/register.schema';

export function RegisterForm() {
  const navigate = useNavigate();
  const { mutate, isPending, error } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onSuccess: () => {
        toast.success('Account created — welcome to Rental Hunt KE.');
        navigate(PATHS.public.home);
      },
    });
  });

  const submissionError = isAppError(error) ? error.message : null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {submissionError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Registration failed</AlertTitle>
          <AlertDescription>{submissionError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">
          Full name <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </Label>
        <Input
          id="fullName"
          autoComplete="name"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          readOnly={isPending}
          {...register('fullName')}
        />
        {errors.fullName && <FieldError id="fullName-error">{errors.fullName.message}</FieldError>}
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="password">
          Password <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
          readOnly={isPending}
          {...register('password')}
        />
        {errors.password && <FieldError id="password-error">{errors.password.message}</FieldError>}
      </div>

      <Button type="submit" className="w-full" isLoading={isPending}>
        Create account
      </Button>
    </form>
  );
}
