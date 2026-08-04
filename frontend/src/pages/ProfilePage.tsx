import {
  NotificationPreferencesForm,
  SignOutOtherDevicesSection,
  UpdateEmailForm,
  UpdatePasswordForm,
  UpdateProfileForm,
} from '@/features/profile-management';

function ProfilePage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 p-6">
      <div className="space-y-1">
        <h1 className="text-h1 text-foreground font-semibold">Account settings</h1>
        <p className="text-body text-muted-foreground">
          Manage your profile, notifications, and the email and password you use to sign in.
        </p>
      </div>
      <UpdateProfileForm />
      <hr className="border-border" />
      <NotificationPreferencesForm />
      <hr className="border-border" />
      <UpdateEmailForm />
      <hr className="border-border" />
      <UpdatePasswordForm />
      <hr className="border-border" />
      <SignOutOtherDevicesSection />
    </div>
  );
}

export { ProfilePage };
