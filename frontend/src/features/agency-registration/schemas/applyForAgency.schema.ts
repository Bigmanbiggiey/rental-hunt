import { z } from 'zod';
import { isHttpUrl } from '@/shared/lib';

// `.url()` alone accepts `javascript:`/`data:` URIs (syntactically valid,
// but they execute as script when rendered as an href — found via the
// Sprint 10 security review). `isHttpUrl` restricts the scheme.
const urlField = z
  .union([z.string().trim().url('Enter a valid URL.').refine(isHttpUrl, 'URL must start with http:// or https://'), z.literal('')])
  .optional()
  .transform((value) => value || undefined);

/** api-design.md §13's `SocialLinks` (Epic 12) — every key optional, each validated as a real URL when present. */
export const SocialLinksSchema = z.object({
  facebook: urlField,
  instagram: urlField,
  twitter: urlField,
  linkedin: urlField,
  website: urlField,
});

/**
 * Same shape as `admin-agencies`' `CreateAgencySchema` plus `socialLinks` —
 * kept as its own schema (not imported from that feature) since `features`
 * can't cross-import each other (coding-standards.md §3.2), matching
 * `useCounties()`'s own precedent for this exact cross-feature duplication.
 */
export const ApplyForAgencySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100, 'Name must be 100 characters or fewer.'),
  description: z.string().trim().max(2000, 'Description must be 2000 characters or fewer.').optional(),
  logoUrl: urlField,
  phone: z.string().trim().max(20, 'Phone must be 20 characters or fewer.').optional(),
  email: z
    .union([z.string().trim().email('Enter a valid email.'), z.literal('')])
    .optional()
    .transform((value) => value || undefined),
  countyId: z.union([z.string().uuid('Choose a county.'), z.literal('')]).optional().transform((value) => value || undefined),
  socialLinks: SocialLinksSchema.optional(),
});

export type ApplyForAgencyFormInput = z.input<typeof ApplyForAgencySchema>;
