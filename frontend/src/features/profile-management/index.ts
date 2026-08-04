// Public surface of the profile-management feature — components and hooks
// other layers are allowed to import. Services/Repositories/schemas stay
// internal.
export { UpdateEmailForm } from './components/UpdateEmailForm';
export { UpdatePasswordForm } from './components/UpdatePasswordForm';
export { UpdateProfileForm } from './components/UpdateProfileForm';
export { NotificationPreferencesForm } from './components/NotificationPreferencesForm';
export { SignOutOtherDevicesSection } from './components/SignOutOtherDevicesSection';
export { useCurrentEmail } from './hooks/useCurrentEmail';
export { useUpdateEmail } from './hooks/useUpdateEmail';
export { useUpdatePassword } from './hooks/useUpdatePassword';
export { useUpdateProfile } from './hooks/useUpdateProfile';
export { useUpdateNotificationPreferences } from './hooks/useUpdateNotificationPreferences';
export { useSignOutOtherDevices } from './hooks/useSignOutOtherDevices';
