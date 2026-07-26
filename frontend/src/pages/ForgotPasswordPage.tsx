import { Link } from 'react-router';
import { ForgotPasswordForm } from '@/features/authentication';
import { PATHS } from '@/shared/config';

function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <div className="space-y-1 text-center">
        <h1 className="text-h1 text-foreground font-semibold">Reset your password</h1>
        <p className="text-body text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset it.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-body-sm text-muted-foreground text-center">
        Remembered your password?{' '}
        <Link to={PATHS.public.login} className="text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export { ForgotPasswordPage };
