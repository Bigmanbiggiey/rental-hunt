import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle, Button, FieldError, Input, Label, Textarea } from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import { useAuth } from '@/entities/user';
import { useCurrentUserEmail } from '../hooks/useCurrentUserEmail';
import { useSubmitContactMessage } from '../hooks/useSubmitContactMessage';
import { SubmitContactMessageSchema, type SubmitContactMessageInput } from '../schemas/submitContactMessage.schema';

// CONTENT-002. Pre-fills name/email for a signed-in user via `values` (the
// same async-prefill pattern `UpdateProfileForm` already established) —
// blank for a guest, who types both.
export function ContactForm() {
  const { profile } = useAuth();
  const { data: currentEmail } = useCurrentUserEmail();
  const { mutate, isPending, isSuccess, error, reset } = useSubmitContactMessage();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmitContactMessageInput>({
    resolver: zodResolver(SubmitContactMessageSchema),
    mode: 'onBlur',
    values: profile ? { name: profile.fullName, email: currentEmail ?? '', message: '' } : undefined,
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onSuccess: () => toast.success('Message sent — we’ll get back to you soon.'),
    });
  });

  const submissionError = isAppError(error) ? error.message : null;

  if (isSuccess) {
    return (
      <Alert>
        <AlertTitle>Message sent</AlertTitle>
        <AlertDescription>
          Thanks for reaching out — we’ll get back to you soon.{' '}
          <button type="button" className="text-primary underline underline-offset-2" onClick={() => reset()}>
            Send another message
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {submissionError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Message not sent</AlertTitle>
          <AlertDescription>{submissionError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="contact-name">
          Name <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </Label>
        <Input
          id="contact-name"
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'contact-name-error' : undefined}
          readOnly={isPending}
          {...register('name')}
        />
        {errors.name && <FieldError id="contact-name-error">{errors.name.message}</FieldError>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-email">
          Email <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </Label>
        <Input
          id="contact-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'contact-email-error' : undefined}
          readOnly={isPending}
          {...register('email')}
        />
        {errors.email && <FieldError id="contact-email-error">{errors.email.message}</FieldError>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">
          Message <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </Label>
        <Textarea
          id="contact-message"
          rows={6}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          readOnly={isPending}
          {...register('message')}
        />
        {errors.message && <FieldError id="contact-message-error">{errors.message.message}</FieldError>}
      </div>

      <Button type="submit" className="w-full sm:w-auto" isLoading={isPending}>
        Send message
      </Button>
    </form>
  );
}
