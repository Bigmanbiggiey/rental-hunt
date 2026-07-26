import { UpdateEmailForm, UpdatePasswordForm } from '@/features/profile-management';

function ProfilePage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 p-6">
      <div className="space-y-1">
        <h1 className="text-h1 text-foreground font-semibold">Account settings</h1>
        <p className="text-body text-muted-foreground">
          Manage the email and password you use to sign in.
        </p>
      </div>
      <UpdateEmailForm />
      <hr className="border-border" />
      <UpdatePasswordForm />
    </div>
  );
}

export { ProfilePage };
