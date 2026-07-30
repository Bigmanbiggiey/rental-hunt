import { z } from 'zod';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** api-design.md §8.5 (BOOK-003). Mirrors `createViewingRequest.schema.ts`'s date/time validation precedent. */
export const RescheduleViewingRequestSchema = z.object({
  requestedDate: z
    .string()
    .min(1, 'Choose a date.')
    .refine((value) => value >= today(), 'Choose today or a future date.'),
  requestedTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time.'),
});

export type RescheduleViewingRequestInput = z.infer<typeof RescheduleViewingRequestSchema>;
