import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle, Button, FieldError, Input, Label } from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import { useAuth } from '@/entities/user';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { UpdateProfileSchema, type UpdateProfileInput } from '../schemas/updateProfile.schema';

// CUST-003. `ProfilePage` is only reachable inside `ProtectedRoute`, which
// already waits out session resolution before rendering — `profile` is
// expected non-null here in practice; the guard below just avoids a
// null-pointer render during that brief window instead of assuming it away.
export function UpdateProfileForm() {
  const { profile } = useAuth();
  const { mutate, isPending, error } = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
    mode: 'onBlur',
    values: profile ? { fullName: profile.fullName, phone: profile.phone ?? '' } : undefined,
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onSuccess: () => toast.success('Profile updated.'),
    });
  });

  const submissionError = isAppError(error) ? error.message : null;

  if (!profile) return null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <h2 className="text-h3 text-foreground font-semibold">Profile</h2>

      {submissionError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Update failed</AlertTitle>
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
        <Label htmlFor="phone">
          Phone number <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+254712345678"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
          readOnly={isPending}
          {...register('phone')}
        />
        {errors.phone && <FieldError id="phone-error">{errors.phone.message}</FieldError>}
      </div>

      <Button type="submit" isLoading={isPending}>
        Save changes
      </Button>
    </form>
  );
}
