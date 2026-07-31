import { z } from 'zod';

/**
 * api-design.md §6.9: `reason` required when `status = 'rejected'`. Validated
 * here first for fast, specific feedback — `set_property_verification()`'s
 * own `23514` check is the real backstop (coding-standards.md §11), not the
 * primary UX path.
 */
export const VerificationActionSchema = z
  .object({
    status: z.enum(['verified', 'rejected', 'pending_verification'], {
      message: 'Choose a verification decision.',
    }),
    reason: z
      .string()
      .trim()
      .max(1000, 'Reason must be 1000 characters or fewer.')
      .optional(),
  })
  .refine((value) => value.status !== 'rejected' || Boolean(value.reason), {
    message: 'A reason is required when rejecting a listing.',
    path: ['reason'],
  });

export type VerificationActionFormInput = z.input<typeof VerificationActionSchema>;
