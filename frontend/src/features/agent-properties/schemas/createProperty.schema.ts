import { z } from 'zod';

/**
 * api-design.md §14's `CreatePropertySchema`, plus `availabilityStatus` —
 * AGENT-002's acceptance criteria list availability among the fields the
 * creation form captures, but the documented schema example omitted it
 * (Sprint 6 plan, Part D). Numeric fields are read via `valueAsNumber` at
 * the input registration (`PropertyForm.tsx`), so this stays `z.number()`,
 * matching the documented contract verbatim rather than diverging to
 * `z.coerce.number()`.
 */
export const CreatePropertySchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters.').max(150, 'Title must be 150 characters or fewer.'),
  description: z
    .string()
    .trim()
    .min(20, 'Description must be at least 20 characters.')
    .max(5000, 'Description must be 5000 characters or fewer.'),
  propertyTypeId: z.string().uuid('Choose a property type.'),
  countyId: z.string().uuid('Choose a county.'),
  locationId: z.string().uuid('Choose a location.'),
  latitude: z.number().min(-4.9, 'Latitude must be within Kenya.').max(5.5, 'Latitude must be within Kenya.'),
  longitude: z.number().min(33.9, 'Longitude must be within Kenya.').max(41.9, 'Longitude must be within Kenya.'),
  bedrooms: z.number().int().min(0, 'Bedrooms cannot be negative.').max(20, 'Bedrooms must be 20 or fewer.'),
  bathrooms: z.number().int().min(0, 'Bathrooms cannot be negative.').max(20, 'Bathrooms must be 20 or fewer.'),
  rentAmount: z.number().positive('Rent must be greater than zero.'),
  depositAmount: z.number().nonnegative('Deposit cannot be negative.'),
  amenityIds: z.array(z.string().uuid()).max(20, 'Choose at most 20 amenities.'),
  availabilityStatus: z.enum(['available', 'reserved', 'occupied', 'hidden'], {
    message: 'Choose an availability status.',
  }),
});

export type CreatePropertyFormInput = z.infer<typeof CreatePropertySchema>;
