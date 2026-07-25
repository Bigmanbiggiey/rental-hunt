import { Link } from 'react-router';
import { RegisterForm } from '@/features/authentication';
import { PATHS } from '@/shared/config';

function RegisterPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <div className="space-y-1 text-center">
        <h1 className="text-h1 text-foreground font-semibold">Create your account</h1>
        <p className="text-body text-muted-foreground">
          Save properties, book viewings, and track your search.
        </p>
      </div>
      <RegisterForm />
      <p className="text-body-sm text-muted-foreground text-center">
        Already have an account?{' '}
        <Link to={PATHS.public.login} className="text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export { RegisterPage };
