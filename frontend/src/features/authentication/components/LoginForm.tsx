import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation, useNavigate, type Location } from 'react-router';
import { Alert, AlertDescription, AlertTitle, Button, FieldError, Input, Label } from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import { PATHS } from '@/shared/config';
import { useLogin } from '../hooks/useLogin';
import { LoginSchema, type LoginInput } from '../schemas/login.schema';

interface LocationState {
  from?: Location;
}

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onSuccess: () => {
        toast.success('Welcome back.');
        const state = location.state as LocationState | null;
        const redirectTo = state?.from
          ? `${state.from.pathname}${state.from.search}`
          : PATHS.public.home;
        navigate(redirectTo, { replace: true });
      },
    });
  });

  // api-design.md §5.2: deliberately generic — never reveals whether the
  // email exists, regardless of which credential was actually wrong.
  const submissionError = isAppError(error) ? error.message : null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {submissionError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Login failed</AlertTitle>
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

      <div className="space-y-2">
        <Label htmlFor="password">
          Password <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
          readOnly={isPending}
          {...register('password')}
        />
        {errors.password && <FieldError id="password-error">{errors.password.message}</FieldError>}
      </div>

      <Button type="submit" className="w-full" isLoading={isPending}>
        Log in
      </Button>
    </form>
  );
}
