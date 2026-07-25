import { Link } from 'react-router';
import { LoginForm } from '@/features/authentication';
import { PATHS } from '@/shared/config';

function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <div className="space-y-1 text-center">
        <h1 className="text-h1 text-foreground font-semibold">Welcome back</h1>
        <p className="text-body text-muted-foreground">Log in to continue your search.</p>
      </div>
      <LoginForm />
      <div className="flex flex-col items-center gap-1">
        <Link
          to={PATHS.public.forgotPassword}
          className="text-body-sm text-primary underline-offset-4 hover:underline"
        >
          Forgot your password?
        </Link>
        <p className="text-body-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            to={PATHS.public.register}
            className="text-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export { LoginPage };
