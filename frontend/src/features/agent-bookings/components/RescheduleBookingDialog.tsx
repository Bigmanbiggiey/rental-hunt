import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FieldError,
  Input,
  Label,
} from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import {
  RescheduleViewingRequestSchema,
  type RescheduleViewingRequestInput,
} from '../schemas/rescheduleViewingRequest.schema';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// BOOK-003. Mirrors BookingRequestDialog's controlled-Dialog shape.
export function RescheduleBookingDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: RescheduleViewingRequestInput) => void;
  isPending?: boolean;
  error?: unknown;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RescheduleViewingRequestInput>({
    resolver: zodResolver(RescheduleViewingRequestSchema),
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit((values) => onConfirm(values));
  const submissionError = isAppError(error) ? error.message : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule this viewing?</DialogTitle>
          <DialogDescription>Choose a new date and time.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {submissionError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertTitle>Couldn’t reschedule</AlertTitle>
              <AlertDescription>{submissionError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reschedule-date">
              New date <span aria-hidden="true">*</span>
              <span className="sr-only"> (required)</span>
            </Label>
            <Input
              id="reschedule-date"
              type="date"
              min={today()}
              aria-invalid={!!errors.requestedDate}
              aria-describedby={errors.requestedDate ? 'reschedule-date-error' : undefined}
              readOnly={isPending}
              {...register('requestedDate')}
            />
            {errors.requestedDate && (
              <FieldError id="reschedule-date-error">{errors.requestedDate.message}</FieldError>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reschedule-time">
              New time <span aria-hidden="true">*</span>
              <span className="sr-only"> (required)</span>
            </Label>
            <Input
              id="reschedule-time"
              type="time"
              aria-invalid={!!errors.requestedTime}
              aria-describedby={errors.requestedTime ? 'reschedule-time-error' : undefined}
              readOnly={isPending}
              {...register('requestedTime')}
            />
            {errors.requestedTime && (
              <FieldError id="reschedule-time-error">{errors.requestedTime.message}</FieldError>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Keep current time
            </Button>
            <Button type="submit" isLoading={isPending}>
              Reschedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
