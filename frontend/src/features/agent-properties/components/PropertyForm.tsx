import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  Combobox,
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
import type { Property, PropertyAvailabilityStatus } from '@/entities/property';
import { useCreateProperty } from '../hooks/useCreateProperty';
import { useUpdateProperty } from '../hooks/useUpdateProperty';
import {
  useCounties,
  useCreateLocation,
  useLocations,
  usePropertyTypes,
  useAmenities,
} from '../hooks/useReferenceData';
import { CreatePropertySchema, type CreatePropertyFormInput } from '../schemas/createProperty.schema';
import { LocationPickerMap } from './LocationPickerMap';

const AVAILABILITY_OPTIONS: { value: PropertyAvailabilityStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'hidden', label: 'Hidden' },
];

export interface PropertyFormProps {
  /** Omitted for create mode (AGENT-002); passed for edit mode (AGENT-003), pre-filling every field with its current value. */
  property?: Property;
  onSuccess?: (property: Property) => void;
}

// AGENT-002/003 share one form — an edit always submits every field's
// current value (not a sparse patch), so validating with the full
// `CreatePropertySchema` in both modes is correct; only the mutation target
// (create vs. update) differs. Numeric fields use `valueAsNumber` at
// registration so the schema stays `z.number()`, matching api-design.md
// §14's documented contract verbatim.
export function PropertyForm({ property, onSuccess }: PropertyFormProps) {
  const isEditMode = !!property;
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  const { data: counties } = useCounties();
  const { data: propertyTypes } = usePropertyTypes();
  const { data: amenities } = useAmenities();
  const createLocation = useCreateLocation();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreatePropertyFormInput>({
    resolver: zodResolver(CreatePropertySchema),
    mode: 'onBlur',
    defaultValues: property
      ? {
          title: property.title,
          description: property.description,
          propertyTypeId: property.propertyTypeId,
          countyId: property.countyId,
          locationId: property.locationId,
          latitude: property.latitude,
          longitude: property.longitude,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          rentAmount: property.rentAmount,
          depositAmount: property.depositAmount,
          amenityIds: property.amenities.map((a) => a.id),
          availabilityStatus: property.availabilityStatus,
        }
      : { amenityIds: [], availabilityStatus: 'available' },
  });

  const selectedCountyId = watch('countyId');
  const watchedLatitude = watch('latitude');
  const watchedLongitude = watch('longitude');
  const { data: locations } = useLocations(selectedCountyId);
  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending;
  const mutationError = isEditMode ? updateMutation.error : createMutation.error;
  const submissionError = isAppError(mutationError) ? mutationError.message : null;

  function handleMapChange(lat: number, lng: number) {
    setValue('latitude', lat, { shouldValidate: true, shouldDirty: true });
    setValue('longitude', lng, { shouldValidate: true, shouldDirty: true });
  }

  // A previously-picked location belongs to a specific county — if the
  // county changes, that location no longer makes sense (and, with the
  // Combobox now making county switches fast, is far more likely to
  // actually happen than it was with the old slow four-item Select).
  // `useRef(selectedCountyId)` primes the "previous" value to whatever
  // countyId already is on first render — including edit mode's prefilled
  // value — so this only ever fires on a genuine *change*, never on mount.
  const previousCountyId = useRef(selectedCountyId);
  useEffect(() => {
    if (previousCountyId.current !== selectedCountyId) {
      setValue('locationId', '', { shouldValidate: false });
      previousCountyId.current = selectedCountyId;
    }
  }, [selectedCountyId, setValue]);

  const onSubmit = handleSubmit((values) => {
    if (isEditMode && property) {
      updateMutation.mutate(
        { id: property.id, input: values },
        {
          onSuccess: (updated) => {
            toast.success('Listing updated.');
            onSuccess?.(updated);
          },
        },
      );
      return;
    }

    createMutation.mutate(values, {
      onSuccess: (created) => {
        toast.success('Listing created.');
        onSuccess?.(created);
      },
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {submissionError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>{isEditMode ? 'Update failed' : 'Creation failed'}</AlertTitle>
          <AlertDescription>{submissionError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </Label>
        <Input
          id="title"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
          readOnly={isPending}
          {...register('title')}
        />
        {errors.title && <FieldError id="title-error">{errors.title.message}</FieldError>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </Label>
        <Textarea
          id="description"
          rows={5}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
          readOnly={isPending}
          {...register('description')}
        />
        {errors.description && <FieldError id="description-error">{errors.description.message}</FieldError>}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="propertyTypeId">
            Property type <span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </Label>
          <Controller
            control={control}
            name="propertyTypeId"
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange} disabled={isPending}>
                <SelectTrigger id="propertyTypeId" aria-invalid={!!errors.propertyTypeId}>
                  <SelectValue placeholder="Choose a type" />
                </SelectTrigger>
                <SelectContent>
                  {(propertyTypes ?? []).map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.propertyTypeId && <FieldError id="propertyTypeId-error">{errors.propertyTypeId.message}</FieldError>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="availabilityStatus">
            Availability <span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </Label>
          <Controller
            control={control}
            name="availabilityStatus"
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange} disabled={isPending}>
                <SelectTrigger id="availabilityStatus" aria-invalid={!!errors.availabilityStatus}>
                  <SelectValue placeholder="Choose availability" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.availabilityStatus && (
            <FieldError id="availabilityStatus-error">{errors.availabilityStatus.message}</FieldError>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="countyId">
            County <span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </Label>
          <Controller
            control={control}
            name="countyId"
            render={({ field }) => (
              <Combobox
                id="countyId"
                value={field.value ?? ''}
                onValueChange={field.onChange}
                options={(counties ?? []).map((county) => ({ value: county.id, label: county.name }))}
                placeholder="Choose a county"
                searchPlaceholder="Search counties…"
                disabled={isPending}
                aria-invalid={!!errors.countyId}
              />
            )}
          />
          {errors.countyId && <FieldError id="countyId-error">{errors.countyId.message}</FieldError>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="locationId">
            Location <span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </Label>
          <Controller
            control={control}
            name="locationId"
            render={({ field }) => (
              <Combobox
                id="locationId"
                value={field.value ?? ''}
                onValueChange={field.onChange}
                options={(locations ?? []).map((location) => ({ value: location.id, label: location.name }))}
                placeholder={selectedCountyId ? 'Choose or type a location' : 'Choose a county first'}
                searchPlaceholder="Search or type a new neighborhood…"
                emptyText="No matching neighborhood yet — type its full name to add it."
                disabled={isPending || !selectedCountyId}
                aria-invalid={!!errors.locationId}
                onCreate={
                  selectedCountyId
                    ? async (name) => {
                        const created = await createLocation.mutateAsync({ countyId: selectedCountyId, name });
                        return created.id;
                      }
                    : undefined
                }
                createLabel={(name) => `Add "${name}" as a new location`}
              />
            )}
          />
          {errors.locationId && <FieldError id="locationId-error">{errors.locationId.message}</FieldError>}
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label>Map location</Label>
          <LocationPickerMap latitude={watchedLatitude} longitude={watchedLongitude} onChange={handleMapChange} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="latitude">
            Latitude <span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            aria-invalid={!!errors.latitude}
            aria-describedby={errors.latitude ? 'latitude-error' : undefined}
            readOnly={isPending}
            {...register('latitude', { valueAsNumber: true })}
          />
          {errors.latitude && <FieldError id="latitude-error">{errors.latitude.message}</FieldError>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="longitude">
            Longitude <span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            aria-invalid={!!errors.longitude}
            aria-describedby={errors.longitude ? 'longitude-error' : undefined}
            readOnly={isPending}
            {...register('longitude', { valueAsNumber: true })}
          />
          {errors.longitude && <FieldError id="longitude-error">{errors.longitude.message}</FieldError>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bedrooms">
            Bedrooms <span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </Label>
          <Input
            id="bedrooms"
            type="number"
            min={0}
            aria-invalid={!!errors.bedrooms}
            aria-describedby={errors.bedrooms ? 'bedrooms-error' : undefined}
            readOnly={isPending}
            {...register('bedrooms', { valueAsNumber: true })}
          />
          {errors.bedrooms && <FieldError id="bedrooms-error">{errors.bedrooms.message}</FieldError>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bathrooms">
            Bathrooms <span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </Label>
          <Input
            id="bathrooms"
            type="number"
            min={0}
            aria-invalid={!!errors.bathrooms}
            aria-describedby={errors.bathrooms ? 'bathrooms-error' : undefined}
            readOnly={isPending}
            {...register('bathrooms', { valueAsNumber: true })}
          />
          {errors.bathrooms && <FieldError id="bathrooms-error">{errors.bathrooms.message}</FieldError>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="rentAmount">
            Monthly rent (KES) <span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </Label>
          <Input
            id="rentAmount"
            type="number"
            min={0}
            aria-invalid={!!errors.rentAmount}
            aria-describedby={errors.rentAmount ? 'rentAmount-error' : undefined}
            readOnly={isPending}
            {...register('rentAmount', { valueAsNumber: true })}
          />
          {errors.rentAmount && <FieldError id="rentAmount-error">{errors.rentAmount.message}</FieldError>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="depositAmount">
            Deposit (KES) <span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </Label>
          <Input
            id="depositAmount"
            type="number"
            min={0}
            aria-invalid={!!errors.depositAmount}
            aria-describedby={errors.depositAmount ? 'depositAmount-error' : undefined}
            readOnly={isPending}
            {...register('depositAmount', { valueAsNumber: true })}
          />
          {errors.depositAmount && <FieldError id="depositAmount-error">{errors.depositAmount.message}</FieldError>}
        </div>
      </div>

      <Controller
        control={control}
        name="amenityIds"
        render={({ field }) => {
          const selected = new Set(field.value ?? []);
          return (
            <fieldset className="space-y-2">
              <legend className="text-body-sm font-medium text-foreground">Amenities</legend>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {(amenities ?? []).map((amenity) => (
                  <div key={amenity.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`amenity-${amenity.id}`}
                      checked={selected.has(amenity.id)}
                      disabled={isPending}
                      onCheckedChange={(checked) => {
                        const next = new Set(selected);
                        if (checked) next.add(amenity.id);
                        else next.delete(amenity.id);
                        field.onChange(Array.from(next));
                      }}
                    />
                    <Label htmlFor={`amenity-${amenity.id}`} className="font-normal">
                      {amenity.name}
                    </Label>
                  </div>
                ))}
              </div>
            </fieldset>
          );
        }}
      />

      <Button type="submit" isLoading={isPending}>
        {isEditMode ? 'Save changes' : 'Create listing'}
      </Button>
    </form>
  );
}
