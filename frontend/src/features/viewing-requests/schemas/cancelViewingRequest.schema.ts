import { z } from 'zod';

/** api-design.md §8.6 (VIEW-004). `id` stays outside Zod — an opaque ID passed separately, not user-supplied text. */
export const CancelViewingRequestSchema = z.object({
  reason: z
    .string()
    .max(500, 'Reason must be 500 characters or fewer.')
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    }),
});

export type CancelViewingRequestInput = z.input<typeof CancelViewingRequestSchema>;
