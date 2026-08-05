import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Button,
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
import { ApplyForAgencySchema, type ApplyForAgencyFormInput } from '../schemas/applyForAgency.schema';
import { useApplyForAgency } from '../hooks/useApplyForAgency';
import { useCounties } from '../hooks/useCounties';

const NONE = '__none__';

/** Epic 12 — a customer's self-service agency application. Same field set as admin's `AdminAgencyFormDialog`, plus social links. */
export function AgencyRegistrationForm() {
  const { data: counties } = useCounties();
  const { mutate: apply, isPending } = useApplyForAgency();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ApplyForAgencyFormInput>({
    resolver: zodResolver(ApplyForAgencySchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      description: '',
      logoUrl: '',
      phone: '',
      email: '',
      countyId: '',
      socialLinks: { facebook: '', instagram: '', twitter: '', linkedin: '', website: '' },
    },
  });

  const onSubmit = handleSubmit((values) => {
    apply(values, {
      onError: (error) => {
        toast.error(isAppError(error) ? error.message : 'Something went wrong.');
      },
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-xl flex-col gap-6">
      <div className="space-y-2">
        <Label htmlFor="agency-name">
          Agency name <span aria-hidden="true">*</span>
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
        <Textarea id="agency-description" rows={4} readOnly={isPending} {...register('description')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="agency-phone">Phone</Label>
        <Input id="agency-phone" readOnly={isPending} {...register('phone')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="agency-email">Email</Label>
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

      <fieldset className="space-y-4">
        <legend className="text-body font-medium">Social links</legend>

        <div className="space-y-2">
          <Label htmlFor="agency-social-website">Website</Label>
          <Input id="agency-social-website" readOnly={isPending} {...register('socialLinks.website')} />
          {errors.socialLinks?.website && <FieldError>{errors.socialLinks.website.message}</FieldError>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="agency-social-facebook">Facebook</Label>
          <Input id="agency-social-facebook" readOnly={isPending} {...register('socialLinks.facebook')} />
          {errors.socialLinks?.facebook && <FieldError>{errors.socialLinks.facebook.message}</FieldError>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="agency-social-instagram">Instagram</Label>
          <Input id="agency-social-instagram" readOnly={isPending} {...register('socialLinks.instagram')} />
          {errors.socialLinks?.instagram && <FieldError>{errors.socialLinks.instagram.message}</FieldError>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="agency-social-twitter">Twitter / X</Label>
          <Input id="agency-social-twitter" readOnly={isPending} {...register('socialLinks.twitter')} />
          {errors.socialLinks?.twitter && <FieldError>{errors.socialLinks.twitter.message}</FieldError>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="agency-social-linkedin">LinkedIn</Label>
          <Input id="agency-social-linkedin" readOnly={isPending} {...register('socialLinks.linkedin')} />
          {errors.socialLinks?.linkedin && <FieldError>{errors.socialLinks.linkedin.message}</FieldError>}
        </div>
      </fieldset>

      <Button type="submit" isLoading={isPending} className="self-start">
        Submit application
      </Button>
    </form>
  );
}
