import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FieldError,
  Label,
  TimePicker,
} from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import {
  RescheduleViewingRequestSchema,
  type RescheduleViewingRequestInput,
} from '../schemas/rescheduleViewingRequest.schema';

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
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RescheduleViewingRequestInput>({
    resolver: zodResolver(RescheduleViewingRequestSchema),
    mode: 'onBlur',
    // requestedDate/requestedTime are Controller-driven (DatePicker/TimePicker,
    // not native inputs register() can attach to) — an explicit default keeps
    // field.value a string from the start instead of undefined.
    defaultValues: { requestedDate: '', requestedTime: '' },
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
            <Controller
              name="requestedDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="reschedule-date"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                  aria-invalid={!!errors.requestedDate}
                  aria-describedby={errors.requestedDate ? 'reschedule-date-error' : undefined}
                />
              )}
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
            <Controller
              name="requestedTime"
              control={control}
              render={({ field }) => (
                <TimePicker
                  id="reschedule-time"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                  aria-invalid={!!errors.requestedTime}
                  aria-describedby={errors.requestedTime ? 'reschedule-time-error' : undefined}
                />
              )}
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
