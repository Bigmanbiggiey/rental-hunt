import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FieldError,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import type { Agency } from '@/entities/agency';
import { CreateAgencySchema, type CreateAgencyFormInput } from '../schemas/createAgency.schema';
import { useCounties } from '../hooks/useCounties';
import { useCreateAgency } from '../hooks/useCreateAgency';
import { useUpdateAgency } from '../hooks/useUpdateAgency';

export interface AdminAgencyFormDialogProps {
  /** `null` means create mode; a real `Agency` means edit mode. */
  agency: Agency | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NONE = '__none__';

/**
 * roadmap.md §11's "an admin can... create a new agency" — a Dialog, not a
 * dedicated route (unlike `PropertyForm`'s page-level treatment), since the
 * field count here is small (`ui-guidelines.md` §11.10). `logoUrl` stays a
 * plain optional text field — no Storage bucket/upload UI this sprint (Sprint
 * 7 plan's Open Questions #1: the DoD says "create a new agency," not
 * "upload a logo").
 */
export function AdminAgencyFormDialog({ agency, open, onOpenChange }: AdminAgencyFormDialogProps) {
  const { data: counties } = useCounties();
  const { mutate: create, isPending: isCreating } = useCreateAgency();
  const { mutate: update, isPending: isUpdating } = useUpdateAgency();
  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateAgencyFormInput>({
    resolver: zodResolver(CreateAgencySchema),
    mode: 'onBlur',
    defaultValues: {
      name: agency?.name ?? '',
      description: agency?.description ?? '',
      logoUrl: agency?.logoUrl ?? '',
      phone: agency?.phone ?? '',
      email: agency?.email ?? '',
      countyId: agency?.countyId ?? '',
    },
  });

  useEffect(() => {
    reset({
      name: agency?.name ?? '',
      description: agency?.description ?? '',
      logoUrl: agency?.logoUrl ?? '',
      phone: agency?.phone ?? '',
      email: agency?.email ?? '',
      countyId: agency?.countyId ?? '',
    });
  }, [agency, reset]);

  const onSubmit = handleSubmit((values) => {
    const onSuccess = () => {
      toast.success(agency ? 'Agency updated.' : 'Agency created.');
      onOpenChange(false);
    };
    const onError = (error: unknown) => {
      toast.error(isAppError(error) ? error.message : 'Something went wrong.');
    };

    if (agency) {
      update({ id: agency.id, input: values }, { onSuccess, onError });
    } else {
      create(values, { onSuccess, onError });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{agency ? 'Edit agency' : 'New agency'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agency-name">
              Name <span aria-hidden="true">*</span>
              <span className="sr-only"> (required)</span>
            </Label>
            <Input
              id="agency-name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'agency-name-error' : undefined}
              readOnly={isPending}
              {...register('name')}
            />
            {errors.name && <FieldError id="agency-name-error">{errors.name.message}</FieldError>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="agency-description">Description</Label>
            <Textarea id="agency-description" rows={3} readOnly={isPending} {...register('description')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agency-phone">Phone</Label>
            <Input id="agency-phone" readOnly={isPending} {...register('phone')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agency-email">
              Email
            </Label>
            <Input
              id="agency-email"
              type="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'agency-email-error' : undefined}
              readOnly={isPending}
              {...register('email')}
            />
            {errors.email && <FieldError id="agency-email-error">{errors.email.message}</FieldError>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="agency-county">County</Label>
            <Select
              value={watch('countyId') || NONE}
              onValueChange={(value) => setValue('countyId', value === NONE ? '' : value)}
            >
              <SelectTrigger id="agency-county">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {(counties ?? []).map((county) => (
                  <SelectItem key={county.id} value={county.id}>
                    {county.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agency-logo-url">Logo URL</Label>
            <Input
              id="agency-logo-url"
              aria-invalid={!!errors.logoUrl}
              aria-describedby={errors.logoUrl ? 'agency-logo-url-error' : undefined}
              readOnly={isPending}
              {...register('logoUrl')}
            />
            {errors.logoUrl && <FieldError id="agency-logo-url-error">{errors.logoUrl.message}</FieldError>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              {agency ? 'Save changes' : 'Create agency'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
