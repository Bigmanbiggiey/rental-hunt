import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
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
  Textarea,
  TimePicker,
} from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import type { Property } from '@/entities/property';
import { useCreateViewingRequest } from '../hooks/useCreateViewingRequest';
import {
  CreateViewingRequestSchema,
  type CreateViewingRequestInput,
} from '../schemas/createViewingRequest.schema';

// ui-guidelines.md §11.10/§12.14 — a controlled Dialog (no internal
// DialogTrigger, the trigger is entities/property's ViewingCTA living
// outside this feature). VIEW-001/VIEW-002/VIEW-003.
export function BookingRequestDialog({
  open,
  onOpenChange,
  property,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
}) {
  const { mutate, isPending, error, reset } = useCreateViewingRequest();
  const {
    register,
    control,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<CreateViewingRequestInput>({
    resolver: zodResolver(CreateViewingRequestSchema),
    mode: 'onBlur',
    // requestedDate/requestedTime are Controller-driven (DatePicker/TimePicker,
    // not native inputs register() can attach to) — an explicit default keeps
    // field.value a string from the start instead of undefined.
    defaultValues: { requestedDate: '', requestedTime: '', notes: '' },
  });

  const onSubmit = handleSubmit((values) => {
    mutate(
      { property, input: values },
      {
        onSuccess: () => {
          toast.success('Viewing request sent — we’ll notify you once the agent responds.');
          resetForm();
          onOpenChange(false);
        },
      },
    );
  });

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
          <DialogTitle>Book a Viewing</DialogTitle>
          <DialogDescription>
            Choose your preferred date and time for {property.title}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {submissionError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertTitle>Couldn’t send your request</AlertTitle>
              <AlertDescription>{submissionError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="requestedDate">
              Preferred date <span aria-hidden="true">*</span>
              <span className="sr-only"> (required)</span>
            </Label>
            <Controller
              name="requestedDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="requestedDate"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                  aria-invalid={!!errors.requestedDate}
                  aria-describedby={errors.requestedDate ? 'requestedDate-error' : undefined}
                />
              )}
            />
            {errors.requestedDate && (
              <FieldError id="requestedDate-error">{errors.requestedDate.message}</FieldError>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestedTime">
              Preferred time <span aria-hidden="true">*</span>
              <span className="sr-only"> (required)</span>
            </Label>
            <Controller
              name="requestedTime"
              control={control}
              render={({ field }) => (
                <TimePicker
                  id="requestedTime"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                  aria-invalid={!!errors.requestedTime}
                  aria-describedby={errors.requestedTime ? 'requestedTime-error' : undefined}
                />
              )}
            />
            {errors.requestedTime && (
              <FieldError id="requestedTime-error">{errors.requestedTime.message}</FieldError>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={3}
              aria-invalid={!!errors.notes}
              aria-describedby={errors.notes ? 'notes-error' : undefined}
              readOnly={isPending}
              {...register('notes')}
            />
            {errors.notes && <FieldError id="notes-error">{errors.notes.message}</FieldError>}
          </div>

          <DialogFooter>
            <Button type="submit" isLoading={isPending}>
              Send request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
