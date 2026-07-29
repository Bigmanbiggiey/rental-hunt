import { z } from 'zod';
import { fullNameSchema, phoneSchema } from '@/entities/user';

/**
 * CUST-003 — name/phone only (email/password are AUTH-006's separate
 * `credentials.service.ts`). Phone is always required here, not
 * optionally-clearable — the AC asks to *edit* name/phone, not to support
 * blanking a phone back to null; keeps `profileRepository.update()`'s
 * existing `phone?: string` shape unchanged rather than widening it to
 * `string | null` for an edge case no acceptance criterion asks for.
 */
export const UpdateProfileSchema = z.object({
  fullName: fullNameSchema,
  phone: phoneSchema,
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
