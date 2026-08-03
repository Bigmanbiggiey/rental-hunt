import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation, useNavigate, type Location } from 'react-router';
import { Alert, AlertDescription, AlertTitle, Button, FieldError, Input, Label, PasswordInput } from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import { PATHS } from '@/shared/config';
import type { UserRole } from '@/entities/user';
import { useLogin } from '../hooks/useLogin';
import { LoginSchema, type LoginInput } from '../schemas/login.schema';

interface LocationState {
  from?: Location;
}

// Where a role lands when there's no "return to the page you were trying to
// reach" state (ProtectedRoute's redirect), or when that state points
// somewhere the logged-in role can't reach. Every role has its own
// dedicated dashboard route group (post-Sprint-8 restructuring — see
// decisions.md).
function roleLandingPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return PATHS.adminDashboard.root;
    case 'moderator':
      return PATHS.moderatorDashboard.root;
    case 'agent':
      return PATHS.agentDashboard.root;
    case 'customer':
      return PATHS.userDashboard.root;
  }
}

// `state.from` is set whenever ProtectedRoute bounced a visit to a specific
// URL — but it's from *before* this login, so it isn't necessarily reachable
// by *this* role (e.g. logging out of an agent account from
// /agent-dashboard, then logging into a moderator account: naively honoring
// state.from would send the moderator to a page only agents can reach,
// which ProtectedRoute then bounces to the guest homepage — found
// 2026-08-04 testing the new per-role dashboards). Only honor it if this
// role can actually reach it; otherwise fall back to the role's own
// dashboard root.
function isReachableByRole(pathname: string, role: UserRole): boolean {
  if (pathname === PATHS.authenticated.profile) return true;
  switch (role) {
    case 'admin':
      return pathname.startsWith(PATHS.adminDashboard.root);
    case 'moderator':
      return pathname.startsWith(PATHS.moderatorDashboard.root);
    case 'agent':
      return pathname.startsWith(PATHS.agentDashboard.root);
    case 'customer':
      return pathname.startsWith(PATHS.userDashboard.root);
  }
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
      onSuccess: (data) => {
        toast.success('Welcome back.');
        const state = location.state as LocationState | null;
        const redirectTo =
          state?.from && isReachableByRole(state.from.pathname, data.user.role)
            ? `${state.from.pathname}${state.from.search}`
            : roleLandingPath(data.user.role);
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
        <PasswordInput
          id="password"
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
