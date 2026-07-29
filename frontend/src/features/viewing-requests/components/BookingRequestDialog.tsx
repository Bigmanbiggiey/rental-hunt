import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
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
  Textarea,
} from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import type { Property } from '@/entities/property';
import { useCreateViewingRequest } from '../hooks/useCreateViewingRequest';
import {
  CreateViewingRequestSchema,
  type CreateViewingRequestInput,
} from '../schemas/createViewingRequest.schema';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

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
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<CreateViewingRequestInput>({
    resolver: zodResolver(CreateViewingRequestSchema),
    mode: 'onBlur',
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
            <Input
              id="requestedDate"
              type="date"
              min={today()}
              aria-invalid={!!errors.requestedDate}
              aria-describedby={errors.requestedDate ? 'requestedDate-error' : undefined}
              readOnly={isPending}
              {...register('requestedDate')}
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
            <Input
              id="requestedTime"
              type="time"
              aria-invalid={!!errors.requestedTime}
              aria-describedby={errors.requestedTime ? 'requestedTime-error' : undefined}
              readOnly={isPending}
              {...register('requestedTime')}
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
