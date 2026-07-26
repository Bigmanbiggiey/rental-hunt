import { Link } from 'react-router';
import { useAuth } from '@/entities/user';
import { ResetPasswordForm } from '@/features/authentication';
import { PATHS } from '@/shared/config';

/**
 * `authRepository.resetPassword` calls `supabase.auth.updateUser`, which
 * requires an active session — the emailed recovery link establishes a
 * temporary one automatically via supabase-js's default
 * `detectSessionInUrl` before this page ever renders the form. If `profile`
 * is still null once loading settles, no valid recovery session exists
 * (missing/expired/already-used link), so the form is never shown.
 */
function ResetPasswordPage() {
  const { profile, isLoading } = useAuth();

  if (isLoading) return null;

  if (!profile) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 p-6 text-center">
        <h1 className="text-h1 text-foreground font-semibold">Link expired</h1>
        <p className="text-body text-muted-foreground">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link
          to={PATHS.public.forgotPassword}
          className="text-primary underline-offset-4 hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <div className="space-y-1 text-center">
        <h1 className="text-h1 text-foreground font-semibold">Choose a new password</h1>
        <p className="text-body text-muted-foreground">
          Enter and confirm your new password below.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}

export { ResetPasswordPage };
