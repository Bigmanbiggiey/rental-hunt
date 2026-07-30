import { z } from 'zod';

/**
 * api-design.md §8.6 (BOOK-004) — a second copy of
 * `features/viewing-requests/schemas/cancelViewingRequest.schema.ts`'s exact
 * shape. Features can't cross-import (coding-standards.md §3.2), and per
 * "extract on the third real duplicate" a second occurrence doesn't yet
 * justify a shared/entities move (Sprint 6 plan, Part E) — flag for a
 * shared extraction if a third copy of this shape appears.
 */
export const CancelViewingRequestAgentSchema = z.object({
  reason: z
    .string()
    .max(500, 'Reason must be 500 characters or fewer.')
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    }),
});

export type CancelViewingRequestAgentInput = z.input<typeof CancelViewingRequestAgentSchema>;
