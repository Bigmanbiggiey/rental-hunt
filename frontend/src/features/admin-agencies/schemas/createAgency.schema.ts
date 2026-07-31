import { z } from 'zod';

/**
 * api-design.md §13's `CreateAgencyInput`. `slug` is deliberately absent —
 * Service-resolved via `slugify(name)` (`agencyRepository.create()`), not
 * user-editable, matching `CreatePropertySchema`'s own precedent.
 */
export const CreateAgencySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100, 'Name must be 100 characters or fewer.'),
  description: z.string().trim().max(2000, 'Description must be 2000 characters or fewer.').optional(),
  logoUrl: z
    .union([z.string().trim().url('Enter a valid URL.'), z.literal('')])
    .optional()
    .transform((value) => value || undefined),
  phone: z.string().trim().max(20, 'Phone must be 20 characters or fewer.').optional(),
  email: z
    .union([z.string().trim().email('Enter a valid email.'), z.literal('')])
    .optional()
    .transform((value) => value || undefined),
  countyId: z.union([z.string().uuid('Choose a county.'), z.literal('')]).optional().transform((value) => value || undefined),
});

export type CreateAgencyFormInput = z.input<typeof CreateAgencySchema>;
